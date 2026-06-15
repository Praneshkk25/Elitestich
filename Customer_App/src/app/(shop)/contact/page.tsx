'use client';

import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import dynamic from 'next/dynamic';
import styles from './contact.module.css';

// Import MapComponent dynamically to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className={styles.mapPlaceholder}>Loading Map...</div>
});

export default function ContactPage() {
    const { t } = useLanguage();

    return (
        <div className={`container ${styles.page}`}>
            <header className={styles.header}>
                <h1 className={styles.title}>CONTACT US</h1>
                <p className={styles.subtitle}>{}</p>
            </header>

            <div className={styles.content}>
                <div className={styles.contactInfo}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>
                            <MapPin size={24} />
                        </div>
                        <div className={styles.infoText}>
                            <h3>{t('Contact Address')}</h3>
                            <p>42/1, llnd cross M.G.R nagar,<br />Chinnathirupathi, Salem - 636 008</p>
                        </div>
                    </div>

                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>
                            <Phone size={24} />
                        </div>
                        <div className={styles.infoText}>
                            <h3>Phone</h3>
                            <p>+91 98765 43210</p>
                        </div>
                    </div>

                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>
                            <Mail size={24} />
                        </div>
                        <div className={styles.infoText}>
                            <h3>Email</h3>
                            <p>elitestitchworld@gmail.com</p>
                        </div>
                    </div>

                    <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>
                            <Clock size={24} />
                        </div>
                        <div className={styles.infoText}>
                            <h3>Business Hours</h3>
                            <p>Mon - Sat: 10:00 AM - 8:00 PM<br />Sun: Closed</p>
                        </div>
                    </div>

                    <div className={styles.mapWrapper}>
                        <MapComponent locations={[{
                            lat: 11.6643,
                            lng: 78.1460,
                            title: 'Elite Stitch World',
                            description: 'Salem, Tamil Nadu'
                        }]} />
                    </div>
                </div>

                <div className={styles.formWrapper}>
                    <p>Contact form is currently unavailable.</p>
                </div>
            </div>
        </div>
    );
}
