import express from 'express';
import crypto from 'crypto';
import { adminDb } from '../lib/firebaseAdmin';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const body = req.body;
        const reviewId = crypto.randomUUID();
        const newReview = { id: reviewId, created_at: new Date().toISOString(), ...body };
        
        await adminDb.collection('reviews').doc(reviewId).set(newReview);
        
        res.json({ success: true, data: [newReview] });
    } catch (error) {
        console.error('Failed to submit review:', error);
        res.status(500).json({ success: false, error: 'Failed to submit review' });
    }
});

router.get('/', async (req, res) => {
    try {
        const snapshot = await adminDb.collection('reviews').orderBy('created_at', 'desc').limit(10).get();
        const reviews = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

export default router;
