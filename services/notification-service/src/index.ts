import fastify from 'fastify';
import dotenv from 'dotenv';
import { RabbitMQConsumer } from './infrastructure/RabbitMQConsumer';
import { EmailService } from './services/EmailService';
import { EventRoutingKeys, ExchangeNames, QueueNames } from '@tokopaedi/shared';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, `../.env`) });

const app = fastify();
const consumer = new RabbitMQConsumer();
const emailService = new EmailService();

async function bootstrap() {
    try {
        // 1. Start RabbitMQ Consumer
        await consumer.connect();

        // 2. Subscribe to "order.created"
        // Queue Name: "notification_order_created" ensures we have our own persistent inbox
        await consumer.subscribe(
            ExchangeNames.ORDER_EVENTS,  // Exchange
            EventRoutingKeys.ORDER_CREATED,             // Routing Key
            QueueNames.NOTIFICATION_SERVICE,// Queue Name
            async (data) => {
                await emailService.sendOrderConfirmation(data);
            }
        );

        // 3. Start Health Check Server
        app.get('/health', async () => ({ status: 'ok', service: 'notification-service' }));

        const PORT = process.env.PORT || 3004;
        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`🚀 Notification Service running on port ${PORT}`);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

bootstrap();