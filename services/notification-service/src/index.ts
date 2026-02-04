import fastify from 'fastify';
import dotenv from 'dotenv';
import { EmailService } from './services/EmailService';
import { EventRoutingKeys, ExchangeNames, QueueNames, RabbitMQConsumer } from '@tokopaedi/shared';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, `../.env`) });

const app = fastify();
const emailService = new EmailService();

async function bootstrap() {
    try {
        const consumer = new RabbitMQConsumer();

        // 1. Order Created -> Send Confirmation
        await consumer.subscribe({
            exchange: ExchangeNames.ORDER_EVENTS,
            exchangeType: 'topic',
            routingKey: EventRoutingKeys.ORDER_CREATED,
            queueName: `${QueueNames.NOTIFICATION_SERVICE}.created`,
        },
            async (data) => {
                await emailService.sendOrderConfirmation(data);
            }
        );

        // 2. Order Paid -> Send Payment Receipt
        await consumer.subscribe({
            exchange: ExchangeNames.ORDER_EVENTS,
            exchangeType: 'topic',
            routingKey: EventRoutingKeys.ORDER_PAID,
            queueName: `${QueueNames.NOTIFICATION_SERVICE}`,
        },
            async (data) => {
                await emailService.sendPaymentReceived(data);
            }
        );

        // 3. Delivery Shipped -> Send Tracking Info
        // Note: We listen to DELIVERY_EVENTS exchange here
        await consumer.subscribe({
            exchange: ExchangeNames.DELIVERY_EVENTS,
            exchangeType: 'topic',
            routingKey: EventRoutingKeys.DELIVERY_SHIPPED,
            queueName: `${QueueNames.NOTIFICATION_SERVICE}.shipped`,
        },
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