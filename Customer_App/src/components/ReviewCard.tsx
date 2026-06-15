import { Star } from 'lucide-react';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
    name: string;
    rating: number;
    date: string;
    comment: string;
    image?: string;
}

export default function ReviewCard({ name, rating, date, comment, image }: ReviewCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {name.charAt(0)}
                    </div>
                    <div>
                        <h4 className={styles.name}>{name}</h4>
                        <span className={styles.date}>{date}</span>
                    </div>
                </div>
                <div className={styles.rating}>
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={16}
                            fill={i < rating ? "var(--primary)" : "none"}
                            color={i < rating ? "var(--primary)" : "var(--text-muted)"}
                        />
                    ))}
                </div>
            </div>
            <p className={styles.comment}>{comment}</p>
            {image && (
                <div className={styles.imageWrapper}>
                    <img src={image} alt="Customer photo" className={styles.image} />
                </div>
            )}
        </div>
    );
}
