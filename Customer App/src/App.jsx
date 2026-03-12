import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './App.css';

// --- Component Imports ---
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterPills from './components/FilterPills';
import RestaurantCard from './components/RestaurantCard';
import BottomNav from './components/BottomNav';
import RestaurantDetail from './components/RestaurantDetail';
import CheckoutPage from './components/CheckoutPage';
import TrackingPage from './components/TrackingPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import ProfilePage from './components/ProfilePage';
import AddressFormModal from './components/AddressFormModal';
import AddressPicker from './components/AddressPicker';

// --- Firebase & Service Imports ---
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { getProfile, createProfile, updateProfile, setDefaultAddress } from './userProfileService.js';
import AuthPage from './AuthPage';

// --- Utility Functions ---
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km) {
  if (km === null || km === undefined) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// --- Main App ---
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRestaurant, setSelectedRestaurant] = useState(() => {
    const saved = localStorage.getItem('food_suite_selectedRestaurant');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('food_suite_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cloudMenu, setCloudMenu] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [placedOrderId, setPlacedOrderId] = useState(() => localStorage.getItem('food_suite_placedOrderId'));

  // User profile state
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [authRedirect, setAuthRedirect] = useState(null);

  // Address Modal state
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState(null);
  const [pureVegStatus, setPureVegStatus] = useState({});

  // Google Maps script loading
  const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    if (document.getElementById('google-maps-script')) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_KEY]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (uid) => {
    const profile = await getProfile(uid);
    setUserProfile(profile);
    return profile;
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (selectedRestaurant) {
      localStorage.setItem('food_suite_selectedRestaurant', JSON.stringify(selectedRestaurant));
    } else {
      localStorage.removeItem('food_suite_selectedRestaurant');
    }
  }, [selectedRestaurant]);
  useEffect(() => { localStorage.setItem('food_suite_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (placedOrderId) localStorage.setItem('food_suite_placedOrderId', placedOrderId);
    else localStorage.removeItem('food_suite_placedOrderId');
  }, [placedOrderId]);

  // Auth and Firestore listener
  useEffect(() => {
    let unsubscribeSnapshot = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
        fetchUserProfile(user.uid);
        if (!unsubscribeSnapshot) {
          unsubscribeSnapshot = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
            setRestaurants(list);
            setLoading(false);
          }, (error) => {
            console.error("Firestore error:", error);
            setLoading(false);
          });
        }
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous Login FAILED:", err);
          setAuthError(err.code || err.message);
          setLoading(false);
        });
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Menu listener for selected restaurant
  useEffect(() => {
    if (!selectedRestaurant) return;
    const menuRef = collection(db, 'restaurants', selectedRestaurant.id, 'menu');
    const q = query(menuRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => { items.push({ id: docSnap.id, ...docSnap.data() }); });
      setCloudMenu(items);
    });
    return () => unsub();
  }, [selectedRestaurant?.id]);

  // Pure Veg filter data
  useEffect(() => {
    if (activeFilter === 'Pure Veg') {
      restaurants.forEach(async (rest) => {
        if (pureVegStatus[rest.id] === undefined) {
          try {
            const menuRef = collection(db, 'restaurants', rest.id, 'menu');
            const snap = await getDocs(menuRef);
            let hasNonVeg = false;
            snap.forEach(doc => { if (doc.data().isVeg === false) hasNonVeg = true; });
            setPureVegStatus(prev => ({ ...prev, [rest.id]: !hasNonVeg }));
          } catch (err) {
            console.error("Error fetching menu for pure veg check:", err);
          }
        }
      });
    }
  }, [activeFilter, restaurants, pureVegStatus]);

  // --- Event Handlers ---
  const handleRestaurantClick = (restaurant) => {
    if (restaurant.isOpen === false) {
      alert(`${restaurant.name || 'This restaurant'} is currently closed.`);
      return;
    }
    setSelectedRestaurant({ ...restaurant, menu: [] });
    navigate('/restaurant');
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (item) => setCart([...cart, item]);

  const handleRemoveFromCart = (itemId) => {
    const lastIndex = cart.findLastIndex(item => item.id === itemId);
    if (lastIndex !== -1) {
      const newCart = [...cart];
      newCart.splice(lastIndex, 1);
      setCart(newCart);
    }
  };

  const handlePlaceOrder = async () => {
    if (authUser?.isAnonymous) { setAuthRedirect('/checkout'); navigate('/auth'); return; }
    if (!userProfile || !userProfile.name || !userProfile.phone) { setShowProfileSetup(true); return; }
    if (!userProfile.addresses || userProfile.addresses.length === 0) { navigate('/profile'); return; }

    try {
      const defaultIdx = userProfile.defaultAddressIndex || 0;
      const deliveryAddress = userProfile.addresses[defaultIdx];
      const newOrder = {
        customerId: authUser.uid,
        restaurantId: selectedRestaurant.id,
        restaurantName: selectedRestaurant.name,
        customerInfo: { name: userProfile.name || '', phone: userProfile.phone || '' },
        deliveryAddress,
        items: cart,
        totalAmount: cart.reduce((total, item) => total + item.price, 0),
        status: 'placed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      setPlacedOrderId(docRef.id);
      navigate('/tracking');
      setCart([]);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleTabClick = (tabId) => {
    const routes = { HOME: '/', ORDERS: '/orders', SEARCH: '/search', PROFILE: '/profile' };
    if ((tabId === 'PROFILE' || tabId === 'ORDERS') && authUser?.isAnonymous) {
      setAuthRedirect(routes[tabId]);
      navigate('/auth');
      window.scrollTo(0, 0);
      return;
    }
    navigate(routes[tabId] || '/');
    window.scrollTo(0, 0);
  };

  const handleProfileMenuClick = (menuId) => {
    if (menuId === 'HISTORY') navigate('/orders');
    window.scrollTo(0, 0);
  };

  const handleProfileSetupSave = async ({ name, phone }) => {
    if (!authUser) return;
    if (userProfile) { await updateProfile(authUser.uid, { name, phone }); }
    else { await createProfile(authUser.uid, { name, phone }); }
    await fetchUserProfile(authUser.uid);
    setShowProfileSetup(false);
  };

  const handleEditProfile = async (partial) => {
    if (!authUser) return;
    await updateProfile(authUser.uid, partial);
    await fetchUserProfile(authUser.uid);
  };

  const handleProfileUpdated = async () => {
    if (!authUser) return;
    await fetchUserProfile(authUser.uid);
  };

  const handleChangeAddress = () => {
    if (!userProfile?.addresses?.length) { setAddressToEdit(null); setIsAddrModalOpen(true); return; }
    setShowAddressPicker(true);
  };

  const handleAddressSelect = async (idx) => {
    if (!authUser) return;
    await setDefaultAddress(authUser.uid, idx);
    await fetchUserProfile(authUser.uid);
    setShowAddressPicker(false);
  };

  const handleGoToCheckout = () => {
    if (authUser?.isAnonymous) { setAuthRedirect('/checkout'); navigate('/auth'); return; }
    navigate('/checkout');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthUser(null); setUserProfile(null); setCart([]); navigate('/');
    } catch (err) { console.error('Error signing out:', err); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      if (authUser) await deleteUser(authUser);
      setAuthUser(null); setUserProfile(null); setCart([]); navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      if (err.code === 'auth/requires-recent-login') {
        alert("Please sign in again to delete your account.");
        await signOut(auth);
        setAuthUser(null);
        navigate('/auth');
      } else {
        alert("Failed to delete account. Please try again later.");
      }
    }
  };

  // --- Derive Display Data ---
  let displayRestaurants = restaurants;
  if (activeFilter === 'Pure Veg') {
    displayRestaurants = displayRestaurants.filter(r => pureVegStatus[r.id] === true);
  }
  const liveRestaurants = displayRestaurants.map(rest => {
    const distKm = customerLocation ? calcDistanceKm(customerLocation.lat, customerLocation.lng, rest.latitude, rest.longitude) : null;
    return {
      ...rest,
      image: rest.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400",
      rating: rest.rating || "4.5",
      time: rest.deliveryTime || "20-25 min",
      distance: formatDistance(distKm),
      price: "₹₹",
      tags: rest.isOpen ? ["OPEN"] : ["CLOSED"]
    };
  });

  // Determine active tab from current route
  const pathToTab = { '/': 'HOME', '/orders': 'ORDERS', '/search': 'SEARCH', '/profile': 'PROFILE' };
  const currentTab = pathToTab[location.pathname] || 'HOME';

  // --- Page Components ---
  const HomePage = () => (
    <div className="app-container">
      <div className="home-header-fixed">
        <Header userProfile={userProfile} onClickLocation={handleChangeAddress} />
        <SearchBar />
        <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <div className="section-header">
          <h2 className="section-title">Local Restaurants Managed by You</h2>
        </div>
      </div>
      <div className="restaurants-list">
        {liveRestaurants.length === 0 ? (
          <div className="loading-state"><p>Connecting to Food Suite Cloud...</p></div>
        ) : (
          liveRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => handleRestaurantClick(restaurant)} />
          ))
        )}
      </div>
      <BottomNav activeTab="HOME" onTabClick={handleTabClick} />
    </div>
  );

  const DetailPage = () => selectedRestaurant ? (
    <div className="app-container" style={{ padding: 0 }}>
      <RestaurantDetail
        restaurant={selectedRestaurant}
        items={cloudMenu}
        onBack={() => navigate('/')}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        cart={cart}
        onViewCart={handleGoToCheckout}
      />
      {cart.length > 0 && (
        <div className="cart-floating-bar" onClick={handleGoToCheckout}>
          <div className="cart-left">
            <span className="cart-items-count">{cart.length} Items</span>
            <span>View Cart</span>
          </div>
          <div className="cart-right">
            <span>₹{cart.reduce((total, item) => total + item.price, 0).toFixed(2)}</span>
            <ChevronRight size={18} />
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="full-app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/orders" element={
          <div className="app-container" style={{ padding: 0 }}>
            <OrderHistoryPage onBack={() => navigate('/')} userId={authUser?.uid} />
            <BottomNav activeTab="ORDERS" onTabClick={handleTabClick} />
          </div>
        } />
        <Route path="/search" element={
          <div className="app-container">
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>Coming Soon</div>
            <BottomNav activeTab="SEARCH" onTabClick={handleTabClick} />
          </div>
        } />
        <Route path="/profile" element={
          <div className="app-container" style={{ padding: 0 }}>
            <ProfilePage
              onBack={() => navigate('/')}
              onMenuItemClick={handleProfileMenuClick}
              userProfile={userProfile}
              onEditProfile={handleEditProfile}
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
              uid={authUser?.uid}
              onProfileUpdated={handleProfileUpdated}
              onOpenAddressModal={(addr) => { setAddressToEdit(addr); setIsAddrModalOpen(true); }}
            />
            <BottomNav activeTab="PROFILE" onTabClick={handleTabClick} />
          </div>
        } />
        <Route path="/restaurant" element={<DetailPage />} />
        <Route path="/auth" element={
          <div className="app-container" style={{ padding: 0 }}>
            <AuthPage
              onBack={() => navigate('/')}
              onAuthSuccess={() => {
                if (authRedirect) { navigate(authRedirect); setAuthRedirect(null); }
                else { navigate('/'); }
              }}
            />
          </div>
        } />
        <Route path="/checkout" element={
          <div className="app-container" style={{ padding: 0 }}>
            <CheckoutPage cart={cart} onBack={() => navigate('/restaurant')} onPlaceOrder={handlePlaceOrder} userProfile={userProfile} onChangeAddress={handleChangeAddress} />
          </div>
        } />
        <Route path="/tracking" element={
          <div className="app-container" style={{ padding: 0 }}>
            <TrackingPage orderId={placedOrderId} restaurantName={selectedRestaurant?.name || "Restaurant"} onBack={() => navigate('/')} />
          </div>
        } />
        {/* Fallback: redirect unknown routes to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>

      {/* Global Modals */}
      {showProfileSetup && <ProfileSetupModal onSave={handleProfileSetupSave} onClose={() => setShowProfileSetup(false)} />}
      <AddressFormModal isOpen={isAddrModalOpen} onClose={() => setIsAddrModalOpen(false)} userProfile={userProfile} uid={authUser?.uid} onProfileUpdated={handleProfileUpdated} editAddress={addressToEdit} />
      {showAddressPicker && userProfile?.addresses?.length > 0 && (
        <AddressPicker addresses={userProfile.addresses} defaultIdx={userProfile.defaultAddressIndex || 0} onSelect={handleAddressSelect} onClose={() => setShowAddressPicker(false)} />
      )}
    </div>
  );
}

export default App;
