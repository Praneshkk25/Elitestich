'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Eye, EyeOff } from 'lucide-react';

export default function DeliveryLogin() {
    const [personnelNumber, setPersonnelNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const { auth } = await import('@/lib/firebase');
            
            // If they enter a personnel number like DP-1234 without an @ symbol, append a dummy domain
            const email = personnelNumber.includes('@') ? personnelNumber : `${personnelNumber.toLowerCase()}@delivery.local`;
            
            await signInWithEmailAndPassword(auth, email, password);
            
            // Set a cookie for middleware/dashboard compatibility
            document.cookie = `driver_token=firebase-auth-token; path=/; max-age=86400`;
            router.push('/delivery/dashboard');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--background)',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--secondary)',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Truck size={32} color="#000" />
                </div>

                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Delivery Partner</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Login to access your orders</p>

                <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Personnel Number</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., DP-1234"
                            value={personnelNumber}
                            onChange={(e) => setPersonnelNumber(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                bottom: '0.75rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
