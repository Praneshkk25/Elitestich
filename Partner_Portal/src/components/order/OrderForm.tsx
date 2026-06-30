'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StepDesign from './StepDesign';
import StepReview from './StepReview';
import styles from './OrderSteps.module.css';
import { designs } from '@/data/designs';

function OrderFormContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        basePrice: 1500, // Default base price
        currency: 'INR'
    });
    const [showMeasurementPrompt, setShowMeasurementPrompt] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const designId = searchParams.get('design');
        if (designId) {
            const selectedDesign = designs.find(d => d.id === designId);
            if (selectedDesign) {
                setFormData((prev: any) => ({
                    ...prev,
                    designId: selectedDesign.id,
                    designTitle: selectedDesign.title,
                    designType: 'gallery_selection',
                    previewUrl: selectedDesign.image,
                    basePrice: selectedDesign.basePrice,
                    dressType: selectedDesign.category.toLowerCase().replace(' ', '_')
                }));
            }
        }
    }, [searchParams]);

    const handleNext = (data: any) => {
        setFormData({ ...formData, ...data });

        if (step === 1) {
            setShowMeasurementPrompt(true);
        }
    };

    const handleMeasurementChoice = (method: string) => {
        let alertMessage = '';
        if (method === 'Give measurement to Us while Pick up') {
            alertMessage = 'While pick up order measurement will be collected.';
            setShowMeasurementPrompt(false);
        } else if (method === 'Give sample cloth for measurement') {
            alertMessage = 'Sample cloth will be collected during pick up.';
        }
        
        alert(alertMessage);
        
        setShowMeasurementPrompt(false);
        setFormData((prev: any) => ({ ...prev, measurementMethod: method }));
        setStep(2);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async (paymentMethod: string) => {
        const session = {
            user: {
                id: 'mock-user-id',
                email: 'mockuser@example.com',
                user_metadata: { full_name: 'Mock User' }
            }
        };

        try {
            const endpoint = paymentMethod === 'online' ? '$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/checkout' : '$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: [{ id: 'custom-order', quantity: 1 }],
                    email: session.user.email,
                    customerName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    userId: session.user.id,
                    paymentMethod,
                    ...formData
                }),
            });

            const result = await response.json();

            if (paymentMethod === 'online') {
                if (result.url) {
                    window.location.href = result.url;
                } else {
                    console.error('Failed to create checkout session');
                }
            } else {
                // COD Success
                if (result.success) {
                    setOrderId(result.orderId);
                    setShowSuccessPopup(true);
                }
            }
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', gap: '1rem' }}>
                {[1, 2].map((s) => (
                    <div
                        key={s}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: step >= s ? 'var(--primary)' : 'var(--secondary)',
                            color: step >= s ? '#000' : 'var(--text-muted)',
                            border: `1px solid ${step >= s ? 'var(--primary)' : 'var(--border)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {s}
                    </div>
                ))}
            </div>

            {step === 1 && <StepDesign onNext={handleNext} initialData={formData} />}
            {step === 2 && <StepReview data={formData} onBack={handleBack} onSubmit={handleSubmit} />}

            {showMeasurementPrompt && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Provide Measurements</h3>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                            How would you like to provide your measurements?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleMeasurementChoice('Give measurement to us')}
                                style={{ width: '100%' }}
                            >
                                Give measurement to us
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleMeasurementChoice('Sample cloth for measurement')}
                                style={{ width: '100%' }}
                            >
                                Sample cloth for measurement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2.5rem',
                        borderRadius: '16px',
                        maxWidth: '450px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid var(--primary)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>

                        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Order Placed!</h2>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            Your order has been placed successfully. We've sent a confirmation email with the details.
                        </p>

                        <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Order ID</p>
                            <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>{orderId}</p>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => window.location.href = `/track?order_id=${orderId}`}
                        >
                            Track Order Status
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OrderForm() {
    return (
        <Suspense fallback={<div>Loading order form...</div>}>
            <OrderFormContent />
        </Suspense>
    );
}
