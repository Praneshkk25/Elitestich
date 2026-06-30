'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, CheckCircle, Navigation, LogOut, Phone, Ruler } from 'lucide-react';
import dynamic from 'next/dynamic';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Dynamically import MapComponent
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

interface Order {
    id: string;
    customer_name: string;
    amount: number;
    delivery_status: string;
    delivery_location: any;
    address?: string;
    phone?: string;
    measurements?: any;
    payment_status?: string;
    fabricSource?: string;
    measurementMethod?: string;
    pickupOTP?: string;
    deliveryOTP?: string;
    status: string;
}

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [driverId, setDriverId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
    const [showMeasurementModal, setShowMeasurementModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [measurements, setMeasurements] = useState<Record<string, any>>({});

    // Tab state & OTP handshake states
    const [activeTab, setActiveTab] = useState<'pickups' | 'deliveries'>('pickups');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpType, setOtpType] = useState<'pickup' | 'delivery'>('pickup');
    const [enteredOtp, setEnteredOtp] = useState('');
    const [otpTargetOrder, setOtpTargetOrder] = useState<Order | null>(null);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().firstLogin === true) {
                        router.push('/setup-password');
                        return;
                    }

                    // Fetch delivery_personnel profile matching authUid
                    const q = query(collection(db, 'delivery_personnel'), where('authUid', '==', user.uid));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const driverDocId = snap.docs[0].id;
                        setDriverId(driverDocId);
                        await fetchOrders(driverDocId);
                    } else {
                        // Fallback to mock driver if profile not created yet for this auth user
                        console.log('Driver profile not found, falling back to mock driver ID');
                        setDriverId('mock_driver_123');
                        await fetchOrders('mock_driver_123');
                    }
                } catch (e) {
                    console.error("Error verifying driver status", e);
                    setLoading(false);
                }
            } else {
                router.push('/delivery/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchOrders = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders?driverId=${id}`);
            const result = await response.json();
            if (result.success) {
                setOrders(result.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitStatusUpdate = async (orderId: string, status: string) => {
        try {
            const order = orders.find(o => o.id === orderId);
            const payload: any = { delivery_status: status };

            if (status === 'delivered') {
                payload.status = 'delivered';
                if (order && order.payment_status === 'pending_cod') {
                    payload.payment_status = 'paid';
                }
            }

            const response = await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                handleSuccess(orderId, status);
            } else {
                alert('Failed to update status on server');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        if (status === 'picked_up') {
            if (order.pickupOTP) {
                setOtpTargetOrder(order);
                setOtpType('pickup');
                setEnteredOtp('');
                setShowOtpModal(true);
                return;
            }
        }

        if (status === 'delivered') {
            if (order.payment_status === 'pending_cod') {
                const confirmed = window.confirm(
                    `Amount to Collect: ₹${order.amount}\n\nHave you collected the cash payment from the customer?`
                );
                if (!confirmed) return;
            }

            if (order.deliveryOTP) {
                setOtpTargetOrder(order);
                setOtpType('delivery');
                setEnteredOtp('');
                setShowOtpModal(true);
                return;
            }
        }

        await submitStatusUpdate(orderId, status);
    };

    const handleVerifyOtp = async () => {
        if (!otpTargetOrder) return;
        const correctOtp = otpType === 'pickup' ? otpTargetOrder.pickupOTP : otpTargetOrder.deliveryOTP;
        if (enteredOtp !== correctOtp) {
            alert('Invalid OTP code. Please ask the customer for the correct code.');
            return;
        }

        setShowOtpModal(false);
        const nextStatus = otpType === 'pickup' ? 'picked_up' : 'delivered';
        await submitStatusUpdate(otpTargetOrder.id, nextStatus);
    };

    const handleSuccess = (orderId: string, status: string) => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, delivery_status: status } : o));

        if (status === 'out_for_delivery') {
            setTrackingOrderId(orderId);
        } else if (status === 'delivered') {
            setTrackingOrderId(null);
            alert('Order delivered and payment recorded successfully!');
            if (driverId) fetchOrders(driverId); // Refresh list
        } else if (status === 'picked_up') {
            alert('Pickup confirmed! Drop it off at the tailor workshop.');
            if (driverId) fetchOrders(driverId);
        }
    };

    // Measurement Categories Configuration
    const MEASUREMENT_CATEGORIES = {
        'Saree Blouse': [
            { id: 'bust', label: 'Bust (in)' },
            { id: 'waist', label: 'Waist (in)' },
            { id: 'shoulder', label: 'Shoulder (in)' },
            { id: 'arm_hole', label: 'Arm Hole (in)' },
            { id: 'sleeve_length', label: 'Sleeve Length (in)' },
            { id: 'blouse_length', label: 'Blouse Length (in)' },
            { id: 'front_neck', label: 'Front Neck Depth (in)' },
            { id: 'back_neck', label: 'Back Neck Depth (in)' },
            { id: 'knot', label: 'Knot?', type: 'select', options: ['No', 'Yes'] }
        ],
        'Chudithar': [
            { id: 'bust', label: 'Bust (in)' },
            { id: 'waist', label: 'Waist (in)' },
            { id: 'hips', label: 'Hips (in)' },
            { id: 'shoulder', label: 'Shoulder (in)' },
            { id: 'sleeve_length', label: 'Sleeve Length (in)' },
            { id: 'top_length', label: 'Top Length (in)' },
            { id: 'pant_length', label: 'Pant Length (in)' },
            { id: 'inseam', label: 'Inseam (in)' },
            { id: 'knot', label: 'Knot?', type: 'select', options: ['No', 'Yes'] }
        ],
        'Lehenga': [
            { id: 'blouse_bust', label: 'Blouse Bust (in)' },
            { id: 'blouse_waist', label: 'Blouse Waist (in)' },
            { id: 'blouse_length', label: 'Blouse Length (in)' },
            { id: 'skirt_waist', label: 'Skirt Waist (in)' },
            { id: 'skirt_length', label: 'Skirt Length (in)' },
            { id: 'hips', label: 'Hips (in)' },
            { id: 'knot', label: 'Blouse Knot?', type: 'select', options: ['No', 'Yes'] }
        ],
        'Half Saree': [
            { id: 'blouse_bust', label: 'Blouse Bust (in)' },
            { id: 'blouse_waist', label: 'Blouse Waist (in)' },
            { id: 'blouse_length', label: 'Blouse Length (in)' },
            { id: 'skirt_waist', label: 'Skirt Waist (in)' },
            { id: 'skirt_length', label: 'Skirt Length (in)' },
            { id: 'knot', label: 'Blouse Knot?', type: 'select', options: ['No', 'Yes'] }
        ]
    };

    const [selectedCategory, setSelectedCategory] = useState<string>('Saree Blouse');

    const handleSaveMeasurements = async () => {
        if (!selectedOrder) return;

        const dataToSave = {
            category: selectedCategory,
            ...measurements
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Mock Save Data:', dataToSave);
        alert('Measurements saved successfully!');
        setShowMeasurementModal(false);
        setMeasurements({}); // Reset
    };

    const handleLogout = () => {
        document.cookie = 'driver_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/delivery/login');
    };

    const pickups = orders.filter(order => 
        (order.fabricSource === 'own' || order.measurementMethod === 'Sample cloth for measurement') && 
        order.delivery_status === 'assigned'
    );

    const deliveries = orders.filter(order => 
        order.delivery_status === 'out_for_delivery' || 
        (order.status === 'ready_for_delivery' && (order.delivery_status === 'assigned' || order.delivery_status === 'picked_up'))
    );

    const activeOrders = activeTab === 'pickups' ? pickups : deliveries;

    // Prepare locations for map
    const mapLocations = activeOrders.map(order => ({
        lat: 11.6643 + (Math.random() - 0.5) * 0.05, // Mock location around Salem
        lng: 78.1460 + (Math.random() - 0.5) * 0.05,
        title: order.customer_name,
        description: order.address || 'No address provided'
    }));

    if (loading) return <div style={{ color: 'var(--foreground)', padding: '2rem', textAlign: 'center' }}>Loading dashboard data...</div>;

    return (
        <div style={{ padding: '1rem', paddingBottom: '5rem', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>My Deliveries</h1>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--error)' }}>
                    <LogOut size={24} />
                </button>
            </div>

            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <button 
                    onClick={() => setActiveTab('pickups')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'pickups' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'pickups' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Pending Pickups ({pickups.length})
                </button>
                <button 
                    onClick={() => setActiveTab('deliveries')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'deliveries' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'deliveries' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Pending Deliveries ({deliveries.length})
                </button>
            </div>

            {/* Map View */}
            {activeOrders.length > 0 && (
                <div style={{ marginBottom: '2rem', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <MapComponent locations={mapLocations} />
                </div>
            )}

            {activeOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                    <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No pending tasks here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeOrders.map(order => (
                        <div key={order.id} style={{
                            backgroundColor: 'var(--secondary)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{order.customer_name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Order #{order.id.slice(0, 8)}</p>
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    backgroundColor:
                                        order.delivery_status === 'assigned' ? 'rgba(234, 179, 8, 0.1)' :
                                            order.delivery_status === 'picked_up' ? 'rgba(59, 130, 246, 0.1)' :
                                                'rgba(16, 185, 129, 0.1)',
                                    color:
                                        order.delivery_status === 'assigned' ? '#eab308' :
                                            order.delivery_status === 'picked_up' ? '#3b82f6' :
                                                '#10b981',
                                    height: 'fit-content',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {order.delivery_status === 'assigned' ? 'Pickup Pending' : order.delivery_status.replace(/_/g, ' ')}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                    <MapPin size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                                        {order.address || '123, Gandhi Road, Salem, Tamil Nadu - 636007'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                    <Phone size={18} />
                                    <p style={{ fontSize: '0.95rem' }}>{order.phone || '9876543210'}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* Pickup Actions */}
                                {activeTab === 'pickups' && order.delivery_status === 'assigned' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowMeasurementModal(true);
                                            }}
                                            className="btn btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <Ruler size={18} /> Measure
                                        </button>
                                        <button
                                            onClick={() => updateStatus(order.id, 'picked_up')}
                                            className="btn btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#eab308', borderColor: '#eab308', color: '#000' }}
                                        >
                                            <Package size={18} /> Pickup
                                        </button>
                                    </>
                                )}

                                {/* Delivery Actions */}
                                {activeTab === 'deliveries' && (order.delivery_status === 'picked_up' || order.delivery_status === 'assigned') && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'out_for_delivery')}
                                        disabled={order.status !== 'ready_for_delivery'}
                                        className="btn btn-primary"
                                        style={{ 
                                            gridColumn: '1 / -1', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '0.5rem',
                                            opacity: order.status !== 'ready_for_delivery' ? 0.6 : 1,
                                            cursor: order.status !== 'ready_for_delivery' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <Navigation size={18} /> {order.status === 'ready_for_delivery' ? 'Start Delivery' : 'Waiting for Stitching to Complete'}
                                    </button>
                                )}

                                {order.delivery_status === 'out_for_delivery' && (
                                    <>
                                        <button
                                            className="btn btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=11.6643,78.1460`)}
                                        >
                                            <MapPin size={18} /> Nav
                                        </button>
                                        <button
                                            onClick={() => updateStatus(order.id, 'delivered')}
                                            className="btn btn-primary"
                                            style={{ backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <CheckCircle size={18} /> Delivered
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Measurement Modal */}
            {showMeasurementModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        border: '1px solid var(--border)'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>Take Measurements</h2>

                        {/* Category Selector */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setMeasurements({}); // Reset on category change
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--foreground)'
                                }}
                            >
                                {Object.keys(MEASUREMENT_CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {MEASUREMENT_CATEGORIES[selectedCategory as keyof typeof MEASUREMENT_CATEGORIES].map((field: any) => (
                                <div key={field.id} style={{ gridColumn: field.id === 'knot' ? '1 / -1' : 'auto' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {field.label}
                                    </label>
                                    {field.type === 'select' ? (
                                        <select
                                            value={(measurements as any)[field.id] || ''}
                                            onChange={e => setMeasurements({ ...measurements, [field.id]: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        >
                                            <option value="">Select...</option>
                                            {field.options.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={(measurements as any)[field.id] || ''}
                                            onChange={e => setMeasurements({ ...measurements, [field.id]: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowMeasurementModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={handleSaveMeasurements} className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '400px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
                            {otpType === 'pickup' ? 'Verify Pickup OTP' : 'Verify Delivery OTP'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Please ask the customer for the 4-digit verification code shown on their tracking page.
                        </p>

                        <input
                            type="text"
                            maxLength={4}
                            placeholder="0 0 0 0"
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                            style={{
                                width: '150px',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '2px solid var(--primary)',
                                backgroundColor: 'var(--background)',
                                color: 'var(--foreground)',
                                fontSize: '1.8rem',
                                textAlign: 'center',
                                letterSpacing: '4px',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                                outline: 'none'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => setShowOtpModal(false)} 
                                className="btn btn-outline" 
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleVerifyOtp} 
                                className="btn btn-primary" 
                                style={{ flex: 1 }}
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
