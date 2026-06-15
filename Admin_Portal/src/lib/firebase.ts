import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB7zk-63B8eH9IuP3GnZZJl99L6BsxTk4M",
  authDomain: "elitestitchworld-191ad.firebaseapp.com",
  databaseURL: "https://elitestitchworld-191ad-default-rtdb.firebaseio.com",
  projectId: "elitestitchworld-191ad",
  storageBucket: "elitestitchworld-191ad.firebasestorage.app",
  messagingSenderId: "244230859401",
  appId: "1:244230859401:web:3b57760e8307b7928c3458",
  measurementId: "G-FS055VTF3K"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only if supported (prevents Next.js server-side errors)
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Export the services so we can use them across the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);