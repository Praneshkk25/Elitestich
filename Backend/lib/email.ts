import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

// Check if we are running in Sandbox mode (unverified Resend account)
// By default, sandbox mode is true unless RESEND_SANDBOX is explicitly set to 'false'
const isSandboxMode = process.env.RESEND_SANDBOX !== 'false';
const SANDBOX_RECIPIENT = 'elitestitchworld@gmail.com';

export const sendOrderConfirmation = async (order: any, customerEmail: string) => {
    try {
        const recipient = isSandboxMode ? SANDBOX_RECIPIENT : customerEmail;
        const subjectLine = isSandboxMode 
            ? `[SANDBOX REDIRECT to ${customerEmail}] Order Confirmation - Elite Stitch`
            : `Order Confirmation - Elite Stitch`;

        const sandboxNotice = isSandboxMode ? `
            <div style="background-color: #fff3cd; color: #856404; padding: 12px; border-radius: 5px; border: 1px solid #ffeeba; margin-bottom: 20px; font-size: 0.9rem;">
                <strong>Resend Sandbox Notice:</strong> This email was originally sent to <strong>${customerEmail}</strong> but was redirected to your sandbox tester email.
            </div>
        ` : '';

        const data = await resend.emails.send({
            from: 'Elite Stitch <onboarding@resend.dev>',
            to: [recipient],
            subject: subjectLine,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    ${sandboxNotice}
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

export const sendWelcomeCredentials = async (name: string, email: string, role: 'tailor' | 'delivery', otp: string) => {
    try {
        const recipient = isSandboxMode ? SANDBOX_RECIPIENT : email;
        const subjectLine = isSandboxMode
            ? `[SANDBOX REDIRECT to ${email}] Welcome to Elite Stitch World! Your OTP Inside`
            : `Welcome to Elite Stitch World! Your One-Time Password (OTP) Inside`;

        const sandboxNotice = isSandboxMode ? `
            <div style="background-color: #fff3cd; color: #856404; padding: 12px; border-radius: 5px; border: 1px solid #ffeeba; margin-bottom: 20px; font-size: 0.9rem;">
                <strong>Resend Sandbox Notice:</strong> This email was originally sent to <strong>${email}</strong> but was redirected to your sandbox tester email.
            </div>
        ` : '';

        const portalUrl = role === 'tailor' ? 'http://localhost:3002/tailor/login' : 'http://localhost:3002/delivery/login';
        const data = await resend.emails.send({
            from: 'Elite Stitch <onboarding@resend.dev>',
            to: [recipient],
            subject: subjectLine,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
                    ${sandboxNotice}
                    <h1 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 0;">Welcome to Elite Stitch World!</h1>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>You have been registered as a <strong>${role === 'tailor' ? 'Tailor / Stitcher' : 'Delivery Partner'}</strong> at Elite Stitch World!</p>
                    <p>Here is your One-Time Password (OTP) to log in for the first time. You will be prompted to choose your own password upon logging in:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d4af37; font-size: 0.95rem; line-height: 1.5;">
                        <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="${portalUrl}" style="color: #d4af37; text-decoration: underline;">${portalUrl}</a></p>
                        <p style="margin: 5px 0;"><strong>Username / Email:</strong> ${email}</p>
                        <p style="margin: 5px 0; font-size: 1.2rem; color: #111;"><strong>One-Time Password (OTP):</strong> <span style="font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px; font-weight: bold; letter-spacing: 1px;">${otp}</span></p>
                    </div>
                    <p>Please log in using this OTP and complete your account setup.</p>
                    <p style="margin-top: 30px; font-size: 0.9rem; color: #777; border-top: 1px solid #eee; padding-top: 15px;">Best regards,<br>The Elite Stitch World Team</p>
                </div>
            `
        });
        return data;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
