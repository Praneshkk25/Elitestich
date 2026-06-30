'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, doc, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckCircle, Clock, Image as ImageIcon, Ruler, FileText, ChevronRight, X, MessageCircle } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { Order } from '@/types/database';
import ChatBox from '@/components/ChatBox';

const MILESTONE_STEPS = [
    { key: 'stitching', label: 'Started' },
    { key: 'fabric_received', label: 'Fabric Checked' },
    { key: 'pattern_cutting', label: 'Pattern Cut' },
    { key: 'stitching_progress', label: 'Stitched' },
    { key: 'embroidery', label: 'Embroidery' },
    { key: 'finished', label: 'Finished' }
];

export default function TailorDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tailorDocId, setTailorDocId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
    const [dashboardTab, setDashboardTab] = useState<'workspace' | 'earnings'>('workspace');
    
    // QC Photo upload states
    const [qcPhotoBase64, setQcPhotoBase64] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Check if first login setup is needed
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().firstLogin === true) {
                        router.push('/setup-password');
                        return;
                    }
                } catch (e) {
                    console.error("Error verifying firstLogin status", e);
                }

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
    }, [router]);

    useEffect(() => {
        if (!tailorDocId) return;
        fetchOrders();
    }, [tailorDocId]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders?tailorId=${tailorDocId}`);
            const data = await response.json();
            if (data.success) {
                const ordersData = data.orders;
                // Sort client side: Stitching milestones first, then Stitched/others
                ordersData.sort((a: any, b: any) => {
                    const aActive = !['ready_for_delivery', 'delivered'].includes(a.status);
                    const bActive = !['ready_for_delivery', 'delivered'].includes(b.status);
                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;
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

    const updateMilestone = async (orderId: string, nextStatus: string, extraData: any = {}) => {
        try {
            await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus, ...extraData })
            });
            
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: nextStatus, ...extraData } : null);
            }
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error('Error updating milestone:', error);
            alert('Failed to update status.');
        }
    };

    const handleQcPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setQcPhotoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const submitForQc = async (orderId: string) => {
        if (!qcPhotoBase64) return;
        try {
            await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'pending_qc', 
                    qc_photo: qcPhotoBase64,
                    qc_rejected_note: null 
                })
            });
            
            setQcPhotoBase64(null);
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: 'pending_qc', qc_photo: qcPhotoBase64, qc_rejected_note: null } : null);
            }
            fetchOrders();
            alert('Garment photo successfully submitted for Admin QC Approval!');
        } catch (e) {
            console.error(e);
            alert('Failed to submit QC photo.');
        }
    };

    const calculatePayout = (order: Order) => {
        const type = order.dressType || '';
        const hasEmbroidery = !!order.customizationNotes;
        
        let base = 600;
        let embroidery = 200;

        if (type.includes('blouse')) {
            base = 500;
            embroidery = 200;
        } else if (type.includes('chudithar')) {
            base = 700;
            embroidery = 300;
        } else if (type.includes('lehenga')) {
            base = 1200;
            embroidery = 500;
        } else if (type.includes('half_saree')) {
            base = 1000;
            embroidery = 400;
        }

        return base + (hasEmbroidery ? embroidery : 0);
    };

    const getMilestoneIndex = (status: string) => {
        if (status === 'stitching') return 0;
        if (status === 'fabric_received') return 1;
        if (status === 'pattern_cutting') return 2;
        if (status === 'stitching_progress') return 3;
        if (status === 'embroidery') return 4;
        if (['finished', 'pending_qc', 'ready_for_delivery', 'delivered'].includes(status)) return 5;
        return 0;
    };

    const getMilestonePercent = (status: string) => {
        const idx = getMilestoneIndex(status);
        return (idx / (MILESTONE_STEPS.length - 1)) * 90;
    };

    const isStepActive = (status: string, stepKey: string) => {
        if (status === stepKey) return true;
        if (stepKey === 'finished' && status === 'pending_qc') return true;
        return false;
    };

    const isStepCompleted = (status: string, stepKey: string) => {
        const currentIdx = getMilestoneIndex(status);
        const stepIdx = MILESTONE_STEPS.findIndex(s => s.key === stepKey);
        return currentIdx > stepIdx;
    };

    const renderMilestoneActions = (order: Order) => {
        const status = order.status;

        if (status === 'stitching') {
            return (
                <button className="btn btn-primary" onClick={() => updateMilestone(order.id, 'fabric_received')}>
                    Mark Fabric as Received & Checked
                </button>
            );
        }
        if (status === 'fabric_received') {
            return (
                <button className="btn btn-primary" onClick={() => updateMilestone(order.id, 'pattern_cutting')}>
                    Mark Pattern Cutting Completed
                </button>
            );
        }
        if (status === 'pattern_cutting') {
            return (
                <button className="btn btn-primary" onClick={() => updateMilestone(order.id, 'stitching_progress')}>
                    Mark Stitching Completed
                </button>
            );
        }
        if (status === 'stitching_progress') {
            return (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => updateMilestone(order.id, 'embroidery')}>
                        Proceed to Embroidery & Handwork
                    </button>
                    <button className="btn btn-outline" onClick={() => updateMilestone(order.id, 'finished')}>
                        Skip to Finished & Pressed
                    </button>
                </div>
            );
        }
        if (status === 'embroidery') {
            return (
                <button className="btn btn-primary" onClick={() => updateMilestone(order.id, 'finished')}>
                    Mark as Finished & Pressed
                </button>
            );
        }
        if (status === 'finished') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center' }}>
                        📸 Quality Check (QC) Photo Required to Complete Order
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleQcPhotoUpload}
                        style={{
                            padding: '0.75rem',
                            border: '1px dashed var(--primary)',
                            borderRadius: '6px',
                            backgroundColor: 'var(--background)',
                            color: 'var(--foreground)',
                            cursor: 'pointer'
                        }}
                    />
                    {qcPhotoBase64 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Garment Preview:</span>
                            <img src={qcPhotoBase64} alt="QC Preview" style={{ maxHeight: '150px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                style={{ width: '100%', marginTop: '0.5rem' }} 
                                onClick={() => submitForQc(order.id)}
                            >
                                Submit Garment for Admin QC Approval
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        if (status === 'pending_qc') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                    <span style={{ color: '#eab308', fontWeight: 'bold' }}>⏳ Awaiting Admin Quality Check Approval</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>The delivery partner can be assigned once the admin approves the stitch quality.</p>
                    {order.qc_photo && (
                        <img src={order.qc_photo} alt="Submitted QC" style={{ maxHeight: '120px', borderRadius: '6px', marginTop: '0.5rem', border: '1px solid var(--border)' }} />
                    )}
                </div>
            );
        }
        if (status === 'ready_for_delivery' || status === 'delivered') {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
                    <CheckCircle size={18} /> Stitching Completed & Approved by Admin
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem' }}>
                <Skeleton style={{ height: '40px', width: '250px', marginBottom: '2rem' }} />
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

    const completedOrdersList = orders.filter(o => ['finished', 'pending_qc', 'ready_for_delivery', 'delivered'].includes(o.status));
    const totalEarnings = completedOrdersList.reduce((sum, o) => sum + calculatePayout(o), 0);
    const pendingQCVal = orders.filter(o => ['finished', 'pending_qc'].includes(o.status)).reduce((sum, o) => sum + calculatePayout(o), 0);
    const clearedVal = orders.filter(o => ['ready_for_delivery', 'delivered'].includes(o.status)).reduce((sum, o) => sum + calculatePayout(o), 0);

    return (
        <div style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
            <h2 style={{ color: 'var(--foreground)', marginBottom: '1.5rem', fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>Tailor Portal</h2>

            {/* Dashboard top tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem', gap: '2rem' }}>
                <button
                    onClick={() => setDashboardTab('workspace')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '1rem 0.5rem',
                        borderBottom: dashboardTab === 'workspace' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: dashboardTab === 'workspace' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        cursor: 'pointer'
                    }}
                >
                    My Workspace
                </button>
                <button
                    onClick={() => setDashboardTab('earnings')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '1rem 0.5rem',
                        borderBottom: dashboardTab === 'earnings' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: dashboardTab === 'earnings' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        cursor: 'pointer'
                    }}
                >
                    Earnings & Payouts
                </button>
            </div>

            {dashboardTab === 'earnings' ? (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Lifetime Earnings</p>
                            <p style={{ color: 'var(--primary)', fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>₹{totalEarnings}</p>
                        </div>
                        <div style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Pending Approval</p>
                            <p style={{ color: '#eab308', fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>₹{pendingQCVal}</p>
                        </div>
                        <div style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Cleared & Settled</p>
                            <p style={{ color: '#10b981', fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>₹{clearedVal}</p>
                        </div>
                    </div>

                    <h3 style={{ color: 'var(--foreground)', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Payout Breakdown</h3>
                    {completedOrdersList.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No completed orders recorded yet.</p>
                    ) : (
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--foreground)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                                        <th style={{ padding: '1rem' }}>Order ID</th>
                                        <th style={{ padding: '1rem' }}>Garment Type</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Complexity/Embroidery</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Your Payout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedOrdersList.map(o => {
                                        const payout = calculatePayout(o);
                                        const hasEmb = !!o.customizationNotes;
                                        return (
                                            <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                                                <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{o.dressType?.replace('_', ' ')}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        fontSize: '0.8rem',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '12px',
                                                        backgroundColor: ['finished', 'pending_qc'].includes(o.status) ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)',
                                                        color: ['finished', 'pending_qc'].includes(o.status) ? '#eab308' : '#10b981',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {o.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{hasEmb ? '✨ High Complexity (Embroidery)' : 'Standard'}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>₹{payout}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* Workspace List Tab */
                <div>
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
                                            backgroundColor: ['stitching', 'fabric_received', 'pattern_cutting', 'stitching_progress', 'embroidery'].includes(order.status) ? 'rgba(212, 175, 55, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: ['stitching', 'fabric_received', 'pattern_cutting', 'stitching_progress', 'embroidery'].includes(order.status) ? 'var(--primary)' : '#10b981',
                                            textTransform: 'capitalize',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
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
                                Stitching Details & Steps
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
                                    {/* QC Rejection Feedback Banner */}
                                    {selectedOrder.qc_rejected_note && (
                                        <div style={{ 
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                            border: '1px solid #ef4444', 
                                            borderRadius: '8px', 
                                            padding: '1.25rem', 
                                            marginBottom: '2rem' 
                                        }}>
                                            <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                ⚠️ Quality Check Rejected
                                            </h4>
                                            <p style={{ color: 'var(--foreground)', margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                <strong>Feedback:</strong> {selectedOrder.qc_rejected_note}
                                            </p>
                                        </div>
                                    )}

                                    {/* Images Section */}
                                    <div style={{ marginBottom: '2rem' }}>
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
                                    <div style={{ marginBottom: '2rem' }}>
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
                                                <strong>Measurement Source:</strong> {selectedOrder.measurementMethod || 'Provided manually below or sample cloth pick up.'}
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
                                                            {String(value)} in
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
                                                <FileText size={18} /> Special Instructions / Customization
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

                                    {/* Milestone Tracker Stepper */}
                                    <div style={{ marginBottom: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                        <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            <Clock size={18} /> Stitching Milestone Progress
                                        </h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: '2rem' }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '15px',
                                                left: '5%',
                                                right: '5%',
                                                height: '2px',
                                                backgroundColor: 'var(--border)',
                                                zIndex: 1
                                            }} />

                                            <div style={{
                                                position: 'absolute',
                                                top: '15px',
                                                left: '5%',
                                                width: `${getMilestonePercent(selectedOrder.status)}%`,
                                                height: '2px',
                                                backgroundColor: 'var(--primary)',
                                                zIndex: 1,
                                                transition: 'width 0.3s ease'
                                            }} />

                                            {MILESTONE_STEPS.map((step, idx) => {
                                                const isActive = isStepActive(selectedOrder.status, step.key);
                                                const isCompleted = isStepCompleted(selectedOrder.status, step.key);
                                                return (
                                                    <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '16%' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            backgroundColor: isCompleted ? 'var(--primary)' : isActive ? 'var(--background)' : 'var(--secondary)',
                                                            border: `2px solid ${isActive || isCompleted ? 'var(--primary)' : 'var(--border)'}`,
                                                            color: isCompleted ? '#000' : isActive ? 'var(--primary)' : 'var(--text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {isCompleted ? '✓' : idx + 1}
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            marginTop: '0.5rem',
                                                            color: isActive ? 'var(--primary)' : isCompleted ? 'var(--foreground)' : 'var(--text-muted)',
                                                            fontWeight: isActive ? 'bold' : 'normal'
                                                        }}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            padding: '1.5rem',
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            {renderMilestoneActions(selectedOrder)}
                                        </div>
                                    </div>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
