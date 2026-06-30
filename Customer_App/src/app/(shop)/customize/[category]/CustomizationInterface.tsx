'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCustomization, CustomizationOption } from '@/data/customizationOptions';
import { useCart } from '@/contexts/CartContext';
import ProductPreview from '@/components/ProductPreview';
import styles from './customize.module.css';
import { ArrowLeft } from 'lucide-react';

interface CustomizationInterfaceProps {
    customizationData: ProductCustomization;
    initialBasePrice?: number;
    baseImage: string;
}

export default function CustomizationInterface({
    customizationData,
    initialBasePrice = 1500,
    baseImage,
}: CustomizationInterfaceProps) {
    const router = useRouter();
    const { addToCart } = useCart();

    // Which option is selected per section (for price calc & highlight)
    const [selections, setSelections] = useState<Record<string, CustomizationOption>>(() => {
        const init: Record<string, CustomizationOption> = {};
        customizationData.sections.forEach((section) => {
            if (section.options.length > 0) {
                init[section.id] = section.options[0];
            }
        });
        return init;
    });

    // What the preview pane is currently showing
    const [previewSrc, setPreviewSrc] = useState<string>(baseImage);
    const [previewLabel, setPreviewLabel] = useState<string>('');
    const [previewSublabel, setPreviewSublabel] = useState<string>('');
    const [isBase, setIsBase] = useState(true);

    const handleSelect = (sectionId: string, sectionName: string, option: CustomizationOption) => {
        setSelections((prev) => ({ ...prev, [sectionId]: option }));
        // Update the preview to show this option's image
        setPreviewSrc(option.image);
        setPreviewLabel(option.name);
        setPreviewSublabel(sectionName);
        setIsBase(false);
    };

    const resetPreview = () => {
        setPreviewSrc(baseImage);
        setPreviewLabel('');
        setPreviewSublabel('');
        setIsBase(true);
    };

    const calculateTotal = () =>
        initialBasePrice +
        Object.values(selections).reduce((acc, opt) => acc + opt.price, 0);

    const handleAddToCart = () => {
        addToCart({
            id: `${customizationData.category}-${Date.now()}`,
            title: customizationData.category,
            category: customizationData.category,
            image: baseImage,
            price: calculateTotal(),
        });
        alert('Added to cart!');
        router.push('/cart');
    };

    return (
        <div className={styles.page}>
            {/* Fixed bottom bar */}
            <div className={styles.actions}>
                <button
                    onClick={() => router.back()}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <div className={styles.totalPrice}>Total: ₹{calculateTotal()}</div>
            </div>

            <div className={styles.container}>
                <div className={styles.layout}>
                    {/* ── Left: Click-to-view Preview ── */}
                    <div className={styles.previewPane}>
                        <h2 className={styles.sectionTitle}>Preview</h2>
                        <ProductPreview
                            src={previewSrc}
                            label={previewLabel}
                            sublabel={previewSublabel}
                            isBase={isBase}
                            onReset={resetPreview}
                            sections={customizationData.sections}
                            selections={selections}
                        />
                    </div>

                    {/* ── Right: Customization Options ── */}
                    <div className={styles.optionsContainer}>
                        {customizationData.sections.map((section) => (
                            <div key={section.id} className={styles.section}>
                                <h3 className={styles.sectionTitle}>{section.name}</h3>
                                <div className={styles.optionsGrid}>
                                    {section.options.map((option) => {
                                        const isSelected = selections[section.id]?.id === option.id;
                                        const isPreviewing = previewSrc === option.image && !isBase;
                                        return (
                                            <div
                                                key={option.id}
                                                className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
                                                onClick={() => handleSelect(section.id, section.name, option)}
                                            >
                                                <div className={styles.optionImageWrapper}>
                                                    <img
                                                        src={option.image}
                                                        alt={option.name}
                                                        className={styles.optionImage}
                                                    />
                                                    {/* "Previewing" badge */}
                                                    {isPreviewing && (
                                                        <div className={styles.previewingBadge}>Viewing</div>
                                                    )}
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

                        <button
                            className={styles.addToCartBtn}
                            onClick={handleAddToCart}
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            Add to Cart — ₹{calculateTotal()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
