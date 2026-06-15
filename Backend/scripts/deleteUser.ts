import { adminAuth } from '../lib/firebaseAdmin';

async function run() {
    try {
        const email = process.argv[2];
        if (!email) {
            console.error('Please provide an email');
            return;
        }
        
        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.deleteUser(user.uid);
        console.log(`Successfully deleted user with email: ${email}`);
    } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
            console.log('User not found in Auth system.');
        } else {
            console.error(e);
        }
    }
}

run();
