'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, CheckCircle, Navigation, LogOut, Phone, Ruler } from 'lucide-react';
import dynamic from 'next/dynamic';

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
}

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [driverId, setDriverId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
    const [showMeasurementModal, setShowMeasurementModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [measurements, setMeasurements] = useState<Record<string, any>>({});

    const router = useRouter();

    useEffect(() => {
        // MOCK MODE: Bypass Auth and Fetching
        console.log('Running in Mock Mode');
        setDriverId('mock_driver_123');
        setOrders([
            {
                id: 'ord_mock_001',
                customer_name: 'Vaishnavi (Mock)',
                amount: 1500,
                delivery_status: 'assigned',
                delivery_location: { lat: 11.6643, lng: 78.1460 },
                address: '123 Mock Street, Salem',
                phone: '9999999999',
                payment_status: 'pending_cod'
            },
            {
                id: 'ord_mock_002',
                customer_name: 'Shubha (Mock)',
                amount: 2500,
                delivery_status: 'assigned',
                delivery_location: { lat: 11.6650, lng: 78.1470 },
                address: '456 Test Lane, Salem',
                phone: '8888888888'
            }
        ]);
        setLoading(false);

        /* ORIGINAL CODE COMMENTED OUT FOR MOCK MODE
        // Get driver ID from cookie
        const match = document.cookie.match(/driver_token=([^;]+)/);
        if (match) {
            setDriverId(match[1]);
            fetchOrders(match[1]);
        } else {
            router.push('/delivery/login');
        }
        */
    }, []);

    // Simulate location tracking
    useEffect(() => {
        // Mock tracking - do nothing or just log
    }, []);

    const fetchOrders = async (id: string) => {
        // Mock fetch - do nothing
    };

    const updateStatus = async (orderId: string, status: string) => {
        // Check for COD payment before marking as delivered
        if (status === 'delivered') {
            const order = orders.find(o => o.id === orderId);
            if (order && (order as any).payment_status === 'pending_cod') {
                const confirmed = window.confirm(
                    `Amount to Collect: ₹${order.amount}\n\nHave you collected the cash payment from the customer?`
                );

                if (!confirmed) return;

                // Mock Update payment status to 'paid' along with delivery status
                setTimeout(() => {
                    handleSuccess(orderId, status);
                }, 500);
                return;
            }
        }

        // Mock Update delivery status
        setTimeout(() => {
            handleSuccess(orderId, status);
        }, 500);
    };

    const handleSuccess = (orderId: string, status: string) => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, delivery_status: status } : o));

        if (status === 'out_for_delivery') {
            setTrackingOrderId(orderId);
        } else if (status === 'delivered') {
            setTrackingOrderId(null);
            alert('Order delivered and payment recorded successfully!');
            fetchOrders(driverId!); // Refresh list
        } else if (status === 'picked_up') {
            alert('Pickup confirmed! You can now start the delivery.');
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

        // MOCK MODE: Bypass Supabase for UI testing
        // const { error } = await supabase
        //     .from('orders')
        //     .update({ measurements: dataToSave })
        //     .eq('id', selectedOrder.id);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Mock Save Data:', dataToSave);
        alert('Measurements saved successfully! (Mock Mode)');
        setShowMeasurementModal(false);
        setMeasurements({}); // Reset
    };

    const handleLogout = () => {
        document.cookie = 'driver_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/delivery/login');
    };

    // Prepare locations for map
    const mapLocations = orders.map(order => ({
        lat: 11.6643 + (Math.random() - 0.5) * 0.05, // Mock location around Salem
        lng: 78.1460 + (Math.random() - 0.5) * 0.05,
        title: order.customer_name,
        description: order.address || 'No address provided'
    }));

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '1rem', paddingBottom: '5rem', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--foreground)' }}>My Deliveries</h1>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--error)' }}>
                    <LogOut size={24} />
                </button>
            </div>

            {/* Map View */}
            {orders.length > 0 && (
                <div style={{ marginBottom: '2rem', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <MapComponent locations={mapLocations} />
                </div>
            )}

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                    <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No pending deliveries.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.map(order => (
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
                                {order.delivery_status === 'assigned' && (
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

                                {order.delivery_status === 'picked_up' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'out_for_delivery')}
                                        className="btn btn-primary"
                                        style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Navigation size={18} /> Start Delivery
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
        </div>
    );
}
