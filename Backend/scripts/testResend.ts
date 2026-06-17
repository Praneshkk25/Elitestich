import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

const testEmail = async () => {
    const apiKey = process.env.RESEND_API_KEY;
    console.log(`Using Resend API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);

    try {
        console.log('\n--- Attempting to send using onboarding@resend.dev ---');
        const res1 = await resend.emails.send({
            from: 'Elite Stitch <onboarding@resend.dev>',
            to: ['elitestitchworld@gmail.com'], // Send to the registered email in their .env
            subject: 'Test Email - Resend Sandbox',
            html: '<p>This is a test from resend.dev</p>'
        });
        console.log('Result:', res1);
    } catch (e: any) {
        console.error('Error with onboarding@resend.dev:', e.message || e);
    }

    try {
        console.log('\n--- Attempting to send using onboarding@elitestitch.com ---');
        const res2 = await resend.emails.send({
            from: 'Elite Stitch <onboarding@elitestitch.com>',
            to: ['elitestitchworld@gmail.com'],
            subject: 'Test Email - Custom Domain',
            html: '<p>This is a test from elitestitch.com</p>'
        });
        console.log('Result:', res2);
    } catch (e: any) {
        console.error('Error with onboarding@elitestitch.com:', e.message || e);
    }
};

testEmail();
