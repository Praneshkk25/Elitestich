import { Upload, Image as ImageIcon, Check, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import styles from './OrderSteps.module.css';

interface StepDesignProps {
    onNext: (data: any) => void;
    initialData: any;
}

export default function StepDesign({ onNext, initialData }: StepDesignProps) {
    const [preview, setPreview] = useState<string | null>(initialData?.previewUrl || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dressType, setDressType] = useState<string>(initialData?.dressType || '');
    const [fabricSource, setFabricSource] = useState<string>(initialData?.fabricSource || 'own');

    const isGallery = initialData?.designType === 'gallery_selection';

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        }
    };

    const handleConfirm = () => {
        if (selectedFile || preview) {
            if (!isGallery && !dressType) {
                alert('Please select a dress type for your custom design.');
                return;
            }
            onNext({
                designType: isGallery ? 'gallery_selection' : 'custom_upload',
                designFile: selectedFile?.name,
                previewUrl: preview,
                dressType: isGallery ? initialData.dressType : dressType,
                fabricSource: fabricSource
            });
        }
    };

    const handleClear = () => {
        setPreview(null);
        setSelectedFile(null);
    };

    return (
        <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Choose Your Design</h2>

            {preview ? (
                <div className={styles.previewContainer}>
                    <h3>Confirm Your Design</h3>
                    <div className={styles.imagePreview}>
                        <img src={preview} alt="Design Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '1.5rem' }} />
                    </div>
                    
                    {!isGallery && (
                        <div style={{ marginBottom: '2rem', textAlign: 'left', width: '100%', maxWidth: '400px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>What type of dress is this?</label>
                            <select 
                                value={dressType} 
                                onChange={(e) => setDressType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--foreground)'
                                }}
                            >
                                <option value="">Select a dress type...</option>
                                <option value="blouse">Blouse</option>
                                <option value="chudithar">Chudithar</option>
                                <option value="lehenga">Lehenga</option>
                                <option value="half_saree">Half Saree</option>
                                <option value="salwar">Salwar</option>
                            </select>
                        </div>
                    )}
                    <div style={{ marginBottom: '2rem', textAlign: 'left', width: '100%', maxWidth: '400px' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>Fabric Sourcing Option</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div 
                                onClick={() => setFabricSource('own')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: fabricSource === 'own' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    background: fabricSource === 'own' ? 'rgba(212, 175, 55, 0.05)' : 'var(--input-bg)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <input 
                                        type="radio" 
                                        name="fabricSource" 
                                        value="own" 
                                        checked={fabricSource === 'own'} 
                                        onChange={() => {}} // Controlled via parent click
                                    />
                                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Provide Fabric</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Provide your own fabric (driver will pickup, +₹50)</span>
                            </div>
                            
                            <div 
                                onClick={() => setFabricSource('store')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: fabricSource === 'store' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    background: fabricSource === 'store' ? 'rgba(212, 175, 55, 0.05)' : 'var(--input-bg)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <input 
                                        type="radio" 
                                        name="fabricSource" 
                                        value="store" 
                                        checked={fabricSource === 'store'} 
                                        onChange={() => {}} // Controlled via parent click
                                    />
                                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Purchase Fabric</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Purchase direct from our inventory (no pickup needed)</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.previewActions}>
                        <button className="btn btn-outline" onClick={handleClear}>
                            <XIcon size={18} style={{ marginRight: '0.5rem' }} />
                            Change Image
                        </button>
                        <button className="btn btn-primary" onClick={handleConfirm}>
                            <Check size={18} style={{ marginRight: '0.5rem' }} />
                            Confirm & Next
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className={styles.optionCard} style={{ maxWidth: '400px', width: '100%' }}>
                        <div className={styles.iconWrapper}>
                            <Upload size={40} />
                        </div>
                        <h3>Upload Your Own</h3>
                        <p>Have a specific design in mind? Upload an image</p>
                        <input
                            type="file"
                            id="design-upload"
                            hidden
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="design-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                            Upload Image
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
