import { adminAuth } from '../lib/firebaseAdmin';

const resetPassword = async () => {
    try {
        const email = 'geetha34@gmail.com';
        const password = 'Geetha@2026';
        
        console.log(`Searching for auth user by email: ${email}`);
        const user = await adminAuth.getUserByEmail(email);
        
        console.log(`Found user! UID: ${user.uid}. Resetting password to: ${password}`);
        await adminAuth.updateUser(user.uid, { password });
        
        console.log('Password reset successfully!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

resetPassword();
