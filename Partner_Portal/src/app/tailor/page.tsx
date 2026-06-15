'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckCircle, Clock, Image as ImageIcon, Ruler, FileText, ChevronRight, X, MessageCircle } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { Order } from '@/types/database';
import ChatBox from '@/components/ChatBox';

export default function TailorDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tailorDocId, setTailorDocId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Find the tailor document ID using the auth UID
                const tailorsRef = collection(db, 'tailors');
                const q = query(tailorsRef, where('authUid', '==', user.uid));
                try {
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const tDocId = snap.docs[0].id;
                        setTailorDocId(tDocId);
                    } else {
                        console.error("No tailor document found for this user");
                        setLoading(false);
                    }
                } catch (e) {
                    console.error("Error fetching tailor doc", e);
                    setLoading(false);
                }
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!tailorDocId) return;

        fetchOrders();
    }, [tailorDocId]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/orders?tailorId=${tailorDocId}`);
            const data = await response.json();
            if (data.success) {
                const ordersData = data.orders;
                // Sort client side: Stitching first, then Stitched/others
                ordersData.sort((a: any, b: any) => {
                    if (a.status === 'stitching' && b.status !== 'stitching') return -1;
                    if (a.status !== 'stitching' && b.status === 'stitching') return 1;
                    return 0;
                });
                setOrders(ordersData);
            }
        } catch (error) {
            console.error('Error fetching orders from API:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsStitched = async (orderId: string) => {
        if (!confirm('Are you sure you want to mark this dress as completely stitched?')) return;
        
        try {
            await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'stitched' })
            });
            
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: 'stitched' });
            }
            fetchOrders(); // Refresh the list
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
    };

    if (loading) {
        return (
            <div>
                <h2 style={{ color: 'var(--foreground)', marginBottom: '2rem' }}>My Assigned Orders</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                            <Skeleton style={{ height: '24px', width: '200px', marginBottom: '1rem' }} />
                            <Skeleton style={{ height: '16px', width: '150px' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ color: 'var(--foreground)', marginBottom: '2rem', fontSize: '1.8rem' }}>My Workspace</h2>

            {orders.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '4rem 2rem', 
                    backgroundColor: 'var(--secondary)', 
                    borderRadius: '8px',
                    border: '1px dashed var(--border)' 
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>You currently have no assigned orders.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '8px',
                            border: `1px solid ${order.status === 'stitching' ? 'var(--primary)' : 'var(--border)'}`,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            setSelectedOrder(order);
                            setActiveTab('details');
                        }}
                        >
                            <div style={{ 
                                padding: '1rem', 
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold', 
                                    color: 'var(--text-muted)' 
                                }}>
                                    #{order.id.slice(0, 8)}
                                </span>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    backgroundColor: order.status === 'stitching' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: order.status === 'stitching' ? 'var(--primary)' : '#10b981',
                                    textTransform: 'capitalize',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    {order.status === 'stitching' ? <Clock size={12} /> : <CheckCircle size={12} />}
                                    {order.status}
                                </span>
                            </div>
                            
                            <div style={{ padding: '1.5rem', flexGrow: 1 }}>
                                <h3 style={{ color: 'var(--foreground)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                                    {order.design_title}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'capitalize' }}>
                                    Type: {order.dressType?.replace('_', ' ')}
                                </p>
                                
                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <ImageIcon size={14} /> Images
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Ruler size={14} /> Measurements
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                color: 'var(--primary)',
                                fontWeight: 'bold'
                            }}>
                                View Stitching Details <ChevronRight size={18} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
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
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'var(--background)'
                        }}>
                            <div>
                                <h2 style={{ color: 'var(--foreground)', margin: 0 }}>Stitching Guide: {selectedOrder.design_title}</h2>
                                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Order #{selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setActiveTab('details')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: activeTab === 'details' ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Stitching Details
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'chat' ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: activeTab === 'chat' ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <MessageCircle size={18} />
                                Customer Chat
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
                            
                            {activeTab === 'details' ? (
                                <>
                                    {/* Images Section */}
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <ImageIcon size={18} /> Reference Images
                                </h3>
                                {selectedOrder.referenceImages && selectedOrder.referenceImages.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                        {selectedOrder.referenceImages.map((img, idx) => (
                                            <img 
                                                key={idx} 
                                                src={img} 
                                                alt={`Reference ${idx + 1}`} 
                                                style={{ height: '200px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No reference images provided.</p>
                                )}
                            </div>

                            {/* Measurements Section */}
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <Ruler size={18} /> Measurements
                                </h3>
                                
                                <div style={{ 
                                    backgroundColor: 'rgba(212, 175, 55, 0.05)', 
                                    border: '1px solid var(--primary)', 
                                    borderRadius: '8px', 
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <p style={{ color: 'var(--foreground)', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        <strong>Measurement Source:</strong> Measurements are either provided manually below, OR the customer has provided a physical sample cloth which will be handed over by the delivery partner.
                                    </p>
                                </div>

                                {selectedOrder.measurementsUsed ? (
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                        gap: '1rem',
                                        backgroundColor: 'var(--background)',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {Object.entries(selectedOrder.measurementsUsed).map(([key, value]) => (
                                            <div key={key}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'capitalize', margin: '0 0 0.25rem 0' }}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </p>
                                                <p style={{ color: 'var(--foreground)', fontWeight: 'bold', margin: 0 }}>
                                                    {String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No digital measurements found. Please use the provided physical sample cloth.</p>
                                )}
                            </div>

                            {/* Customization Notes */}
                            {selectedOrder.customizationNotes && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <FileText size={18} /> Special Instructions
                                    </h3>
                                    <div style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid var(--primary)',
                                        color: 'var(--foreground)',
                                        lineHeight: 1.6
                                    }}>
                                        {selectedOrder.customizationNotes}
                                    </div>
                                </div>
                            )}
                                </>
                            ) : (
                                <ChatBox 
                                    orderId={selectedOrder.id}
                                    currentUserRole="tailor"
                                    currentUserId={auth.currentUser?.uid || 'tailor'}
                                    currentUserName="Your Tailor"
                                />
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div style={{
                            padding: '1.5rem',
                            borderTop: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1rem'
                        }}>
                            <button 
                                className="btn btn-outline" 
                                onClick={() => setSelectedOrder(null)}
                            >
                                Close Details
                            </button>
                            
                            {selectedOrder.status === 'stitching' && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => markAsStitched(selectedOrder.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <CheckCircle size={18} />
                                    Mark as Stitched
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
