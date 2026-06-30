'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { Package, Truck, CheckCircle, Clock, MapPin, Scissors, MessageCircle, X, Ruler } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { Tailor } from '@/types/database';
import ChatBox from '@/components/ChatBox';

interface Order {
    id: string;
    customer_name: string;
    design_title: string;
    amount: number;
    status: string;
    delivery_status: string;
    assigned_to: string | null;
    tailorId: string | null;
    dressType: string;
    createdAt: any;
    measurementMethod?: string;
    measurementsUsed?: Record<string, string>;
    customizationNotes?: string;
    qc_photo?: string;
    qc_rejected_note?: string;
    fabricSource?: string;
}

interface Driver {
    id: string;
    name: string;
    personnel_number: string;
    current_location?: { lat: number, lng: number }; // Mock location
    distance?: number;
    status?: string;
}

// Shop Location (Salem)
const SHOP_LOCATION = { lat: 11.6643, lng: 78.1460 };

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading live finder map...</div>
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

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [tailors, setTailors] = useState<Tailor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChatOrder, setSelectedChatOrder] = useState<Order | null>(null);
    const [selectedQcOrder, setSelectedQcOrder] = useState<Order | null>(null);
    const [mapOrder, setMapOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchDrivers();
        fetchTailors();
        fetchOrders();

        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders');
            const data = await response.json();
            if (data.success) {
                const sortedOrders = data.orders.sort((a: any, b: any) => {
                    const getVal = (o: any) => {
                        if (o.created_at) return new Date(o.created_at).getTime();
                        if (o.createdAt) {
                            if (o.createdAt.seconds) return o.createdAt.seconds * 1000;
                            return new Date(o.createdAt).getTime();
                        }
                        return 0;
                    };
                    return getVal(b) - getVal(a);
                });
                setOrders(sortedOrders);
            }
        } catch (error) {
            console.error('Error fetching orders from API:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const response = await fetch('$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/users/drivers');
            const data = await response.json();
            if (data.success) {
                const driversData = data.drivers;
                const driversWithDistance = driversData.map((driver: any) => {
                    const mockLat = SHOP_LOCATION.lat + (Math.random() - 0.5) * 0.1;
                    const mockLng = SHOP_LOCATION.lng + (Math.random() - 0.5) * 0.1;
                    const dist = calculateDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, mockLat, mockLng);

                    return {
                        ...driver,
                        current_location: { lat: mockLat, lng: mockLng },
                        distance: parseFloat(dist.toFixed(1))
                    };
                }).sort((a: any, b: any) => a.distance - b.distance); 

                setDrivers(driversWithDistance as Driver[]);
            }
        } catch (e) {
            console.error('Error fetching drivers from API:', e);
        }
    };

    const fetchTailors = async () => {
        try {
            const response = await fetch('$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/users/tailors');
            const data = await response.json();
            if (data.success) {
                setTailors(data.tailors as Tailor[]);
            }
        } catch (e) {
            console.error('Error fetching tailors from API:', e);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchOrders(); // Refresh data
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleAssignDriver = async (orderId: string, driverId: string) => {
        if (!driverId) return;

        try {
            await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assigned_to: driverId,
                    delivery_status: 'assigned'
                })
            });
            fetchOrders(); // Refresh data
        } catch (error) {
            alert('Error assigning driver');
        }
    };

    const handleAssignTailor = async (orderId: string, tailorId: string) => {
        if (!tailorId) return;

        try {
            await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tailorId: tailorId,
                    status: 'stitching' // Automatically update status to stitching
                })
            });
            fetchOrders(); // Refresh data
        } catch (error) {
            alert('Error assigning tailor');
        }
    };

    const handleQcAction = async (orderId: string, approve: boolean, note?: string) => {
        try {
            const body = approve 
                ? { status: 'ready_for_delivery', qc_rejected_note: null }
                : { status: 'stitching_progress', qc_rejected_note: note || 'QC Rejected by admin.' };

            await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            fetchOrders();
            alert(approve ? 'QC Approved!' : 'QC Rejected. Sent back to tailor.');
        } catch (error) {
            console.error(error);
            alert('Error updating QC status');
        }
    };

    if (loading) {
        return (
            <div>
                <Skeleton style={{ height: '40px', width: '250px', marginBottom: '2rem' }} />
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            backgroundColor: 'var(--secondary)',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <Skeleton style={{ height: '24px', width: '100px' }} />
                                    <Skeleton style={{ height: '20px', width: '200px' }} />
                                    <Skeleton style={{ height: '16px', width: '150px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    <Skeleton style={{ height: '30px', width: '80px' }} />
                                    <Skeleton style={{ height: '16px', width: '120px' }} />
                                </div>
                            </div>
                            <Skeleton style={{ height: '1px', width: '100%' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Skeleton style={{ height: '36px', width: '150px' }} />
                                <Skeleton style={{ height: '36px', width: '200px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--foreground)' }}>Manage Orders</h1>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {orders.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '4rem 2rem', 
                        backgroundColor: 'var(--secondary)', 
                        borderRadius: '8px',
                        border: '1px dashed var(--border)' 
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>There are currently no orders in the system.</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Orders placed by customers will appear here.</p>
                    </div>
                ) : (
                    orders.map(order => (
                    <div key={order.id} style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--primary)',
                                        color: '#000',
                                        fontWeight: 'bold'
                                    }}>
                                        #{order.id.slice(0, 8)}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {order.createdAt ? new Date(order.createdAt?.seconds * 1000).toLocaleDateString() : 'Recent'}
                                    </span>
                                    <span style={{ 
                                        color: 'var(--text-muted)', 
                                        fontSize: '0.8rem',
                                        textTransform: 'capitalize',
                                        border: '1px solid var(--border)',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '12px'
                                     }}>
                                        Type: {order.dressType?.replace('_', ' ') || 'Unknown'}
                                    </span>
                                </div>
                                <h3 style={{ color: 'var(--foreground)', marginBottom: '0.25rem' }}>{order.design_title}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Customer: {order.customer_name}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.amount}</p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    justifyContent: 'flex-end',
                                    marginTop: '0.25rem',
                                    fontSize: '0.85rem',
                                    color: (order as any).payment_status === 'paid' ? '#10b981' : '#eab308'
                                }}>
                                    <span>Payment: {(order as any).payment_status === 'pending_cod' ? 'Pending (COD)' : 'Paid'}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    justifyContent: 'flex-end',
                                    marginTop: '0.5rem',
                                    color: ['delivered', 'ready_for_delivery'].includes(order.status) ? '#10b981' :
                                           ['pending_qc', 'finished'].includes(order.status) ? '#eab308' : '#3b82f6'
                                }}>
                                    {['delivered', 'ready_for_delivery'].includes(order.status) ? <CheckCircle size={16} /> : <Clock size={16} />}
                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{order.status === 'pending_qc' ? 'Pending QC' : order.status.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            borderTop: '1px solid var(--border)',
                            paddingTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1.5rem'
                        }}>
                            {/* Status Display (Read-only for Admin, since tailoring process controls it) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                                <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                    color: 'var(--primary)',
                                    border: '1px solid var(--primary)',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    textTransform: 'capitalize'
                                }}>
                                    {order.status.replace(/_/g, ' ')}
                                </span>
                            </div>

                            {/* Tailor Assignment */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Scissors size={18} color="var(--text-muted)" />
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: order.tailorId ? '#10b981' : '#eab308',
                                    }}>
                                        {order.tailorId ? 'Tailor Assigned' : 'Unassigned'}
                                    </span>
                                </div>

                                <select
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--foreground)',
                                        border: '1px solid var(--border)',
                                        minWidth: '200px',
                                        opacity: (() => {
                                            const needsPickup = ['pending', 'confirmed'].includes(order.status) &&
                                                (order.fabricSource === 'own' || order.measurementMethod === 'Sample cloth for measurement');
                                            const tailorDisabled = order.status === 'stitched' || 
                                                order.status === 'ready_for_delivery' || 
                                                order.status === 'shipped' || 
                                                order.status === 'delivered' || 
                                                (needsPickup && !order.assigned_to);
                                            return tailorDisabled ? 0.5 : 1;
                                        })()
                                    }}
                                    value={order.tailorId || ''}
                                    onChange={(e) => handleAssignTailor(order.id, e.target.value)}
                                    disabled={(() => {
                                        const needsPickup = ['pending', 'confirmed'].includes(order.status) &&
                                            (order.fabricSource === 'own' || order.measurementMethod === 'Sample cloth for measurement');
                                        return order.status === 'stitched' || 
                                            order.status === 'ready_for_delivery' || 
                                            order.status === 'shipped' || 
                                            order.status === 'delivered' || 
                                            (needsPickup && !order.assigned_to);
                                    })()}
                                    title={(() => {
                                        const needsPickup = ['pending', 'confirmed'].includes(order.status) &&
                                            (order.fabricSource === 'own' || order.measurementMethod === 'Sample cloth for measurement');
                                        if (needsPickup && !order.assigned_to) return "Assign pickup driver first";
                                        if (order.status === 'stitched') return "Already stitched";
                                        return "Assign Tailor";
                                    })()}
                                >
                                    <option value="">
                                        {(() => {
                                            const needsPickup = ['pending', 'confirmed'].includes(order.status) &&
                                                (order.fabricSource === 'own' || order.measurementMethod === 'Sample cloth for measurement');
                                            if (needsPickup && !order.assigned_to) return "Assign Pickup Driver First...";
                                            return order.tailorId ? "Re-assign Tailor..." : "Assign Tailor...";
                                        })()}
                                    </option>
                                    {tailors.map(tailor => {
                                        // Highlight if tailor has skill for this dress type
                                        const hasSkill = tailor.skills.includes(order.dressType as any);
                                        return (
                                            <option key={tailor.id} value={tailor.id}>
                                                {tailor.name} {hasSkill ? '★ (Skilled)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Driver Assignment */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Truck size={18} color="var(--text-muted)" />
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: order.status === 'pending_qc' ? '#eab308' :
                                            order.delivery_status === 'delivered' ? '#10b981' :
                                            order.delivery_status === 'assigned' ? '#eab308' :
                                            order.delivery_status === 'picked_up' ? '#3b82f6' : '#eab308',
                                        textTransform: 'capitalize'
                                    }}>
                                        {order.status === 'pending_qc' ? 'Approval Needed' : (order.delivery_status ? order.delivery_status.replace(/_/g, ' ') : 'Pending')}
                                    </span>
                                </div>

                                {order.status === 'pending_qc' ? (
                                    <button
                                        onClick={() => setSelectedQcOrder(order)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--primary)',
                                            color: '#000',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                                        }}
                                    >
                                        🔍 Review & Approve QC
                                    </button>
                                ) : (
                                    (() => {
                                        const needsPickup = ['pending', 'confirmed'].includes(order.status) &&
                                            (order.fabricSource === 'own' || order.measurementMethod === 'Sample cloth for measurement');
                                        
                                        const canAssignDriver = order.status === 'ready_for_delivery' || 
                                            (needsPickup && ['pending', 'assigned'].includes(order.delivery_status));
                                        
                                        const selectPlaceholder = () => {
                                            if (order.delivery_status === 'delivered') return "Delivered to Customer";
                                            if (order.status === 'ready_for_delivery') return order.assigned_to ? "Re-assign Delivery..." : "Assign Delivery Driver...";
                                            if (needsPickup) {
                                                if (order.delivery_status === 'picked_up') return "Fabric Picked Up";
                                                return order.assigned_to ? "Re-assign Pickup..." : "Assign Pickup Driver...";
                                            }
                                            if (['pending', 'confirmed'].includes(order.status)) return "No Pickup Required";
                                            return "Wait for Stitching...";
                                        };

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <select
                                                        style={{
                                                            padding: '0.5rem',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'var(--background)',
                                                            color: 'var(--foreground)',
                                                            border: '1px solid var(--border)',
                                                            minWidth: '200px',
                                                            opacity: canAssignDriver ? 1 : 0.5,
                                                            pointerEvents: canAssignDriver ? 'auto' : 'none'
                                                        }}
                                                        value={order.assigned_to || ''}
                                                        onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                                                        disabled={!canAssignDriver}
                                                        title={selectPlaceholder()}
                                                    >
                                                        <option value="">
                                                            {selectPlaceholder()}
                                                        </option>
                                                        {drivers
                                                            .map(driver => {
                                                                const custLoc = getCustomerLocation(order.id);
                                                                const driverLoc = getDriverLocation(driver.id);
                                                                const dist = calculateDistance(custLoc.lat, custLoc.lng, driverLoc.lat, driverLoc.lng);
                                                                return { ...driver, distance: dist };
                                                            })
                                                            .sort((a, b) => a.distance - b.distance)
                                                            .map(driver => (
                                                                <option key={driver.id} value={driver.id}>
                                                                    {driver.name} ({driver.distance.toFixed(1)} km from customer - {driver.status || 'active'})
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                    
                                                    <button
                                                        onClick={() => setMapOrder(order)}
                                                        style={{
                                                            padding: '0.5rem 0.75rem',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                                            border: '1px solid var(--primary)',
                                                            color: 'var(--primary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.85rem'
                                                        }}
                                                        title="Show Nearby Drivers on Map"
                                                    >
                                                        🗺️ Map
                                                    </button>
                                                </div>
                                                
                                                {(canAssignDriver || order.assigned_to) && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-muted)',
                                                        marginTop: '0.25rem',
                                                        display: 'flex',
                                                        gap: '0.5rem',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <span>📍 Cust: ({getCustomerLocation(order.id).lat.toFixed(4)}, {getCustomerLocation(order.id).lng.toFixed(4)})</span>
                                                        {order.assigned_to && (
                                                            <span style={{ color: 'var(--primary)' }}>🚚 Driver: ({getDriverLocation(order.assigned_to).lat.toFixed(4)}, {getDriverLocation(order.assigned_to).lng.toFixed(4)})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                         );
                                     })())}
                            </div>

                            {/* QC Approved status display */}
                            {order.qc_photo && order.status !== 'pending_qc' && (
                                <div style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Approved QC Photo: </span>
                                    <a href={order.qc_photo} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>View Image</a>
                                </div>
                            )}

                            {/* Sizing & Customization Specifications */}
                            <div style={{
                                width: '105%',
                                padding: '1rem',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--border)',
                                fontSize: '0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Ruler size={16} /> Sizing & Customization
                                </h4>
                                
                                {order.measurementMethod === 'Sample cloth for measurement' ? (
                                    <div style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                        <span>📦 Sample Garment Pickup Required (A driver must collect a sample cloth from customer)</span>
                                    </div>
                                ) : order.measurementsUsed ? (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            {Object.entries(order.measurementsUsed).map(([key, val]) => (
                                                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                                    </span>
                                                    <span style={{ color: 'var(--foreground)', fontWeight: 'bold' }}>{String(val)} in</span>
                                                </div>
                                            ))}
                                        </div>
                                        {order.customizationNotes && (
                                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Special Instructions:</span>
                                                <p style={{ color: 'var(--foreground)', margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>"{order.customizationNotes}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No measurement details provided.</span>
                                )}
                            </div>
                            
                            {/* View Chat Button */}
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => setSelectedChatOrder(order)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--primary)',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        width: '100%',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MessageCircle size={18} />
                                    Supervise Chat
                                </button>
                            </div>
                        </div>
                    </div>
                )))}
            </div>

            {/* Chat Modal */}
            {selectedChatOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--border)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'var(--background)'
                        }}>
                            <div>
                                <h2 style={{ color: 'var(--foreground)', margin: 0 }}>Chat Supervision</h2>
                                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                                    Order #{selectedChatOrder.id.slice(0, 8)} - {selectedChatOrder.customer_name}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedChatOrder(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                            <ChatBox 
                                orderId={selectedChatOrder.id}
                                currentUserRole="admin"
                                currentUserId="admin"
                                currentUserName="Admin Supervisor"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* QC Approval Modal */}
            {selectedQcOrder && (() => {
                const activeQcOrder = orders.find(o => o.id === selectedQcOrder.id) || selectedQcOrder;
                return (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--primary)',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)'
                        }}>
                            <div style={{
                                padding: '1.5rem',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'var(--background)'
                            }}>
                                <div>
                                    <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>👑</span> Quality Check (QC) Approval
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                                        Order #{activeQcOrder.id.slice(0, 8)} - {activeQcOrder.design_title}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedQcOrder(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <p style={{ color: 'var(--foreground)', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Review the tailor's completed garment preview below. Approving will mark the order as <strong style={{ color: '#10b981' }}>Ready for Delivery</strong> and enable driver assignment.
                                </p>

                                {activeQcOrder.qc_photo ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
                                        <img 
                                            src={activeQcOrder.qc_photo} 
                                            alt="QC Preview" 
                                            style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }} 
                                        />
                                    </div>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No completed garment photo uploaded yet.</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        onClick={async () => {
                                            await handleQcAction(activeQcOrder.id, true);
                                            setSelectedQcOrder(null);
                                        }}
                                        disabled={!activeQcOrder.qc_photo}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            backgroundColor: '#10b981',
                                            color: '#000',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            cursor: activeQcOrder.qc_photo ? 'pointer' : 'not-allowed',
                                            opacity: activeQcOrder.qc_photo ? 1 : 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        ✓ Approve & Enable Delivery
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const note = prompt('Enter rejection feedback explaining why this garment was rejected:');
                                            if (note !== null) {
                                                await handleQcAction(activeQcOrder.id, false, note || undefined);
                                                setSelectedQcOrder(null);
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            backgroundColor: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        ✗ Reject & Send Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Finder Map Modal */}
            {mapOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '800px',
                        height: '600px',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--primary)',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)'
                    }}>
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'var(--background)'
                        }}>
                            <div>
                                <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>🗺️</span> Driver Finder Map
                                </h2>
                                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                                    Order #{mapOrder.id.slice(0, 8)} - Customer: {mapOrder.customer_name}
                                </p>
                            </div>
                            <button 
                                onClick={() => setMapOrder(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flexGrow: 1, padding: '1rem', backgroundColor: 'var(--background)' }}>
                            <MapComponent locations={[
                                {
                                    lat: getCustomerLocation(mapOrder.id).lat,
                                    lng: getCustomerLocation(mapOrder.id).lng,
                                    title: `Customer: ${mapOrder.customer_name}`,
                                    description: `Fabric / Delivery point`
                                },
                                ...drivers.map(driver => {
                                    const loc = getDriverLocation(driver.id);
                                    return {
                                        lat: loc.lat,
                                        lng: loc.lng,
                                        title: `Driver: ${driver.name}`,
                                        description: `Personnel ID: ${driver.personnel_number}`
                                    };
                                })
                            ]} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
