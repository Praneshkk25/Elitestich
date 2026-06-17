import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { adminDb } from '../lib/firebaseAdmin';
import { sendOrderConfirmation } from '../lib/email';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_p0r8VStiJ7x19X',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'MPlc3hPlac3hold3rS3cr3tKey',
});

// Endpoint to create a Razorpay order
router.post('/checkout', async (req, res) => {
    try {
        const { basePrice, includeMeasurements } = req.body;
        const totalAmount = (basePrice || 0) + (includeMeasurements ? 500 : 0);

        if (totalAmount <= 0) {
            return res.status(400).json({ error: 'Invalid order amount' });
        }

        const options = {
            amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise (1 INR = 100 paise)
            currency: 'INR',
            receipt: 'rcpt_' + crypto.randomBytes(4).toString('hex'),
        };

        const rzpOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_p0r8VStiJ7x19X',
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            razorpayOrderId: rzpOrder.id
        });
    } catch (err: any) {
        console.error('Razorpay order creation error:', err);
        res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
    }
});

// Endpoint to verify payment signature and register the order
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDetails
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment signature verification details' });
        }

        // Verify the signature
        const secret = process.env.RAZORPAY_KEY_SECRET || 'MPlc3hPlac3hold3rS3cr3tKey';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment verification failed: invalid signature' });
        }

        // Signature is valid! Create the final order
        const {
            email,
            customerName,
            designTitle,
            basePrice,
            includeMeasurements,
            dressType,
            measurementMethod,
            measurementsUsed,
            customizationNotes,
            fabricSource
        } = orderDetails || {};

        const totalAmount = (basePrice || 0) + (includeMeasurements ? 500 : 0);

        const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
        const finalFabricSource = fabricSource || 'own';

        const pickupOTP = (finalFabricSource === 'own' || measurementMethod === 'Sample cloth for measurement') 
            ? generateOTP() 
            : null;
        const deliveryOTP = generateOTP();

        const orderId = crypto.randomUUID();
        const finalOrder = {
            id: orderId,
            customer_name: customerName || 'Valued Customer',
            email: email || '',
            design_title: designTitle || 'Bespoke Design',
            amount: totalAmount,
            status: 'pending',
            payment_status: 'paid',
            payment_method: 'online',
            razorpay_payment_id,
            razorpay_order_id,
            dressType: dressType || 'unknown',
            measurementMethod: measurementMethod || 'Not Provided',
            measurementsUsed: measurementsUsed || null,
            customizationNotes: customizationNotes || '',
            fabricSource: finalFabricSource,
            pickupOTP,
            deliveryOTP,
            delivery_status: 'pending',
            created_at: new Date().toISOString()
        };

        // Save order to Firestore
        await adminDb.collection('orders').doc(orderId).set(finalOrder);

        // Send confirmation email in background
        if (email && process.env.RESEND_API_KEY) {
            sendOrderConfirmation(finalOrder, email).catch(err =>
                console.error('Failed to send background payment confirmation email:', err)
            );
        }

        res.json({
            success: true,
            orderId,
            url: `${req.headers.origin}/track?order_id=${orderId}`
        });

    } catch (err: any) {
        console.error('Payment verification registration error:', err);
        res.status(500).json({ error: err.message || 'Payment verification registration failed' });
    }
});

export default router;
