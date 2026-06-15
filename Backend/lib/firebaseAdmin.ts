import * as admin from 'firebase-admin';
import * as path from 'path';

// If already initialized, don't initialize again
if (!admin.apps.length) {
    try {
        const serviceAccountPath = path.resolve(__dirname, '../config/firebaseServiceAccount.json');
        
        admin.initializeApp({
            credential: admin.credential.cert(require(serviceAccountPath))
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });
export const adminAuth = admin.auth();
