import { adminDb } from './lib/firebaseAdmin';

const checkAdmin = async () => {
    try {
        const doc = await adminDb.collection('users').doc('JhxfIYbR8DNjTwlEA2vA4mYkvQ63').get();
        if (doc.exists) {
            console.log('Document data:', doc.data());
        } else {
            console.log('No such document!');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkAdmin();
