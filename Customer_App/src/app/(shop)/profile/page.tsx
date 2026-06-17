'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Ruler, User, Save, CheckCircle, ChevronRight, Lock } from 'lucide-react';

const CATEGORIES = [
    { id: 'saree_blouse', label: 'Saree Blouse', icon: '👚' },
    { id: 'chudithar', label: 'Chudithar', icon: '👗' },
    { id: 'lehenga', label: 'Lehenga', icon: '💃' },
    { id: 'half_saree', label: 'Half Saree', icon: '🥻' }
];

const FIELDS_CONFIG = {
    saree_blouse: [
        { id: 'bust', label: 'Bust (in)', placeholder: '36' },
        { id: 'waist', label: 'Waist (in)', placeholder: '30' },
        { id: 'shoulder', label: 'Shoulder (in)', placeholder: '14' },
        { id: 'arm_hole', label: 'Arm Hole (in)', placeholder: '16' },
        { id: 'sleeve_length', label: 'Sleeve Length (in)', placeholder: '11' },
        { id: 'blouse_length', label: 'Blouse Length (in)', placeholder: '14' },
        { id: 'front_neck', label: 'Front Neck Depth (in)', placeholder: '7.5' },
        { id: 'back_neck', label: 'Back Neck Depth (in)', placeholder: '8' }
    ],
    chudithar: [
        { id: 'bust', label: 'Bust (in)', placeholder: '38' },
        { id: 'waist', label: 'Waist (in)', placeholder: '32' },
        { id: 'hips', label: 'Hips (in)', placeholder: '40' },
        { id: 'shoulder', label: 'Shoulder (in)', placeholder: '15' },
        { id: 'sleeve_length', label: 'Sleeve Length (in)', placeholder: '12' },
        { id: 'top_length', label: 'Top Length (in)', placeholder: '38' },
        { id: 'pant_length', label: 'Pant Length (in)', placeholder: '39' }
    ],
    lehenga: [
        { id: 'blouse_bust', label: 'Blouse Bust (in)', placeholder: '36' },
        { id: 'blouse_waist', label: 'Blouse Waist (in)', placeholder: '30' },
        { id: 'blouse_length', label: 'Blouse Length (in)', placeholder: '14' },
        { id: 'skirt_waist', label: 'Skirt Waist (in)', placeholder: '32' },
        { id: 'skirt_length', label: 'Skirt Length (in)', placeholder: '40' }
    ],
    half_saree: [
        { id: 'blouse_bust', label: 'Blouse Bust (in)', placeholder: '36' },
        { id: 'blouse_waist', label: 'Blouse Waist (in)', placeholder: '30' },
        { id: 'blouse_length', label: 'Blouse Length (in)', placeholder: '14' },
        { id: 'skirt_waist', label: 'Skirt Waist (in)', placeholder: '32' },
        { id: 'skirt_length', label: 'Skirt Length (in)', placeholder: '40' }
    ]
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('profile');
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchUserProfile(currentUser.uid);
            } else {
                setLoading(false);
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchUserProfile = async (uid: string) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                setProfiles(data.measurementsProfiles || {});
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (category: string, values: any) => {
        if (!user) return;
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const updatedProfiles = {
                ...profiles,
                [category]: values
            };

            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                measurementsProfiles: updatedProfiles
            }, { merge: true });

            setProfiles(updatedProfiles);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving measurements profile:", error);
            alert("Failed to save measurements profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)' }}>
                <p>Loading your profile details...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ minHeight: '90vh', padding: '3rem 1rem', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        MY PROFILE
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Manage your user settings and custom measurements for instant tailoring orders.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
                    
                    {/* Navigation Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            onClick={() => setSelectedTab('profile')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: selectedTab === 'profile' ? 'rgba(212, 175, 55, 0.15)' : 'var(--secondary)',
                                color: selectedTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                borderLeft: selectedTab === 'profile' ? '3px solid var(--primary)' : '3px solid transparent'
                            }}
                        >
                            <User size={18} /> Account Settings
                        </button>

                        <div style={{ margin: '1rem 0 0.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Measurement Profiles
                        </div>

                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedTab(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem 1.25rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: selectedTab === cat.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--secondary)',
                                    color: selectedTab === cat.id ? 'var(--primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s ease',
                                    borderLeft: selectedTab === cat.id ? '3px solid var(--primary)' : '3px solid transparent'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span> {cat.label}
                                </span>
                                {profiles[cat.id] && <CheckCircle size={14} style={{ color: '#10b981' }} />}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        padding: '2rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        {selectedTab === 'profile' ? (
                            <div>
                                <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--foreground)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                    Account Details
                                </h2>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email Address</label>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span>{user.email}</span>
                                            <Lock size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Display Name</label>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            color: 'var(--foreground)'
                                        }}>
                                            {user.displayName || user.email?.split('@')[0]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <MeasurementForm 
                                category={selectedTab}
                                categoryName={CATEGORIES.find(c => c.id === selectedTab)?.label || ''}
                                savedValues={profiles[selectedTab] || {}}
                                onSave={handleSaveProfile}
                                isSaving={isSaving}
                                success={saveSuccess}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FormProps {
    category: string;
    categoryName: string;
    savedValues: any;
    onSave: (category: string, values: any) => Promise<void>;
    isSaving: boolean;
    success: boolean;
}

function MeasurementForm({ category, categoryName, savedValues, onSave, isSaving, success }: FormProps) {
    const fields = FIELDS_CONFIG[category as keyof typeof FIELDS_CONFIG] || [];
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialValues: any = {};
        fields.forEach(field => {
            initialValues[field.id] = savedValues[field.id] || '';
        });
        setFormValues(initialValues);
    }, [category, savedValues]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(category, formValues);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ 
                fontFamily: 'var(--font-serif)', 
                color: 'var(--foreground)', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
                <Ruler size={24} style={{ color: 'var(--primary)' }} />
                {categoryName} Profile
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                Please provide your measurements in **inches**. We will use these as standard inputs for your {categoryName} custom orders.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {fields.map(field => (
                    <div key={field.id}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            {field.label}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder={field.placeholder}
                            value={formValues[field.id] || ''}
                            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--background)',
                                color: 'var(--foreground)',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 2rem'
                    }}
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Profile'}
                </button>

                {success && (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                        <CheckCircle size={18} /> Profile updated successfully!
                    </span>
                )}
            </div>
        </form>
    );
}
