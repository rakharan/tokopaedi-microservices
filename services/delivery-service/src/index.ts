import "reflect-metadata";
import Fastify from "fastify";
import dotenv from "dotenv";
import amqp from "amqplib";
import { RabbitMQConsumer } from "./infrastructure/rabbitmq/RabbitMQConsumer";
import { EventPublisher } from "./infrastructure/rabbitmq/EventPublisher";
import { Delivery } from "./models/Delivery";
import { AppDataSource } from "./infrastructure/mysql";
import path from "path";
import { ExchangeNames } from "@tokopaedi/shared";

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

        // 2. Initialize RabbitMQ with discrete variables
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST || "localhost",
            port: Number(process.env.RABBITMQ_PORT) || 5672,
            username: process.env.RABBITMQ_USER || "guest",
            password: process.env.RABBITMQ_PASS || "guest",
            vhost: process.env.RABBITMQ_VHOST || "/",
        });

        const channel = await connection.createChannel();
        await channel.assertExchange(ExchangeNames.ORDER_EVENTS, "topic", { durable: true });
        console.log("RabbitMQ Connected");

        // 3. Inject Channel into Classes
        const publisher = new EventPublisher(channel);
        const consumer = new RabbitMQConsumer(channel, publisher);

        // 4. Start Consumer
        await consumer.start();

        // 5. Start Server
        await app.listen({ port: Number(process.env.PORT) || 3005, host: "0.0.0.0" });
        console.log(`Delivery Service running on port ${process.env.PORT || 3005}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();