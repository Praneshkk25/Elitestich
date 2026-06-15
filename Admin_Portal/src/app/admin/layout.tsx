'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Package, LogOut, Map, Scissors } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user && pathname !== '/admin') {
                router.push('/admin');
            } else if (user) {
                try {
                    // Fetch user document to check role
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userData = userDoc.data();
                    
                    if (userData?.role === 'admin') {
                        setIsAuthorized(true);
                    } else if (pathname !== '/admin') {
                        // Not an admin, sign them out and redirect
                        console.error('Unauthorized: Admin access required.');
                        await signOut(auth);
                        router.push('/admin');
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    // If we can't fetch the role (e.g. permission denied), sign them out
                    if (pathname !== '/admin') {
                        await signOut(auth);
                        router.push('/admin');
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/admin');
    };

    if (pathname === '/admin') {
        return <>{children}</>;
    }

    if (!isAuthorized) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '250px',
                backgroundColor: 'var(--secondary)',
                borderRight: '1px solid var(--border)',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ marginBottom: '3rem', paddingLeft: '1rem' }}>
                    <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        ADMIN<span style={{ color: 'var(--foreground)' }}>PANEL</span>
                    </h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <Link href="/admin/dashboard" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/admin/dashboard' ? 'var(--primary)' : 'transparent',
                        color: pathname === '/admin/dashboard' ? '#000' : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link href="/admin/orders" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/admin/orders' ? 'var(--primary)' : 'transparent',
                        color: pathname === '/admin/orders' ? '#000' : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}>
                        <Package size={20} />
                        Orders
                    </Link>
                    <Link href="/admin/tailors" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/admin/tailors' ? 'var(--primary)' : 'transparent',
                        color: pathname === '/admin/tailors' ? '#000' : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}>
                        <Scissors size={20} />
                        Tailors
                    </Link>
                    <Link href="/admin/drivers" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/admin/drivers' ? 'var(--primary)' : 'transparent',
                        color: pathname === '/admin/drivers' ? '#000' : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}>
                        <Users size={20} />
                        Drivers
                    </Link>
                    <Link href="/admin/map" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/admin/map' ? 'var(--primary)' : 'transparent',
                        color: pathname === '/admin/map' ? '#000' : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}>
                        <Map size={20} />
                        Live Map
                    </Link>
                </nav>

                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: 'var(--error)',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: 'auto'
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
