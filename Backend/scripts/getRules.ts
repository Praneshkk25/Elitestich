import { adminAuth } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

const getRules = async () => {
    try {
        // Explicitly touch/use adminAuth to prevent TS tree-shaking
        const client = adminAuth;
        console.log(`Using Firebase project: ${client.app.options.projectId || 'unknown'}`);
        
        const rules = admin.securityRules();
        const firestoreRuleset = await rules.getFirestoreRuleset();
        console.log("Firestore Rules source files:");
        firestoreRuleset.source.forEach(file => {
            console.log(`--- File: ${file.name} ---`);
            console.log(file.content);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error fetching security rules:', error);
        process.exit(1);
    }
};

getRules();
