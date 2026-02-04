import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { EventPublisher, EventRoutingKeys } from '@tokopaedi/shared';
import { ProductClient } from '../infrastructure/ProductClient';

export class OrderService {
    constructor(
        private orderRepository: Repository<Order>,
        private eventPublisher: EventPublisher,
        private productClient: ProductClient
    ) { }

    async createOrder(userId: number, items: { productId: number; quantity: number }[]): Promise<Order> {
        const orderItems: OrderItem[] = [];
        let totalAmount = 0;

        // 1. Synchronous Step: Lock Stock via gRPC
        for (const item of items) {
            try {
                console.log(`🔌 Requesting stock for Product ${item.productId}...`);

                // This waits for the Product Service to confirm!
                const productData = await this.productClient.decreaseStock(item.productId, item.quantity);

                // If we get here, stock is locked.
                const orderItem = new OrderItem();
                orderItem.productId = item.productId;
                orderItem.productName = productData.name;
                orderItem.price = productData.price;
                orderItem.quantity = item.quantity;

                orderItems.push(orderItem);
                totalAmount += (productData.price * item.quantity);

            } catch (error: any) {
                // If ANY item fails, we abort the whole order.
                // In a real system, we might need to "unlock" previous items (Saga pattern),
                // but for MVP, failing fast is acceptable.
                throw new Error(`Failed to order product ${item.productId}: ${error.message}`);
            }
        }

        // 2. Database Step: Save Order
        const order = new Order();
        order.userId = userId;
        order.status = OrderStatus.PENDING;
        order.totalAmount = totalAmount;
        order.items = orderItems;

        await this.orderRepository.save(order);
        console.log(`💾 Order ${order.id} saved to DB`);

        // 3. Prepare data for the Event
        // We assume shipping is free for MVP, so itemsPrice == totalPrice
        const itemsPrice = Number(order.totalAmount);
        const shippingPrice = 0;
        const totalPrice = itemsPrice + shippingPrice;

        // Expiration: Set order to expire in 1 hour if not paid
        const expireAt = Date.now() + (60 * 60 * 1000);

        // Publish event — unified publisher wraps this in { data: ... } automatically
        await this.eventPublisher.publish(EventRoutingKeys.ORDER_CREATED, {
            orderId: order.id,
            userId: order.userId,
            items: order.items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                price: Number(i.price),
                name: i.productName
            })),
            itemsPrice: itemsPrice,
            shippingPrice: shippingPrice,
            totalPrice: totalPrice,
            shippingAddressId: 1, // Hardcoded for MVP
            expireAt: expireAt
        });

        return order;
    }

    async updateOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
        const order = await this.orderRepository.findOneBy({ id: orderId });

        if (!order) {
            console.error(`Order ${orderId} not found`);
            return;
        }

        if (order.status === status) {
            return;
        }

        order.status = status;
        await this.orderRepository.save(order);
        console.log(`Order ${orderId} status updated to ${status}`);
    }

    async cancelOrder(orderId: number, reason: string): Promise<void> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items'] // We need items to refund stock later
        });

        if (!order) {
            console.error(`Order ${orderId} not found for cancellation`);
            return;
        }

        if (order.status === OrderStatus.CANCELLED) {
            return;
        }

        order.status = OrderStatus.CANCELLED;
        await this.orderRepository.save(order);
        console.log(`Order ${orderId} cancelled. Reason: ${reason}`);

        // Publish cancellation event
        await this.eventPublisher.publish(EventRoutingKeys.ORDER_CANCELLED, {
            orderId: order.id,
            userId: order.userId,
            items: order.items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                price: Number(i.price)
            })),
            reason: reason
        });
    }
}