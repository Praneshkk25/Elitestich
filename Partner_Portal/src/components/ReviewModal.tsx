import { useState } from 'react';
import { X, Star, Upload } from 'lucide-react';
import styles from './ReviewModal.module.css';
import { addReview } from '@/lib/db';
import { auth } from '@/lib/firebase';

interface ReviewModalProps {
    orderId: string;
    designId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ReviewModal({ orderId, designId, isOpen, onClose }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            const user = auth.currentUser;
            
            await addReview({
                orderId,
                designId: designId || 'custom_design',
                userId: user?.uid || 'guest',
                userName: user?.displayName || user?.email?.split('@')[0] || 'Guest Customer',
                rating,
                comment,
                images: [] // Future scope: upload image to Firebase Storage and put URL here
            });
            
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setComment('');
                setRating(5);
            }, 3000);
            
        } catch (err: any) {
            console.error('Error submitting review:', err);
            setError(err.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>
                
                {success ? (
                    <div className={styles.successState}>
                        <div className={styles.checkIcon}>✓</div>
                        <h2 className={styles.title}>Thank You!</h2>
                        <p className={styles.subtitle}>Your style story has been shared.</p>
                    </div>
                ) : (
                    <>
                        <h2 className={styles.title}>Share Your Style Story</h2>
                        <p className={styles.subtitle}>How does your bespoke piece fit?</p>
                        
                        {error && <div className={styles.error}>{error}</div>}
                        
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.stars}>
                                {[...Array(5)].map((star, index) => {
                                    const ratingValue = index + 1;
                                    return (
                                        <label key={index}>
                                            <input 
                                                type="radio" 
                                                name="rating" 
                                                value={ratingValue} 
                                                onClick={() => setRating(ratingValue)}
                                                style={{ display: 'none' }}
                                            />
                                            <Star 
                                                size={36} 
                                                className={styles.starIcon}
                                                color={ratingValue <= (hover || rating) ? "var(--primary)" : "var(--border)"}
                                                fill={ratingValue <= (hover || rating) ? "var(--primary)" : "none"}
                                                onMouseEnter={() => setHover(ratingValue)}
                                                onMouseLeave={() => setHover(0)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Your Thoughts</label>
                                <textarea 
                                    rows={4}
                                    placeholder="Tell us about the fit, the fabric, and your experience..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required
                                    className={styles.textarea}
                                />
                            </div>
                            
                            <div className={styles.uploadSection}>
                                <div className={styles.uploadBtnPlaceholder}>
                                    <Upload size={18} />
                                    <span>Upload Photo (Optional)</span>
                                </div>
                            </div>

                            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
