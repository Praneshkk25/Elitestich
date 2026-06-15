import { db } from './firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';
import { UserProfile, Order, Review } from '@/types/database';

// ---------------------------------------------------------
// User Helpers
// ---------------------------------------------------------

export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        ...data,
        createdAt: serverTimestamp(),
    }, { merge: true });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userSnap = await getDoc(doc(db, 'users', uid));
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
};

export const updateUserMeasurements = async (uid: string, dressType: string, measurements: any) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        measurementsProfiles: {
            [dressType]: measurements
        }
    }, { merge: true });
};

// ---------------------------------------------------------
// Order Helpers
// ---------------------------------------------------------

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const ordersRef = collection(db, 'orders');
    const newOrderRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
    });
    return newOrderRef.id;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
    const orderSnap = await getDoc(doc(db, 'orders', orderId));
    return orderSnap.exists() ? ({ id: orderSnap.id, ...orderSnap.data() } as Order) : null;
};

export const updateOrderStatus = async (orderId: string, status: string, note?: string) => {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
        status,
        trackingHistory: arrayUnion({
            status,
            timestamp: new Date(), // Local timestamp before sync, or use serverTimestamp depending on exact needs
            note: note || ''
        })
    });
};

// ---------------------------------------------------------
// Review Helpers
// ---------------------------------------------------------

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const reviewsRef = collection(db, 'reviews');
    await addDoc(reviewsRef, {
        ...reviewData,
        createdAt: serverTimestamp(),
    });
};

export const getReviewsForDesign = async (designId: string): Promise<Review[]> => {
    const q = query(collection(db, 'reviews'), where('designId', '==', designId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};
