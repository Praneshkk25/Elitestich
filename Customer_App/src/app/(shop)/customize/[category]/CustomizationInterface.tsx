'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductCustomization, CustomizationOption } from '@/data/customizationOptions';
import { useCart } from '@/contexts/CartContext';
import styles from './customize.module.css';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface CustomizationInterfaceProps {
    customizationData: ProductCustomization;
    initialBasePrice?: number;
}

export default function CustomizationInterface({ customizationData, initialBasePrice = 1500 }: CustomizationInterfaceProps) {
    const router = useRouter();
    const { addToCart } = useCart();

    // State to track selected option ID for each section ID
    const [selections, setSelections] = useState<Record<string, CustomizationOption>>({});

    // Initialize with first option of each section if not selected
    useState(() => {
        const initialSelections: Record<string, CustomizationOption> = {};
        customizationData.sections.forEach(section => {
            if (section.options.length > 0) {
                initialSelections[section.id] = section.options[0];
            }
        });
        setSelections(initialSelections);
    });

    const handleSelect = (sectionId: string, option: CustomizationOption) => {
        setSelections(prev => ({
            ...prev,
            [sectionId]: option
        }));
    };

    const calculateTotal = () => {
        const extras = Object.values(selections).reduce((acc, opt) => acc + opt.price, 0);
        return initialBasePrice + extras;
    };

    const handleAddToCart = () => {
        // Construct a descriptive title
        const selectedOptionsStr = Object.values(selections).map(s => s.name).join(', ');

        addToCart({
            id: `${customizationData.category}-${Date.now()}`, // unique ID for cart item
            title: `${customizationData.category} (Custom)`,
            category: customizationData.category,
            image: '/images/placeholder-garment.png', // This should be dynamic based on selection ideally
            price: calculateTotal(),
        });
        alert('Added to cart!');
        router.push('/cart'); // or just stay here
    };

    return (
        <div className={styles.page}>
            <div className={styles.actions} style={{ position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <button onClick={() => router.back()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={20} /> Back
                </button>
                <div className={styles.totalPrice}>
                    Total: ₹{calculateTotal()}
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.layout}>

                    {/* Left: Preview */}
                    <div className={styles.previewPane}>
                        <h2 className={styles.sectionTitle}>Preview</h2>
                        <div className={styles.previewImageContainer}>
                            {/* Use a placeholder image for now, later this can be dynamic */}
                            <img
                                src={`https://placehold.co/400x533?text=${customizationData.category}`}
                                alt="Preview"
                                className={styles.baseImage}
                            />
                            <div className={styles.previewOverlay}>
                                {Object.entries(selections).map(([sectionId, option]) => (
                                    <div key={sectionId} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{customizationData.sections.find(s => s.id === sectionId)?.name}:</span>
                                        <b>{option.name}</b>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                            *Visualization is approximate. Final product may vary slightly.
                        </p>
                    </div>

                    {/* Right: Customization Options */}
                    <div className={styles.optionsContainer}>
                        {customizationData.sections.map((section) => (
                            <div key={section.id} className={styles.section}>
                                <h3 className={styles.sectionTitle}>{section.name}</h3>
                                <div className={styles.optionsGrid}>
                                    {section.options.map((option) => {
                                        const isSelected = selections[section.id]?.id === option.id;
                                        return (
                                            <div
                                                key={option.id}
                                                className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
                                                onClick={() => handleSelect(section.id, option)}
                                            >
                                                <div className={styles.optionImageWrapper}>
                                                    <img src={option.image} alt={option.name} className={styles.optionImage} />
                                                </div>
                                                <div className={styles.optionInfo}>
                                                    <div className={styles.optionName}>{option.name}</div>
                                                    <div className={styles.optionPrice}>
                                                        {option.price > 0 ? `+₹${option.price}` : 'Free'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <button className={styles.addToCartBtn} onClick={handleAddToCart} style={{ width: '100%', marginTop: '1rem' }}>
                            Add to Cart - ₹{calculateTotal()}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
