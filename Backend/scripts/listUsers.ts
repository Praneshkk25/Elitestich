import { adminDb } from '../lib/firebaseAdmin';

const listUsers = async () => {
    try {
        console.log('Fetching users from Firestore...');
        const snapshot = await adminDb.collection('users').get();
        if (snapshot.empty) {
            console.log('No users found in Firestore.');
            process.exit(0);
        }

        for (const doc of snapshot.docs) {
            console.log(`\nUser ID: ${doc.id}`);
            console.log(doc.data());
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

listUsers();
