import { adminAuth, adminDb } from './lib/firebaseAdmin';
import * as dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
        process.exit(1);
    }

    try {
        let user;
        try {
            user = await adminAuth.getUserByEmail(email);
            console.log(`User ${email} already exists in Auth. UID: ${user.uid}`);
            
            // Update password just in case
            await adminAuth.updateUser(user.uid, { password });
            console.log('Password updated.');
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                user = await adminAuth.createUser({
                    email,
                    password,
                    displayName: 'System Admin'
                });
                console.log(`Created new admin user in Auth. UID: ${user.uid}`);
            } else {
                throw error;
            }
        }

        // Add to users collection in Firestore
        await adminDb.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: 'System Admin',
            role: 'admin',
            createdAt: new Date()
        }, { merge: true });

        console.log(`Successfully granted admin privileges to ${email} in Firestore.`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();
