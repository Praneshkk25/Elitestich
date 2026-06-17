'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { updatePassword, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function SetupPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [verifyingUser, setVerifyingUser] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Not logged in, redirect to login selection or main page
                router.push('/tailor/login');
                return;
            }

            try {
                // Verify user doc status
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserRole(data.role);

                    if (data.firstLogin !== true) {
                        // Already set password, redirect to dashboard
                        if (data.role === 'tailor') {
                            router.push('/tailor');
                        } else if (data.role === 'driver') {
                            router.push('/delivery/dashboard');
                        } else {
                            router.push('/tailor/login');
                        }
                    }
                } else {
                    router.push('/tailor/login');
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                router.push('/tailor/login');
            } finally {
                setVerifyingUser(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user is currently signed in.');

            // 1. Update auth password
            await updatePassword(user, password);

            // 2. Update Firestore document
            await updateDoc(doc(db, 'users', user.uid), {
                firstLogin: false
            });

            alert('Password setup successful!');

            // 3. Redirect to respective dashboard
            if (userRole === 'tailor') {
                router.push('/tailor');
            } else {
                router.push('/delivery/dashboard');
            }
        } catch (error: any) {
            console.error('Password setup error:', error);
            alert(error.message || 'Failed to setup password');
        } finally {
            setLoading(false);
        }
    };

    if (verifyingUser) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)'
            }}>
                Loading setup page...
            </div>
        );
    }

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
                    <Lock size={30} />
                </div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--foreground)' }}>Set Your Password</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Welcome to Elite Stitch! Please configure your secure password.
                </p>
                <form onSubmit={handleSetup}>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
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
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
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
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Setting Password...' : 'Save Password & Enter'}
                    </button>
                </form>
            </div>
        </div>
    );
}
