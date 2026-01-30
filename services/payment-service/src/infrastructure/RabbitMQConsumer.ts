import * as amqp from 'amqplib';

export class RabbitMQConsumer {
    private connection: any;
    private channel: any;

    async connect(): Promise<void> {
        // 1. Load Config properly
        const host = process.env.RABBITMQ_HOST || 'localhost';
        const port = process.env.RABBITMQ_PORT || '5672';
        const user = process.env.RABBITMQ_USER || '';
        const pass = process.env.RABBITMQ_PASS || '';
        const vhost = process.env.RABBITMQ_VHOST || '';

        // 2. Construct the full AMQP Connection String
        // Format: amqp://user:pass@host:port/vhost
        // We encodeURIComponent to handle special characters in passwords
        const connectionUrl = `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(vhost)}`;

        try {
            this.connection = await amqp.connect(connectionUrl);
            this.channel = await this.connection.createChannel();
            console.log('Notification Service connected to RabbitMQ');
        } catch (error) {
            console.error('RabbitMQ Connection Failed:', error);
            throw error;
        }
    }

    async subscribe(
        exchange: string,
        routingKey: string,
        queueName: string,
        handler: (data: any) => Promise<void>
    ): Promise<void> {
        if (!this.channel) await this.connect();

        // 1. Assert Exchange
        await this.channel.assertExchange(exchange, 'topic', { durable: true });

        // 2. Assert Queue
        await this.channel.assertQueue(queueName, { durable: true });

        // 3. Bind
        await this.channel.bindQueue(queueName, exchange, routingKey);

        console.log(`🎧 Listening on queue: ${queueName}`);

        // 4. Consume
        this.channel.consume(queueName, async (msg: any) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    console.log(`Received event: ${content.eventType}`);

                    await handler(content.data);

                    this.channel.ack(msg);
                } catch (error) {
                    console.error('Processing failed:', error);
                    // this.channel.nack(msg); // Uncomment to retry logic
                }
            }
        });
    }
}