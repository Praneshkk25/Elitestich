'use client';

import React, { useState } from 'react';
import { CustomizationOption, CustomizationCategory } from '@/data/customizationOptions';
import styles from './ProductPreview.module.css';

interface PreviewProps {
    src: string;
    label?: string;        // e.g. "V Neck"
    sublabel?: string;     // e.g. "Neck Design"
    onReset?: () => void;  // tap to go back to base garment view
    isBase?: boolean;      // true when showing the default garment image
    sections?: CustomizationCategory[];
    selections?: Record<string, CustomizationOption>;
}

export default function ProductPreview({
    src, label, sublabel, onReset, isBase,
    sections, selections,
}: PreviewProps) {
    const [loaded, setLoaded] = useState(false);

    // Build a list of chosen options to display below the image
    const chosenItems = sections && selections
        ? sections
            .map((sec) => ({ section: sec, option: selections[sec.id] }))
            .filter((e) => e.option)
        : [];

    return (
        <div className={styles.wrapper}>
            {/* ── Main preview image box ── */}
            <div className={styles.previewImageBox}>
                {!loaded && <div className={styles.shimmer} />}

                <img
                    key={src}
                    src={src}
                    alt={label ?? 'Preview'}
                    className={styles.previewImage}
                    style={{ opacity: loaded ? 1 : 0 }}
                    onLoad={() => setLoaded(true)}
                />

                {/* Bottom gradient label — shown when viewing a specific option */}
                {loaded && label && (
                    <div className={styles.previewLabel}>
                        {sublabel && (
                            <span className={styles.previewLabelSection}>{sublabel}</span>
                        )}
                        <span className={styles.previewLabelName}>{label}</span>
                    </div>
                )}

                {/* "← View garment" pill */}
                {loaded && !isBase && onReset && (
                    <button className={styles.resetBtn} onClick={onReset}>
                        ← View garment
                    </button>
                )}
            </div>

            <p className={styles.hint}>
                {isBase
                    ? 'Tap any option below to preview it here.'
                    : '* Visualization is approximate. Final product may vary.'}
            </p>

            {/* ── Selections summary ── */}
            {chosenItems.length > 0 && (
                <div className={styles.selectionsPanel}>
                    <p className={styles.selectionTitle}>Your Choices</p>
                    {chosenItems.map(({ section, option }) => (
                        <div key={section.id} className={styles.selectionRow}>
                            <img
                                src={option.image}
                                alt={option.name}
                                className={styles.selectionThumb}
                            />
                            <div className={styles.selectionMeta}>
                                <span className={styles.selectionSection}>{section.name}</span>
                                <span className={styles.selectionName}>{option.name}</span>
                            </div>
                            <span className={styles.selectionPrice}>
                                {option.price > 0 ? `+₹${option.price}` : 'Free'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}