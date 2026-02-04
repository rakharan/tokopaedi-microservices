import { connect, ConsumeMessage } from "amqplib";
import { EventRoutingKeys, ExchangeNames, QueueNames } from "../../events/shared-events-types";

// Pull concrete types directly off the functions — avoids the ChannelModel mismatch
type RabbitMQConnection = Awaited<ReturnType<typeof connect>>;
type RabbitMQChannel = Awaited<ReturnType<RabbitMQConnection["createChannel"]>>;

// ---------------------------------------------------------------------------
// Config types — each service passes one of these into subscribe()
// ---------------------------------------------------------------------------
export interface SubscriptionConfig {
    exchange: typeof ExchangeNames[keyof typeof ExchangeNames];
    exchangeType: "topic" | "direct" | "fanout" | "headers";
    queueName: string;
    routingKey: typeof EventRoutingKeys[keyof typeof EventRoutingKeys];
    /** Whether the exchange and queue survive a broker restart (default: true) */
    durable?: boolean;
    /** If true, the queue is deleted when the last consumer disconnects */
    autoDelete?: boolean;
    /** Prefetch — how many unacked messages the channel will hold (default: 10) */
    prefetch?: number;
}

// ---------------------------------------------------------------------------
// Connection config — pulled from env by default, or passed explicitly
// ---------------------------------------------------------------------------
export interface RabbitMQConnectionConfig {
    /** Full connection URL takes priority (e.g. CloudAMQP in prod) */
    url?: string;
    /** Fallbacks used only when url is not set */
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    vhost?: string;
}

// ---------------------------------------------------------------------------
// The unified consumer
// ---------------------------------------------------------------------------
export class RabbitMQConsumer {
    private connection: RabbitMQConnection | null = null;
    private channel: RabbitMQChannel | null = null;
    private connectionConfig: RabbitMQConnectionConfig;

    /**
     * @param connectionConfig  Optional — falls back to env vars if omitted.
     *                          Useful for tests or non-standard setups.
     */
    constructor(connectionConfig?: RabbitMQConnectionConfig) {
        this.connectionConfig = connectionConfig ?? {};
    }

    // -----------------------------------------------------------------------
    // Connection
    // -----------------------------------------------------------------------
    private buildConnectionUrl(): string {
        // Explicit config value wins, then env var, then defaults
        const url =
            this.connectionConfig.url || process.env.RABBITMQ_URL;

        if (url) return url;

        const host = this.connectionConfig.host || process.env.RABBITMQ_HOST || "localhost";
        const port = this.connectionConfig.port || Number(process.env.RABBITMQ_PORT) || 5672;
        const user = this.connectionConfig.user || process.env.RABBITMQ_USER || "guest";
        const pass = this.connectionConfig.pass || process.env.RABBITMQ_PASS || "guest";
        const vhost = this.connectionConfig.vhost || process.env.RABBITMQ_VHOST || "/";

        return `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(vhost)}`;
    }

    private async ensureConnection(): Promise<void> {
        if (this.connection && this.channel) return;

        const url = this.buildConnectionUrl();
        this.connection = await connect(url);
        this.channel = await this.connection.createChannel();

        // Graceful handling if the broker closes the connection unexpectedly
        this.connection.on("error", (err) => {
            console.error("[RabbitMQ] Connection error:", err.message);
        });
        this.connection.on("close", () => {
            console.warn("[RabbitMQ] Connection closed.");
            this.connection = null;
            this.channel = null;
        });

        console.log("[RabbitMQ] Connected successfully");
    }

    // -----------------------------------------------------------------------
    // Subscribe — the only method a consuming service needs to call
    // -----------------------------------------------------------------------
    /**
     * Sets up exchange + queue + binding, then starts consuming.
     *
     * @param config   Where to listen (exchange, queue, routing key, …)
     * @param handler  Called with the parsed JSON payload for every message.
     *                 Throw inside here to trigger a nack.
     */
    async subscribe(
        config: SubscriptionConfig,
        handler: (payload: any) => Promise<void>
    ): Promise<void> {
        await this.ensureConnection();
        if (!this.channel) throw new Error("[RabbitMQ] Channel is not initialized");

        const {
            exchange,
            exchangeType,
            queueName,
            routingKey,
            durable = true,
            autoDelete = false,
            prefetch = 10,
        } = config;

        // Limit how many unacked messages this channel processes at once
        await this.channel.prefetch(prefetch);

        // 1. Assert exchange
        await this.channel.assertExchange(exchange, exchangeType, { durable });

        // 2. Assert queue
        const q = await this.channel.assertQueue(queueName, { durable, autoDelete });

        // 3. Bind queue → exchange via routing key
        await this.channel.bindQueue(q.queue, exchange, routingKey);

        console.log(`[RabbitMQ] Listening — queue: "${q.queue}" | exchange: "${exchange}" | key: "${routingKey}"`);

        // 4. Consume
        this.channel.consume(q.queue, async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            try {
                const content = JSON.parse(msg.content.toString());
                // Unwrap { data: … } envelope if present, otherwise use raw payload
                const payload = content.data ?? content;

                await handler(payload);
                this.channel!.ack(msg);
            } catch (error) {
                console.error("[RabbitMQ] Error processing message:", error);
                // nack + requeue so the message isn't lost
                this.channel!.nack(msg, false, true);
            }
        });
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
            console.log("[RabbitMQ] Connection closed");
        }
    }
}