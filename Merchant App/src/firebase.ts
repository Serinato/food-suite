import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAfL72mMYZRCmcdJPUvZmCyjAFLVE7a-4U",
    authDomain: "food-suite-bf970.firebaseapp.com",
    projectId: "food-suite-bf970",
    storageBucket: "food-suite-bf970.firebasestorage.app",
    messagingSenderId: "248938861326",
    appId: "1:248938861326:web:b21e11dc9d2c3942bbfd5f",
    measurementId: "G-FB4L60MS2Z"
};
console.log("Firebase Config (Hardcoded):", { ...firebaseConfig, apiKey: "REDACTED" });

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
