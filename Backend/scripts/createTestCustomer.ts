import { adminAuth, adminDb } from '../lib/firebaseAdmin';

const setupTestCustomer = async () => {
    const email = 'test@test.com';
    const password = 'customer@123';
    const name = 'Test User';
    const phone = '9876543210';
    const address = '123 Test Street';
    const preferredUid = 'VXBed0xIsBPpS3iJqg8puz3IO9F3';

    try {
        let authUser;
        try {
            authUser = await adminAuth.getUserByEmail(email);
            console.log(`User ${email} already exists in Auth. UID: ${authUser.uid}`);
            
            // Update password
            await adminAuth.updateUser(authUser.uid, { password });
            console.log('Password updated successfully.');
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                let uidTaken = false;
                try {
                    await adminAuth.getUser(preferredUid);
                    uidTaken = true;
                } catch (e) {}

                authUser = await adminAuth.createUser({
                    uid: uidTaken ? undefined : preferredUid,
                    email,
                    password,
                    displayName: name
                });
                console.log(`Created new customer user in Auth. UID: ${authUser.uid}`);
            } else {
                throw error;
            }
        }

        const uid = authUser.uid;

        // 1. Create/Update user document in Firestore 'users' collection
        await adminDb.collection('users').doc(uid).set({
            uid,
            fullName: name,
            email,
            phone,
            address,
            role: 'customer',
            createdAt: new Date()
        }, { merge: true });
        console.log(`Updated Firestore users collection for UID: ${uid}`);

        console.log(`Test customer setup complete. Use credentials:\nEmail: ${email}\nPassword: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error setting up test customer:', error);
        process.exit(1);
    }
};

setupTestCustomer();
