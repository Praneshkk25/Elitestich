import { adminAuth } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

const updateRules = async () => {
    try {
        const client = adminAuth;
        console.log(`Initializing rules update on project: ${client.app.options.projectId || 'unknown'}`);

        const rulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if the user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users profile collection
    match /users/{userId} {
      // Users can read/write their own profiles
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Orders collection (needed for client-side queries and status updates)
    match /orders/{orderId} {
      allow read, write: if isAuthenticated();
      
      // Messages subcollection for order chat
      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    // Tailors collection
    match /tailors/{tailorId} {
      allow read, write: if isAuthenticated();
    }
    
    // Delivery personnel collection
    match /delivery_personnel/{driverId} {
      allow read, write: if isAuthenticated();
    }
    
    // Reviews collection (e.g. customer feedback)
    match /reviews/{reviewId} {
      allow read: if true; // Anyone can read reviews
      allow write: if isAuthenticated(); // Must be logged in to write a review
    }
  }
}`;

        console.log('Creating rules file...');
        const rules = admin.securityRules();
        const rulesFile = rules.createRulesFileFromSource('firestore.rules', rulesContent);
        
        console.log('Creating ruleset...');
        const ruleset = await rules.createRuleset(rulesFile);
        
        console.log(`Releasing ruleset: ${ruleset.name}`);
        await rules.releaseFirestoreRuleset(ruleset);
        
        console.log('Firestore security rules updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating security rules:', error);
        process.exit(1);
    }
};

updateRules();
