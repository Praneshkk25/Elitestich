import * as dotenv from 'dotenv';
dotenv.config();
import { adminAuth, adminDb } from './lib/firebaseAdmin';

const seedAdmin = async () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
        process.exit(1);
    }

    try {
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(email);
            console.log('User already exists in Auth. Updating password...');
            userRecord = await adminAuth.updateUser(userRecord.uid, { password });
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log('User not found in Auth. Creating new user...');
                userRecord = await adminAuth.createUser({
                    email,
                    password,
                    displayName: 'Admin User',
                });
            } else {
                throw error;
            }
        }

        console.log(`Successfully ensured auth user: ${userRecord.uid}`);

        // Update Firestore
        await adminDb.collection('users').doc(userRecord.uid).set({
            email,
            role: 'admin',
            createdAt: new Date(),
        }, { merge: true });

        console.log(`Successfully set admin role in Firestore for: ${userRecord.uid}`);
        process.exit(0);
    } catch (e) {
        console.error('Error seeding admin user:', e);
        process.exit(1);
    }
};

seedAdmin();
