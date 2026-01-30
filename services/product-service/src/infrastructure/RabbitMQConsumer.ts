import * as amqp from 'amqplib';

export class RabbitMQConsumer {
    private connection: any;
    private channel: any;

    async connect(): Promise<void> {
        const host = process.env.RABBITMQ_HOST || 'localhost';
        const port = process.env.RABBITMQ_PORT || '5672';
        const user = process.env.RABBITMQ_USER || '';
        const pass = process.env.RABBITMQ_PASS || '';
        const vhost = process.env.RABBITMQ_VHOST || '/';

        const connectionUrl = `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(vhost)}`;

        try {
            this.connection = await amqp.connect(connectionUrl);
            this.channel = await this.connection.createChannel();
            console.log('Order Service Consumer connected to RabbitMQ');
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

        await this.channel.assertExchange(exchange, 'topic', { durable: true });
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, exchange, routingKey);

        console.log(`Listening on queue: ${queueName}`);

        this.channel.consume(queueName, async (msg: any) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content.data);
                    this.channel.ack(msg);
                } catch (error) {
                    console.error('Processing failed:', error);
                }
            }
        });
    }
}