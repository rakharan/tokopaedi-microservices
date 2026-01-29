import { Repository } from 'typeorm';
import { Product } from '../models/Product';
import { EventPublisher } from '../infrastructure/EventPublisher';
import { ProductCreatedEvent, ProductUpdatedEvent } from '@tokopaedi/shared';

export class ProductService {
    constructor(
        private productRepository: Repository<Product>,
        private eventPublisher: EventPublisher
    ) { }

    async createProduct(data: { name: string; price: number; stock: number; category: number; description?: string }): Promise<Product> {
        const product = this.productRepository.create({
            ...data,
            // Version is automatically set to 1 by TypeORM
        });

        await this.productRepository.save(product);

        // Publish event for Search Service or Analytics
        const event: ProductCreatedEvent = {
            eventType: 'product.created',
            timestamp: Date.now(),
            data: {
                productId: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
                category: product.category
            },
        };
        await this.eventPublisher.publish(event);

        return product;
    }

    async listProducts(page: number = 1, limit: number = 20): Promise<{ products: Product[]; total: number }> {
        const [products, total] = await this.productRepository.findAndCount({
            take: limit,
            skip: (page - 1) * limit,
            order: { createdAt: 'DESC' },
        });

        return { products, total };
    }

    async getProduct(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async decreaseStock(id: number, quantity: number): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });

        if (!product) {
            throw new Error('Product not found');
        }

        if (product.stock < quantity) {
            throw new Error('Insufficient stock');
        }

        const currentVersion = product.version;
        const newStock = product.stock - quantity;

        // MANUAL OPTIMISTIC LOCKING
        // We explicitly tell the DB: "Update ONLY IF the version hasn't changed"
        const result = await this.productRepository.update(
            { id: id, version: currentVersion }, // WHERE id = ? AND version = ?
            {
                stock: newStock,
                version: currentVersion + 1 // Manually increment version
            }
        );

        if (result.affected === 0) {
            // If 0 rows were updated, it means the version changed in the split second between findOne and update
            throw new Error('Concurrency conflict: Stock was updated by another transaction. Please retry.');
        }

        // Return the updated object
        product.stock = newStock;
        product.version = currentVersion + 1;

        // Publish event
        const event: ProductUpdatedEvent = {
            eventType: 'product.updated',
            timestamp: Date.now(),
            data: {
                productId: product.id,
                changes: {
                    stock: product.stock,
                    price: product.price
                }
            }
        };
        await this.eventPublisher.publish(event);

        return product;
    }

}