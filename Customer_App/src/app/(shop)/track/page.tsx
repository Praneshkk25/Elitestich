'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, Scissors, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './track.module.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReviewModal from '@/components/ReviewModal';
import ChatBox from '@/components/ChatBox';

function TrackPageContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        const idFromUrl = searchParams.get('order_id');
        const sessionId = searchParams.get('session_id');

        if (sessionId && idFromUrl) {
            verifyPayment(sessionId, idFromUrl);
        } else if (idFromUrl) {
            setOrderId(idFromUrl);
            fetchOrder(idFromUrl);
        }
    }, [searchParams]);

    const verifyPayment = async (sessionId: string, orderId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            const result = await response.json();

            if (result.success) {
                window.history.replaceState({}, '', `/track?order_id=${orderId}`);
                setOrderId(orderId);
                fetchOrder(orderId);
            } else {
                setError(result.error || 'Payment verification failed');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Failed to verify payment');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrder = async (id: string) => {
        setLoading(true);
        setError('');
        try {
            const docRef = doc(db, 'orders', id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Order not found');
            }
            
            setOrder({ id: docSnap.id, ...docSnap.data() });
        } catch (err) {
            console.error('Error fetching order:', err);
            setError('Order not found. Please check the ID and try again.');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderId.trim()) {
            fetchOrder(orderId.trim());
        }
    };

    const getStepStatus = (step: string) => {
        const { status, delivery_status } = order;

        // Define progress levels for order status
        const statusLevels: Record<string, number> = {
            'pending': 0,
            'confirmed': 1,
            'stitching': 2,
            'stitched': 3,
            'ready_for_delivery': 4,
            'delivered': 5
        };

        // Define progress levels for delivery status
        const deliveryLevels: Record<string, number> = {
            'pending': 0,
            'assigned': 1,
            'picked_up': 2,
            'out_for_delivery': 3,
            'delivered': 4
        };

        const currentStatusLevel = statusLevels[status] || 0;
        const currentDeliveryLevel = deliveryLevels[delivery_status] || 0;

        switch (step) {
            case 'confirmed':
                if (currentStatusLevel >= 1) return styles.completed;
                return styles.active; // Pending is active on first step
            case 'processing': // Stitching
                if (currentStatusLevel >= 3) return styles.completed; // Stitched or later
                if (currentStatusLevel === 2) return styles.active; // Stitching
                return '';
            case 'quality_check':
                if (currentStatusLevel >= 4) return styles.completed; // Ready for delivery
                if (currentStatusLevel === 3) return styles.active; // Stitched (Quality Check happening)
                return '';
            case 'shipped': // Out for Delivery
                if (currentDeliveryLevel >= 4) return styles.completed; // Delivered
                if (currentDeliveryLevel >= 3) return styles.active; // Out for delivery
                return '';
            default:
                return '';
        }
    };

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>Track Your Order</h1>
                    <p className={styles.subtitle}>
                        Enter your order ID to see the current status of your garment.
                    </p>
                </header>

                <div className={styles.searchContainer}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Enter Order ID (e.g., 550e8400...)"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className={styles.input}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Search size={20} /> {loading ? 'Tracking...' : 'Track'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div style={{ textAlign: 'center', color: 'red', marginBottom: '2rem' }}>
                        <AlertCircle size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        {error}
                    </div>
                )}

                {order && (
                    <div className={`${styles.statusContainer} animate-fade-in`}>
                        <div className={styles.orderInfo}>
                            <div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Order #{order.id.slice(0, 8)}...</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {order.design_title} | ₹{order.amount}
                                </p>
                                {/* Payment Status Display */}
                                <p style={{
                                    color: order.payment_status === 'paid' ? '#10b981' : '#eab308',
                                    fontSize: '0.85rem',
                                    marginTop: '0.25rem',
                                    fontWeight: 'bold'
                                }}>
                                    Payment: {order.payment_status === 'pending_cod' ? 'Pending (COD)' : 'Paid'}
                                </p>
                            </div>
                            <span className={styles.statusBadge} style={{ textTransform: 'capitalize' }}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        <div className={styles.timeline}>
                            <div className={`${styles.timelineItem} ${getStepStatus('confirmed')}`}>
                                <div className={styles.iconWrapper}><CheckCircle size={20} /></div>
                                <div className={styles.content}>
                                    <h4>Order Confirmed</h4>
                                    <p>We have received your order and measurements.</p>
                                    <span className={styles.date}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className={`${styles.timelineItem} ${getStepStatus('processing')}`}>
                                <div className={styles.iconWrapper}><Scissors size={20} /></div>
                                <div className={styles.content}>
                                    <h4>Stitching in Progress</h4>
                                    <p>Our master tailors are working on your garment.</p>
                                </div>
                            </div>

                            <div className={`${styles.timelineItem} ${getStepStatus('quality_check')}`}>
                                <div className={styles.iconWrapper}><Package size={20} /></div>
                                <div className={styles.content}>
                                    <h4>Quality Check</h4>
                                    <p>Final inspection to ensure perfect fit and finish.</p>
                                </div>
                            </div>

                            <div className={`${styles.timelineItem} ${getStepStatus('shipped')}`}>
                                <div className={styles.iconWrapper}><Truck size={20} /></div>
                                <div className={styles.content}>
                                    <h4>Out for Delivery</h4>
                                    <p>Your garment is on its way to you.</p>
                                </div>
                            </div>
                        </div>

                        {/* Leave a Review Button for Delivered Orders */}
                        {(order.status === 'delivered' || order.delivery_status === 'delivered') && (
                            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                                <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                    Your bespoke piece has arrived. We'd love to hear your thoughts.
                                </div>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setIsReviewModalOpen(true)}
                                    style={{ fontFamily: 'var(--font-serif)', letterSpacing: '1px' }}
                                >
                                    Share Your Style Story
                                </button>
                            </div>
                        )}
                        
                        <ReviewModal 
                            isOpen={isReviewModalOpen}
                            onClose={() => setIsReviewModalOpen(false)}
                            orderId={order.id}
                            designId={order.design_id || order.designId} 
                        />

                        {/* Customer Chat */}
                        <div style={{ marginTop: '3rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--foreground)' }}>Message Your Tailor</h3>
                            <ChatBox 
                                orderId={order.id} 
                                currentUserRole="customer" 
                                currentUserId={order.userId || 'guest'} 
                                currentUserName={order.customer_name || 'Customer'} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackPage() {
    return (
        <Suspense fallback={<div>Loading tracking...</div>}>
            <TrackPageContent />
        </Suspense>
    );
}
