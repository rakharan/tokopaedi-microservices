import "reflect-metadata";
import fastify from 'fastify';
import dotenv from 'dotenv';
import { connectDatabase, AppDataSource } from './infrastructure/mysql';
import { RabbitMQConsumer } from './infrastructure/RabbitMQConsumer';
import { EventPublisher } from './infrastructure/EventPublisher';
import { PaymentService } from './services/PaymentService';
import { Payment } from './models/Payment';
import { ExchangeNames } from '@tokopaedi/shared';
import path from "path";

dotenv.config({ path: path.resolve(__dirname, `../.env`) });


const app = fastify();

async function bootstrap() {
  try {
    // 1. Database
    await connectDatabase();

    // 2. RabbitMQ Setup
    const eventPublisher = new EventPublisher();
    await eventPublisher.connect({
      host: process.env.RABBITMQ_HOST || 'localhost',
      port: 5672,
      username: process.env.RABBITMQ_USER || 'guest',
      password: process.env.RABBITMQ_PASS || 'guest',
      vhost: process.env.RABBITMQ_VHOST || '/'
    });

    const consumer = new RabbitMQConsumer();
    await consumer.connect();

    // 3. Service
    const paymentRepo = AppDataSource.getRepository(Payment);
    const paymentService = new PaymentService(paymentRepo, eventPublisher);

    // 4. Subscribe
    await consumer.subscribe(
      ExchangeNames.ORDER_EVENTS,
      'order.created',
      'payment_order_created', // Unique queue name for Payment Service
      async (data) => {
        await paymentService.processPayment(data);
      }
    );

    app.get('/health', async () => ({ status: 'ok', service: 'payment-service' }));

    const PORT = process.env.PORT || 3005;
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
    console.log(`🚀 Payment Service running on port ${PORT}`);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

bootstrap();