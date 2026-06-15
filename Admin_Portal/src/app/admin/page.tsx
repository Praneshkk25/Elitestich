'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if user is already logged in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/admin/dashboard');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/admin/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            alert(error.message || 'Failed to login');
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
            paddingTop: '80px'
        }}>
            <div style={{
                backgroundColor: 'var(--secondary)',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: 'var(--primary)'
                }}>
                    <Lock size={30} />
                </div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>Admin Access</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            marginBottom: '1rem',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--foreground)'
                        }}
                    />
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                paddingRight: '2.5rem',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--foreground)'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
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
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
