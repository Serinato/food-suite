import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAfL72mMYZRCmcdJPUvZmCyjAFLVE7a-4U",
    authDomain: "food-suite-bf970.firebaseapp.com",
    projectId: "food-suite-bf970",
    storageBucket: "food-suite-bf970.appspot.com",
    messagingSenderId: "248938861326",
    appId: "1:248938861326:web:b21e11dc9d2c3942bbfd5f"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function testUpload() {
    console.log("Starting upload...");
    const storageRef = ref(storage, "test_upload.txt");
    try {
        await uploadString(storageRef, "Hello world!");
        console.log("Upload successful with firebasestorage.app");
    } catch (e) {
        console.error("Error with firebasestorage.app:", e.message);
    }
}
testUpload();
