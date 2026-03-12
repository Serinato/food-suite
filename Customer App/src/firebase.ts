import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAfL72mMYZRCmcdJPUvZmCyjAFLVE7a-4U",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "food-suite-bf970.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "food-suite-bf970",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "food-suite-bf970.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "248938861326",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:248938861326:web:218e10335952bea3bbfd5f",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4GVRC841P3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
