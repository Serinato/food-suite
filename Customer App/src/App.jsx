import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Bell,
  Search,
  Heart,
  Star,
  Clock,
  Route,
  Home as HomeIcon,
  ClipboardList,
  User,
  ArrowLeft,
  Share2,
  ChevronRight,
  CheckCircle2,
  CreditCard as CardIcon,
  Smartphone,
  Plus,
  Minus,
  Navigation,
  Phone,
  MessageCircle,
  Camera,
  Map,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Trash2,
  MessageSquare,
  History,
  Edit,
  Mail
} from 'lucide-react';
import { RESTAURANTS, CATEGORIES } from './data';
import './App.css';

// --- Home Components ---
const Header = () => (
  <header className="header">
    <div className="location-group">
      <span className="delivering-label">DELIVERING TO</span>
      <div className="location-value">
        <MapPin size={16} color="var(--accent-primary)" />
        <span>Kolshet, Thane</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </div>
    </div>
    <div className="notification-bell">
      <Bell size={18} />
    </div>
  </header>
);

const SearchBar = () => (
  <div className="search-container">
    <Search className="search-icon" size={18} />
    <input
      type="text"
      className="search-input"
      placeholder="Search for dishes or restaurants"
    />
  </div>
);

const FilterPills = () => {
  const [activeFilter, setActiveFilter] = useState(null);
  return (
    <div className="filter-pills-row">
      {CATEGORIES.map(category => (
        <div
          key={category}
          className={`filter-pill ${activeFilter === category ? 'active' : ''}`}
          onClick={() => setActiveFilter(category)}
        >
          {category}
        </div>
      ))}
    </div>
  );
};

const RestaurantCard = ({ restaurant, onClick }) => (
  <div className="restaurant-card fade-in" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="card-image-wrapper">
      <img src={restaurant.image} alt={restaurant.name} className="card-image" />
      {restaurant.tags.includes("FREE DELIVERY") && (
        <div className="free-delivery-badge">FREE DELIVERY</div>
      )}
      <div className="favorite-btn">
        <Heart size={16} />
      </div>
    </div>
    <div className="card-content">
      <div className="card-title-row">
        <h3 className="restaurant-name">{restaurant.name}</h3>
        <span className="rating-badge">{restaurant.rating}</span>
      </div>
      <p className="cuisine-info">{restaurant.cuisine}</p>
      <div className="card-footer">
        <div className="footer-item">
          <Clock size={14} color="var(--accent-primary)" />
          <span>{restaurant.time}</span>
        </div>
        <div className="footer-item">
          <Route size={14} color="var(--accent-primary)" />
          <span>{restaurant.distance}</span>
        </div>
        <div className="footer-item">
          <span>{restaurant.price}</span>
        </div>
      </div>
    </div>
  </div>
);

