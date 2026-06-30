'use client';

import { useState, useEffect } from 'react';
import { useCart, CartItem } from '@/contexts/CartContext';
import Link from 'next/link';
import { Trash2, ShoppingBag, CreditCard, Truck } from 'lucide-react';
import styles from './cart.module.css';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function CartPage() {
    const { items, removeFromCart, clearCart } = useCart();
    const [user, setUser] = useState<any>(null);

    // Checkout state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    // Opens the payment modal for either all items or a single item
    const openCheckout = (forItems: CartItem[]) => {
        setCheckoutItems(forItems);
        setShowPaymentModal(true);
    };

    const handlePayment = async (method: 'online' | 'cod') => {
        setIsProcessing(true);
        const amount = checkoutItems.reduce((s, i) => s + i.price, 0);

        const payload = {
            items: checkoutItems.map(i => ({ id: i.id, title: i.title, quantity: 1, price: i.price })),
            email: user?.email || 'guest@example.com',
            customerName: user?.displayName || user?.email?.split('@')[0] || 'Guest',
            userId: user?.uid || 'guest',
            paymentMethod: method,
            // backend /api/checkout reads `basePrice` to calculate Razorpay amount
            basePrice: amount,
            totalAmount: amount,
            orderType: 'design_selection',
            currency: 'INR',
            designTitle: checkoutItems.map(i => i.title).join(', '),
        };

        try {
            const endpoint = method === 'online'
                ? '$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/checkout'
                : '$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();

            if (method === 'online') {
                if (!result.razorpayOrderId) {
                    alert('Failed to initiate payment. Please try again.');
                    setIsProcessing(false);
                    return;
                }

                // Load Razorpay script
                await new Promise<void>((resolve, reject) => {
                    if ((window as any).Razorpay) { resolve(); return; }
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject();
                    document.body.appendChild(script);
                });

                const rzp = new (window as any).Razorpay({
                    key: result.key,
                    amount: result.amount,
                    currency: result.currency || 'INR',
                    name: 'Elite World',
                    description: checkoutItems.map(i => i.title).join(', '),
                    order_id: result.razorpayOrderId,
                    handler: async (response: any) => {
                        try {
                            const verifyRes = await fetch('$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderDetails: payload,
                                }),
                            });
                            const verifyResult = await verifyRes.json();
                            if (verifyResult.success) {
                                setOrderId(verifyResult.orderId);
                                setShowPaymentModal(false);
                                clearCart();
                                setShowSuccess(true);
                            } else {
                                alert('Payment verification failed. Please contact support.');
                            }
                        } catch {
                            alert('Error verifying payment.');
                        }
                    },
                    prefill: { name: user?.displayName || '', email: user?.email || '' },
                    theme: { color: '#d4af37' },
                });
                rzp.open();
            } else {
                // COD
                if (result.success) {
                    setOrderId(result.orderId);
                    setShowPaymentModal(false);
                    clearCart();
                    setShowSuccess(true);
                } else {
                    alert('Failed to place order. Please try again.');
                }
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Empty cart ──
    if (items.length === 0 && !showSuccess) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
                <ShoppingBag size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h1 style={{ marginBottom: '1rem', color: 'var(--foreground)' }}>Your Cart is Empty</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Looks like you haven't added any designs yet.
                </p>
                <Link href="/designs" className="btn btn-primary">Browse Designs</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center' }}>
                Your Shopping Cart
            </h1>

            <div className={styles.cartGrid}>
                {/* ── Item List ── */}
                <div className={styles.itemsList}>
                    {items.map((item, index) => (
                        <div key={`${item.id}-${index}`} className={styles.cartItem}>
                            <div className={styles.itemImage}>
                                <img src={item.image} alt={item.title} />
                            </div>
                            <div className={styles.itemInfo}>
                                <h3>{item.title}</h3>
                                <p className={styles.category}>{item.category}</p>
                                <p className={styles.price}>₹{item.price}</p>
                            </div>
                            <div className={styles.itemActions}>
                                <button
                                    className="btn btn-outline"
                                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                    onClick={() => openCheckout([item])}
                                >
                                    Order Now
                                </button>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className={styles.removeBtn}
                                    title="Remove"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Order Summary ── */}
                <div className={styles.summary}>
                    <h2>Order Summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                        <span>₹{totalAmount}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Estimated Tax</span>
                        <span>₹0</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.total}`}>
                        <span>Total</span>
                        <span>₹{totalAmount}</span>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem' }}
                        onClick={() => openCheckout(items)}
                    >
                        Proceed to Checkout
                    </button>

                    <button
                        onClick={clearCart}
                        className="btn btn-outline"
                        style={{ width: '100%', marginTop: '1rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                    >
                        Clear Cart
                    </button>
                </div>
            </div>

            {/* ── Payment Method Modal ── */}
            {showPaymentModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2.5rem',
                        borderRadius: '16px',
                        maxWidth: '420px',
                        width: '90%',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                            Choose Payment Method
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            {checkoutItems.map(i => i.title).join(', ')}
                        </p>
                        <p style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '2rem' }}>
                            Total: ₹{checkoutItems.reduce((s, i) => s + i.price, 0)}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                onClick={() => handlePayment('online')}
                                disabled={isProcessing}
                            >
                                <CreditCard size={18} />
                                {isProcessing ? 'Processing...' : 'Pay Online (UPI / Card / NetBanking)'}
                            </button>

                            <button
                                className="btn btn-outline"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                onClick={() => handlePayment('cod')}
                                disabled={isProcessing}
                            >
                                <Truck size={18} />
                                {isProcessing ? 'Placing Order...' : 'Cash on Delivery'}
                            </button>

                            <button
                                onClick={() => setShowPaymentModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.9rem' }}
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Success Popup ── */}
            {showSuccess && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000,
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2.5rem',
                        borderRadius: '16px',
                        maxWidth: '450px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid var(--primary)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            backgroundColor: '#dcfce7', color: '#166534',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
                            Order Placed!
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Your order has been confirmed. We'll reach out with updates.
                        </p>
                        {orderId && (
                            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order ID</p>
                                <p style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{orderId}</p>
                            </div>
                        )}
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => window.location.href = orderId ? `/track?order_id=${orderId}` : '/'}
                        >
                            Track Order
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
