import "reflect-metadata";
import fastify from 'fastify';
import dotenv from 'dotenv';
import { connectDatabase, AppDataSource } from './infrastructure/mysql';
import { PaymentService } from './services/PaymentService';
import { Payment } from './models/Payment';
import { EventPublisher, EventRoutingKeys, ExchangeNames, RabbitMQConsumer } from '@tokopaedi/shared';
import path from "path";

dotenv.config({ path: path.resolve(__dirname, `../.env`) });


const app = fastify();

async function bootstrap() {
  try {
    // 1. Database
    await connectDatabase();

    // 2. RabbitMQ Setup
    const eventPublisher = new EventPublisher();

    const consumer = new RabbitMQConsumer();

    // 3. Service
    const paymentRepo = AppDataSource.getRepository(Payment);
    const paymentService = new PaymentService(paymentRepo, eventPublisher);

    // 4. Subscribe
    await consumer.subscribe({
      exchange: ExchangeNames.ORDER_EVENTS,
      exchangeType: "topic",
      routingKey: EventRoutingKeys.ORDER_CREATED,
      queueName: "payment_order_created",
    },
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