const BottomNav = ({ activeTab, onTabClick }) => {
  const items = [
    { id: 'HOME', label: 'Home', icon: HomeIcon },
    { id: 'ORDERS', label: 'Orders', icon: ClipboardList },
    { id: 'SEARCH', label: 'Search', icon: Search },
    { id: 'PROFILE', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <div
          key={item.id}
          className={`nav-item ${activeTab === item.id || (activeTab === 'PROFILE_ORDERS' && item.id === 'PROFILE') || (activeTab === 'PROFILE_ADDRESS' && item.id === 'PROFILE') ? 'active' : ''}`}
          onClick={() => onTabClick(item.id)}
        >
          <item.icon size={22} />
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

// --- Restaurant Detail Components ---
const RestaurantDetail = ({ restaurant, onBack, onAddToCart, onRemoveFromCart, cart, onViewCart }) => {
  const [activeTab, setActiveTab] = useState('Popular');

  const getItemCount = (itemId) => {
    return cart.filter(i => i.id === itemId).length;
  };

  return (
    <div className="detail-container fade-in">
      <div className="detail-header">
        <img src={restaurant.image} className="detail-hero-img" alt={restaurant.name} />
        <div className="header-overlay">
          <div className="header-top-actions">
            <div className="icon-btn-circle" onClick={onBack}>
              <ArrowLeft size={18} />
            </div>
            <div className="right-actions">
              <div className="icon-btn-circle">
                <Share2 size={18} />
              </div>
              <div className="icon-btn-circle">
                <Heart size={18} />
              </div>
            </div>
          </div>
          <div className="header-bottom-info">
            <div className="restaurant-logo-small">
              <img src={restaurant.image} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h2 className="detail-restaurant-name">{restaurant.name}</h2>
              <p className="detail-cuisine">{restaurant.cuisine}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-stats-bar">
        <div className="stat-item">
          <Star size={14} className="rating-star" fill="var(--accent-primary)" />
          <span>4.5 Stars</span>
        </div>
        <div className="stat-item">
          <Clock size={14} color="var(--accent-primary)" />
          <span>25-30 min</span>
        </div>
        <div className="stat-item">
          <MapPin size={14} color="var(--accent-primary)" />
          <span>1.2 km</span>
        </div>
      </div>

      <div className="filter-pills-row" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['Popular', 'Main Course', 'Sides', 'Beverages'].map(tab => (
          <div
            key={tab}
            className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="menu-sections">
        <h3 className="menu-section-title">Popular Items</h3>
        <div className="menu-items-list">
          {restaurant.menu?.map(item => (
            <div key={item.id} className="menu-item-card">
              <div className="item-left">
                <div className="item-name-row">
                  {item.isSpicy && <div className="spicy-dot"></div>}
                  <span className="item-name">{item.name}</span>
                </div>
                <p className="item-desc">{item.description}</p>
                <span className="item-price">₹{item.price.toFixed(2)}</span>
              </div>
              <div className="item-right">
                <img src={item.image} alt={item.name} className="item-img" />
                {getItemCount(item.id) > 0 ? (
                  <div className="quantity-selector">
                    <button className="qty-btn" onClick={() => onRemoveFromCart(item.id)}>
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="qty-number">{getItemCount(item.id)}</span>
                    <button className="qty-btn" onClick={() => onAddToCart(item)}>
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button className="add-btn" onClick={() => onAddToCart(item)}>+ ADD</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// --- Checkout Page Component ---
const CheckoutPage = ({ cart, onBack, onPlaceOrder }) => {
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const subtotal = cart.reduce((total, item) => total + item.price, 0);
  const deliveryFee = 45;
  const total = subtotal + deliveryFee;

  const groupedItems = cart.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, count: 0 };
    }
    acc[item.id].count += 1;
    return acc;
  }, {});

  return (
    <div className="checkout-page fade-in">
      <div className="checkout-header">
        <div className="checkout-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </div>
        <h2 className="checkout-title">Checkout</h2>
      </div>

      <div className="checkout-section">
        <div className="checkout-section-title">
          <span>Delivery Address</span>
          <span className="change-link">Change</span>
        </div>
        <div className="selection-card">
          <div className="icon-wrapper-yellow">
            <MapPin size={20} />
          </div>
          <div className="card-text-group">
            <h4 className="card-main-text">Home</h4>
            <p className="card-sub-text">Hiranandani Estate, Kolshet Road, Thane West, Maharashtra 400607</p>
          </div>
        </div>
      </div>

      <div className="checkout-section">
        <div className="checkout-section-title">
          <span>Order Summary</span>
        </div>
        <div className="summary-card">
          {Object.values(groupedItems).map(item => (
            <div key={item.id} className="summary-item-row">
              <div className="item-qty-name">
                <span className="qty-highlight">{item.count}x</span>
                <span>{item.name}</span>
              </div>
              <span style={{ fontWeight: 700 }}>₹{(item.price * item.count).toFixed(2)}</span>
            </div>
          ))}

          <div className="bill-details">
            <div className="bill-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="bill-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="bill-row total">
              <span>Total</span>
              <span className="total-amount-large">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="checkout-section">
        <div className="checkout-section-title">
          <span>Payment Method</span>
          <span className="change-link">Add New</span>
        </div>
        <div className="payment-list">
          <div
            className={`selection-card ${selectedPayment === 'UPI' ? 'selected' : ''}`}
            onClick={() => setSelectedPayment('UPI')}
          >
            <div className="icon-wrapper-yellow">
              <Smartphone size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">UPI / Google Pay</h4>
              <p className="card-sub-text">Pay directly from your bank</p>
            </div>
            {selectedPayment === 'UPI' && <CheckCircle2 className="check-circle" size={20} />}
          </div>

          <div
            className={`selection-card ${selectedPayment === 'CARD' ? 'selected' : ''}`}
            onClick={() => setSelectedPayment('CARD')}
          >
            <div className="icon-wrapper-yellow">
              <CardIcon size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">Credit / Debit Card</h4>
              <p className="card-sub-text">**** **** **** 4242</p>
            </div>
            {selectedPayment === 'CARD' && <CheckCircle2 className="check-circle" size={20} />}
          </div>
        </div>
      </div>

      <div className="place-order-wrapper">
        <button className="place-order-btn" onClick={onPlaceOrder}>
          Place Order • ₹{total.toFixed(2)}
          <ChevronRight size={18} />
        </button>
        <p className="terms-text">By placing order you agree to our Terms & Conditions</p>
      </div>
    </div>
  );
};

// --- Tracking Page Component ---
const TrackingPage = ({ onBack, restaurantName }) => {
  const [progress, setProgress] = useState(70); // Mock progress

  return (
    <div className="tracking-page fade-in">
      <div className="map-area">
        <div className="map-overlay-header">
          <div className="icon-btn-circle" onClick={onBack}>
            <ArrowLeft size={18} />
          </div>
          <h2 className="checkout-title" style={{ color: 'white' }}>Track Order</h2>
          <span className="change-link" style={{ fontSize: '12px' }}>HELP</span>
        </div>

        <div className="map-controls">
          <div className="map-control-btn"><Plus size={18} /></div>
          <div className="map-control-btn"><Minus size={18} /></div>
          <div className="map-control-btn" style={{ color: 'var(--accent-primary)' }}><Navigation size={18} fill="currentColor" /></div>
        </div>
      </div>

      <div className="tracking-card">
        <div className="drag-handle"></div>

        <div>
          <h2 className="arriving-text">Arriving in 12 mins</h2>
          <p className="order-info-small">Order #4421 • {restaurantName}</p>
        </div>

        <div className="stepper-container">
          <div className="stepper-track">
            <div className="stepper-progress" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="stepper-labels">
            <span className="step-label active">Confirmed</span>
            <span className="step-label active">Preparing</span>
            <span className="step-label active">On Way</span>
            <span className="step-label">Delivered</span>
          </div>
        </div>

        <p className="status-update-text">
          <b>Latest update:</b> Rahul has picked up your order and is heading your way!
        </p>

        <div className="partner-card">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
            alt="partner"
            className="partner-avatar"
          />
          <div className="partner-info">
            <h4 className="partner-name">Rahul S.</h4>
            <div className="partner-rating">
              <Star size={14} fill="var(--accent-primary)" color="var(--accent-primary)" />
              <span>4.8 • Honda Activa</span>
            </div>
          </div>
          <div className="partner-actions">
            <div className="action-btn-circle call">
              <Phone size={18} />
            </div>
            <div className="action-btn-circle msg">
              <MessageCircle size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Profile Page Component ---
const ProfilePage = ({ onBack, onMenuItemClick }) => {
  const menuItems = [
    { id: 'ADDRESS', label: 'Address and Contact Details', icon: MapPin },
    { id: 'HISTORY', label: 'Order History', icon: History },
    { id: 'PAYMENTS', label: 'Payment Methods', icon: CreditCard },
    { id: 'NOTIFICATIONS', label: 'Notification Settings', icon: Bell },
    { id: 'FEEDBACK', label: 'Feedback', icon: MessageSquare },
    { id: 'SUPPORT', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="checkout-title">My Profile</h2>
        <span className="edit-btn">Edit</span>
      </div>

      <div className="profile-identity">
        <div className="avatar-container">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200"
            alt="user"
            className="profile-img"
          />
          <div className="camera-badge">
            <Camera size={14} />
          </div>
        </div>
        <div className="user-text-center">
          <h2 className="user-name-large">Arjun Mehta</h2>
          <p className="user-email-small">arjun.mehta@example.com</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-val">12</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">₹450</span>
          <span className="stat-label">Wallet</span>
        </div>
      </div>

      <div className="menu-list">
        {menuItems.map((item, index) => (
          <div key={index} className="menu-card" onClick={() => onMenuItemClick(item.id)}>
            <div className="menu-icon-bg">
              <item.icon size={20} />
            </div>
            <span className="menu-title-text">{item.label}</span>
            <ChevronRight className="menu-chevron" size={18} />
          </div>
        ))}
      </div>

      <div className="account-actions">
        <div className="danger-card">
          <LogOut size={20} />
          <span className="danger-text">Sign Out</span>
        </div>
        <div className="danger-card">
          <Trash2 size={20} />
          <span className="danger-text">Delete Account</span>
        </div>
      </div>
    </div>
  );
};

// --- Order History Page Component ---
const OrderHistoryPage = ({ onBack }) => {
  const orders = [
    {
      id: '#4421',
      restaurant: 'The Pizza Project - Downtown',
      logo: RESTAURANTS[0].image,
      status: 'Delivered',
      date: 'Oct 24, 7:30 PM',
      items: '1x Margherita Classic, 1x Coke Zero, 1x Garlic Bread',
      price: 650.00,
      canRate: true
    },
    {
      id: '#4398',
      restaurant: 'The Pizza Project - Uptown',
      logo: RESTAURANTS[0].image,
      status: 'Delivered',
      date: 'Oct 15, 8:15 PM',
      items: '2x Pepperoni Feast, 2x Large Coke',
      price: 1240.00,
      canRate: true
    },
    {
      id: '#4350',
      restaurant: 'The Pizza Project - Downtown',
      logo: RESTAURANTS[0].image,
      status: 'Cancelled',
      date: 'Sep 30, 6:45 PM',
      items: '1x Veggie Supreme, 1x Garlic Bread',
      price: 450.00,
      canRate: false
    }
  ];

  return (
    <div className="order-history-page fade-in">
      <div className="order-history-header">
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="checkout-title">Order History</h2>
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Settings size={18} />
        </div>
      </div>

      <div className="search-container">
        <Search className="search-icon" size={18} />
        <input type="text" className="search-input" placeholder="Search past orders..." />
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-history-card">
            <div className="order-card-top">
              <img src={order.logo} alt="logo" className="order-rest-logo" />
              <div className="order-info-main">
                <h4 className="order-rest-name">{order.restaurant}</h4>
                <p className="order-meta-info">{order.status} • {order.date}</p>
              </div>
              <span className={`status-badge ${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>

            <p className="order-items-summary">
              {order.items.split(', ').map((item, i) => (
                <span key={i}>
                  <span className="qty-bold">{item.split('x ')[0]}x</span> {item.split('x ')[1]}
                  {i < order.items.split(', ').length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>

            <div className="order-card-bottom">
              <span className="order-total-price">₹{order.price.toFixed(2)}</span>
              <div className="card-btns-row">
                {order.status === 'Cancelled' ? (
                  <button className="card-btn outline">Help</button>
                ) : (
                  <button className="card-btn outline">Rate</button>
                )}
                <button className="card-btn primary">Reorder</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Address & Contact Page Component ---
const AddressPage = ({ onBack }) => {
  const addresses = [
    { id: 1, type: 'Home', isDefault: true, detail: 'Flat 402, Sunshine Apartments, Indiranagar, Bengaluru, KA 560038', icon: HomeIcon },
    { id: 2, type: 'Work', isDefault: false, detail: 'WeWork Galaxy, 43 Residency Road, Shanthala Nagar, Ashok Nagar, Bengaluru, KA 560025', icon: CardIcon },
    { id: 3, type: 'Parents\' House', isDefault: false, detail: '12th Main Rd, 4th Block, Jayanagar, Bengaluru, KA 560011', icon: MapPin },
  ];

  return (
    <div className="address-page fade-in">
      <div className="profile-header">
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="checkout-title">Address & Contact</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="contact-section">
        <h3 className="address-section-title">Contact Details</h3>
        <div className="contact-card">
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-field-wrapper">
              <span className="input-text">Arjun Mehta</span>
              <User size={16} color="var(--text-secondary)" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-field-wrapper">
              <span className="input-text">arjun.mehta@example.com</span>
              <Mail size={16} color="var(--text-secondary)" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <div className="input-field-wrapper">
              <span className="input-text">+91 98765 43210</span>
              <Phone size={16} color="var(--text-secondary)" />
            </div>
          </div>
          <button className="update-btn">Update Contact Info</button>
        </div>
      </div>

      <div className="addresses-section">
        <h3 className="address-section-title">Saved Addresses</h3>
        <div className="saved-addresses-list">
          {addresses.map(addr => (
            <div key={addr.id} className="address-card">
              <div className="address-icon-bg">
                <addr.icon size={20} />
              </div>
              <div className="address-info">
                <div className="address-name-row">
                  <span className="address-name">{addr.type}</span>
                  {addr.isDefault && <span className="default-badge">DEFAULT</span>}
                </div>
                <p className="address-detail-text">{addr.detail}</p>
              </div>
              <div className="address-actions">
                <div className="address-action-btn"><Edit size={14} /></div>
                <div className="address-action-btn"><Trash2 size={14} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="add-new-address-btn">
        <Plus size={20} />
        Add New Address
      </button>
    </div>
  );
};

// --- Main App Component ---
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

function App() {
  const [currentPage, setCurrentPage] = useState('HOME');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [cloudMenu, setCloudMenu] = useState([]);

  // Listen to the live cloud menu
  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCloudMenu(items);
    });
    return () => unsubscribe();
  }, []);

  const handleRestaurantClick = (restaurant) => {
    // If it's our new live menu restaurant
    if (restaurant.id === 'live-menu') {
      const liveRest = {
        ...restaurant,
        menu: cloudMenu.map(item => ({
          ...item,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200"
        }))
      };
      setSelectedRestaurant(liveRest);
    } else {
      setSelectedRestaurant(restaurant);
    }
    setCurrentPage('DETAIL');
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (item) => {
    setCart([...cart, item]);
  };

  const handleRemoveFromCart = (itemId) => {
    const lastIndex = cart.findLastIndex(item => item.id === itemId);
    if (lastIndex !== -1) {
      const newCart = [...cart];
      newCart.splice(lastIndex, 1);
      setCart(newCart);
    }
  };

  const handlePlaceOrder = () => {
    setCurrentPage('TRACKING');
    setCart([]);
    window.scrollTo(0, 0);
  };

  const handleTabClick = (tabId) => {
    setCurrentPage(tabId);
    window.scrollTo(0, 0);
  };

  const handleProfileMenuClick = (menuId) => {
    if (menuId === 'ADDRESS') {
      setCurrentPage('PROFILE_ADDRESS');
    } else if (menuId === 'HISTORY') {
      setCurrentPage('PROFILE_ORDERS');
    } else {
      console.log('Clicked menu:', menuId);
    }
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    // Inject our live restaurant into the list
    const liveRestaurant = {
      id: 'live-menu',
      name: "Your Local Kitchen",
      cuisine: "Cloud Controlled Menu",
      rating: "New",
      time: "20-25 min",
      distance: "0.5 km",
      price: "₹₹",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400",
      tags: ["LIVE UPDATES"],
      menu: cloudMenu
    };

    const allRestaurants = [liveRestaurant, ...RESTAURANTS];

    switch (currentPage) {
      case 'HOME':
        return (
          <div className="app-container">
            <div className="home-header-fixed">
              <Header />
              <SearchBar />
              <FilterPills />
              <div className="section-header">
                <h2 className="section-title">Restaurants Near You</h2>
                <a href="#" className="view-all-link">View All</a>
              </div>
            </div>
            <div className="restaurants-list">
              {allRestaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => handleRestaurantClick(restaurant)}
                />
              ))}
            </div>
            <BottomNav activeTab="HOME" onTabClick={handleTabClick} />
          </div>
        );

      case 'ORDERS':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <OrderHistoryPage onBack={() => setCurrentPage('HOME')} />
            <BottomNav activeTab="ORDERS" onTabClick={handleTabClick} />
          </div>
        );
      case 'SEARCH':
        return (
          <div className="app-container">
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
              Coming Soon
            </div>
            <BottomNav activeTab={currentPage} onTabClick={handleTabClick} />
          </div>
        );

      case 'PROFILE':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <ProfilePage
              onBack={() => setCurrentPage('HOME')}
              onMenuItemClick={handleProfileMenuClick}
            />
            <BottomNav activeTab="PROFILE" onTabClick={handleTabClick} />
          </div>
        );

      case 'PROFILE_ADDRESS':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <AddressPage onBack={() => setCurrentPage('PROFILE')} />
            <BottomNav activeTab="PROFILE" onTabClick={handleTabClick} />
          </div>
        );

      case 'PROFILE_ORDERS':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <OrderHistoryPage onBack={() => setCurrentPage('PROFILE')} />
            <BottomNav activeTab="PROFILE" onTabClick={handleTabClick} />
          </div>
        );

      case 'DETAIL':
        return selectedRestaurant ? (
          <div className="app-container" style={{ padding: 0 }}>
            <RestaurantDetail
              restaurant={selectedRestaurant}
              onBack={() => setCurrentPage('HOME')}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              cart={cart}
              onViewCart={() => setCurrentPage('CHECKOUT')}
            />
            {cart.length > 0 && (
              <div className="cart-floating-bar" onClick={() => setCurrentPage('CHECKOUT')}>
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

      case 'CHECKOUT':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <CheckoutPage
              cart={cart}
              onBack={() => setCurrentPage('DETAIL')}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        );

      case 'TRACKING':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <TrackingPage
              restaurantName={selectedRestaurant?.name || "The Pizza Project"}
              onBack={() => setCurrentPage('HOME')}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="full-app">
      {renderContent()}
    </div>
  );
}

export default App;
