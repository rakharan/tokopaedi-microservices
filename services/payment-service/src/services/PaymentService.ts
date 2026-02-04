import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../models/Payment';
import { EventPublisher, EventRoutingKeys } from '@tokopaedi/shared';

export class PaymentService {
    constructor(
        private paymentRepository: Repository<Payment>,
        private eventPublisher: EventPublisher
    ) { }

    async processPayment(orderData: any): Promise<void> {
        console.log(`Processing payment for Order #${orderData.orderId} ($${orderData.totalPrice})...`);

        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force failure if amount is greater than 2000
        if (orderData.totalPrice > 2000) {
            console.error(`Payment rejected for Order #${orderData.orderId} (Amount too high)`);

            const failedPayment = new Payment();
            failedPayment.orderId = orderData.orderId;
            failedPayment.amount = orderData.totalPrice;
            failedPayment.status = PaymentStatus.FAILED;
            failedPayment.transactionId = `err_${Date.now()}`;
            await this.paymentRepository.save(failedPayment);

            await this.eventPublisher.publish(EventRoutingKeys.PAYMENT_FAILED, {
                paymentId: failedPayment.id,
                orderId: failedPayment.orderId,
                userId: orderData.userId,
                reason: 'Limit Exceeded',
                gatewayResponse: { error: 'declined' }
            });
            return;
        }

        const payment = new Payment();
        payment.orderId = orderData.orderId;
        payment.amount = orderData.totalPrice;
        payment.status = PaymentStatus.SUCCESS;
        payment.transactionId = `txn_${Date.now()}`;

        await this.paymentRepository.save(payment);
        console.log(`Payment successful. Txn: ${payment.transactionId}`);

        await this.eventPublisher.publish(EventRoutingKeys.ORDER_PAID, {
            orderId: payment.orderId,
            paymentId: payment.id,
            amount: payment.amount,
            paidAt: new Date()
        });
    }
}