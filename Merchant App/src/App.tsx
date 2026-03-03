import { useState, useEffect } from 'react';
import './App.css';
import type { MenuItem } from '@food-suite/shared';
import { collection, addDoc, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { db, storage, auth } from './firebase';

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // Dynamic identity is the user's UID (Google Account)
  const restaurantId = user ? user.uid : 'temp-kitchen';

  const [syncing, setSyncing] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [restaurantProfile, setRestaurantProfile] = useState({
    name: '',
    cuisine: '',
    image: '',
    deliveryTime: '20-25 min',
    distance: '0.5 km',
    isOpen: true
  });

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'Main Course',
    description: ''
  });

  // Listen to Firestore for real-time updates
  useEffect(() => {
    if (!user) return; // Wait until logged in

    // 1. Listen for Menu Items in this specific restaurant's sub-collection

    const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
    const unsubscribeMenu = onSnapshot(menuRef, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
      });
      setMenuItems(items);
      setLoading(false);
    });

    // 2. Fetch specific Restaurant Profile
    const unsubscribeProfile = onSnapshot(doc(db, 'restaurants', restaurantId), (docSnap) => {
      if (docSnap.exists()) {
        setRestaurantProfile(docSnap.data() as any);
      } else {
        // If the user logs in for the first time, clear any leftover state!
        setRestaurantProfile({
          name: '',
          cuisine: '',
          image: '',
          deliveryTime: '20-25 min',
          distance: '0.5 km',
          isOpen: true
        });
      }
    });

    return () => {
      unsubscribeMenu();
      unsubscribeProfile();
    };
  }, [restaurantId, user]);



  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSyncing(true);

    // Safety check: Is user logged in?
    if (!user) {
      alert("You must be logged in to save.");
      setProfileSyncing(false);
      return;
    }


    try {
      // 8-second timeout for the cloud save
      const savePromise = setDoc(doc(db, 'restaurants', restaurantId), {
        ...restaurantProfile,
        id: restaurantId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Cloud timeout")), 8000));

      await Promise.race([savePromise, timeoutPromise]);
      alert("Restaurant profile updated in the cloud! 🚀");
    } catch (error: any) {
      console.error(error);
      alert(`Failed to update profile: ${error.message || "Unknown Error"}`);
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
      setRestaurantProfile({ ...restaurantProfile, image: downloadURL });
    } catch (error) {
      console.error("Error uploading image: ", error);
      alert("Failed to upload image.");
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
      const addPromise = addDoc(menuRef, itemData);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Cloud timeout")), 8000));

      await Promise.race([addPromise, timeoutPromise]);
      setNewItem({ name: '', price: '', category: 'Main Course', description: '' });
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(`Failed to sync with cloud: ${error.message || "Check permissions"}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };


  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="login-container fade-in">
        <div className="login-card">
          <div className="logo-placeholder">🍽️</div>
          <h1>Merchant Portal</h1>
          <p>Sign in to manage your kitchen and menu.</p>
          <button className="primary-btn login-btn" onClick={handleLogin}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="merchant-container fade-in">
      <header className="merchant-header">
        <div className="header-titles">
          <h1>Merchant Portal</h1>
          <p>Manage your restaurant identity and menu in real-time</p>
        </div>
        <div className="header-actions">
          <span className="user-email">{user.email}</span>
          <button className="secondary-btn logout-btn" onClick={handleLogout}>Log Out</button>
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
                <label>
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
            <h2>Add New Dish</h2>
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
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    <option>Starters</option>
                    <option>Main Course</option>
                    <option>Desserts</option>
                    <option>Beverages</option>
                  </select>
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
                {syncing ? 'Syncing...' : 'Add to Menu'}
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

          {loading ? (
            <div className="loading-spinner">Waking up the cloud database...</div>
          ) : (
            <div className="preview-list">
              {menuItems.length === 0 ? (
                <p className="empty-msg">No items added yet. Your customers will see an empty menu.</p>
              ) : (
                menuItems.sort((a, b) => (b as any).createdAt?.localeCompare((a as any).createdAt)).map(item => (
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
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
