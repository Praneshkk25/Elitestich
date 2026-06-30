import { Router } from 'express';
import { adminAuth, adminDb } from '../lib/firebaseAdmin';
import { sendWelcomeCredentials } from '../lib/email';

const router = Router();

// POST /api/users/register
router.post('/register', async (req: any, res: any) => {
    const { name, email, phone, role, skills } = req.body;

    if (!name || !email || !phone || !role) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (role !== 'tailor' && role !== 'delivery') {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        // Generate a 6-digit OTP to use as temporary password
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 1. Create Auth User using OTP as the initial password
        const authUser = await adminAuth.createUser({
            email,
            password: otp,
            displayName: name
        });

        const uid = authUser.uid;

        // 2. Add profile based on role
        if (role === 'tailor') {
            await adminDb.collection('tailors').add({
                name,
                email,
                phoneNumber: phone,
                skills: skills || [],
                status: 'active',
                authUid: uid,
                createdAt: new Date()
            });
        } else if (role === 'delivery') {
            const personnel_number = `DP-${Math.floor(1000 + Math.random() * 9000)}`;
            await adminDb.collection('delivery_personnel').add({
                name,
                phone,
                personnel_number,
                status: 'active',
                authUid: uid,
                createdAt: new Date()
            });
        }

        // 3. Add to general users collection for role checks & mark firstLogin as true
        await adminDb.collection('users').doc(uid).set({
            uid,
            email,
            role: role === 'tailor' ? 'tailor' : 'driver', // In users it maps delivery to driver
            firstLogin: true,
            createdAt: new Date()
        });

        // 4. Send Onboarding email with OTP
        try {
            await sendWelcomeCredentials(name, email, role, otp);
            console.log(`Welcome email with OTP successfully sent to ${email}. OTP: ${otp}`);
        } catch (emailErr) {
            console.error(`Error sending welcome email to ${email}:`, emailErr);
            console.log(`[TESTING ONLY] Generated OTP for ${email} is: ${otp}`);
        }

        res.status(201).json({
            success: true,
            message: `${role === 'tailor' ? 'Tailor' : 'Driver'} registered successfully.`,
            uid
        });
    } catch (error: any) {
        console.error('Error in user registration:', error);
        res.status(500).json({ success: false, message: error.message || 'Registration failed' });
    }
});

// DELETE /api/users/:uid
router.delete('/:uid', async (req: any, res: any) => {
    const { uid } = req.params;

    if (!uid) {
        return res.status(400).json({ success: false, message: 'Missing user UID' });
    }

    try {
        // 1. Delete from Firebase Auth
        try {
            await adminAuth.deleteUser(uid);
            console.log(`Deleted user ${uid} from Firebase Auth`);
        } catch (authErr: any) {
            console.warn(`User ${uid} not found in Firebase Auth or failed to delete:`, authErr.message);
        }

        // 2. Delete from general users collection in Firestore
        await adminDb.collection('users').doc(uid).delete();

        // 3. Delete from tailors collection
        const tailorsRef = adminDb.collection('tailors');
        const tailorQuery = await tailorsRef.where('authUid', '==', uid).get();
        const tailorDeletePromises = tailorQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(tailorDeletePromises);

        // 4. Delete from delivery_personnel collection
        const driversRef = adminDb.collection('delivery_personnel');
        const driverQuery = await driversRef.where('authUid', '==', uid).get();
        const driverDeletePromises = driverQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(driverDeletePromises);

        res.status(200).json({
            success: true,
            message: 'User and profiles deleted successfully.'
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: error.message || 'Deletion failed' });
    }
});

// GET /api/users/resolve-driver
router.get('/resolve-driver', async (req: any, res: any) => {
    const { personnel_number } = req.query;
    if (!personnel_number) {
        return res.status(400).json({ success: false, message: 'Missing personnel_number' });
    }

    try {
        const driversRef = adminDb.collection('delivery_personnel');
        const querySnapshot = await driversRef.where('personnel_number', '==', personnel_number.toUpperCase().trim()).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ success: false, message: 'Driver not found with this personnel number' });
        }

        const driverData = querySnapshot.docs[0].data();
        const authUid = driverData.authUid;

        if (!authUid) {
            return res.status(404).json({ success: false, message: 'Driver auth profile not configured' });
        }

        const userDoc = await adminDb.collection('users').doc(authUid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'Driver account credentials not found' });
        }

        res.status(200).json({
            success: true,
            email: userDoc.data()?.email
        });
    } catch (error: any) {
        console.error('Error resolving driver:', error);
        res.status(500).json({ success: false, message: error.message || 'Resolution failed' });
    }
});

// GET /api/users/tailors
router.get('/tailors', async (req: any, res: any) => {
    try {
        const snapshot = await adminDb.collection('tailors').where('status', '==', 'active').get();
        const tailors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, tailors });
    } catch (error: any) {
        console.error('Error fetching tailors:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/users/drivers
router.get('/drivers', async (req: any, res: any) => {
    try {
        const snapshot = await adminDb.collection('delivery_personnel').where('status', '==', 'active').get();
        const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, drivers });
    } catch (error: any) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/users/drivers/:id
router.get('/drivers/:id', async (req: any, res: any) => {
    const { id } = req.params;
    try {
        let snapshot = await adminDb.collection('delivery_personnel').where('authUid', '==', id).get();
        if (snapshot.empty) {
            const doc = await adminDb.collection('delivery_personnel').doc(id).get();
            if (doc.exists) {
                return res.status(200).json({ success: true, driver: { id: doc.id, ...doc.data() } });
            }
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        const doc = snapshot.docs[0];
        res.status(200).json({ success: true, driver: { id: doc.id, ...doc.data() } });
    } catch (error: any) {
        console.error('Error fetching driver:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
