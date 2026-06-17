import { adminDb, adminAuth } from '../lib/firebaseAdmin';

const listTailors = async () => {
    try {
        console.log('Fetching tailors from Firestore...');
        const snapshot = await adminDb.collection('tailors').get();
        if (snapshot.empty) {
            console.log('No tailors found in Firestore.');
            process.exit(0);
        }

        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`\nFirestore Tailor ID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Email: ${data.email}`);
            console.log(`AuthUid: ${data.authUid}`);
            
            if (data.authUid) {
                try {
                    const authUser = await adminAuth.getUser(data.authUid);
                    console.log(`Auth User Exists: Yes (Email: ${authUser.email})`);
                } catch (authErr: any) {
                    console.log(`Auth User Exists: No (Error: ${authErr.message})`);
                }
            } else {
                console.log('AuthUid: Missing!');
            }
        }
        process.exit(0);
    } catch (e) {
        console.error('Error listing tailors:', e);
        process.exit(1);
    }
};

listTailors();
