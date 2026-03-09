import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from './firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { scanMenuFromImage } from './aiService';
import { Camera, Image as ImageIcon } from 'lucide-react';
import './App.css';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg?: boolean;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadingDishImage, setUploadingDishImage] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [dishImageSuccess, setDishImageSuccess] = useState(false);

  // New Scan States
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '',
    isVeg: '',
    description: '',
    imageUrl: ''
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [restaurantProfile, setRestaurantProfile] = useState({
    name: '',
    description: '',
    image: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    cuisine: '',
    isOpen: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setRestaurantId(currentUser.uid);
        fetchRestaurantProfile(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
      const unsubscribe = onSnapshot(menuRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        setMenuItems(items);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [restaurantId]);

  const fetchRestaurantProfile = async (id: string) => {
    try {
      const docRef = doc(db, 'restaurants', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRestaurantProfile({
          name: data.name || '',
          description: data.description || '',
          image: data.image || data.imageUrl || '',
          address: data.address || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          cuisine: data.cuisine || '',
          isOpen: data.isOpen !== undefined ? data.isOpen : true
        } as any);
        setRestaurantName(data.name || 'Your Restaurant');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSyncing(true);
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await setDoc(docRef, restaurantProfile, { merge: true });
      setRestaurantName(restaurantProfile.name);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile');
    } finally {
      setProfileSyncing(false);
    }
  };

  // Instant toggle: Restaurant Open/Closed
  const handleToggleOpen = async () => {
    const newIsOpen = !restaurantProfile.isOpen;
    setRestaurantProfile(prev => ({ ...prev, isOpen: newIsOpen }));
    try {
      await setDoc(doc(db, 'restaurants', restaurantId), { isOpen: newIsOpen }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle open status:', err);
      setRestaurantProfile(prev => ({ ...prev, isOpen: !newIsOpen })); // rollback
    }
  };

  // Instant toggle: Dish Available/Unavailable
  const handleToggleDishAvailable = async (itemId: string, currentAvail: boolean) => {
    const newAvail = !currentAvail;
    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: newAvail } : i));
    try {
      await setDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId), { isAvailable: newAvail }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle dish availability:', err);
      setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !newAvail } : i)); // rollback
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadSuccess(false);
    try {
      const storageRef = ref(storage, `restaurant/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setRestaurantProfile(prev => ({ ...prev, image: downloadURL }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading image: ", error);
      alert("Failed to upload image. Ensure Firebase Storage rules allow uploads.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDishImage(true);
    setDishImageSuccess(false);
    try {
      const storageRef = ref(storage, `dishes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setNewItem(prev => ({ ...prev, imageUrl: downloadURL }));
      setDishImageSuccess(true);
      setTimeout(() => setDishImageSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading dish image: ", error);
      alert("Failed to upload dish image. Ensure Firebase Storage rules allow uploads.");
    } finally {
      setUploadingDishImage(false);
      e.target.value = '';
    }
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || newItem.isVeg === '') return;

    setSyncing(true);
    try {
      const itemData = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        isVeg: newItem.isVeg === 'true',
        description: newItem.description,
        imageUrl: newItem.imageUrl,
        isAvailable: true,
        updatedAt: new Date().toISOString(),
        ...(editingItemId ? {} : { createdAt: new Date().toISOString() })
      };

      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');

      if (editingItemId) {
        await setDoc(doc(db, 'restaurants', restaurantId, 'menu', editingItemId), itemData, { merge: true });
        setEditingItemId(null);
      } else {
        await addDoc(menuRef, itemData);
      }

      setNewItem({ name: '', price: '', category: '', isVeg: '', description: '', imageUrl: '' });
      setDishImageSuccess(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Failed to sync with cloud. Check console.");
    } finally {
      setSyncing(false);
    }
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      price: item.price.toString(),
      category: item.category || '',
      isVeg: item.isVeg !== undefined ? item.isVeg.toString() : '',
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
    setDishImageSuccess(item.imageUrl ? true : false);
    // Scroll to form
    const formElement = document.querySelector('.menu-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setShowScanner(true);
    setScanError(null);
    setScanResults([]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const results = await scanMenuFromImage(base64);
        setScanResults(results);
      } catch (err: any) {
        console.error("Scanner error:", err);
        setScanError(err.message || "Failed to scan menu. Please try again.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmScan = async () => {
    setSyncing(true);
    try {
      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
      const promises = scanResults.map(item => addDoc(menuRef, {
        ...item,
        isAvailable: true,
        createdAt: new Date().toISOString()
      }));
      await Promise.all(promises);
      alert(`${scanResults.length} items added successfully!`);
      setShowScanner(false);
      setScanResults([]);
    } catch (err) {
      alert("Failed to save scans.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // ── Google Maps / Places ──
  const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  // Load the Google Maps script once
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return;
    if (document.getElementById('google-maps-script')) {
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => { };
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_KEY]);

  // Initialize autocomplete on an input element
  const attachAutocomplete = (inputEl: HTMLInputElement) => {
    if (autocompleteRef.current) return; // already initialized

    const ac = new google.maps.places.Autocomplete(inputEl, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry', 'name']
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const addr = place.name
        ? `${place.name}, ${place.formatted_address}`
        : place.formatted_address || '';

      setRestaurantProfile(prev => ({
        ...prev,
        address: addr,
        latitude: lat,
        longitude: lng
      }));
      setIsEditingLocation(false);
    });

    autocompleteRef.current = ac;
  };

  // Callback ref: fires when the input element mounts in the DOM
  const locationInputCallbackRef = (node: HTMLInputElement | null) => {
    autocompleteInputRef.current = node;
    if (!node) return;

    // If Google is already loaded, attach immediately
    if (window.google?.maps?.places) {
      attachAutocomplete(node);
      return;
    }

    // Otherwise poll until Google Maps is ready (script may still be loading)
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval);
        attachAutocomplete(node);
      }
    }, 200);

    // Clean up after 15 seconds if Google never loads
    setTimeout(() => clearInterval(interval), 15000);
  };

  // "Use My Location" — browser geolocation + Google reverse geocode
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setRestaurantProfile(prev => ({ ...prev, latitude, longitude }));

        // Google reverse geocode
        if (window.google?.maps) {
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            if (result.results?.[0]) {
              const fullAddress = result.results[0].formatted_address;
              setRestaurantProfile(prev => ({
                ...prev,
                address: fullAddress,
                latitude,
                longitude
              }));
              setIsEditingLocation(false);
              if (autocompleteInputRef.current) {
                autocompleteInputRef.current.value = fullAddress;
              }
            } else {
              throw new Error('No address results found for these coordinates.');
            }
          } catch (err) {
            console.error('Google reverse geocoding failed (Check if Geocoding API is enabled!):', err);
            // Even if geocoding fails, we have the coordinates.
            // Let's set a friendly placeholder instead of numbers.
            setRestaurantProfile(prev => ({
              ...prev,
              address: 'Detected Location (precise coordinates captured)',
              latitude,
              longitude
            }));
            setIsEditingLocation(false);
          }
        } else {
          // Fallback if Google isn't loaded
          setRestaurantProfile(prev => ({
            ...prev,
            address: 'Detected Location',
            latitude,
            longitude
          }));
          setIsEditingLocation(false);
        }
        setLocatingUser(false);
      },
      (error) => {
        setLocatingUser(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please allow location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('The request to get your location timed out.');
            break;
          default:
            alert('An unknown error occurred while getting location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Auto-heal technical addresses (heals data saved when API was limited)
  useEffect(() => {
    const isTechnicalAddress = (addr: string) => {
      if (!addr) return false;
      if (addr.includes('Detected Location')) return true;
      // Detects strings like "19.233, 72.988"
      return /^[\d\s.,-]+$/.test(addr) && addr.includes(',');
    };

    const healAddress = async () => {
      if (
        restaurantProfile.latitude &&
        restaurantProfile.longitude &&
        isTechnicalAddress(restaurantProfile.address) &&
        window.google?.maps?.Geocoder
      ) {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: restaurantProfile.latitude, lng: restaurantProfile.longitude }
          });
          if (result.results?.[0]) {
            setRestaurantProfile(prev => ({
              ...prev,
              address: result.results[0].formatted_address
            }));
          }
        } catch (err) {
          console.log("Silent healing failed (API might be loading or limited)");
        }
      }
    };

    // Delay slightly to ensure Maps is ready
    const timer = setTimeout(healAddress, 1000);
    return () => clearTimeout(timer);
  }, [restaurantProfile.latitude, restaurantProfile.longitude, restaurantProfile.address]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Merchant Login</h1>
          <form onSubmit={handleLogin} className="email-login">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="primary-btn">Login with Email</button>
          </form>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <button onClick={handleGoogleLogin} className="google-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-container fade-in">
      <header className="merchant-header">
        <div className="header-row">
          <div className="header-titles">
            <h1>{restaurantName ? `${restaurantName} - Portal` : 'Merchant Portal'}</h1>
            <p className="header-subtitle">Manage your restaurant identity and menu in real-time</p>
          </div>
          <div className="header-actions">
            <div className="header-toggle-group" onClick={handleToggleOpen}>
              <div className={`toggle-switch ${restaurantProfile.isOpen ? 'on' : 'off'}`}>
                <div className="toggle-knob"></div>
              </div>
              <span className={`toggle-label ${restaurantProfile.isOpen ? 'open' : 'closed'}`}>
                {restaurantProfile.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <span className="user-email">{user.email}</span>
            <button className="secondary-btn logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </header>

      <div className="merchant-layout">
        <aside className="merchant-sidebar">
          <section className="profile-section">
            <h2>Restaurant Profile</h2>
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="input-group">
                <label>Restaurant Name</label>
                <input
                  type="text"
                  value={restaurantProfile.name}
                  onChange={(e) => setRestaurantProfile({ ...restaurantProfile, name: e.target.value })}
                  placeholder="e.g. Amara Curry House"
                />
              </div>
              <div className="input-group">
                <label>Cuisine Type</label>
                <input
                  type="text"
                  value={restaurantProfile.cuisine}
                  onChange={(e) => setRestaurantProfile({ ...restaurantProfile, cuisine: e.target.value })}
                  placeholder="e.g. Indian, Chinese"
                />
              </div>
              <div className="input-group">
                <label>Header Image</label>
                <div className="image-options">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="header-image-upload"
                    className="file-input-hidden"
                  />
                  <label
                    htmlFor="header-image-upload"
                    className="upload-label"
                    style={{
                      borderColor: uploadSuccess ? '#1ea97c' : '',
                      color: uploadSuccess ? '#1ea97c' : '',
                      background: uploadSuccess ? '#e1f9eb' : ''
                    }}
                  >
                    <div className="upload-label-content">
                      <ImageIcon size={18} />
                      {uploadingImage ? 'Uploading...' : uploadSuccess ? 'Uploaded!' : 'Gallery'}
                    </div>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    id="header-image-camera"
                    className="file-input-hidden"
                  />
                  <label
                    htmlFor="header-image-camera"
                    className="upload-label camera-label"
                    style={{
                      borderColor: uploadSuccess ? '#1ea97c' : '',
                      color: uploadSuccess ? '#1ea97c' : '',
                      background: uploadSuccess ? '#e1f9eb' : ''
                    }}
                  >
                    <div className="upload-label-content">
                      <Camera size={18} />
                      {uploadingImage ? 'Uploading...' : uploadSuccess ? 'Done!' : 'Camera'}
                    </div>
                  </label>

                </div>

                {/* Live Customer Preview */}
                {restaurantProfile.image && (
                  <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 0, marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Customer App Preview
                    </p>
                    <div style={{ position: 'relative', height: '140px', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                      <img src={restaurantProfile.image} alt="Restaurant Header" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }}></div>

                      {/* Customer App layout mock */}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>←</div>
                      <div style={{ position: 'absolute', bottom: '15px', left: '15px', color: 'white', display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                        <div style={{ width: '50px', height: '50px', background: 'white', borderRadius: '12px', padding: '2px', overflow: 'hidden' }}>
                          <img src={restaurantProfile.image} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontFamily: 'system-ui' }}>{restaurantProfile.name || 'Your Kitchen'}</h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>{restaurantProfile.cuisine || 'Cuisine'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="input-group">
                <div className="location-container-v2">
                  {(!restaurantProfile.latitude || isEditingLocation) ? (
                    <div className="location-editing">
                      <div className="location-input-wrapper-v2">
                        <div className="input-with-pin">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4d4d"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                          <input
                            ref={locationInputCallbackRef}
                            type="text"
                            defaultValue={restaurantProfile.address}
                            onChange={(e) => setRestaurantProfile({ ...restaurantProfile, address: e.target.value })}
                            placeholder="Enter restaurant address..."
                            className="location-search-input"
                          />
                        </div>
                        <button
                          type="button"
                          className="detect-location-btn"
                          onClick={handleUseMyLocation}
                          disabled={locatingUser}
                        >
                          {locatingUser ? <span className="mini-spinner"></span> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>}
                          <span>Current Location</span>
                        </button>
                      </div>
                      <p className="tiny-hint">Start typing or use "Current Location" for better accuracy.</p>
                    </div>
                  ) : (
                    <div className="location-display-card">
                      <div className="card-map-mock">
                        <div className="pulse-pin"></div>
                      </div>
                      <div className="card-content">
                        <div className="card-info">
                          <div className="location-label">Verified Restaurant Location</div>
                          <div className="location-address-main">{restaurantProfile.address || 'Address not set'}</div>
                        </div>
                        <div className="card-actions">
                          <button type="button" className="text-btn change-loc-btn" onClick={() => setIsEditingLocation(true)}>Change</button>
                          <a
                            href={`https://www.google.com/maps?q=${restaurantProfile.latitude},${restaurantProfile.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-btn map-link-btn"
                          >
                            View on Grid
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="secondary-btn" disabled={profileSyncing}>
                {profileSyncing ? 'Saving...' : 'Update Settings'}
              </button>
            </form>
          </section>

          <section className="menu-form-section">
            <div className="section-header-flex">
              <h2 style={{ margin: 0 }}>{editingItemId ? 'Edit Dish' : 'Add New Dish'}</h2>
              {!editingItemId && (
                <div className="scan-button-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScanUpload}
                    id="menu-scan-upload"
                    className="file-input-hidden"
                  />
                  <label htmlFor="menu-scan-upload" className="scan-badge" style={{ background: '#f0f0ff', color: '#6366f1', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid currentColor' }}>
                    ✨ Scan Menu
                  </label>
                </div>
              )}
            </div>

            <form onSubmit={handleAddOrEdit} className="menu-form">
              <div className="input-group">
                <label>Dish Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  required
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala"
                />
              </div>

              <div className="input-group">
                <label>Dietary Preference (Mandatory)</label>
                <div style={{ display: 'flex', gap: '20px', padding: '5px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="isVeg"
                      value="true"
                      checked={newItem.isVeg === 'true'}
                      onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value })}
                      required
                    />
                    <span style={{ color: '#1ea97c' }}>●</span> Veg
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="isVeg"
                      value="false"
                      checked={newItem.isVeg === 'false'}
                      onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value })}
                      required
                    />
                    <span style={{ color: '#ff4d4d' }}>●</span> Non-Veg
                  </label>
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    required
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="250"
                  />
                </div>
                <div className="input-group">
                  <label>Cuisine</label>
                  <input
                    type="text"
                    placeholder="e.g. North Indian"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Tell customers about this dish..."
                />
              </div>

              <div className="input-group">
                <label>Dish Image (Optional)</label>
                <div className="image-options">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDishImageUpload}
                    id="dish-image-upload"
                    className="file-input-hidden"
                  />
                  <label
                    htmlFor="dish-image-upload"
                    className="upload-label"
                    style={{
                      borderColor: dishImageSuccess ? '#1ea97c' : '',
                      color: dishImageSuccess ? '#1ea97c' : '',
                      background: dishImageSuccess ? '#e1f9eb' : ''
                    }}
                  >
                    <div className="upload-label-content">
                      <ImageIcon size={18} />
                      {uploadingDishImage ? 'Uploading...' : dishImageSuccess ? 'Uploaded!' : 'Gallery'}
                    </div>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleDishImageUpload}
                    id="dish-image-camera"
                    className="file-input-hidden"
                  />
                  <label
                    htmlFor="dish-image-camera"
                    className="upload-label camera-label"
                    style={{
                      borderColor: dishImageSuccess ? '#1ea97c' : '',
                      color: dishImageSuccess ? '#1ea97c' : '',
                      background: dishImageSuccess ? '#e1f9eb' : ''
                    }}
                  >
                    <div className="upload-label-content">
                      <Camera size={18} />
                      {uploadingDishImage ? 'Uploading...' : dishImageSuccess ? 'Done!' : 'Camera'}
                    </div>
                  </label>
                </div>
                {newItem.imageUrl && (
                  <div style={{ marginTop: '10px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={newItem.imageUrl} alt="Dish preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="primary-btn" disabled={syncing} style={{ flex: 1 }}>
                  {syncing ? 'Saving...' : editingItemId ? 'Update Dish' : 'Add to Menu'}
                </button>
                {editingItemId && (
                  <button type="button" className="secondary-btn" disabled={syncing} onClick={() => {
                    setEditingItemId(null);
                    setNewItem({ name: '', price: '', category: '', isVeg: '', description: '', imageUrl: '' });
                    setDishImageSuccess(false);
                  }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        </aside>

        <main className="menu-preview-section">
          <div className="preview-header">
            <h2>Live Menu Preview</h2>
            <div className={`status-pill ${restaurantProfile.isOpen ? 'open' : 'closed'}`}>
              {restaurantProfile.isOpen ? '● OPEN' : '● CLOSED'}
            </div>
          </div>

          <div className="preview-list">
            {menuItems.length === 0 ? (
              <p className="empty-msg">No items added yet. Your customers will see an empty menu.</p>
            ) : (
              menuItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(item => (
                <div key={item.id} className={`preview-card ${item.isAvailable === false ? 'unavailable' : ''}`}>
                  <div style={{ display: 'flex', gap: '15px', flexGrow: 1 }}>
                    {item.imageUrl && (
                      <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>
                    )}
                    <div className="card-info">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.isVeg !== undefined && (
                          <span style={{ color: item.isVeg ? '#1ea97c' : '#ff4d4d', fontSize: '10px' }}>●</span>
                        )}
                        {item.name}
                      </h3>
                      {item.category && <p className="category-badge">{item.category}</p>}
                      <p className="desc">{item.description}</p>
                    </div>
                  </div>
                  <div className="card-price">
                    ₹{item.price}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <div
                        className={`toggle-switch-sm ${item.isAvailable !== false ? 'on' : 'off'}`}
                        onClick={() => handleToggleDishAvailable(item.id, item.isAvailable !== false)}
                        title={item.isAvailable !== false ? 'Mark as unavailable' : 'Mark as available'}
                      >
                        <div className="toggle-knob-sm"></div>
                      </div>
                      <button className="icon-action-btn edit" title="Edit Item" onClick={() => handleEditClick(item)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button className="icon-action-btn delete" title="Delete Item" onClick={() => handleDelete(item.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {showScanner && (
        <div className="scanner-overlay">
          <div className="scanner-modal">
            <div className="modal-header">
              <h3>✨ AI Menu Scanner</h3>
              <button className="close-btn" onClick={() => setShowScanner(false)}>×</button>
            </div>

            <div className="modal-body">
              {scanning ? (
                <div className="scan-loading">
                  <div className="spinner"></div>
                  <p>Gemini is reading your menu...</p>
                  <p className="tiny-hint">This usually takes 5-10 seconds</p>
                </div>
              ) : scanError ? (
                <div className="scan-error-view">
                  <div className="error-icon">⚠️</div>
                  <p className="error-msg">{scanError}</p>
                  <label htmlFor="menu-scan-upload" className="primary-btn retry-btn" style={{ cursor: 'pointer' }}>
                    Try different image
                  </label>
                </div>
              ) : (
                <div className="results-list">
                  <p className="hint">We found {scanResults.length} items. Please verify before adding.</p>
                  {scanResults.map((item, idx) => (
                    <div key={idx} className="result-item">
                      <input
                        className="item-name"
                        value={item.name}
                        onChange={(e) => {
                          const newResults = [...scanResults];
                          newResults[idx].name = e.target.value;
                          setScanResults(newResults);
                        }}
                      />
                      <div className="item-meta">
                        <input
                          type="number"
                          className="item-price"
                          value={item.price}
                          onChange={(e) => {
                            const newResults = [...scanResults];
                            newResults[idx].price = parseFloat(e.target.value);
                            setScanResults(newResults);
                          }}
                        />
                        <input
                          className="item-cat"
                          placeholder="Cuisine"
                          value={item.category}
                          onChange={(e) => {
                            const newResults = [...scanResults];
                            newResults[idx].category = e.target.value;
                            setScanResults(newResults);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!scanning && !scanError && (
              <div className="modal-footer">
                <button className="secondary-btn" onClick={() => setShowScanner(false)}>Cancel</button>
                <button className="primary-btn" onClick={handleConfirmScan} disabled={syncing}>
                  {syncing ? 'Adding...' : `Add ${scanResults.length} Items`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
