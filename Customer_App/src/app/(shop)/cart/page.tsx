'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import styles from './cart.module.css';

export default function CartPage() {
    const { items, removeFromCart, clearCart } = useCart();

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    if (items.length === 0) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
                <ShoppingBag size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h1 style={{ marginBottom: '1rem', color: 'var(--foreground)' }}>Your Cart is Empty</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Looks like you haven't added any designs yet.
                </p>
                <Link href="/designs" className="btn btn-primary">
                    Browse Designs
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center' }}>Your Shopping Cart</h1>

            <div className={styles.cartGrid}>
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
                                <Link href={`/order?design=${item.id}`} className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                    Order Now
                                </Link>
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

                <div className={styles.summary}>
                    <h2>Order Summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal ({items.length} items)</span>
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

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '1rem 0' }}>
                        * Customization charges may apply during order placement.
                    </p>

                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert('Proceeding to checkout for all items is coming soon! Please order items individually for now.')}>
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
        </div>
    );
}
