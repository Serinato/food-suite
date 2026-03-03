const admin = require('firebase-admin');

// Note: This requires credentials or being logged in via CLI
// Since I don't have the service account JSON here easily, I'll try to use the project ID
console.log("Checking Firestore connectivity for project: food-suite-bf970");

// I'll try to use the Firebase JS SDK instead of Admin if possible, but Admin is easier for one-off scripts if I have credentials.
// Actually, I'll just use a simple fetch to see if the firebase endpoints are reachable.
const fetch = require('node-fetch');

async function check() {
    try {
        const res = await fetch('https://firestore.googleapis.com/v1/projects/food-suite-bf970/databases/(default)/documents/settings/profile');
        const data = await res.json();
        console.log("Firestore Reachability Test:", res.status);
        console.log("Document Content:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Connectivity Error:", e.message);
    }
}

check();
