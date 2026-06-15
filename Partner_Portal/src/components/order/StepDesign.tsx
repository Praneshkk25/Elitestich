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
                dressType: isGallery ? initialData.dressType : dressType
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
