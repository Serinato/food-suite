import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from './firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy
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
import { Camera, Image as ImageIcon, Navigation } from 'lucide-react';
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
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  // New Scan States
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);

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

  useEffect(() => {
    if (restaurantId) {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filter for this restaurant locally for simplicity
        const restaurantOrders = allOrders.filter((o: any) => o.restaurantId === restaurantId);
        setOrders(restaurantOrders);
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

  const handleToggleOpen = async () => {
    const newIsOpen = !restaurantProfile.isOpen;
    setRestaurantProfile(prev => ({ ...prev, isOpen: newIsOpen }));
    try {
      await setDoc(doc(db, 'restaurants', restaurantId), { isOpen: newIsOpen }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle open status:', err);
      setRestaurantProfile(prev => ({ ...prev, isOpen: !newIsOpen }));
    }
  };

  const handleToggleDishAvailable = async (itemId: string, currentAvail: boolean) => {
    const newAvail = !currentAvail;
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: newAvail } : i));
    try {
      await setDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId), { isAvailable: newAvail }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle dish availability:', err);
      setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !newAvail } : i));
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
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
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
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Failed to sync with cloud.");
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      let latestUpdate = '';
      switch (newStatus) {
        case 'CONFIRMED': latestUpdate = 'Your order has been confirmed by the restaurant!'; break;
        case 'PREPARING': latestUpdate = 'Chef is preparing your delicious meal!'; break;
        case 'ON_WAY': latestUpdate = 'Food is ready and out for delivery!'; break;
        case 'DELIVERED': latestUpdate = 'Order delivered. Enjoy your meal!'; break;
      }

      await setDoc(orderRef, {
        status: newStatus,
        latestUpdate,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status.");
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
    setScanResults([]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const results = await scanMenuFromImage(base64);
        setScanResults(results);
      } catch (err: any) {
        console.error("Scanner error:", err);
        alert("Failed to scan menu.");
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

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return;
    if (document.getElementById('google-maps-script')) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_KEY]);

  const attachAutocomplete = (inputEl: HTMLInputElement) => {
    if (autocompleteRef.current) return;
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
      const addr = place.name ? `${place.name}, ${place.formatted_address}` : place.formatted_address || '';
      setRestaurantProfile(prev => ({ ...prev, address: addr, latitude: lat, longitude: lng }));
      setIsEditingLocation(false);
    });
    autocompleteRef.current = ac;
  };

  const locationInputCallbackRef = (node: HTMLInputElement | null) => {
    autocompleteInputRef.current = node;
    if (!node) return;
    if (window.google?.maps?.places) {
      attachAutocomplete(node);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval);
        attachAutocomplete(node);
      }
    }, 200);
    setTimeout(() => clearInterval(interval), 15000);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (window.google?.maps) {
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            if (result.results?.[0]) {
              setRestaurantProfile(prev => ({ ...prev, address: result.results[0].formatted_address, latitude, longitude }));
              setIsEditingLocation(false);
            }
          } catch (err) {
            setRestaurantProfile(prev => ({ ...prev, address: 'Detected Location', latitude, longitude }));
            setIsEditingLocation(false);
          }
        }
        setLocatingUser(false);
      },
      () => setLocatingUser(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

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
          <div className="login-divider"><span>OR</span></div>
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
            <div className="tab-switcher" style={{ display: 'flex', background: '#f0f0f0', borderRadius: '12px', padding: '4px', marginRight: '20px' }}>
              <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')} style={{ border: 'none', background: activeTab === 'menu' ? 'white' : 'transparent', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                Menu
              </button>
              <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} style={{ border: 'none', background: activeTab === 'orders' ? 'white' : 'transparent', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                Orders {orders.filter(o => o.status !== 'DELIVERED').length > 0 && <span style={{ background: '#ff4d4d', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', marginLeft: '4px' }}>{orders.filter(o => o.status !== 'DELIVERED').length}</span>}
              </button>
            </div>
            <div className="header-toggle-group" onClick={handleToggleOpen} style={{ marginRight: '20px' }}>
              <div className={`toggle-switch ${restaurantProfile.isOpen ? 'on' : 'off'}`}><div className="toggle-knob"></div></div>
              <span className={`toggle-label ${restaurantProfile.isOpen ? 'open' : 'closed'}`}>{restaurantProfile.isOpen ? 'Open' : 'Closed'}</span>
            </div>
            <span className="user-email">{user.email}</span>
            <button className="secondary-btn logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </header>

      <div className="merchant-layout">
        {activeTab === 'menu' ? (
          <>
            <aside className="merchant-sidebar">
              <section className="profile-section">
                <h2>Restaurant Profile</h2>
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="input-group">
                    <label>Restaurant Name</label>
                    <input type="text" value={restaurantProfile.name} onChange={(e) => setRestaurantProfile({ ...restaurantProfile, name: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Cuisine Type</label>
                    <input type="text" value={restaurantProfile.cuisine} onChange={(e) => setRestaurantProfile({ ...restaurantProfile, cuisine: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Header Image</label>
                    <div className="image-options">
                      <input type="file" accept="image/*" onChange={handleImageUpload} id="header-image-upload" className="file-input-hidden" />
                      <label htmlFor="header-image-upload" className="upload-label">
                        <div className="upload-label-content"><ImageIcon size={18} /> {uploadingImage ? 'Uploading...' : 'Gallery'}</div>
                      </label>
                    </div>
                  </div>
                  <div className="input-group">
                    {(!restaurantProfile.latitude || isEditingLocation) ? (
                      <div className="location-editing">
                        <input ref={locationInputCallbackRef} type="text" defaultValue={restaurantProfile.address} placeholder="Enter address..." className="location-search-input" />
                        <button type="button" className="detect-location-btn" onClick={handleUseMyLocation} disabled={locatingUser}>
                          <Navigation size={18} /> <span>Current Location</span>
                        </button>
                      </div>
                    ) : (
                      <div className="location-display-card">
                        <div>{restaurantProfile.address || 'Address not set'}</div>
                        <button type="button" onClick={() => setIsEditingLocation(true)}>Change</button>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="secondary-btn" disabled={profileSyncing}>{profileSyncing ? 'Saving...' : 'Update Settings'}</button>
                </form>
              </section>

              <section className="menu-form-section">
                <h2>{editingItemId ? 'Edit Dish' : 'Add New Dish'}</h2>
                <form onSubmit={handleAddOrEdit} className="menu-form">
                  <div className="input-group">
                    <label>Dish Name</label>
                    <input type="text" value={newItem.name} required onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Dietary Preference</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label><input type="radio" name="isVeg" value="true" checked={newItem.isVeg === 'true'} onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value })} required /> Veg</label>
                      <label><input type="radio" name="isVeg" value="false" checked={newItem.isVeg === 'false'} onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value })} /> Non-Veg</label>
                    </div>
                  </div>
                  <button type="submit" className="primary-btn" disabled={syncing}>{syncing ? 'Saving...' : editingItemId ? 'Update Dish' : 'Add to Menu'}</button>
                </form>
              </section>
            </aside>

            <main className="merchant-main">
              <section className="menu-list-section">
                <h2>Menu Inventory</h2>
                <div className="menu-grid">
                  {menuItems.map((item) => (
                    <div key={item.id} className={`menu-card-v2 ${!item.isAvailable ? 'unavailable-card' : ''}`}>
                      <div className="menu-card-header"><h3>{item.name}</h3><span>₹{item.price}</span></div>
                      <div className="menu-card-footer">
                        <div onClick={() => handleToggleDishAvailable(item.id, item.isAvailable)}>
                          <span>{item.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                        </div>
                        <div className="actions">
                          <button onClick={() => handleEditClick(item)}>✎</button>
                          <button onClick={() => handleDelete(item.id)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </>
        ) : (
          <main className="merchant-main" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <section className="orders-section">
              <div className="section-header-flex">
                <h2>Active Orders</h2>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div><b>{orders.length}</b> Total</div>
                  <div><b>{orders.filter(o => o.status === 'PLACED').length}</b> New</div>
                </div>
              </div>
              <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {orders.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: '#f9f9f9', borderRadius: '12px' }}>
                    <p>No orders yet.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#888' }}>ORDER #{order.id.slice(-6).toUpperCase()}</div>
                          <h4>{order.userName}</h4>
                        </div>
                        <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', background: '#eee' }}>{order.status}</span>
                      </div>
                      <div style={{ margin: '12px 0' }}>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>1x {item.name}</span><span>₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                        <strong>Address:</strong> {order.deliveryAddress.googleAddress}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {order.status === 'PLACED' && <button onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')} style={{ flex: 1, padding: '8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '8px' }}>Confirm</button>}
                        {order.status === 'CONFIRMED' && <button onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')} style={{ flex: 1, padding: '8px', background: '#fab005', color: 'white', border: 'none', borderRadius: '8px' }}>Prepare</button>}
                        {order.status === 'PREPARING' && <button onClick={() => handleUpdateOrderStatus(order.id, 'ON_WAY')} style={{ flex: 1, padding: '8px', background: '#40c057', color: 'white', border: 'none', borderRadius: '8px' }}>Out for Delivery</button>}
                        {order.status === 'ON_WAY' && <button onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')} style={{ flex: 1, padding: '8px', background: '#adb5bd', color: 'white', border: 'none', borderRadius: '8px' }}>Delivered</button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        )}
      </div>

      {showScanner && (
        <div className="scanner-overlay">
          <div className="scanner-modal">
            <div className="modal-header"><h3>✨ AI Menu Scanner</h3><button onClick={() => setShowScanner(false)}>×</button></div>
            <div className="modal-body">
              {scanning ? <p>Scanning...</p> : (
                <div>
                  {scanResults.map((item, idx) => (
                    <div key={idx}><input value={item.name} onChange={(e) => {
                      const nr = [...scanResults];
                      nr[idx].name = e.target.value;
                      setScanResults(nr);
                    }} /></div>
                  ))}
                  <button onClick={handleConfirmScan}>Add Items</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
