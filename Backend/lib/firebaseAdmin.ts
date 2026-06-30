import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// If already initialized, don't initialize again
if (!admin.apps.length) {
    try {
        // Use process.cwd() instead of __dirname so the path works in both
        // ts-node (local) and compiled dist/ (Render production)
        // process.cwd() = Backend/ directory in both cases
        const serviceAccountPath = path.resolve(process.cwd(), 'config/firebaseServiceAccount.json');

        console.log('Looking for Firebase credentials at:', serviceAccountPath);

        if (fs.existsSync(serviceAccountPath)) {
            const raw = fs.readFileSync(serviceAccountPath, 'utf8');
            const serviceAccount = JSON.parse(raw);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log('Firebase Admin initialized successfully (from JSON file).');
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(decoded);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log('Firebase Admin initialized successfully (from env var).');
        } else {
            throw new Error(`Firebase credentials not found at ${serviceAccountPath} and FIREBASE_SERVICE_ACCOUNT_BASE64 env var is not set.`);
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });
export const adminAuth = admin.auth();
