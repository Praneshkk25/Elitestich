'use client';

import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase';
import { Plus, User, Phone, Circle } from 'lucide-react';

interface Driver {
    id: string;
    name: string;
    personnel_number: string;
    phone: string;
    status: 'active' | 'busy' | 'inactive';
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDriver, setNewDriver] = useState({ name: '', phone: '', password: '' });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        // const { data, error } = await supabase
        //     .from('delivery_personnel')
        //     .select('*')
        //     .order('created_at', { ascending: false });

        // if (data) setDrivers(data);
        const data: any = [];
        setDrivers(data);
        setLoading(false);
    };

    const handleAddDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        // Generate unique personnel number (e.g., DP-1001)
        const personnel_number = `DP-${Math.floor(1000 + Math.random() * 9000)}`;

        // const { error } = await supabase
        //     .from('delivery_personnel')
        //     .insert([{
        //         name: newDriver.name,
        //         phone: newDriver.phone,
        //         password: newDriver.password, // In real app, hash this!
        //         personnel_number,
        //         status: 'active'
        //     }]);
        const error = null;

        if (error) {
            // alert('Error adding driver: ' + error.message);
        } else {
            alert(`Driver added! Personnel Number: ${personnel_number}`);
            setShowAddModal(false);
            setNewDriver({ name: '', phone: '', password: '' });
            fetchDrivers();
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
                                    <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{driver.personnel_number}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                    <Phone size={16} />
                                    {driver.phone}
                                </div>
                                <button
                                    onClick={async () => {
                                        const newStatus = driver.status === 'active' ? 'inactive' : 'active';
                                        // const { error } = await supabase
                                        //     .from('delivery_personnel')
                                        //     .update({ status: newStatus })
                                        //     .eq('id', driver.id);

                                        // if (!error) {
                                            setDrivers(drivers.map(d => d.id === driver.id ? { ...d, status: newStatus } : d));
                                        // }
                                    }}
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone</label>
                                <input
                                    type="tel"
                                    required
                                    value={newDriver.phone}
                                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newDriver.password}
                                    onChange={e => setNewDriver({ ...newDriver, password: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
