'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, X, User, LogOut, Sun, Moon, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import BrightnessToggle from './BrightnessToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { cartCount } = useCart();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Listen for Firebase auth changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
        setUser(null);
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
                <Link href="/" className={styles.logo}>
                    <img
                        src="/images/logo.jpeg"
                        alt="Elite World Logo"
                        className={styles.logoImage}
                    />
                    <div className={styles.logoText}>
                        <span className={styles.logoMain}>Elite World</span>
                        <span className={styles.logoSub}>Where Style Begins With a Stitch</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className={styles.desktopMenu}>
                    <Link href="/" className={styles.navLink} aria-label="Home" title="Home"><Home size={18} /></Link>
                    <Link href="/order" className={styles.navLink}>Custom Order</Link>
                    <Link href="/designs" className={styles.navLink}>Services</Link>
                    <Link href="/track" className={styles.navLink}>Track Order</Link>
                    <Link href="/contact" className={styles.navLink}>Connect With Us</Link>
                </div>

                <div className={styles.navActions}>
                    <BrightnessToggle />
                    <button
                        onClick={toggleTheme}
                        className={styles.iconBtn}
                        aria-label="Toggle Theme"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className={styles.desktopUserSection}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Link href="/profile" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <User size={16} style={{ color: 'var(--primary)' }} />
                                    <span style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                                        {user.email?.split('@')[0]}
                                    </span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={styles.iconBtn}
                                    aria-label="Logout"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className={styles.iconBtn} aria-label="Login">
                                <User size={20} />
                            </Link>
                        )}
                    </div>

                    <Link href="/cart" className={styles.iconBtn} aria-label="Cart" style={{ position: 'relative' }}>
                        <ShoppingBag size={20} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: 'var(--primary)',
                                color: '#000',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        className={styles.mobileToggle}
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
                    <Link href="/" className={styles.mobileLink} onClick={() => setIsOpen(false)}>🏠 Home</Link>
                    <Link href="/order" className={styles.mobileLink} onClick={() => setIsOpen(false)}>✂️ Custom Order</Link>
                    <Link href="/designs" className={styles.mobileLink} onClick={() => setIsOpen(false)}>👗 Services</Link>
                    <Link href="/track" className={styles.mobileLink} onClick={() => setIsOpen(false)}>📦 Track Order</Link>
                    <Link href="/contact" className={styles.mobileLink} onClick={() => setIsOpen(false)}>✉️ Connect With Us</Link>
                    
                    {user ? (
                        <div className={styles.mobileUserSection}>
                            <div className={styles.mobileUserEmail}>👤 Logged in as: {user.email?.split('@')[0]}</div>
                            <Link href="/profile" className={styles.mobileLink} onClick={() => setIsOpen(false)}>Profile Settings</Link>
                            <button onClick={() => { handleLogout(); setIsOpen(false); }} className={styles.mobileLogoutBtn}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className={styles.mobileLink} onClick={() => setIsOpen(false)}>👤 Login / Signup</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
