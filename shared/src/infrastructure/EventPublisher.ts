import { connect } from "amqplib";
import { ExchangeNames } from "../../events/shared-events-types";

// Same concrete-type pattern as RabbitMQConsumer
type RabbitMQConnection = Awaited<ReturnType<typeof connect>>;
type RabbitMQChannel = Awaited<ReturnType<RabbitMQConnection["createChannel"]>>;

export interface EventPublisherConfig {
    /** Which exchange to publish to. Defaults to ORDER_EVENTS if omitted. */
    exchange?: string;
    /** Whether the exchange survives a broker restart (default: true) */
    durable?: boolean;
}

export class EventPublisher {
    private connection: RabbitMQConnection | null = null;
    private channel: RabbitMQChannel | null = null;
    private exchange: string;
    private durable: boolean;

    constructor(config?: EventPublisherConfig) {
        this.exchange = config?.exchange ?? ExchangeNames.ORDER_EVENTS;
        this.durable = config?.durable ?? true;
    }

    // -----------------------------------------------------------------------
    // Connection — identical strategy to RabbitMQConsumer
    // -----------------------------------------------------------------------
    private buildConnectionUrl(): string {
        const url = process.env.RABBITMQ_URL;
        if (url) return url;

        const host = process.env.RABBITMQ_HOST || "localhost";
        const port = process.env.RABBITMQ_PORT || "5672";
        const user = process.env.RABBITMQ_USER || "guest";
        const pass = process.env.RABBITMQ_PASS || "guest";
        const vhost = process.env.RABBITMQ_VHOST || "/";

        return `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(vhost)}`;
    }

    private async ensureConnection(): Promise<void> {
        if (this.connection && this.channel) return;

        this.connection = await connect(this.buildConnectionUrl());
        this.channel = await this.connection.createChannel();

        this.connection.on("error", (err) => {
            console.error("[RabbitMQ] Publisher connection error:", err.message);
        });
        this.connection.on("close", () => {
            console.warn("[RabbitMQ] Publisher connection closed.");
            this.connection = null;
            this.channel = null;
        });

        // Assert the exchange once on connect so publish() never fails on a missing exchange
        await this.channel.assertExchange(this.exchange, "topic", { durable: this.durable });

        console.log("✅ [RabbitMQ] Publisher connected");
    }

    // -----------------------------------------------------------------------
    // Publish
    // -----------------------------------------------------------------------
    async publish(routingKey: string, data: any): Promise<void> {
        await this.ensureConnection();
        if (!this.channel) throw new Error("[RabbitMQ] Publisher channel is not initialized");

        this.channel.publish(
            this.exchange,
            routingKey,
            Buffer.from(JSON.stringify({ data })),  // wrap in { data: … } envelope to match consumer's unwrap
        );

        console.log(`📤 [RabbitMQ] Published — key: "${routingKey}" | exchange: "${this.exchange}"`);
    }

    // -----------------------------------------------------------------------
    // Teardown
    // -----------------------------------------------------------------------
    async close(): Promise<void> {
        try {
            await this.channel?.close();
            await this.connection?.close();
        } finally {
            this.channel = null;
            this.connection = null;
            console.log("🔒 [RabbitMQ] Publisher connection closed");
        }
    }
}