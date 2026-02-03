export class EmailService {
    async sendOrderConfirmation(orderData: any): Promise<void> {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('------------------------------------------------');
        console.log('[Mock Email] ORDER CONFIRMATION sent to', orderData.userId);
        console.log('------------------------------------------------');
        console.log(`Subject: Order #${orderData.orderId} Confirmed`);
        console.log(`Body: Thanks for buying! Total: $${orderData.totalPrice}`);
        console.log(`Items:`);
        if (Array.isArray(orderData.items)) {
            orderData.items.forEach((item: any) => {
                console.log(` - ${item.name || 'Product'} x${item.quantity} ($${item.price})`);
            });
        }
        console.log('------------------------------------------------');
    }

    async sendPaymentReceived(paymentData: any): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('------------------------------------------------');
        console.log('[Mock Email] PAYMENT RECEIVED sent to', paymentData.userId || 'User');
        console.log('------------------------------------------------');
        console.log(`Subject: Payment Received for Order #${paymentData.orderId}`);
        console.log(`Body: We have received your payment of $${paymentData.amount}.`);
        console.log(`Payment ID: ${paymentData.paymentId}`);
        console.log('------------------------------------------------');
    }

    async sendShippingUpdate(deliveryData: any): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('------------------------------------------------');
        console.log('[Mock Email] SHIPPING UPDATE sent to', deliveryData.userId || 'User');
        console.log('------------------------------------------------');
        console.log(`Subject: Order #${deliveryData.orderId} Shipped`);
        console.log(`Body: Your order is on the way!`);
        console.log(`Tracking Number: ${deliveryData.trackingNumber}`);
        console.log(`Expedition: ${deliveryData.expeditionName || 'Internal Fleet'}`);
        console.log('------------------------------------------------');
    }
}