'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './Footer.module.css';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.section}>
                    <Link href="/" className={styles.logo}>
                        ELITE STITCH<span className={styles.logoAccent}> WORLD</span>
                    </Link>
                    <br />
                    <br />
                    <p>
                        Elite Stitch World brings the luxury of bespoke tailoring to your doorstep.
                        Perfect fit, premium fabrics, and personalized service.
                    </p>
                    <div className={styles.socials}>
                        <br />
                        <br />
                        <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>{t('QuickLinks')}</h3>
                    <ul className={styles.links}>
                        <br />
                        <li><Link href="/order">{t('Order')}</Link></li>
                        <li><Link href="/track">{t('Track Order')}</Link></li>
                        <li><Link href="/contactus">{t('Contact Us')}</Link></li>
                        <li><Link href="/aboutus">{t('About Us')}</Link></li>
                        
                    </ul>
                </div>

            </div>
            <div className={styles.bottom}>
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Elite Stitch World. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
}
