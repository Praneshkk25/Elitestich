'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { Package, Truck, CheckCircle, Clock, MapPin, Scissors, MessageCircle, X } from 'lucide-react';
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
}

interface Driver {
    id: string;
    name: string;
    personnel_number: string;
    current_location?: { lat: number, lng: number }; // Mock location
    distance?: number;
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

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [tailors, setTailors] = useState<Tailor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChatOrder, setSelectedChatOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchDrivers();
        fetchTailors();

    useEffect(() => {
        fetchDrivers();
        fetchTailors();
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/orders');
            const data = await response.json();
            if (data.success) {
                // Sort by createdAt descending locally since API doesn't sort yet
                const sortedOrders = data.orders.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000;
                    const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000;
                    return timeB - timeA;
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
        const driversRef = collection(db, 'delivery_personnel');
        const q = query(driversRef, where('status', '==', 'active'));
        try {
            const snapshot = await getDocs(q);
            const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTailors = async () => {
        const tailorsRef = collection(db, 'tailors');
        const q = query(tailorsRef, where('status', '==', 'active'));
        try {
            const snapshot = await getDocs(q);
            const tailorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tailor[];
            setTailors(tailorsData);
        } catch (e) {
            console.error('Error fetching tailors', e);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await fetch(`http://localhost:5000/api/orders/${orderId}`, {
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
            await fetch(`http://localhost:5000/api/orders/${orderId}`, {
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
            await fetch(`http://localhost:5000/api/orders/${orderId}`, {
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
                                    color: order.status === 'confirmed' || order.status === 'stitched' ? '#10b981' : '#eab308'
                                }}>
                                    {order.status === 'confirmed' || order.status === 'stitched' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                    <span style={{ textTransform: 'capitalize' }}>{order.status.replace(/_/g, ' ')}</span>
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
                            {/* Status Management */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                                <select
                                    value={order.status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--foreground)',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="stitching">Stitching</option>
                                    <option value="stitched">Stitched</option>
                                    <option value="ready_for_delivery">Ready for Delivery</option>
                                </select>
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
                                    }}
                                    value={order.tailorId || ''}
                                    onChange={(e) => handleAssignTailor(order.id, e.target.value)}
                                    disabled={order.status === 'stitched' || order.status === 'ready_for_delivery' || order.status === 'shipped' || order.status === 'delivered'}
                                    title={order.status === 'stitched' ? "Already stitched" : "Assign Tailor"}
                                >
                                    <option value="">
                                        {order.tailorId ? "Re-assign Tailor..." : "Assign Tailor..."}
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
                                        color: order.delivery_status === 'delivered' ? '#10b981' :
                                            order.delivery_status === 'assigned' ? '#eab308' :
                                                order.delivery_status === 'picked_up' ? '#3b82f6' : '#eab308',
                                        textTransform: 'capitalize'
                                    }}>
                                        {order.delivery_status ? order.delivery_status.replace(/_/g, ' ') : 'Pending'}
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
                                        opacity: order.status === 'ready_for_delivery' ? 1 : 0.5,
                                        pointerEvents: order.status === 'ready_for_delivery' ? 'auto' : 'none'
                                    }}
                                    value={order.assigned_to || ''}
                                    onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                                    disabled={order.delivery_status === 'delivered' || order.status !== 'ready_for_delivery'}
                                    title={order.status !== 'ready_for_delivery' ? "Mark as 'Ready for Delivery' first" : "Assign Driver"}
                                >
                                    <option value="">
                                        {order.status !== 'ready_for_delivery' ? "Wait for Stitching..." : "Assign Driver..."}
                                    </option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} ({driver.distance} km away)
                                        </option>
                                    ))}
                                </select>
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
        </div>
    );
}
