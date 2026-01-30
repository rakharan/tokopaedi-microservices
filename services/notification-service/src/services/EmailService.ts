export class EmailService {
    async sendOrderConfirmation(orderData: any): Promise<void> {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('------------------------------------------------');
        console.log('📧 MOCK EMAIL SENT TO USER', orderData.userId);
        console.log('------------------------------------------------');
        console.log(`Subject: Order #${orderData.orderId} Confirmed`);
        console.log(`Body: Thanks for buying! Total: $${orderData.totalPrice}`);
        console.log(`Items:`);
        orderData.items.forEach((item: any) => {
            console.log(` - ${item.name} x${item.quantity} ($${item.price})`);
        });
        console.log('------------------------------------------------');
    }
}