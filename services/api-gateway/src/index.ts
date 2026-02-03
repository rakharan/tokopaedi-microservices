import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import proxy from '@fastify/http-proxy';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = fastify({ logger: true });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth Middleware Definition
const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            return reply.status(401).send({ success: false, message: 'No authorization header found' });
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>

        if (!token) {
            return reply.status(401).send({ success: false, message: 'No token provided' });
        }

        // Verify Token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Enhance request with user info (optional, for logging)
        request.user = decoded;

    } catch (error) {
        return reply.status(401).send({ success: false, message: 'Invalid or expired token' });
    }
};

async function bootstrap() {
    try {
        // 1. Global CORS
        await app.register(cors, {
            origin: true
        });

        // 2. Health Check
        app.get('/health', async () => ({ status: 'ok', service: 'api-gateway' }));

        // 3. PUBLIC Route: User Service (Login, Register must be open)
        await app.register(proxy, {
            upstream: process.env.USER_SERVICE_URL || 'http://localhost:3001',
            prefix: '/v1/users',
            rewritePrefix: '/v1/users',
            http2: false
        });

        // 4. PUBLIC Route: Product Service (Browsing is open)
        await app.register(proxy, {
            upstream: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
            prefix: '/v1/products',
            rewritePrefix: '/v1/products',
            http2: false
        });

        // 5. PROTECTED Route: Order Service
        // We add the 'preHandler' hook to enforce authentication
        await app.register(proxy, {
            upstream: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
            prefix: '/v1/orders',
            rewritePrefix: '/v1/orders',
            http2: false,
            preHandler: authenticate 
        });

        // 6. PROTECTED Route: Payment Service (if exposed directly)
        await app.register(proxy, {
            upstream: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
            prefix: '/v1/payments',
            rewritePrefix: '/v1/payments',
            http2: false,
            preHandler: authenticate
        });

        const PORT = process.env.PORT || 8000; // Mapped to 3000 in docker-compose usually, but internal port is flexible
        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`API Gateway running on port ${PORT}`);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

// Add type definition for request.user
declare module 'fastify' {
    interface FastifyRequest {
        user?: string | jwt.JwtPayload;
    }
}

bootstrap();