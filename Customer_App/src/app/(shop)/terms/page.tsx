'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
    const { t } = useLanguage();

    return (
        <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh' }}>
            <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>{t('legal.terms')}</h1>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '1.5rem' }}>
                    By using the Elite Stitch World website, you agree to comply with and be bound by the following terms and conditions of use.
                </p>
                <h2 style={{ color: 'var(--foreground)', margin: '2rem 0 1rem' }}>Bespoke Nature</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    As our products are custom-made to your specific measurements and design preferences, please ensure all details provided during the ordering process are accurate. We cannot be held responsible for errors in measurements provided by the customer.
                </p>
                <h2 style={{ color: 'var(--foreground)', margin: '2rem 0 1rem' }}>Intellectual Property</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    The content, layout, design, data, and graphics on this website are protected by intellectual property laws and are owned by Elite Stitch World.
                </p>
            </div>
        </div>
    );
}
