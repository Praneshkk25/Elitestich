'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function TailorLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // If logged in, double check role
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().role === 'tailor') {
                        router.push('/tailor');
                    } else {
                        // If not a tailor, sign them out of this portal
                        auth.signOut();
                    }
                } catch (e) {
                    console.error("Error verifying role", e);
                }
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Verify role
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (!userDoc.exists() || userDoc.data().role !== 'tailor') {
                await auth.signOut();
                throw new Error('Access denied. This portal is strictly for registered tailors.');
            }

            router.push('/tailor');
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
            paddingTop: '80px',
            backgroundColor: 'var(--background)'
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
                    <Scissors size={30} />
                </div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>Tailor Access</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email Address"
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
                            placeholder="Password"
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
