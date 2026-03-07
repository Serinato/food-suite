import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
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
import { scanMenuFromImage } from './aiService';
import './App.css';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isAvailable: boolean;
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

  // New Scan States
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'Main Course',
    description: ''
  });

  const [restaurantProfile, setRestaurantProfile] = useState({
    name: '',
    description: '',
    imageUrl: '',
    address: '',
    cuisine: ''
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
        setRestaurantProfile(docSnap.data() as any);
        setRestaurantName(docSnap.data().name || 'Your Restaurant');
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
      await updateDoc(docRef, restaurantProfile);
      setRestaurantName(restaurantProfile.name);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile');
    } finally {
      setProfileSyncing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRestaurantProfile(prev => ({ ...prev, imageUrl: reader.result as string }));
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    setSyncing(true);
    try {
      const itemData = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        description: newItem.description,
        isAvailable: true,
        createdAt: new Date().toISOString()
      };

      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
      await addDoc(menuRef, itemData);
      setNewItem({ name: '', price: '', category: 'Main Course', description: '' });
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(`Failed to sync: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setShowScanner(true);
    setScanError(null);
    setScanResults([]);

    console.log("Scanner: Starting read for file:", file.name);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        console.log("Scanner: Base64 ready, calling Gemini...");
        const results = await scanMenuFromImage(base64);
        console.log("Scanner: AI results received:", results);
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
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h1>{restaurantName}</h1>
          <span className="badge">Merchant Admin</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>

      <div className="admin-grid">
        <aside className="admin-sidebar">
          <section className="profile-section">
            <h2>Kitchen Profile</h2>
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="image-preview" onClick={() => document.getElementById('imageInput')?.click()}>
                {restaurantProfile.imageUrl ? (
                  <img src={restaurantProfile.imageUrl} alt="Profile" />
                ) : (
                  <div className="placeholder">Upload Cover Image</div>
                )}
                <input id="imageInput" type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </div>

              <input
                placeholder="Kitchen Name"
                value={restaurantProfile.name}
                onChange={(e) => setRestaurantProfile({ ...restaurantProfile, name: e.target.value })}
              />
              <input
                placeholder="Cuisine Type"
                value={restaurantProfile.cuisine}
                onChange={(e) => setRestaurantProfile({ ...restaurantProfile, cuisine: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={restaurantProfile.description}
                onChange={(e) => setRestaurantProfile({ ...restaurantProfile, description: e.target.value })}
              />
              <button type="submit" className="primary-btn" disabled={profileSyncing}>
                {profileSyncing ? 'Updating...' : 'Save Profile'}
              </button>
            </form>
          </section>

          <section className="menu-form-section">
            <div className="section-header-flex">
              <h2>Add New Dish</h2>
              <div className="scan-button-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScanUpload}
                  id="menu-scan-upload"
                  hidden
                />
                <label htmlFor="menu-scan-upload" className="scan-badge">
                  ✨ Scan Menu
                </label>
              </div>
            </div>

            <form onSubmit={handleAdd} className="add-form">
              <input
                placeholder="Dish Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                required
              />
              <input
                placeholder="Category (e.g. Mains, Sides)"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
              <button type="submit" className="primary-btn" disabled={syncing}>
                {syncing ? 'Adding...' : 'Add Dish'}
              </button>
            </form>
          </section>
        </aside>

        <main className="admin-main">
          <section className="menu-list-section">
            <div className="section-header">
              <h2>Active Menu ({menuItems.length})</h2>
            </div>
            <div className="menu-grid">
              {menuItems.map(item => (
                <div key={item.id} className="menu-card">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="item-cat">{item.category}</p>
                    <p className="item-desc">{item.description}</p>
                  </div>
                  <div className="item-actions">
                    <span className="price">₹{item.price}</span>
                    <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
                  <label htmlFor="menu-scan-upload" className="primary-btn retry-btn">
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
                          placeholder="Category"
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

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowScanner(false)}>Cancel</button>
              <button
                className="primary-btn"
                disabled={scanning || scanResults.length === 0 || syncing}
                onClick={handleConfirmScan}
              >
                {syncing ? 'Adding...' : `Add ${scanResults.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
