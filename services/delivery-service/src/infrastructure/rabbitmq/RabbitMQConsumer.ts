import { Channel } from "amqplib";
import { Delivery, DeliveryStatus } from "../../models/Delivery";
import { EventPublisher } from "./EventPublisher";
import { ExchangeNames, QueueNames } from "@tokopaedi/shared"; 
import { AppDataSource } from "../mysql";

export class RabbitMQConsumer {
  private channel: Channel;
  private publisher: EventPublisher;

  constructor(channel: Channel, publisher: EventPublisher) {
    this.channel = channel;
    this.publisher = publisher;
  }

  async start() {
    // Use Shared Enums
    const exchange = ExchangeNames.ORDER_EVENTS || "order.events"; 
    const queueName = QueueNames.DELIVERY_ORDER_EVENTS || "delivery.queue"; 

    // 1. Assert Queue
    const q = await this.channel.assertQueue(queueName, { durable: true });

    // 2. Bind Queue
    console.log(`Binding ${queueName} to ${exchange} -> order.paid`);
    await this.channel.bindQueue(q.queue, exchange, "order.paid");

    console.log("Delivery Consumer Listening...");

    // 3. Consume
    this.channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const rawContent = msg.content.toString();
          const data = JSON.parse(rawContent);

          const targetOrderId = data.data.orderId

          if (!targetOrderId) {
            console.error("Error: Missing Order ID in event payload!");
            this.channel.ack(msg); // Ack to remove bad message from queue
            return;
          }

          console.log(`Processing Delivery for Order #${targetOrderId}`);
          await this.handlePaymentSuccess(targetOrderId);

          this.channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          // Optional: this.channel.nack(msg);
        }
      }
    });
  }

  private async handlePaymentSuccess(orderId: number) {
    const deliveryRepo = AppDataSource.getRepository(Delivery);

    // 1. Create Initial Delivery Record
    const delivery = deliveryRepo.create({
      orderId: orderId, // Use the extracted ID
      address: "123 Default St, Jakarta",
      status: DeliveryStatus.PENDING,
    });

    await deliveryRepo.save(delivery);
    console.log(`Delivery Created: #${delivery.id}`);

    // 2. Simulate Shipping Process
    setTimeout(async () => {
      delivery.status = DeliveryStatus.SHIPPED;
      delivery.trackingNumber = "TKPD-" + Math.floor(Math.random() * 1000000);
      
      await deliveryRepo.save(delivery);
      console.log(`Order #${orderId} Shipped! Tracking: ${delivery.trackingNumber}`);

      // Publish Event
      await this.publisher.publish("delivery.shipped", {
        orderId: delivery.orderId,
        deliveryId: delivery.id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status
      });

    }, 5000);
  }
}