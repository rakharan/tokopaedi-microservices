import * as amqp from 'amqplib';
import { DomainEvent, ExchangeNames } from '@tokopaedi/shared';

// Define the config interface
export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
}

export class EventPublisher {
  private connection: any = null; // 'any' to bypass type strictness issues
  private channel: any = null;

  async connect(config: RabbitMQConfig): Promise<void> {
    try {
      // Create the connection object compatible with amqplib
      const connectionOptions = {
        protocol: 'amqp',
        hostname: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        vhost: config.vhost || '/',
      };

      console.log(`🔌 Connecting to RabbitMQ at ${config.host}:${config.port}...`);
      
      this.connection = await amqp.connect(connectionOptions);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(ExchangeNames.USER_EVENTS, 'topic', { durable: true });
      
      console.log('✓ Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  // ... (rest of the file remains exactly the same: publish, getExchangeForEvent, close)
  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    const exchange = this.getExchangeForEvent(event.eventType);
    const routingKey = event.eventType;
    
    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log(`📤 Published event: ${event.eventType}`);
  }

  private getExchangeForEvent(eventType: string): string {
    if (eventType.startsWith('user.')) return ExchangeNames.USER_EVENTS;
    if (eventType.startsWith('product.')) return ExchangeNames.PRODUCT_EVENTS;
    if (eventType.startsWith('order.')) return ExchangeNames.ORDER_EVENTS;
    if (eventType.startsWith('payment.')) return ExchangeNames.PAYMENT_EVENTS;
    if (eventType.startsWith('delivery.')) return ExchangeNames.DELIVERY_EVENTS;
    return ExchangeNames.NOTIFICATION_EVENTS;
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}