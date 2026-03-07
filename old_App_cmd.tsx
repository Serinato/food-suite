import { useState, useEffect } from 'react';
import './App.css';
import type { MenuItem } from '@food-suite/shared';
import { collection, addDoc, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [restaurantProfile, setRestaurantProfile] = useState({
    name: 'Your Local Kitchen',
    cuisine: 'Modern Indian',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
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
    // 1. Listen for Menu Items
    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
      setLoading(false);
    });

    // 2. Fetch Restaurant Profile
    const unsubscribeProfile = onSnapshot(doc(db, 'settings', 'profile'), (docSnap) => {
      if (docSnap.exists()) {
        setRestaurantProfile(docSnap.data() as any);
      }
    });

    return () => {
      unsubscribeMenu();
      unsubscribeProfile();
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSyncing(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), restaurantProfile);
      alert("Restaurant profile updated in the cloud! 🚀");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
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

      await addDoc(collection(db, 'menu'), itemData);
      setNewItem({ name: '', price: '', category: 'Main Course', description: '' });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to sync with cloud. Check console.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'menu', id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  return (
    <div className="merchant-container">
      <header className="merchant-header">
        <h1>Merchant Portal</h1>
        <p>Manage your restaurant identity and menu in real-time</p>
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
