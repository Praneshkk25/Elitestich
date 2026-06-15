import { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, ArrowRight, PackageSearch, Ruler } from 'lucide-react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: "Elite Stitch World | Premium Bespoke Tailoring",
    description: "Custom garments tailored exclusively for you. Browse designs, order custom fits, and track your delivery.",
    keywords: ["tailoring", "bespoke", "custom suit", "saree blouse", "lehenga", "salem tailoring"],
    authors: [{ name: "Elite Stitch World" }],
    openGraph: {
        title: "Elite Stitch World | Premium Bespoke Tailoring",
        description: "Custom garments tailored exclusively for you. Browse designs, order custom fits, and track your delivery.",
        url: 'https://elitestitchworld.com',
        siteName: 'Elite Stitch World',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Elite Stitch World | Premium Bespoke Tailoring',
        description: 'Custom garments tailored exclusively for you. Browse designs, order custom fits, and track your delivery.',
        images: ['/og-image.jpg'],
    },
};

export default function Home() {
    return (
        <>
            <div className={styles.heroSection}>
                <div className={styles.imageWrapper}>
                    <img 
                        src="/images/premium_tailoring_hero.png"
                        alt="Premium Bespoke Tailoring" 
                        className={styles.heroImage}
                    />
                </div>

                <div className={styles.contentWrapper}>
                    <h1 className={styles.title}>Elegance Tailored Exclusively For You</h1>
                    <p className={styles.subtitle}>Premium bespoke tailoring services for the modern individual.</p>
                </div>

                <div className={styles.cardsContainer}>
                    {/* Card 1: Services */}
                    <div className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <Scissors size={40} />
                        </div>
                        <h3 className={styles.cardTitle}>SERVICES</h3>
                        <p className={styles.cardDesc}>
                            Bespoke Lehengas, Designer Blouses, Gowns. Expertly tailored for style and fit.
                        </p>
                        <Link href="/designs" className={styles.cardLink} style={{ textDecoration: 'none' }}>
                            Discover Services
                        </Link>
                    </div>

                    {/* Card 2: Custom Order */}
                    <div className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <Ruler size={40} />
                        </div>
                        <h3 className={styles.cardTitle}>CUSTOM ORDER</h3>
                        <p className={styles.cardDesc}>
                            Experience the perfect fit. Schedule your personalized fitting session.
                        </p>
                        <Link href="/order" className={styles.cardLink} style={{ textDecoration: 'none' }}>
                            Book Order
                        </Link>
                    </div>

                    {/* Card 3: Track Order */}
                    <div className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <PackageSearch size={40} />
                        </div>
                        <h3 className={styles.cardTitle}>TRACK ORDER</h3>
                        <p className={styles.cardDesc}>
                            Follow your handcrafted garment from cutting to completion.
                        </p>
                        <form action="/track" method="GET" className={styles.trackForm}>
                            <input
                                type="text"
                                name="order_id"
                                placeholder="Enter Order ID"
                                className={styles.trackInput}
                                required
                            />
                            <button type="submit" className={styles.trackButton}>
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
