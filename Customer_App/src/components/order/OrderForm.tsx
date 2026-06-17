'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StepDesign from './StepDesign';
import StepReview from './StepReview';
import styles from './OrderSteps.module.css';
import { designs } from '@/data/designs';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SIZE_CHARTS: Record<string, Record<string, Record<string, number>>> = {
    saree_blouse: {
        '36 (S)': { bust: 36, waist: 30, shoulder: 14, sleeveLength: 11, garmentLength: 14 },
        '38 (M)': { bust: 38, waist: 32, shoulder: 14.5, sleeveLength: 11.5, garmentLength: 14.5 },
        '40 (L)': { bust: 40, waist: 34, shoulder: 15, sleeveLength: 12, garmentLength: 15 },
        '42 (XL)': { bust: 42, waist: 36, shoulder: 15.5, sleeveLength: 12.5, garmentLength: 15.5 }
    },
    chudithar: {
        '36 (S)': { bust: 36, waist: 30, hips: 38, shoulder: 14, sleeveLength: 11, garmentLength: 37 },
        '38 (M)': { bust: 38, waist: 32, hips: 40, shoulder: 14.5, sleeveLength: 11.5, garmentLength: 38 },
        '40 (L)': { bust: 40, waist: 34, hips: 42, shoulder: 15, sleeveLength: 12, garmentLength: 39 },
        '42 (XL)': { bust: 42, waist: 36, hips: 44, shoulder: 15.5, sleeveLength: 12.5, garmentLength: 40 }
    },
    lehenga: {
        '36 (S)': { bust: 36, waist: 30, hips: 38, shoulder: 14, sleeveLength: 11, garmentLength: 39 },
        '38 (M)': { bust: 38, waist: 32, hips: 40, shoulder: 14.5, sleeveLength: 11.5, garmentLength: 40 },
        '40 (L)': { bust: 40, waist: 34, hips: 42, shoulder: 15, sleeveLength: 12, garmentLength: 41 },
        '42 (XL)': { bust: 42, waist: 36, hips: 44, shoulder: 15.5, sleeveLength: 12.5, garmentLength: 42 }
    },
    half_saree: {
        '36 (S)': { bust: 36, waist: 30, hips: 38, shoulder: 14, sleeveLength: 11, garmentLength: 39 },
        '38 (M)': { bust: 38, waist: 32, hips: 40, shoulder: 14.5, sleeveLength: 11.5, garmentLength: 40 },
        '40 (L)': { bust: 40, waist: 34, hips: 42, shoulder: 15, sleeveLength: 12, garmentLength: 41 },
        '42 (XL)': { bust: 42, waist: 36, hips: 44, shoulder: 15.5, sleeveLength: 12.5, garmentLength: 42 }
    }
};

function OrderFormContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        basePrice: 1500, // Default base price
        currency: 'INR'
    });
    
    // Auth & User Profile Measurements state
    const [user, setUser] = useState<any>(null);
    const [savedProfile, setSavedProfile] = useState<any>(null);

    const [showMeasurementPrompt, setShowMeasurementPrompt] = useState(false);
    const [showMeasurementForm, setShowMeasurementForm] = useState(false);
    
    // Sizing customization options
    const [useStandardSize, setUseStandardSize] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');
    const [adjustments, setAdjustments] = useState<Record<string, number>>({
        shoulder: 0,
        bust: 0,
        waist: 0,
        hips: 0,
        sleeveLength: 0,
        garmentLength: 0
    });
    const [saveToProfile, setSaveToProfile] = useState(false);

    const [measurements, setMeasurements] = useState({
        shoulder: '',
        bust: '',
        waist: '',
        hips: '',
        sleeveLength: '',
        garmentLength: '',
        notes: ''
    });
    
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.measurementsProfiles) {
                            setSavedProfile(data.measurementsProfiles);
                        }
                    }
                } catch (e) {
                    console.error("Error loading user profile measurements", e);
                }
            }
        });
        return () => unsubscribe();
    }, []);

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
        setShowMeasurementPrompt(false);
        if (method === 'Give measurement to us') {
            setShowMeasurementForm(true);
        } else {
            alert('Sample cloth will be collected during pick up.');
            setFormData((prev: any) => ({ 
                ...prev, 
                measurementMethod: 'Sample cloth for measurement',
                measurementsUsed: null,
                customizationNotes: ''
            }));
            setStep(2);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async (paymentMethod: string) => {
        const session = {
            user: {
                id: user?.uid || 'mock-user-id',
                email: user?.email || 'mockuser@example.com',
                user_metadata: { full_name: user?.displayName || user?.email?.split('@')[0] || 'Mock User' }
            }
        };

        try {
            const endpoint = paymentMethod === 'online' ? 'http://localhost:5000/api/checkout' : 'http://localhost:5000/api/orders';

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
                if (!result.razorpayOrderId) {
                    alert('Failed to initiate online payment session');
                    return;
                }

                const loadScript = () => {
                    return new Promise((resolve) => {
                        const script = document.createElement('script');
                        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        script.onload = () => resolve(true);
                        script.onerror = () => resolve(false);
                        document.body.appendChild(script);
                    });
                };

                const isLoaded = await loadScript();
                if (!isLoaded) {
                    alert('Failed to load payment gateway helper. Please check your internet connection.');
                    return;
                }

                const options = {
                    key: result.key,
                    amount: result.amount,
                    currency: result.currency || 'INR',
                    name: 'Elite Stitch',
                    description: `Custom Stitching: ${formData.designTitle || 'Bespoke Dress'}`,
                    order_id: result.razorpayOrderId,
                    handler: async function (response: any) {
                        try {
                            const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderDetails: {
                                        email: session.user.email,
                                        customerName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                                        userId: session.user.id,
                                        paymentMethod: 'online',
                                        ...formData
                                    }
                                })
                            });
                            const verifyResult = await verifyRes.json();
                            if (verifyResult.success) {
                                setOrderId(verifyResult.orderId);
                                setShowSuccessPopup(true);
                            } else {
                                alert('Payment verification failed');
                            }
                        } catch (err) {
                            console.error('Verification error:', err);
                            alert('Error verifying payment.');
                        }
                    },
                    prefill: {
                        name: session.user.user_metadata?.full_name || '',
                        email: session.user.email,
                    },
                    theme: {
                        color: '#d4af37'
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
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

    const normalizedCategoryKey = 
        formData.dressType === 'saree_blouse' ? 'saree_blouse' :
        formData.dressType === 'chudithar' ? 'chudithar' :
        formData.dressType === 'lehenga' ? 'lehenga' :
        formData.dressType === 'half_saree' ? 'half_saree' : 'saree_blouse';

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
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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

            {showMeasurementForm && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1500
                }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>Enter Your Measurements</h3>
                        
                        {/* Load Saved Profile Button */}
                        {savedProfile && savedProfile[normalizedCategoryKey] && (
                            <button
                                type="button"
                                onClick={() => {
                                    const profileData = savedProfile[normalizedCategoryKey];
                                    setMeasurements({
                                        shoulder: String(profileData.shoulder || ''),
                                        bust: String(profileData.bust || profileData.blouse_bust || ''),
                                        waist: String(profileData.waist || profileData.blouse_waist || ''),
                                        hips: String(profileData.hips || ''),
                                        sleeveLength: String(profileData.sleeve_length || profileData.sleeveLength || ''),
                                        garmentLength: String(profileData.garmentLength || profileData.blouse_length || profileData.top_length || profileData.skirt_length || ''),
                                        notes: profileData.notes || measurements.notes
                                    });
                                    setUseStandardSize(false);
                                    alert('Loaded measurements from your saved profile!');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                    border: '1px solid var(--primary)',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold',
                                    marginBottom: '1.25rem',
                                    cursor: 'pointer'
                                }}
                            >
                                📥 Load from Saved Profile ({normalizedCategoryKey.replace('_', ' ')})
                            </button>
                        )}

                        {/* Custom / Standard sizing Choice Toggle */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setUseStandardSize(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '6px',
                                    border: !useStandardSize ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    backgroundColor: !useStandardSize ? 'rgba(212, 175, 55, 0.15)' : 'var(--background)',
                                    color: !useStandardSize ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Custom Input
                            </button>
                            <button
                                type="button"
                                onClick={() => setUseStandardSize(true)}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '6px',
                                    border: useStandardSize ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    backgroundColor: useStandardSize ? 'rgba(212, 175, 55, 0.15)' : 'var(--background)',
                                    color: useStandardSize ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Size + Adjustments
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            
                            // Save profile if checked
                            if (saveToProfile && user) {
                                const userRef = doc(db, 'users', user.uid);
                                setDoc(userRef, {
                                    measurementsProfiles: {
                                        [normalizedCategoryKey]: {
                                            shoulder: measurements.shoulder,
                                            bust: measurements.bust,
                                            waist: measurements.waist,
                                            hips: measurements.hips,
                                            sleeveLength: measurements.sleeveLength,
                                            garmentLength: measurements.garmentLength
                                        }
                                    }
                                }, { merge: true }).catch(err => console.error(err));
                            }

                            setFormData((prev: any) => ({
                                ...prev,
                                measurementMethod: useStandardSize 
                                    ? `Standard size ${selectedSize} with adjustments` 
                                    : 'Give measurement to us',
                                measurementsUsed: {
                                    shoulder: measurements.shoulder,
                                    bust: measurements.bust,
                                    waist: measurements.waist,
                                    hips: measurements.hips,
                                    sleeveLength: measurements.sleeveLength,
                                    garmentLength: measurements.garmentLength
                                },
                                customizationNotes: measurements.notes
                            }));
                            setShowMeasurementForm(false);
                            setStep(2);
                        }}>
                            {useStandardSize ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Base Size Chart</label>
                                        <select
                                            value={selectedSize}
                                            required={useStandardSize}
                                            onChange={(e) => {
                                                const sz = e.target.value;
                                                setSelectedSize(sz);
                                                if (sz && SIZE_CHARTS[normalizedCategoryKey]?.[sz]) {
                                                    const chart = SIZE_CHARTS[normalizedCategoryKey][sz];
                                                    
                                                    // Reset adjustments
                                                    setAdjustments({
                                                        shoulder: 0, bust: 0, waist: 0, hips: 0, sleeveLength: 0, garmentLength: 0
                                                    });

                                                    setMeasurements(prev => ({
                                                        ...prev,
                                                        shoulder: String(chart.shoulder || ''),
                                                        bust: String(chart.bust || ''),
                                                        waist: String(chart.waist || ''),
                                                        hips: String(chart.hips || ''),
                                                        sleeveLength: String(chart.sleeveLength || ''),
                                                        garmentLength: String(chart.garmentLength || '')
                                                    }));
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)'
                                            }}
                                        >
                                            <option value="">Choose base size...</option>
                                            {Object.keys(SIZE_CHARTS[normalizedCategoryKey] || {}).map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Parameter adjustment controls */}
                                    {selectedSize && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {Object.keys(SIZE_CHARTS[normalizedCategoryKey]?.[selectedSize] || {}).map((fieldId) => {
                                                const fieldLabels: Record<string, string> = {
                                                    shoulder: 'Shoulder',
                                                    bust: 'Bust / Chest',
                                                    waist: 'Waist',
                                                    hips: 'Hips',
                                                    sleeveLength: 'Sleeve Length',
                                                    garmentLength: 'Garment Length'
                                                };
                                                const label = fieldLabels[fieldId] || fieldId;
                                                const baseVal = SIZE_CHARTS[normalizedCategoryKey][selectedSize][fieldId] || 0;
                                                const adj = adjustments[fieldId] || 0;
                                                const finalVal = baseVal + adj;

                                                return (
                                                    <div key={fieldId} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {label} (Base: {baseVal} in)
                                                        </label>
                                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                            <select
                                                                value={adj}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    setAdjustments(prev => ({ ...prev, [fieldId]: val }));
                                                                    setMeasurements(prev => ({ ...prev, [fieldId]: String(baseVal + val) }));
                                                                }}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '0.4rem',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--border)',
                                                                    backgroundColor: 'var(--background)',
                                                                    color: 'var(--foreground)',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                <option value="-2.0">-2.0 in</option>
                                                                <option value="-1.5">-1.5 in</option>
                                                                <option value="-1.0">-1.0 in</option>
                                                                <option value="-0.5">-0.5 in</option>
                                                                <option value="0.0">No adj</option>
                                                                <option value="0.5">+0.5 in</option>
                                                                <option value="1.0">+1.0 in</option>
                                                                <option value="1.5">+1.5 in</option>
                                                                <option value="2.0">+2.0 in</option>
                                                            </select>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', minWidth: '48px' }}>
                                                                {finalVal.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Shoulder (in)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            required 
                                            placeholder="e.g. 14.5"
                                            value={measurements.shoulder}
                                            onChange={e => setMeasurements({ ...measurements, shoulder: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Chest / Bust (in)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            required 
                                            placeholder="e.g. 36"
                                            value={measurements.bust}
                                            onChange={e => setMeasurements({ ...measurements, bust: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Waist (in)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            required 
                                            placeholder="e.g. 30"
                                            value={measurements.waist}
                                            onChange={e => setMeasurements({ ...measurements, waist: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hips (in)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            required 
                                            placeholder="e.g. 40"
                                            value={measurements.hips}
                                            onChange={e => setMeasurements({ ...measurements, hips: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sleeve Length (in)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            required 
                                            placeholder="e.g. 11.5"
                                            value={measurements.sleeveLength}
                                            onChange={e => setMeasurements({ ...measurements, sleeveLength: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Garment Length (in)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            required 
                                            placeholder="e.g. 38"
                                            value={measurements.garmentLength}
                                            onChange={e => setMeasurements({ ...measurements, garmentLength: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Special Instructions / Styling Notes</label>
                                <textarea 
                                    placeholder="e.g. Need high back neck, round front neck, extra border lining..."
                                    value={measurements.notes}
                                    onChange={e => setMeasurements({ ...measurements, notes: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                                />
                            </div>

                            {user && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <input
                                        id="save-to-profile-checkbox"
                                        type="checkbox"
                                        checked={saveToProfile}
                                        onChange={(e) => setSaveToProfile(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="save-to-profile-checkbox" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        💾 Save these measurements to my profile for future orders
                                    </label>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    onClick={() => {
                                        setShowMeasurementForm(false);
                                        setShowMeasurementPrompt(true);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Back
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Save & Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSuccessPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
