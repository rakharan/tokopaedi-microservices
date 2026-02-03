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
        await consumer.connect();

        // 1. Order Created -> Send Confirmation
        await consumer.subscribe(
            ExchangeNames.ORDER_EVENTS,
            EventRoutingKeys.ORDER_CREATED,
            `${QueueNames.NOTIFICATION_SERVICE}.created`,
            async (data) => {
                await emailService.sendOrderConfirmation(data);
            }
        );

        // 2. Order Paid -> Send Payment Receipt
        await consumer.subscribe(
            ExchangeNames.ORDER_EVENTS,
            EventRoutingKeys.ORDER_PAID,
            `${QueueNames.NOTIFICATION_SERVICE}.paid`,
            async (data) => {
                await emailService.sendPaymentReceived(data);
            }
        );

        // 3. Delivery Shipped -> Send Tracking Info
        // Note: We listen to DELIVERY_EVENTS exchange here
        await consumer.subscribe(
            ExchangeNames.DELIVERY_EVENTS,
            EventRoutingKeys.DELIVERY_SHIPPED,
            `${QueueNames.NOTIFICATION_SERVICE}.shipped`,
            async (data) => {
                await emailService.sendShippingUpdate(data);
            }
        );

        // Health Check
        app.get('/health', async () => ({ status: 'ok', service: 'notification-service' }));

        const PORT = process.env.PORT || 3006; // Updated to match docker-compose (3006)
        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Notification Service running on port ${PORT}`);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

bootstrap();