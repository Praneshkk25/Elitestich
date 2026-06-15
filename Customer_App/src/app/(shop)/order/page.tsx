import OrderForm from '@/components/order/OrderForm';
import styles from './order.module.css';

export default function OrderPage() {
    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>Start Your Custom Order</h1>
                    <p className={styles.subtitle}>
                        Follow the simple steps below to bring your dream outfit to life.
                        Choose a design, provide your measurements, and we'll handle the rest.
                    </p>
                </header>

                <OrderForm />
            </div>
        </div>
    );
}
