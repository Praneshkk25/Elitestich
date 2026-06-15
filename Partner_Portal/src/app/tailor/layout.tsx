'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Scissors } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function TailorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user && pathname !== '/tailor/login') {
                router.push('/tailor/login');
            } else if (user) {
                try {
                    // Fetch user document to check role
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userData = userDoc.data();
                    
                    if (userData?.role === 'tailor') {
                        setIsAuthorized(true);
                    } else if (pathname !== '/tailor/login') {
                        // Not a tailor, sign them out and redirect
                        console.error('Unauthorized: Tailor access required.');
                        await signOut(auth);
                        router.push('/tailor/login');
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    if (pathname !== '/tailor/login') {
                        await signOut(auth);
                        router.push('/tailor/login');
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/tailor/login');
    };

    if (pathname === '/tailor/login') {
        return <>{children}</>;
    }

    if (!isAuthorized) {
        return null; // Don't render anything while checking authorization
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            {/* Top Navigation Bar */}
            <nav style={{
                backgroundColor: 'var(--secondary)',
                borderBottom: '1px solid var(--border)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)'
                    }}>
                        <Scissors size={20} />
                    </div>
                    <h1 style={{ 
                        color: 'var(--foreground)', 
                        margin: 0, 
                        fontSize: '1.25rem',
                        fontFamily: 'serif',
                        letterSpacing: '1px'
                    }}>
                        Tailor Portal
                    </h1>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </nav>

            {/* Main Content Area */}
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {children}
            </main>
        </div>
    );
}
