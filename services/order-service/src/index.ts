import "reflect-metadata";
import fastify from 'fastify';
import dotenv from 'dotenv';
import { connectDatabase, AppDataSource } from './infrastructure/mysql';
import { EventPublisher } from './infrastructure/EventPublisher';
import { ProductClient } from './infrastructure/ProductClient';
import { OrderService } from './services/OrderService';
import { OrderController } from './controllers/OrderController';
import { Order, OrderStatus } from './models/Order';
import path from "path";
import { ExchangeNames } from "@tokopaedi/shared";
import { RabbitMQConsumer } from "./infrastructure/RabbitMQConsumer";

dotenv.config({ path: path.resolve(__dirname, `./.env`) });


const app = fastify({ logger: true });

async function bootstrap() {
    try {
        // 1. Infrastructure Layer: Connect DB & RabbitMQ
        await connectDatabase();

        const eventPublisher = new EventPublisher();
        await eventPublisher.connect({
            host: process.env.RABBITMQ_HOST || 'localhost',
            port: parseInt(process.env.RABBITMQ_PORT || '5672'),
            username: process.env.RABBITMQ_USER || '',
            password: process.env.RABBITMQ_PASS || '',
            vhost: process.env.RABBITMQ_VHOST || ''
        });

        // 2. Client Layer: Connect to Product Service (gRPC)
        const grpcUrl = process.env.PRODUCT_GRPC_URL || 'localhost:50051';
        const productClient = new ProductClient(grpcUrl);
        console.log(`🔌 Initialized gRPC Client pointing to ${grpcUrl}`);

        // 3. Service Layer: Dependency Injection
        const orderRepository = AppDataSource.getRepository(Order);
        const orderService = new OrderService(orderRepository, eventPublisher, productClient);

        const consumer = new RabbitMQConsumer();
        await consumer.connect();
        await consumer.subscribe(
            ExchangeNames.ORDER_EVENTS,  // Exchange
            'order.paid',                // Routing Key
            'order_updates_queue',       // Queue Name
            async (data) => {
                console.log(`Received payment confirmation for Order ${data.orderId}`);
                await orderService.updateOrderStatus(data.orderId, OrderStatus.PAID);
            }
        );

        await consumer.subscribe(
            ExchangeNames.PAYMENT_EVENTS,
            'payment.failed',
            'order_payment_failures',
            async (data) => {
                console.log(`Payment failed for Order ${data.orderId}. Cancelling...`);
                await orderService.cancelOrder(data.orderId, data.reason);
            }
        );

        // 4. Controller Layer
        const orderController = new OrderController(orderService);

        // 5. Register Routes
        app.post('/v1/orders', orderController.create.bind(orderController));

        app.get('/health', async () => ({ status: 'ok', service: 'order-service' }));

        // 6. Start Server
        const PORT = parseInt(process.env.PORT || '3003');
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 Order Service running on port ${PORT}`);

    } catch (error) {
        console.error('Failed to start service:', error);
        process.exit(1);
    }
}

bootstrap();