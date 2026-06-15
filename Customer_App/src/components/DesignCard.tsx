import Link from 'next/link';
import styles from './DesignCard.module.css';

interface DesignCardProps {
    id: string;
    title: string;
    category: string;
    image: string;
    price: string;
}

export default function DesignCard({ id, title, category, image, price }: DesignCardProps) {
    // URL encode the category for the link
    const categoryParam = encodeURIComponent(category);

    return (
        <div className={styles.card}>
            <Link href={`/customize/${categoryParam}`} className={styles.imageLink}>
                <div className={styles.imageContainer}>
                    <img src={image} alt={title} className={styles.image} />
                </div>
            </Link>
            <div className={styles.info}>
                <span className={styles.category}>{category}</span>
                <Link href={`/customize/${categoryParam}`} className={styles.titleLink}>
                    <h3 className={styles.title}>{title}</h3>
                </Link>
                <p className={styles.price}>{price}</p>
                <div className={styles.actionButtons}>
                    <Link href={`/customize/${categoryParam}`} className={styles.actionBtn}>
                        Designs
                    </Link>
                    <Link href={`/order?design=${id}`} className={styles.actionBtnPrimary}>
                        Customize
                    </Link>
                </div>
            </div>
        </div>
    );
}
