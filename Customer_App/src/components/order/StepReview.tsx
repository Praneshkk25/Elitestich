import { useState } from 'react';
import styles from './OrderSteps.module.css';
import { CreditCard, Banknote } from 'lucide-react';

interface StepReviewProps {
    data: any;
    onBack: () => void;
    onSubmit: (paymentMethod: string) => void;
}

export default function StepReview({ data, onBack, onSubmit }: StepReviewProps) {
    const [paymentMethod, setPaymentMethod] = useState('online');

    return (
        <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Review Order</h2>

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>Design Type : </span>
                    <span>{data.designType === 'custom_upload' ? 'Custom Upload' : 'Gallery Selection'}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span>Base Price : </span>
                    <span>₹{data.basePrice}</span>
                </div>

                <div className={styles.summaryRow}>
                    <span>Measurement Method : </span>
                    <span>{data.measurementMethod || 'Not Provided'}</span>
                </div>

                <div className={`${styles.summaryRow} ${styles.total}`}>
                    <span>Estimated Total : </span>
                    <span>₹{data.basePrice}</span>
                </div>
            </div>

            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Payment Method</h3>
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <div
                        onClick={() => setPaymentMethod('online')}
                        style={{
                            padding: '1rem',
                            border: `1px solid ${paymentMethod === 'online' ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            backgroundColor: paymentMethod === 'online' ? 'rgba(212, 163, 115, 0.1)' : 'transparent'
                        }}
                    >
                        <CreditCard size={24} color="var(--primary)" />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Online Payment</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Card, UPI (GPay, PhonePe), Net Banking</div>
                        </div>
                    </div>

                    <div
                        onClick={() => setPaymentMethod('cod')}
                        style={{
                            padding: '1rem',
                            border: `1px solid ${paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            backgroundColor: paymentMethod === 'cod' ? 'rgba(212, 163, 115, 0.1)' : 'transparent'
                        }}
                    >
                        <Banknote size={24} color="var(--primary)" />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Cash on Delivery</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay when your order is delivered</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button className="btn btn-outline" onClick={onBack}>Back</button>
                <button className="btn btn-primary" onClick={() => onSubmit(paymentMethod)}>
                    {paymentMethod === 'online' ? 'Proceed to Pay' : 'Place Order'}
                </button>
            </div>
        </div>
    );
}
