'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Scissors, Phone, Mail, Circle, Trash2 } from 'lucide-react';
import { DressCategory, Tailor, Order } from '@/types/database';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface TailorWithStats extends Tailor {
    activeOrdersCount: number;
    completedOrdersCount: number;
}

const AVAILABLE_SKILLS: { value: DressCategory, label: string }[] = [
    { value: 'blouse', label: 'Blouse' },
    { value: 'lehenga', label: 'Lehenga' },
    { value: 'chudithar', label: 'Chudithar' },
    { value: 'half_saree', label: 'Half Saree' },
    { value: 'salwar', label: 'Salwar' },
    { value: 'gown', label: 'Gown' },
    { value: 'suit', label: 'Suit' },
];

export default function TailorsPage() {
    const [tailors, setTailors] = useState<TailorWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newTailor, setNewTailor] = useState({
        name: '',
        email: '',
        phone: '',
        skills: [] as DressCategory[]
    });

    useEffect(() => {
        fetchTailors();
    }, []);

    const fetchTailors = async () => {
        try {
            const tailorsRef = collection(db, 'tailors');
            const tailorsSnap = await getDocs(tailorsRef);
            
            const ordersRef = collection(db, 'orders');
            // We fetch all orders that have a tailor assigned to calculate stats
            // Ideally this would be specific count queries per tailor, but for a small dataset fetching orders is fine
            const ordersSnap = await getDocs(query(ordersRef, where('tailorId', '!=', null)));
            const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));

            const tailorsData: TailorWithStats[] = tailorsSnap.docs.map(doc => {
                const data = doc.data() as Tailor;
                // Calculate stats based on orders
                const tailorOrders = ordersData.filter(o => o.tailorId === doc.id);
                const completedCount = tailorOrders.filter(o => ['finished', 'pending_qc', 'ready_for_delivery', 'delivered'].includes(o.status)).length;
                const activeCount = tailorOrders.filter(o => ['fabric_received', 'pattern_cutting', 'stitching', 'stitching_progress', 'embroidery'].includes(o.status)).length;

                return {
                    ...data,
                    id: doc.id,
                    activeOrdersCount: activeCount,
                    completedOrdersCount: completedCount
                };
            });

            setTailors(tailorsData);
        } catch (error) {
            console.error('Error fetching tailors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkillToggle = (skill: DressCategory) => {
        setNewTailor(prev => {
            if (prev.skills.includes(skill)) {
                return { ...prev, skills: prev.skills.filter(s => s !== skill) };
            } else {
                return { ...prev, skills: [...prev.skills, skill] };
            }
        });
    };

    const handleAddTailor = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newTailor.skills.length === 0) {
            alert('Please select at least one skill.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newTailor.name,
                    email: newTailor.email,
                    phone: newTailor.phone,
                    role: 'tailor',
                    skills: newTailor.skills
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to register tailor');
            }

            alert('Tailor registered successfully! An email with a temporary OTP has been sent.');
            setShowAddModal(false);
            setNewTailor({ name: '', email: '', phone: '', skills: [] });
            fetchTailors();
        } catch (error: any) {
            console.error('Error adding tailor:', error);
            alert('Error adding tailor: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (tailor: TailorWithStats) => {
        const newStatus = tailor.status === 'active' ? 'inactive' : 'active';
        try {
            await updateDoc(doc(db, 'tailors', tailor.id), { status: newStatus });
            setTailors(tailors.map(t => t.id === tailor.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    const handleDeleteTailor = async (tailor: TailorWithStats) => {
        if (!confirm(`Are you sure you want to remove tailor "${tailor.name}"? This action cannot be undone.`)) return;
        try {
            if (!tailor.authUid) {
                // Fallback to client-side document delete if authUid isn't present
                await deleteDoc(doc(db, 'tailors', tailor.id));
                setTailors(tailors.filter(t => t.id !== tailor.id));
                return;
            }

            const response = await fetch(`$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/users/${tailor.authUid}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete user');
            }
            alert('Tailor deleted successfully.');
            setTailors(tailors.filter(t => t.id !== tailor.id));
        } catch (error: any) {
            console.error('Error deleting tailor:', error);
            alert('Error deleting tailor: ' + error.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--foreground)' }}>Tailors / Stitchers</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Add Tailor
                </button>
            </div>

            {loading ? (
                <div>Loading tailors...</div>
            ) : tailors.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No tailors added yet.</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {tailors.map(tailor => (
                        <div key={tailor.id} style={{
                            backgroundColor: 'var(--secondary)',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)'
                                }}>
                                    <Scissors size={24} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--foreground)', marginBottom: '0.25rem', fontSize: '1.2rem' }}>{tailor.name}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Phone size={14} /> {tailor.phoneNumber}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Mail size={14} /> {tailor.email}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {tailor.skills.map(skill => (
                                            <span key={skill} style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                color: 'var(--text-muted)',
                                                textTransform: 'capitalize'
                                            }}>
                                                {skill.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Active Orders</p>
                                    <p style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{tailor.activeOrdersCount}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Completed</p>
                                    <p style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>{tailor.completedOrdersCount}</p>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => toggleStatus(tailor)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            backgroundColor: tailor.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                            color: tailor.status === 'active' ? '#10b981' : '#6b7280',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                        title="Click to toggle status"
                                    >
                                        <Circle size={10} fill="currentColor" />
                                        <span style={{ textTransform: 'capitalize', fontSize: '0.9rem', fontWeight: 'bold' }}>{tailor.status}</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDeleteTailor(tailor)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        title="Remove Tailor"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Tailor Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '500px',
                        border: '1px solid var(--border)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>Register New Tailor</h2>
                        <form onSubmit={handleAddTailor}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newTailor.name}
                                    onChange={e => setNewTailor({ ...newTailor, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email (for Login)</label>
                                    <input
                                        type="email"
                                        required
                                        value={newTailor.email}
                                        onChange={e => setNewTailor({ ...newTailor, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newTailor.phone}
                                        onChange={e => setNewTailor({ ...newTailor, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Skills (Select all that apply)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {AVAILABLE_SKILLS.map(skill => {
                                        const isSelected = newTailor.skills.includes(skill.value);
                                        return (
                                            <button
                                                key={skill.value}
                                                type="button"
                                                onClick={() => handleSkillToggle(skill.value)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                                                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {skill.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                             <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? 'Registering...' : 'Register Tailor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
