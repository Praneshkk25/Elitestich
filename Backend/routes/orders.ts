import express from 'express';
import { sendOrderConfirmation } from '../lib/email';
import crypto from 'crypto';
import { adminDb } from '../lib/firebaseAdmin';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const {
            email,
            customerName,
            designTitle,
            basePrice,
            includeMeasurements,
            paymentMethod,
            dressType,
            measurementMethod,
            measurementsUsed,
            customizationNotes,
            fabricSource
        } = req.body;

        const totalAmount = basePrice + (includeMeasurements ? 500 : 0);

        const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
        const finalFabricSource = fabricSource || 'own';

        const pickupOTP = (finalFabricSource === 'own' || measurementMethod === 'Sample cloth for measurement') 
            ? generateOTP() 
            : null;
        const deliveryOTP = generateOTP();

        const mockOrderId = crypto.randomUUID();
        const mockOrder = {
            id: mockOrderId,
            customer_name: customerName,
            email: email,
            design_title: designTitle,
            amount: totalAmount,
            status: 'pending',
            payment_status: paymentMethod === 'cod' ? 'pending_cod' : 'paid',
            payment_method: paymentMethod,
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
        await adminDb.collection('orders').doc(mockOrderId).set(mockOrder);

        // Send confirmation email (fire and forget to avoid blocking)
        if (email && process.env.RESEND_API_KEY) {
            sendOrderConfirmation(mockOrder, email).catch(err =>
                console.error('Failed to send background email:', err)
            );
        }

        // Return success with order ID
        res.json({
            success: true,
            orderId: mockOrderId,
            url: `${req.headers.origin}/track?order_id=${mockOrderId}`
        });

    } catch (err: any) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { tailorId, driverId, status } = req.query;
        let query: FirebaseFirestore.Query = adminDb.collection('orders');

        if (tailorId) {
            query = query.where('tailorId', '==', tailorId);
        }
        if (driverId) {
            query = query.where('assigned_to', '==', driverId);
        }
        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ success: true, orders });
    } catch (err: any) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const doc = await adminDb.collection('orders').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ success: true, order: { id: doc.id, ...doc.data() } });
    } catch (err: any) {
        console.error('Error fetching order:', err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const updates = req.body;
        await adminDb.collection('orders').doc(req.params.id).update(updates);
        res.json({ success: true, message: 'Order updated successfully' });
    } catch (err: any) {
        console.error('Error updating order:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
