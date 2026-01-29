import { FastifyReply, FastifyRequest } from 'fastify';
import { ProductService } from '../services/ProductService';

interface CreateProductBody {
    name: string;
    price: number;
    stock: number;
    category: number; // Expecting Enum value
    description?: string;
}

interface DecreaseStockParams {
    id: number;
}

interface DecreaseStockBody {
    quantity: number;
}

export class ProductController {
    constructor(
        private productService: ProductService
    ) { }

    async create(request: FastifyRequest<{ Body: CreateProductBody }>, reply: FastifyReply) {
        try {
            const product = await this.productService.createProduct(request.body);
            return reply.status(201).send({
                success: true,
                data: product,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                message: error.message,
            });
        }
    }

    async list(request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
        try {
            const page = request.query.page || 1;
            const limit = request.query.limit || 20;
            const result = await this.productService.listProducts(page, limit);

            return reply.send({
                success: true,
                data: result.products,
                meta: {
                    total: result.total,
                    page,
                    limit,
                },
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                message: error.message,
            });
        }
    }

    async getOne(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
        try {
            const product = await this.productService.getProduct(request.params.id);
            return reply.send({
                success: true,
                data: product,
            });
        } catch (error: any) {
            return reply.status(404).send({
                success: false,
                message: error.message,
            });
        }
    }

    async decreaseStock(
        request: FastifyRequest<{ Params: DecreaseStockParams; Body: DecreaseStockBody }>,
        reply: FastifyReply
    ) {
        try {
            // 1. Parse Input (HTTP Layer)
            // Fastify params are strings at runtime, so we safeguard with Number()
            const productId = Number(request.params.id);
            const { quantity } = request.body;

            // 2. Delegate to Chef (Service Layer)
            const result = await this.productService.decreaseStock(productId, quantity);

            // 3. Send Response (HTTP Layer)
            return reply.send({
                success: true,
                data: result,
            });

        } catch (error: any) {
            // 4. Handle Errors (HTTP Translation)
            // If the Service throws a "Concurrency" error, we translate that to HTTP 409
            const statusCode = error.message.includes('Concurrency') ? 409 : 400;

            return reply.status(statusCode).send({
                success: false,
                message: error.message,
            });
        }
    }
}