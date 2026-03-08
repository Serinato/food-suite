import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAfL72mMYZRCmcdJPUvZmCyjAFLVE7a-4U",
    authDomain: "food-suite-bf970.firebaseapp.com",
    projectId: "food-suite-bf970",
    storageBucket: "food-suite-bf970.firebasestorage.app",
    messagingSenderId: "248938861326",
    appId: "1:248938861326:web:b21e11dc9d2c3942bbfd5f"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

async function testUpload() {
    console.log("Starting upload test...");
    try {
        await signInAnonymously(auth);
        console.log("Logged in anonymously.");
    } catch (e) {
        console.log("Login failed or anonymous login disabled, trying without auth", e.message);
    }

    const storageRef = ref(storage, "test_file.txt");
    try {
        console.log("Attempting to upload string...");
        const result = await uploadString(storageRef, "Hello world!");
        console.log("Upload succeeded! Reference:", result.ref.fullPath);

        try {
            const url = await getDownloadURL(storageRef);
            console.log("Download URL:", url);
        } catch (e) {
            console.error("Failed to get download URL:", e);
        }
    } catch (e) {
        console.error("Upload error name:", e.name);
        console.error("Upload error code:", e.code);
        console.error("Upload error message:", e.message);
        console.error("Upload error customData:", e.customData);
        console.error("Upload error details:", e);
    }
    process.exit(0);
}
testUpload();
