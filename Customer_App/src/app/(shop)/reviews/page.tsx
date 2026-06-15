'use client';

import { useState } from 'react';
import ReviewCard from '@/components/ReviewCard';
import { Star, Send } from 'lucide-react';
import styles from './reviews.module.css';

const initialReviews = [
    {
        id: 1,
        name: "Sarah Johnson",
        rating: 5,
        date: "Oct 15, 2023",
        comment: "Absolutely in love with my custom evening gown! The fit is perfect and the fabric quality is outstanding. Highly recommend!",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 2,
        name: "Michael Chen",
        rating: 5,
        date: "Nov 02, 2023",
        comment: "Great service and attention to detail. The suit fits like a glove. Will definitely order again.",
    },
    {
        id: 3,
        name: "Emily Davis",
        rating: 4,
        date: "Nov 20, 2023",
        comment: "Beautiful dress, exactly as I imagined. Delivery was slightly delayed but worth the wait.",
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    }
];

export default function ReviewsPage() {
    const [reviews, setReviews] = useState(initialReviews);
    const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 5 });
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const review = {
            id: reviews.length + 1,
            ...newReview,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
        setReviews([review, ...reviews]);
        setNewReview({ name: '', comment: '', rating: 5 });
    };

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>Customer Reviews</h1>
                    <p className={styles.subtitle}>
                        See what our clients say about their bespoke experiences.
                        We take pride in every stitch.
                    </p>
                </header>

                <div className={styles.content}>
                    <div className={styles.formContainer}>
                        <h3 className={styles.formTitle}>Write a Review</h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Rating</label>
                                <div className={styles.starRating}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={styles.starBtn}
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            <Star
                                                size={24}
                                                fill={(hoverRating || newReview.rating) >= star ? "var(--primary)" : "none"}
                                                color={(hoverRating || newReview.rating) >= star ? "var(--primary)" : "var(--text-muted)"}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={newReview.name}
                                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                                    className={styles.input}
                                    placeholder="Your Name"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="comment">Review</label>
                                <textarea
                                    id="comment"
                                    required
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    className={styles.textarea}
                                    placeholder="Share your experience..."
                                    rows={4}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Submit Review <Send size={16} style={{ marginLeft: '0.5rem' }} />
                            </button>
                        </form>
                    </div>

                    <div className={styles.reviewsGrid}>
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} {...review} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
