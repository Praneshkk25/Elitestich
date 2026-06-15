'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import styles from './Navbar.module.css'; // Reusing Navbar styles for consistency

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className={styles.langSelector}>
            <Globe size={20} />
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={styles.langSelect}
                aria-label="Select Language"
            >
                <option value="en">EN</option>
                <option value="tam">TAM</option>
                <option value="hin">HIN</option>
            </select>
        </div>
    );
}
