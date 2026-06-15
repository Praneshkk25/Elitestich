'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ta'; // English or Tamil

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        'nav.home': 'Home',
        'nav.about': 'About Us',
        'nav.services': 'Services',
        'nav.order': 'Order',
        'nav.track': 'Track',
        'nav.reviews': 'Reviews',
        'nav.contact': 'Contact',
    },
    ta: {
        'nav.home': 'முகப்பு',
        'nav.about': 'எங்களை பற்றி',
        'nav.services': 'சேவைகள்',
        'nav.order': 'ஆர்டர்',
        'nav.track': 'கண்காணிப்பு',
        'nav.reviews': 'விமர்சனங்கள்',
        'nav.contact': 'தொடர்பு',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
