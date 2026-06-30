import { adminAuth, adminDb } from '../lib/firebaseAdmin';

const setupTestTailor = async () => {
    const email = 'reva@gmail.com';
    const password = 'reva@34';
    const name = 'Revathi';
    const phone = '9876543210';

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
                authUser = await adminAuth.createUser({
                    email,
                    password,
                    displayName: name
                });
                console.log(`Created new tailor user in Auth. UID: ${authUser.uid}`);
            } else {
                throw error;
            }
        }

        const uid = authUser.uid;

        // 1. Create/Update user document in Firestore 'users' collection
        await adminDb.collection('users').doc(uid).set({
            uid,
            email,
            role: 'tailor',
            firstLogin: false,
            createdAt: new Date()
        }, { merge: true });
        console.log(`Updated Firestore users collection for UID: ${uid}`);

        // 2. Create/Update tailor profile in Firestore 'tailors' collection
        const tailorsRef = adminDb.collection('tailors');
        const querySnapshot = await tailorsRef.where('authUid', '==', uid).get();

        if (querySnapshot.empty) {
            // Also check by email to be safe
            const emailQuery = await tailorsRef.where('email', '==', email).get();
            if (emailQuery.empty) {
                await tailorsRef.add({
                    name,
                    email,
                    phoneNumber: phone,
                    skills: ['Stitching', 'Cutting'],
                    status: 'active',
                    authUid: uid,
                    createdAt: new Date()
                });
                console.log('Created new tailor profile in tailors collection.');
            } else {
                const docId = emailQuery.docs[0].id;
                await tailorsRef.doc(docId).set({
                    name,
                    email,
                    phoneNumber: phone,
                    skills: ['Stitching', 'Cutting'],
                    status: 'active',
                    authUid: uid
                }, { merge: true });
                console.log(`Updated existing tailor profile (ID: ${docId}) in tailors collection matching email.`);
            }
        } else {
            const docId = querySnapshot.docs[0].id;
            await tailorsRef.doc(docId).set({
                name,
                email,
                phoneNumber: phone,
                skills: ['Stitching', 'Cutting'],
                status: 'active',
                authUid: uid
            }, { merge: true });
            console.log(`Updated existing tailor profile (ID: ${docId}) in tailors collection matching UID.`);
        }

        console.log(`Test tailor setup complete. Use credentials:\nEmail: ${email}\nPassword: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error setting up test tailor:', error);
        process.exit(1);
    }
};

setupTestTailor();
