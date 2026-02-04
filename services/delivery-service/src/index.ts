import "reflect-metadata";
import Fastify from "fastify";
import dotenv from "dotenv";
import path from "path";
import {
    RabbitMQConsumer,
    EventPublisher,
    EventRoutingKeys,
    ExchangeNames,
    QueueNames,
} from "@tokopaedi/shared";
import { Delivery, DeliveryStatus } from "./models/Delivery";
import { AppDataSource } from "./infrastructure/mysql";

dotenv.config({ path: path.resolve(__dirname, `../.env`) });

const app = Fastify({ logger: true });

app.get("/deliveries", async (request, reply) => {
    const repo = AppDataSource.getRepository(Delivery);
    return repo.find();
});

const start = async () => {
    try {
        // 1. Initialize Database
        await AppDataSource.initialize();
        console.log("Database connected");

        // 2. Initialize RabbitMQ — no manual connect/channel/assertExchange needed
        const publisher = new EventPublisher();
        const consumer = new RabbitMQConsumer();

        // 3. Subscribe to order.paid events
        await consumer.subscribe(
            {
                exchange: ExchangeNames.ORDER_EVENTS,
                exchangeType: "topic",
                queueName: QueueNames.DELIVERY_ORDER_EVENTS,
                routingKey: EventRoutingKeys.ORDER_PAID,
            },
            async (payload) => {
                const orderId = payload.orderId;

                if (!orderId) {
                    console.error("[Delivery] Missing orderId in payload, dropping message");
                    return;
                }

                console.log(`[Delivery] Processing order #${orderId}`);
                await handlePaymentSuccess(orderId, publisher);
            }
        );

        // 4. Start Server
        await app.listen({ port: Number(process.env.PORT) || 3005, host: "0.0.0.0" });
        console.log(`Delivery Service running on port ${process.env.PORT || 3005}`);

        // 5. Graceful shutdown
        process.on("SIGTERM", async () => {
            await consumer.close();
            await publisher.close();
            await app.close();
            process.exit(0);
        });

        process.on("SIGINT", async () => {
            await consumer.close();
            await publisher.close();
            await app.close();
            process.exit(0);
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

// ---------------------------------------------------------------------------
// Business logic
// ---------------------------------------------------------------------------
async function handlePaymentSuccess(orderId: number, publisher: EventPublisher) {
    const deliveryRepo = AppDataSource.getRepository(Delivery);

    // 1. Create initial delivery record
    const delivery = deliveryRepo.create({
        orderId,
        address: "123 Default St, Jakarta",
        status: DeliveryStatus.PENDING,
    });

    await deliveryRepo.save(delivery);
    console.log(`[Delivery] Created delivery #${delivery.id} for order #${orderId}`);

    // 2. Simulate shipping delay
    setTimeout(async () => {
        delivery.status = DeliveryStatus.SHIPPED;
        delivery.trackingNumber = "TKPD-" + Math.floor(Math.random() * 1000000);

        await deliveryRepo.save(delivery);
        console.log(`[Delivery] Order #${orderId} shipped — tracking: ${delivery.trackingNumber}`);

        // 3. Publish downstream event
        await publisher.publish(EventRoutingKeys.DELIVERY_SHIPPED, {
            orderId: delivery.orderId,
            deliveryId: delivery.id,
            trackingNumber: delivery.trackingNumber,
            status: delivery.status,
        });
    }, 5000);
}

start();