'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, Scissors, Truck, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import styles from './track.module.css';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReviewModal from '@/components/ReviewModal';
import ChatBox from '@/components/ChatBox';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading live tracker map...</div>
});

const getCustomerLocation = (orderId: string) => {
    const hash = orderId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const lat = 11.6643 + ((hash % 100) / 1000) - 0.05;
    const lng = 78.1460 + (((hash * 13) % 100) / 1000) - 0.05;
    return { lat, lng };
};

const getDriverLocation = (driverId: string) => {
    const hash = driverId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const lat = 11.6643 + ((hash % 120) / 1000) - 0.06;
    const lng = 78.1460 + (((hash * 17) % 120) / 1000) - 0.06;
    return { lat, lng };
};

function TrackPageContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [driverInfo, setDriverInfo] = useState<any>(null);

    useEffect(() => {
        if (order && order.assigned_to) {
            fetchDriverInfo(order.assigned_to);
        } else {
            setDriverInfo(null);
        }
    }, [order]);

    const fetchDriverInfo = async (driverId: string) => {
        try {
            const response = await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/users/drivers/${driverId}`);
            const data = await response.json();
            if (data.success && data.driver) {
                setDriverInfo(data.driver);
            } else {
                setDriverInfo(null);
            }
        } catch (e) {
            console.error('Error fetching driver info:', e);
            setDriverInfo(null);
        }
    };

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
            const response = await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/verify-payment`, {
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
            'fabric_received': 2,
            'pattern_cutting': 3,
            'stitching': 4,
            'stitching_progress': 4,
            'embroidery': 5,
            'finished': 6,
            'pending_qc': 7,
            'ready_for_delivery': 8,
            'delivered': 9
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
            case 'processing': // Stitching & Milestones
                if (currentStatusLevel >= 6) return styles.completed; // Finished or later
                if (currentStatusLevel >= 2) return styles.active; // Fabric checked, pattern cut, stitching, or embroidery
                return '';
            case 'quality_check':
                if (currentStatusLevel >= 8) return styles.completed; // Ready for delivery
                if (currentStatusLevel === 6 || currentStatusLevel === 7) return styles.active; // Finished or Pending QC
                return '';
            case 'shipped': // Out for Delivery
                if (currentDeliveryLevel >= 4) return styles.completed; // Delivered
                if (currentDeliveryLevel >= 2) return styles.active; // Picked up or out for delivery
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
                                
                                {/* OTP Display Section */}
                                {(order.pickupOTP || order.deliveryOTP) && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '6px',
                                        background: 'rgba(212, 175, 55, 0.08)',
                                        border: '1px solid rgba(212, 175, 55, 0.3)',
                                        fontSize: '0.9rem',
                                        color: 'var(--foreground)'
                                    }}>
                                        {order.pickupOTP && order.delivery_status !== 'picked_up' && order.delivery_status !== 'out_for_delivery' && order.delivery_status !== 'delivered' && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: order.deliveryOTP && order.delivery_status !== 'delivered' ? '0.5rem' : 0 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Fabric/Sample Pickup OTP:</span>
                                                <strong style={{ letterSpacing: '2px', fontSize: '1.1rem', color: 'var(--primary)' }}>{order.pickupOTP}</strong>
                                            </div>
                                        )}
                                        {order.deliveryOTP && order.delivery_status !== 'delivered' && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Garment Delivery OTP:</span>
                                                <strong style={{ letterSpacing: '2px', fontSize: '1.1rem', color: 'var(--primary)' }}>{order.deliveryOTP}</strong>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                    {['fabric_received', 'pattern_cutting', 'stitching', 'stitching_progress', 'embroidery'].includes(order.status) && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: 'rgba(212,175,55,0.08)',
                                            border: '1px solid rgba(212,175,55,0.2)',
                                            fontSize: '0.8rem',
                                            display: 'inline-block',
                                            fontWeight: 'bold',
                                            color: 'var(--primary)'
                                        }}>
                                            Milestone: {
                                                order.status === 'fabric_received' ? 'Fabric Checked & Prepared' :
                                                order.status === 'pattern_cutting' ? 'Pattern Cutting' :
                                                order.status === 'stitching' || order.status === 'stitching_progress' ? 'Stitching Custom Pattern' :
                                                order.status === 'embroidery' ? 'Embroidery & Custom Handwork' : 'Tailoring Workspace'
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`${styles.timelineItem} ${getStepStatus('quality_check')}`}>
                                <div className={styles.iconWrapper}><Package size={20} /></div>
                                <div className={styles.content}>
                                    <h4>Quality Check</h4>
                                    <p>Final inspection to ensure perfect fit and finish.</p>
                                    {order.status === 'pending_qc' && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: 'rgba(234,179,8,0.08)',
                                            border: '1px solid rgba(234,179,8,0.2)',
                                            fontSize: '0.8rem',
                                            display: 'inline-block',
                                            fontWeight: 'bold',
                                            color: '#eab308'
                                        }}>
                                            Status: Garment photo submitted for Admin QC Approval
                                        </div>
                                    )}
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

                        {/* Live Tracking Map Section */}
                        <div style={{ marginTop: '3rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={22} color="var(--primary)" /> Live Tracking & Location Details
                            </h3>
                            <div style={{ height: '350px', width: '100%', marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <MapComponent locations={
                                    driverInfo 
                                        ? [
                                            { lat: getDriverLocation(order.assigned_to).lat, lng: getDriverLocation(order.assigned_to).lng, title: `Driver: ${driverInfo.name}`, description: 'Your delivery partner is on the way!' },
                                            { lat: getCustomerLocation(order.id).lat, lng: getCustomerLocation(order.id).lng, title: 'Your Location', description: 'Delivery address location marker' }
                                          ]
                                        : [
                                            { lat: getCustomerLocation(order.id).lat, lng: getCustomerLocation(order.id).lng, title: 'Your Location', description: 'Delivery address location marker' }
                                          ]
                                } />
                            </div>
                            
                            {driverInfo ? (
                                <div style={{ 
                                    padding: '1.25rem', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'rgba(212, 175, 55, 0.05)', 
                                    border: '1px solid rgba(212, 175, 55, 0.2)',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--foreground)', fontSize: '1rem' }}>Assigned Driver: {driverInfo.name}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Personnel Number: {driverInfo.personnel_number} | Contact: {driverInfo.phone || '9876543210'}</p>
                                    </div>
                                    <div style={{ 
                                        padding: '0.3rem 0.8rem', 
                                        borderRadius: '12px', 
                                        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                                        color: '#10b981',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        textTransform: 'capitalize'
                                    }}>
                                        Driver Status: {driverInfo.status || 'Active'}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    padding: '1rem', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                    border: '1px solid var(--border)',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-muted)',
                                    textAlign: 'center'
                                }}>
                                    A driver will be assigned to pick up your fabric or deliver the completed garment.
                                </div>
                            )}
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
