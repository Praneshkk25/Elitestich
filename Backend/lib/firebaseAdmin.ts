import * as admin from 'firebase-admin';
import * as path from 'path';

// If already initialized, don't initialize again
if (!admin.apps.length) {
    try {
        let credential: admin.credential.Credential;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            // Production (Render): decode base64-encoded service account JSON
            // This avoids all newline/escaping issues with the private key
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(decoded);
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
