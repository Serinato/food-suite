import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAfL72mMYZRCmcdJPUvZmCyjAFLVE7a-4U",
    authDomain: "food-suite-bf970.firebaseapp.com",
    projectId: "food-suite-bf970",
    storageBucket: "food-suite-bf970.firebasestorage.app",
    messagingSenderId: "248938861326",
    appId: "1:248938861326:web:218e10335952bea3bbfd5f",
    measurementId: "G-4GVRC841P3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
