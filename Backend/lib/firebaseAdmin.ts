import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// If already initialized, don't initialize again
if (!admin.apps.length) {
    try {
        // Try reading the service account JSON file (works both locally and on Render
        // since the file is committed to the repo)
        const serviceAccountPath = path.resolve(__dirname, '../config/firebaseServiceAccount.json');

        if (fs.existsSync(serviceAccountPath)) {
            const raw = fs.readFileSync(serviceAccountPath, 'utf8');
            const serviceAccount = JSON.parse(raw);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            // Fallback: base64-encoded JSON in env var
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(decoded);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } else {
            throw new Error('No Firebase credentials found. Provide the JSON file or FIREBASE_SERVICE_ACCOUNT_BASE64 env var.');
        }

        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });
export const adminAuth = admin.auth();
