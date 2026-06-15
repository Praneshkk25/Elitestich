import { adminAuth } from './lib/firebaseAdmin';

const resetAdminPassword = async () => {
    try {
        const email = 'elitestitchworld@gmail.com';
        const newPassword = 'Elitestitch@2026';
        
        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.updateUser(user.uid, { password: newPassword });
        
        console.log(`Successfully reset password for ${email} to ${newPassword}`);
        process.exit(0);
    } catch (e) {
        console.error('Error resetting password:', e);
        process.exit(1);
    }
};

resetAdminPassword();
