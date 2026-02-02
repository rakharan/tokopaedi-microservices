import { ExchangeNames } from "@tokopaedi/shared";
import { Channel } from "amqplib";

export class EventPublisher {
    private channel: Channel;

    constructor(channel: Channel) {
        this.channel = channel;
    }

    async publish(routingKey: string, data: any) {
        const exchange = ExchangeNames.ORDER_EVENTS;

        this.channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(data))
        );

        console.log(`Event Published: ${routingKey}`);
    }
}