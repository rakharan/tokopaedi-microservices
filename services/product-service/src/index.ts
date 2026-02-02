import "reflect-metadata";
import fastify from 'fastify';
import dotenv from 'dotenv';
import { connectDatabase, AppDataSource } from './infrastructure/mysql';
import { EventPublisher } from './infrastructure/EventPublisher';
import { ProductService } from './services/ProductService';
import { ProductController } from './controllers/ProductController';
import { Product } from './models/Product';
import { ProductGrpcServer } from "./controllers/ProductGrpcController";
import { RabbitMQConsumer } from "./infrastructure/RabbitMQConsumer";
import { EventRoutingKeys, ExchangeNames } from "@tokopaedi/shared";

dotenv.config();

const app = fastify({ logger: true });

async function bootstrap() {
    try {
        // 1. Connect to Product Database
        await connectDatabase();

        // 2. Connect to RabbitMQ
        const eventPublisher = new EventPublisher();
        await eventPublisher.connect({
            host: process.env.RABBITMQ_HOST || 'localhost',
            port: parseInt(process.env.RABBITMQ_PORT || '5672'),
            username: process.env.RABBITMQ_USER || 'guest',
            password: process.env.RABBITMQ_PASS || 'guest',
            vhost: process.env.RABBITMQ_VHOST || '/'
        });

        const consumer = new RabbitMQConsumer();
        await consumer.connect();

        await consumer.subscribe(
            ExchangeNames.ORDER_EVENTS,   // Exchange
            EventRoutingKeys.ORDER_CANCELLED,            // Routing Key
            'product_stock_restoration',  // Queue Name
            async (data) => {
                console.log(`Received cancellation for Order ${data.orderId}. Restoring stock...`);

                // Loop through items and restore each one
                if (data.items && Array.isArray(data.items)) {
                    for (const item of data.items) {
                        await productService.increaseStock(item.productId, item.quantity);
                    }
                }
            }
        );

        // 3. Initialize Services (Dependency Injection)
        const productRepository = AppDataSource.getRepository(Product);
        const productService = new ProductService(productRepository, eventPublisher);
        const productController = new ProductController(productService);

        // 4. Register Routes
        await app.register(async (api) => {
            api.post('/', productController.create.bind(productController));
            api.get('/', productController.list.bind(productController));
            api.get('/:id', productController.getOne.bind(productController));
            api.post('/:id/decrease-stock', productController.decreaseStock.bind(productController));
        }, { prefix: '/v1/products' });

        app.get('/health', async () => ({ status: 'ok', service: 'product-service' }));

        // 5. Start Server
        const PORT = parseInt(process.env.PORT || '3002'); // Note: Port 3002
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Product Service running on port ${PORT}`);

        const grpcServer = new ProductGrpcServer(productService);
        grpcServer.start(process.env.GRPC_PORT || '50051');

    } catch (error) {
        console.error('Failed to start service:', error);
        process.exit(1);
    }
}

bootstrap();