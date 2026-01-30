import fastify from 'fastify';
import proxy from '@fastify/http-proxy';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const app = fastify({ logger: true });

async function bootstrap() {
    try {
        // 1. Global CORS (Allow Frontend to hit us)
        await app.register(cors, {
            origin: true // Allow all for MVP
        });

        // 2. Health Check
        app.get('/health', async () => ({ status: 'ok', service: 'api-gateway' }));

        // 3. Route: User Service
        // Requests to /v1/users/* -> http://localhost:3001/v1/users/*
        await app.register(proxy, {
            upstream: process.env.USER_SERVICE_URL || 'http://localhost:3001',
            prefix: '/v1/users',
            rewritePrefix: '/v1/users', // Keep the prefix when forwarding
            http2: false
        });

        // 4. Route: Product Service
        await app.register(proxy, {
            upstream: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
            prefix: '/v1/products',
            rewritePrefix: '/v1/products',
            http2: false
        });

        // 5. Route: Order Service
        await app.register(proxy, {
            upstream: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
            prefix: '/v1/orders',
            rewritePrefix: '/v1/orders',
            http2: false
        });

        // 6. Start Server
        const PORT = process.env.PORT || 8000;
        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`API Gateway running on port ${PORT}`);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

bootstrap();