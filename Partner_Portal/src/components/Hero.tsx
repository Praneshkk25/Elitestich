'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './Hero.module.css';

export default function Hero() {
    const { t } = useLanguage();

    return (
        <section className={styles.hero}>
            <div className={styles.overlay}></div>
            <div className={`container ${styles.content}`}>
                <h1 className={`${styles.title} animate-fade-in`}>
                    {t('hero.title')}
                </h1>
                <p className={`${styles.subtitle} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                    {t('hero.subtitle')}
                </p>
            </div>
        </section>
    );
}
