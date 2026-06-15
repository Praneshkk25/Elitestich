import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

export const sendOrderConfirmation = async (order: any, customerEmail: string) => {
    try {
        const data = await resend.emails.send({
            from: 'Elite Stitch <orders@elitestitch.com>',
            to: [customerEmail],
            subject: `Order Confirmation - Elite Stitch`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h1 style="color: #333;">Thank you for your order!</h1>
                    <p>Hi ${order.customer_name},</p>
                    <p>Your order for <strong>${order.design_title}</strong> has been successfully placed.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h2 style="margin-top: 0;">Order Summary</h2>
                        <p><strong>Amount:</strong> ₹${order.amount}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                    </div>
                    <p>You can track your order using this ID: <strong>${order.id}</strong></p>
                </div>
            `
        });
        return data;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
