import React, { useState, useEffect } from 'react';
import { db, auth, storage } from './firebase';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { scanMenuFromImage } from './aiService';
import './App.css';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
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
    image: '',
    address: '',
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
    try {
      const storageRef = ref(storage, `restaurant/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setRestaurantProfile(prev => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error("Error uploading image: ", error);
      alert("Failed to upload image. Ensure Firebase Storage rules allow uploads.");
    } finally {
      setUploadingImage(false);
    }
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
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to sync with cloud. Check console.");
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-titles" style={{ textAlign: 'left' }}>
            <h1>{restaurantName ? `${restaurantName} - Portal` : 'Merchant Portal'}</h1>
            <p>Manage your restaurant identity and menu in real-time</p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
                  <label htmlFor="header-image-upload" className="upload-label">
                    {uploadingImage ? 'Uploading...' : '📁 Choose File'}
                  </label>
                  <span className="or-divider">OR</span>
                  <input
                    type="text"
                    value={restaurantProfile.image}
                    onChange={(e) => setRestaurantProfile({ ...restaurantProfile, image: e.target.value })}
                    placeholder="Paste Image URL"
                  />
                </div>
              </div>
              <div className="input-group checkbox-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={restaurantProfile.isOpen}
                    onChange={(e) => setRestaurantProfile({ ...restaurantProfile, isOpen: e.target.checked })}
                  />
                  Restaurant is Open for Orders
                </label>
              </div>
              <button type="submit" className="secondary-btn" disabled={profileSyncing}>
                {profileSyncing ? 'Saving...' : 'Update Settings'}
              </button>
            </form>
          </section>

          <section className="menu-form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Add New Dish</h2>
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
            </div>

            <form onSubmit={handleAdd} className="menu-form">
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
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Mains, Sides"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    required
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

              <button type="submit" className="primary-btn" disabled={syncing}>
                {syncing ? 'Adding...' : 'Add to Menu'}
              </button>
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
                <div key={item.id} className="preview-card">
                  <div className="card-info">
                    <h3>{item.name}</h3>
                    <p className="category-badge">{item.category}</p>
                    <p className="desc">{item.description}</p>
                  </div>
                  <div className="card-price">
                    ₹{item.price}
                    <button className="delete-btn" title="Delete Item" onClick={() => handleDelete(item.id)}>×</button>
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
