'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
    const { t } = useLanguage();

    return (
        <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh' }}>
            <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>{t('legal.privacy')}</h1>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '1.5rem' }}>
                    At Elite Stitch World, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our site.
                </p>
                <h2 style={{ color: 'var(--foreground)', margin: '2rem 0 1rem' }}>Personal Information We Collect</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    When you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information (including credit card numbers), email address, and phone number.
                </p>
                <h2 style={{ color: 'var(--foreground)', margin: '2rem 0 1rem' }}>How Do We Use Your Personal Information?</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).
                </p>
            </div>
        </div>
    );
}
