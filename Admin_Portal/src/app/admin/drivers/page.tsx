'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, User, Phone, Circle, Mail, Trash2 } from 'lucide-react';

interface Driver {
    id: string;
    name: string;
    email?: string;
    personnel_number: string;
    phone: string;
    status: 'active' | 'busy' | 'inactive';
    authUid?: string;
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newDriver, setNewDriver] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const driversRef = collection(db, 'delivery_personnel');
            const snapshot = await getDocs(driversRef);
            const driversData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Driver[];
            setDrivers(driversData);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDriver = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newDriver.name,
                    email: newDriver.email,
                    phone: newDriver.phone,
                    role: 'delivery'
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to register driver');
            }

            alert('Driver registered successfully! An email with a temporary OTP has been sent.');
            setShowAddModal(false);
            setNewDriver({ name: '', email: '', phone: '' });
            fetchDrivers();
        } catch (error: any) {
            console.error('Error adding driver:', error);
            alert('Error adding driver: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (driver: Driver) => {
        const newStatus = driver.status === 'active' ? 'inactive' : 'active';
        try {
            await updateDoc(doc(db, 'delivery_personnel', driver.id), { status: newStatus });
            setDrivers(drivers.map(d => d.id === driver.id ? { ...d, status: newStatus } : d));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    const handleDeleteDriver = async (driver: Driver) => {
        if (!confirm(`Are you sure you want to remove driver "${driver.name}"? This action cannot be undone.`)) return;
        try {
            if (!driver.authUid) {
                // Fallback to client-side document delete if authUid isn't present
                await deleteDoc(doc(db, 'delivery_personnel', driver.id));
                setDrivers(drivers.filter(d => d.id !== driver.id));
                return;
            }

            const response = await fetch(`http://localhost:5000/api/users/${driver.authUid}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete driver');
            }
            alert('Driver deleted successfully.');
            setDrivers(drivers.filter(d => d.id !== driver.id));
        } catch (error: any) {
            console.error('Error deleting driver:', error);
            alert('Error deleting driver: ' + error.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--foreground)' }}>Delivery Personnel</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Add Driver
                </button>
            </div>

            {loading ? (
                <div>Loading drivers...</div>
            ) : drivers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No drivers registered yet.</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {drivers.map(driver => (
                        <div key={driver.id} style={{
                            backgroundColor: 'var(--secondary)',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <User size={20} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--foreground)', marginBottom: '0.25rem' }}>{driver.name}</h3>
                                    <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{driver.personnel_number}</p>
                                    {driver.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Mail size={12} /> {driver.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                    <Phone size={16} />
                                    {driver.phone}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => toggleStatus(driver)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            backgroundColor: driver.status === 'active' ? 'rgba(16, 185, 129, 0.1)' :
                                                driver.status === 'busy' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                            color: driver.status === 'active' ? '#10b981' :
                                                driver.status === 'busy' ? '#3b82f6' : '#6b7280',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                        title="Click to toggle status"
                                    >
                                        <Circle size={8} fill="currentColor" />
                                        <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{driver.status}</span>
                                    </button>

                                    <button
                                        onClick={() => handleDeleteDriver(driver)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                        title="Remove Driver"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Driver Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
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
                        maxWidth: '400px',
                        border: '1px solid var(--border)'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>Add New Driver</h2>
                        <form onSubmit={handleAddDriver}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newDriver.name}
                                    onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email (for Login)</label>
                                <input
                                    type="email"
                                    required
                                    value={newDriver.email}
                                    onChange={e => setNewDriver({ ...newDriver, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone</label>
                                <input
                                    type="tel"
                                    required
                                    value={newDriver.phone}
                                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>

                             <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Driver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
