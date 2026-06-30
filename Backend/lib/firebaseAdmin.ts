import * as admin from 'firebase-admin';
import * as path from 'path';

// If already initialized, don't initialize again
if (!admin.apps.length) {
    try {
        let credential: admin.credential.Credential;

        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            // Production (Render): use individual env vars to avoid JSON parsing issues
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace literal \n strings with real newlines (common env var issue)
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Fallback: JSON string env var
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            credential = admin.credential.cert(serviceAccount);
        } else {
            // Local development: read from JSON file
            const serviceAccountPath = path.resolve(__dirname, '../config/firebaseServiceAccount.json');
            credential = admin.credential.cert(require(serviceAccountPath));
        }

        admin.initializeApp({ credential });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });
export const adminAuth = admin.auth();
