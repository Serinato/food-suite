/**
 * User Profile Service
 * Firestore CRUD for user profiles at users/{uid}
 */
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const MAX_ADDRESSES = 4;

/**
 * Get user profile from Firestore
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
}

/**
 * Create a new user profile
 * @param {string} uid
 * @param {{ name: string, phone: string, email?: string }} data
 */
export async function createProfile(uid, { name, phone, email }) {
    await setDoc(doc(db, 'users', uid), {
        name: name || '',
        phone: phone || '',
        email: email || '',
        addresses: [],
        defaultAddressIndex: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Update profile fields
 * @param {string} uid
 * @param {{ name?: string, phone?: string, email?: string }} partial
 */
export async function updateProfile(uid, partial) {
    await setDoc(doc(db, 'users', uid), {
        ...partial,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Add a new address (max 4)
 * @param {string} uid
 * @param {object} address
 * @returns {Promise<boolean>} success
 */
export async function addAddress(uid, address) {
    let profile = await getProfile(uid);

    // If no profile exists, we'll create a skeleton one
    if (!profile) {
        profile = {
            addresses: [],
            defaultAddressIndex: 0
        };
    }

    const currentAddresses = profile.addresses || [];
    if (currentAddresses.length >= MAX_ADDRESSES) return false;

    const addresses = [...currentAddresses, address];
    const isFirst = currentAddresses.length === 0;

    await setDoc(doc(db, 'users', uid), {
        addresses,
        defaultAddressIndex: isFirst ? 0 : profile.defaultAddressIndex,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
}

/**
 * Update an address at a given index
 * @param {string} uid
 * @param {number} index
 * @param {object} address
 */
export async function updateAddress(uid, index, address) {
    const profile = await getProfile(uid);
    if (!profile) return;
    const currentAddresses = profile.addresses || [];
    if (index < 0 || index >= currentAddresses.length) return;

    const addresses = [...currentAddresses];
    addresses[index] = address;

    await setDoc(doc(db, 'users', uid), {
        addresses,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Delete an address at a given index
 * @param {string} uid
 * @param {number} index
 */
export async function deleteAddress(uid, index) {
    const profile = await getProfile(uid);
    if (!profile) return;
    const currentAddresses = profile.addresses || [];
    if (index < 0 || index >= currentAddresses.length) return;

    const addresses = [...currentAddresses];
    addresses.splice(index, 1);

    let defaultIdx = profile.defaultAddressIndex;
    if (index === defaultIdx) {
        defaultIdx = 0;
    } else if (index < defaultIdx) {
        defaultIdx = defaultIdx - 1;
    }
    if (addresses.length === 0) defaultIdx = 0;

    await setDoc(doc(db, 'users', uid), {
        addresses,
        defaultAddressIndex: defaultIdx,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Set the default address index
 * @param {string} uid
 * @param {number} index
 */
export async function setDefaultAddress(uid, index) {
    await setDoc(doc(db, 'users', uid), {
        defaultAddressIndex: index,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Validate Indian phone number (+91 followed by 10 digits)
 * Accepts: +91XXXXXXXXXX, +91 XXXXX XXXXX, 91XXXXXXXXXX, XXXXXXXXXX
 * @param {string} phone
 * @returns {string|null} normalized phone or null if invalid
 */
export function validatePhone(phone) {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Match +91 or 91 prefix followed by 10 digits, or just 10 digits
    const match = cleaned.match(/^(?:\+?91)?(\d{10})$/);
    if (!match) return null;
    return '+91 ' + match[1].substring(0, 5) + ' ' + match[1].substring(5);
}
