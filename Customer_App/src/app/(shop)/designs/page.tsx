'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DesignCard from '@/components/DesignCard';
import styles from './designs.module.css';
import { designs } from '@/data/designs';
import Skeleton from '@/components/ui/Skeleton';

const categories = ['All', ...Array.from(new Set(designs.map(d => d.category)))];

function DesignsContent() {
    const searchParams = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const category = searchParams.get('category');
        if (category && categories.includes(category)) {
            setSelectedCategory(category);
        }
    }, [searchParams]);

    const filteredDesigns = selectedCategory === 'All'
        ? designs
        : designs.filter(d => d.category === selectedCategory);

    return (
        <div className={styles.page}>
            <div className={styles.stickyFilterBar}>
                <div className="container">
                    <div className={styles.filterScroll}>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`${styles.filterBtn} ${selectedCategory === category ? styles.active : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>Our Collection</h1>
                    <p className={styles.subtitle}>
                        Browse our curated selection of premium designs.
                        Choose a style to customize or upload your own inspiration.
                    </p>
                </header>

                <div className={styles.grid}>
                    {filteredDesigns.map((design) => (
                        <DesignCard
                            key={design.id}
                            id={design.id}
                            title={design.title}
                            category={design.category}
                            image={design.image}
                            price={design.priceDisplay}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function DesignsSkeleton() {
    return (
        <div className={styles.page}>
            <div className={styles.stickyFilterBar}>
                <div className="container">
                    <div className={styles.filterScroll}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className={styles.filterBtn} style={{ width: '80px', height: '36px' }} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="container">
                <div className={styles.grid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Skeleton style={{ height: '300px', width: '100%', borderRadius: '8px' }} />
                            <Skeleton style={{ height: '20px', width: '60%' }} />
                            <Skeleton style={{ height: '24px', width: '40%' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DesignsPage() {
    return (
        <Suspense fallback={<DesignsSkeleton />}>
            <DesignsContent />
        </Suspense>
    );
}
