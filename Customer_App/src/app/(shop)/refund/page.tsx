'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function RefundPage() {
    const { t } = useLanguage();

    return (
        <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh' }}>
            <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>{t('legal.refund')}</h1>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '1.5rem' }}>
                    We want you to be completely satisfied with your bespoke garment.
                </p>
                <h2 style={{ color: 'var(--foreground)', margin: '2rem 0 1rem' }}>Returns & Refunds</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    Due to the personalized nature of our custom-tailored products, we generally do not accept returns or offer refunds unless there is a manufacturing defect or the garment significantly differs from the specifications provided.
                </p>
                <h2 style={{ color: 'var(--foreground)', margin: '2rem 0 1rem' }}>Alterations</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    If your garment does not fit perfectly, we offer a complimentary alteration service within 14 days of delivery. Please contact our support team to arrange an alteration.
                </p>
            </div>
        </div>
    );
}
