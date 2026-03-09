import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  LogOut,
  Trash2,
  History,
  Edit,
  X,
  Check,
  Briefcase,
  Tag,
} from 'lucide-react';
const CATEGORIES = ["Veg", "Non-Veg", "Starters", "Main Course", "Desserts", "Beverages"];
import './App.css';

// --- Home Components ---
const Header = ({ userProfile, onClickLocation }) => {
  const addresses = userProfile?.addresses || [];
  const defaultIdx = userProfile?.defaultAddressIndex || 0;
  const currentAddress = addresses[defaultIdx];

  let mainText = "Set Location";
  if (currentAddress) {
    if (currentAddress.googleAddress) {
      // Try to get a shorter version of the address (e.g., first two parts)
      const parts = currentAddress.googleAddress.split(',');
      mainText = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
    } else if (currentAddress.landmark) {
      mainText = currentAddress.landmark;
    } else if (currentAddress.flatNo) {
      mainText = `Flat ${currentAddress.flatNo}`;
    }
  } else {
    mainText = "Kolshet, Thane"; // Fallback/Default
  }

  return (
    <header className="header">
      <div className="location-group" onClick={onClickLocation} style={{ cursor: 'pointer' }}>
        <span className="delivering-label">DELIVERING TO</span>
        <div className="location-value active-location-transition">
          <MapPin size={16} color="var(--accent-primary)" />
          <span className="truncate" style={{ maxWidth: '180px' }}>{mainText}</span>
          <span style={{ fontSize: '10px', marginLeft: '2px' }}>▼</span>
        </div>
      </div>
      <div className="notification-bell">
        <Bell size={18} />
      </div>
    </header>
  );
};

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

const RestaurantCard = ({ restaurant, onClick }) => {
  const isClosed = !restaurant.isOpen && restaurant.isOpen !== undefined;
  return (
    <div
      className={`restaurant-card fade-in ${isClosed ? 'closed-restaurant' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-image-wrapper">
        <img src={restaurant.image} alt={restaurant.name} className="card-image" />
        {restaurant.tags.includes("FREE DELIVERY") && (
          <div className="free-delivery-badge">FREE DELIVERY</div>
        )}
        {isClosed && (
          <div className="closed-overlay">
            <span className="closed-badge">CLOSED</span>
          </div>
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
};

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
const RestaurantDetail = ({ restaurant, items, onBack, onAddToCart, onRemoveFromCart, cart, onViewCart }) => {
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
          <span>{restaurant.distance || '—'}</span>
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
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>Loading menu...</p>
          ) : items.map(item => (

            <div key={item.id} className={`menu-item-card ${item.isAvailable === false ? 'item-unavailable' : ''}`}>
              <div className="item-left">
                <div className="item-name-row">
                  {item.isVeg !== undefined && (
                    <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                      <div className="veg-indicator-dot"></div>
                    </div>
                  )}
                  {item.isSpicy && <div className="spicy-dot"></div>}
                  <span className="item-name">{item.name}</span>
                  {item.isAvailable === false && <span className="unavailable-label">Not Available</span>}
                </div>
                <p className="item-desc">{item.description}</p>
                <span className="item-price">₹{item.price.toFixed(2)}</span>
              </div>
              <div className="item-right">
                {(item.imageUrl || item.image) && (
                  <img src={item.imageUrl || item.image} alt={item.name} className="item-img" />
                )}
                {item.isAvailable === false ? (
                  <button className="add-btn" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>+ ADD</button>
                ) : getItemCount(item.id) > 0 ? (
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

// --- Profile Setup Modal ---
const ProfileSetupModal = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!phone.trim()) { setError('Please enter your phone number'); return; }

    // Validate Indian phone
    const { validatePhone } = await import('./userProfileService.js');
    const normalized = validatePhone(phone);
    if (!normalized) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setSaving(true);
    setError('');
    await onSave({ name: name.trim(), phone: normalized });
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <h3 className="modal-title">Welcome! Let's set up your profile</h3>
        <p className="modal-subtitle">We need your details to deliver your order</p>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-field">
          <label className="modal-label">Your Name</label>
          <input
            type="text"
            className="modal-input"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Phone Number</label>
          <div className="modal-phone-row">
            <span className="modal-phone-prefix">+91</span>
            <input
              type="tel"
              className="modal-input"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={12}
            />
          </div>
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Continue'}
          {!saving && <ChevronRight size={18} />}
        </button>

        <button className="modal-skip-btn" onClick={onClose}>
          Skip for now
        </button>
      </div>
    </div>
  );
};

// --- Checkout Page Component ---
const CheckoutPage = ({ cart, onBack, onPlaceOrder, userProfile, onChangeAddress }) => {
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

  const defaultAddress = userProfile?.addresses?.[userProfile?.defaultAddressIndex];

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
          <span className="change-link" onClick={onChangeAddress}>Change</span>
        </div>
        {defaultAddress ? (
          <div className="selection-card">
            <div className="icon-wrapper-yellow">
              <MapPin size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">{defaultAddress.label}</h4>
              <p className="card-sub-text">
                {defaultAddress.flatNo && `${defaultAddress.flatNo}, `}
                {defaultAddress.tower && `${defaultAddress.tower}, `}
                {defaultAddress.floor && `Floor ${defaultAddress.floor}, `}
                {defaultAddress.googleAddress}
              </p>
            </div>
          </div>
        ) : (
          <div className="selection-card" onClick={onChangeAddress} style={{ cursor: 'pointer' }}>
            <div className="icon-wrapper-yellow">
              <Plus size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">Add Delivery Address</h4>
              <p className="card-sub-text">Please add an address to continue</p>
            </div>
          </div>
        )}
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
              <p className="card-sub-text">Visa, Mastercard, RuPay</p>
            </div>
            {selectedPayment === 'CARD' && <CheckCircle2 className="check-circle" size={20} />}
          </div>
        </div>
      </div>

      <div className="place-order-wrapper">
        <button
          className="place-order-btn"
          onClick={onPlaceOrder}
          disabled={!defaultAddress}
          style={!defaultAddress ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {!defaultAddress ? 'Add Address to Continue' : `Place Order • ₹${total.toFixed(2)}`}
          <ChevronRight size={18} />
        </button>
        <p className="terms-text">By placing order you agree to our Terms & Conditions</p>
      </div>
    </div>
  );
};

// --- Tracking Page Component ---
const TrackingPage = ({ onBack, restaurantName }) => {
  const [progress, setProgress] = useState(70);

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
const ProfilePage = ({ onBack, onMenuItemClick, userProfile, onEditProfile, onSignOut }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditName(userProfile?.name || '');
    setEditPhone(userProfile?.phone || '');
  }, [userProfile]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) { setEditError('Name is required'); return; }
    const { validatePhone } = await import('./userProfileService.js');
    const normalized = validatePhone(editPhone);
    if (!normalized) { setEditError('Enter a valid 10-digit Indian number'); return; }

    setSaving(true);
    setEditError('');
    await onEditProfile({ name: editName.trim(), phone: normalized });
    setSaving(false);
    setIsEditing(false);
  };

  const menuItems = [
    { id: 'ADDRESS', label: 'Saved Addresses', icon: MapPin },
    { id: 'HISTORY', label: 'Order History', icon: History },
  ];

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="checkout-title">My Profile</h2>
        {!isEditing ? (
          <span className="edit-btn" onClick={() => setIsEditing(true)}>Edit</span>
        ) : (
          <span className="edit-btn" onClick={() => setIsEditing(false)}>Cancel</span>
        )}
      </div>

      <div className="profile-identity">
        <div className="avatar-container">
          <div className="profile-avatar-placeholder">
            <User size={36} color="var(--accent-primary)" />
          </div>
        </div>

        {!isEditing ? (
          <div className="user-text-center">
            <h2 className="user-name-large">{userProfile?.name || 'Guest'}</h2>
            <p className="user-email-small">{userProfile?.phone || 'No phone set'}</p>
          </div>
        ) : (
          <div className="profile-edit-form">
            {editError && <div className="modal-error">{editError}</div>}
            <div className="modal-field">
              <label className="modal-label">Name</label>
              <input
                type="text"
                className="modal-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Phone</label>
              <div className="modal-phone-row">
                <span className="modal-phone-prefix">+91</span>
                <input
                  type="tel"
                  className="modal-input"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                />
              </div>
            </div>
            <button
              className="modal-save-btn"
              onClick={handleSaveEdit}
              disabled={saving}
              style={{ marginTop: '8px' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {!isEditing && (
        <>
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
            <div className="danger-card" onClick={onSignOut}>
              <LogOut size={20} />
              <span className="danger-text">Sign Out</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- Order History Page Component ---
const OrderHistoryPage = ({ onBack }) => {
  const orders = [
    {
      id: '#4421',
      restaurant: 'The Pizza Project - Downtown',
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
      status: 'Delivered',
      date: 'Oct 24, 7:30 PM',
      items: '1x Margherita Classic, 1x Coke Zero, 1x Garlic Bread',
      price: 650.00,
    },
    {
      id: '#4398',
      restaurant: 'The Pizza Project - Uptown',
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
      status: 'Delivered',
      date: 'Oct 15, 8:15 PM',
      items: '2x Pepperoni Feast, 2x Large Coke',
      price: 1240.00,
    },
    {
      id: '#4350',
      restaurant: 'The Pizza Project - Downtown',
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
      status: 'Cancelled',
      date: 'Sep 30, 6:45 PM',
      items: '1x Veggie Supreme, 1x Garlic Bread',
      price: 450.00,
    }
  ];

  return (
    <div className="order-history-page fade-in">
      <div className="order-history-header">
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="checkout-title">Order History</h2>
        <div style={{ width: '40px' }}></div>
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

// --- Address Page Component ---
const AddressPage = ({ onBack, userProfile, uid, onProfileUpdated }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null); // null = adding new; number = editing
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Form state
  const [formLabel, setFormLabel] = useState('Home');
  const [formGoogleAddress, setFormGoogleAddress] = useState('');
  const [formFlatNo, setFormFlatNo] = useState('');
  const [formTower, setFormTower] = useState('');
  const [formFloor, setFormFloor] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formLat, setFormLat] = useState(null);
  const [formLng, setFormLng] = useState(null);
  const [formError, setFormError] = useState('');

  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const addresses = userProfile?.addresses || [];
  const defaultIdx = userProfile?.defaultAddressIndex || 0;
  const atLimit = addresses.length >= 4;

  // Google Places Autocomplete
  const setupAutocomplete = useCallback((node) => {
    if (!node || autocompleteRef.current) return;
    inputRef.current = node;

    const tryAttach = () => {
      if (!window.google?.maps?.places) return false;
      const ac = new google.maps.places.Autocomplete(node, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        const addr = place.name
          ? `${place.name}, ${place.formatted_address}`
          : place.formatted_address || '';
        setFormGoogleAddress(addr);
        setFormLat(place.geometry.location.lat());
        setFormLng(place.geometry.location.lng());
      });
      autocompleteRef.current = ac;
      return true;
    };

    if (tryAttach()) return;
    const interval = setInterval(() => {
      if (tryAttach()) clearInterval(interval);
    }, 300);
    setTimeout(() => clearInterval(interval), 10000);
  }, []);

  const resetForm = () => {
    setFormLabel('Home');
    setFormGoogleAddress('');
    setFormFlatNo('');
    setFormTower('');
    setFormFloor('');
    setFormLandmark('');
    setFormLat(null);
    setFormLng(null);
    setFormError('');
    autocompleteRef.current = null;
  };

  const handleOpenNew = () => {
    resetForm();
    setEditIndex(null);
    setShowForm(true);
  };

  const handleOpenEdit = (idx) => {
    const addr = addresses[idx];
    setFormLabel(addr.label);
    setFormGoogleAddress(addr.googleAddress);
    setFormFlatNo(addr.flatNo || '');
    setFormTower(addr.tower || '');
    setFormFloor(addr.floor || '');
    setFormLandmark(addr.landmark || '');
    setFormLat(addr.latitude || null);
    setFormLng(addr.longitude || null);
    setFormError('');
    setEditIndex(idx);
    setShowForm(true);
    autocompleteRef.current = null;
  };

  const handleSave = async () => {
    if (!formGoogleAddress.trim() && !formFlatNo.trim()) {
      setFormError('Please provide either a Location Search or a Flat/House No.');
      return;
    }

    const address = {
      label: formLabel,
      googleAddress: formGoogleAddress,
      flatNo: formFlatNo.trim(),
      tower: formTower.trim(),
      floor: formFloor.trim(),
      landmark: formLandmark.trim(),
      latitude: formLat || 0,
      longitude: formLng || 0,
    };

    setSaving(true);
    setFormError('');

    try {
      const svc = await import('./userProfileService.js');

      if (!uid) {
        setFormError('User not authenticated.');
        setSaving(false);
        return;
      }

      if (editIndex !== null) {
        await svc.updateAddress(uid, editIndex, address);
      } else {
        const success = await svc.addAddress(uid, address);
        if (!success) { setFormError('Failed to add address (profile might not exist or limit reached).'); setSaving(false); return; }
      }

      await onProfileUpdated();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Save address error:", err);
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (idx) => {
    setDeleting(idx);
    const svc = await import('./userProfileService.js');
    await svc.deleteAddress(uid, idx);
    await onProfileUpdated();
    setDeleting(null);
  };

  const handleSetDefault = async (idx) => {
    const svc = await import('./userProfileService.js');
    await svc.setDefaultAddress(uid, idx);
    await onProfileUpdated();
  };

  const labelOptions = ['Home', 'Work', 'Other'];
  const labelIcons = { Home: HomeIcon, Work: Briefcase, Other: Tag };

  // Address Form
  if (showForm) {
    return (
      <div className="address-page fade-in">
        <div className="profile-header">
          <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => { setShowForm(false); resetForm(); }}>
            <ArrowLeft size={18} />
          </div>
          <h2 className="checkout-title">{editIndex !== null ? 'Edit Address' : 'Add Address'}</h2>
          <div style={{ width: '40px' }}></div>
        </div>

        {formError && <div className="modal-error">{formError}</div>}

        {/* Google Places Search */}
        <div className="addr-form-section">
          <label className="modal-label">Search Location</label>
          <div className="addr-search-wrapper">
            <Search size={16} className="addr-search-icon" />
            <input
              ref={setupAutocomplete}
              type="text"
              className="modal-input addr-search-input"
              placeholder="Search for area, street name..."
              defaultValue={formGoogleAddress}
              onChange={(e) => setFormGoogleAddress(e.target.value)}
            />
          </div>
          {formGoogleAddress && (
            <p className="addr-selected-location">
              <MapPin size={14} color="var(--accent-primary)" />
              <span>{formGoogleAddress}</span>
            </p>
          )}
        </div>

        {/* Specifics */}
        <div className="addr-form-section">
          <label className="modal-label">Address Details</label>

          <div className="modal-field">
            <input
              type="text"
              className="modal-input"
              placeholder="Flat / House No. *"
              value={formFlatNo}
              onChange={e => setFormFlatNo(e.target.value)}
            />
          </div>

          <div className="addr-row-2col">
            <div className="modal-field" style={{ flex: 1 }}>
              <input
                type="text"
                className="modal-input"
                placeholder="Tower / Wing"
                value={formTower}
                onChange={e => setFormTower(e.target.value)}
              />
            </div>
            <div className="modal-field" style={{ flex: 1 }}>
              <input
                type="text"
                className="modal-input"
                placeholder="Floor"
                value={formFloor}
                onChange={e => setFormFloor(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-field">
            <input
              type="text"
              className="modal-input"
              placeholder="Landmark (optional)"
              value={formLandmark}
              onChange={e => setFormLandmark(e.target.value)}
            />
          </div>
        </div>

        {/* Label Selector */}
        <div className="addr-form-section">
          <label className="modal-label">Save As</label>
          <div className="addr-label-chips">
            {labelOptions.map(opt => {
              const Icon = labelIcons[opt];
              return (
                <div
                  key={opt}
                  className={`addr-label-chip ${formLabel === opt ? 'active' : ''}`}
                  onClick={() => setFormLabel(opt)}
                >
                  <Icon size={14} />
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button className="add-new-address-btn" onClick={handleSave} disabled={saving} style={{ position: 'relative', bottom: 'auto', left: 'auto', right: 'auto' }}>
          {saving ? 'Saving...' : (editIndex !== null ? 'Update Address' : 'Save Address')}
        </button>
      </div>
    );
  }

  // Address List
  return (
    <div className="address-page fade-in">
      <div className="profile-header">
        <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="checkout-title">Saved Addresses</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      {addresses.length === 0 ? (
        <div className="addr-empty-state">
          <MapPin size={40} color="var(--text-secondary)" />
          <p>No saved addresses yet</p>
          <span>Add an address to get started</span>
        </div>
      ) : (
        <div className="saved-addresses-list">
          {addresses.map((addr, idx) => {
            const Icon = labelIcons[addr.label] || MapPin;
            return (
              <div key={idx} className="address-card">
                <div className="address-icon-bg">
                  <Icon size={20} />
                </div>
                <div className="address-info">
                  <div className="address-name-row">
                    <span className="address-name">{addr.label}</span>
                    {idx === defaultIdx && <span className="default-badge">DEFAULT</span>}
                  </div>
                  <p className="address-detail-text">
                    {addr.flatNo && `${addr.flatNo}, `}
                    {addr.tower && `${addr.tower}, `}
                    {addr.floor && `Floor ${addr.floor}, `}
                    {addr.googleAddress}
                    {addr.landmark && ` (near ${addr.landmark})`}
                  </p>
                  {idx !== defaultIdx && (
                    <button className="addr-set-default-btn" onClick={() => handleSetDefault(idx)}>
                      Set as default
                    </button>
                  )}
                </div>
                <div className="address-actions">
                  <div className="address-action-btn" onClick={() => handleOpenEdit(idx)}>
                    <Edit size={14} />
                  </div>
                  <div
                    className="address-action-btn"
                    onClick={() => handleDelete(idx)}
                    style={deleting === idx ? { opacity: 0.4 } : {}}
                  >
                    <Trash2 size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!atLimit ? (
        <button className="add-new-address-btn" onClick={handleOpenNew}>
          <Plus size={20} />
          Add New Address
        </button>
      ) : (
        <div className="addr-limit-note">Maximum 4 addresses saved</div>
      )}
    </div>
  );
};

// --- Address Picker (for Checkout) ---
const AddressPicker = ({ addresses, defaultIdx, onSelect, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>Select Address</h3>
          <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)', width: 32, height: 32 }} onClick={onClose}>
            <X size={16} />
          </div>
        </div>
        <div className="saved-addresses-list" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className={`address-card ${idx === defaultIdx ? 'selected-address' : ''}`}
              onClick={() => onSelect(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="address-icon-bg">
                <MapPin size={18} />
              </div>
              <div className="address-info">
                <div className="address-name-row">
                  <span className="address-name">{addr.label}</span>
                  {idx === defaultIdx && <span className="default-badge">DEFAULT</span>}
                </div>
                <p className="address-detail-text">
                  {addr.flatNo && `${addr.flatNo}, `}
                  {addr.tower && `${addr.tower}, `}
                  {addr.googleAddress}
                </p>
              </div>
              {idx === defaultIdx && <Check size={18} color="var(--accent-primary)" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getProfile, createProfile, updateProfile, setDefaultAddress } from './userProfileService.js';
import AuthPage from './AuthPage';

// Haversine formula: calculates distance between two lat/lng points in km
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
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

function App() {
  const [currentPage, setCurrentPage] = useState('HOME');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [cloudMenu, setCloudMenu] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugStatus, setDebugStatus] = useState('Initializing...');
  const [authError, setAuthError] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);

  // User profile state
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [authRedirect, setAuthRedirect] = useState(null);

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

  // 1. Unified Auth and Firestore Listener
  useEffect(() => {
    console.log("Customer App: Starting Unified Auth Flow...");
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Customer App: Auth detected (UID:", user.uid, ")");
        setDebugStatus(`Auth OK: ${user.uid.substring(0, 5)}...`);
        setAuthUser(user);

        // Fetch profile
        fetchUserProfile(user.uid);

        // Only start Firestore listener when auth is confirmed
        if (!unsubscribeSnapshot) {
          unsubscribeSnapshot = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            console.log("Customer App: Restaurants loaded:", list.length);
            setRestaurants(list);
            setLoading(false);
            setDebugStatus(`Connected! Found ${list.length} kitchens.`);
          }, (error) => {
            console.error("Customer App: Firestore error:", error);
            setDbError(error.message);
            setDebugStatus(`DB Er: ${error.code}`);
            setLoading(false);
          });
        }
      } else {
        console.log("Customer App: User is null, attempting anonymous login...");
        setDebugStatus('Logging in cloud anonymously...');
        signInAnonymously(auth).catch((err) => {
          console.error("Customer App: Anonymous Login FAILED:", err);
          setAuthError(err.code || err.message);
          setDebugStatus(`Auth Failed: ${err.code}`);
          setLoading(false);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Get customer's current location for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          console.log('Customer location detected:', pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.log('Customer geolocation not available:', err.message),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);


  // 2. Listen to the specific menu when a restaurant is selected
  useEffect(() => {
    if (!selectedRestaurant) return;

    console.log(`Customer App: Opening Menu Listener for ${selectedRestaurant.id}...`);
    const menuRef = collection(db, 'restaurants', selectedRestaurant.id, 'menu');
    const q = query(menuRef, orderBy('createdAt', 'desc'));

    const unsubscribeMenu = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCloudMenu(items);
    });

    return () => unsubscribeMenu();
  }, [selectedRestaurant?.id]);


  const handleRestaurantClick = (restaurant) => {
    if (restaurant.isOpen === false) {
      alert(`${restaurant.name || 'This restaurant'} is currently closed. Please try again later.`);
      return;
    }
    const enrichedRest = {
      ...restaurant,
      menu: []
    };
    setSelectedRestaurant(enrichedRest);
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
    if (authUser?.isAnonymous) {
      setAuthRedirect('CHECKOUT');
      setCurrentPage('AUTH');
      return;
    }
    if (!userProfile) {
      setShowProfileSetup(true);
      return;
    }
    if (!userProfile.addresses || userProfile.addresses.length === 0) {
      setCurrentPage('PROFILE_ADDRESS');
      return;
    }
    setCurrentPage('TRACKING');
    setCart([]);
    window.scrollTo(0, 0);
  };

  const handleTabClick = (tabId) => {
    if ((tabId === 'PROFILE' || tabId === 'ORDERS') && authUser?.isAnonymous) {
      setAuthRedirect(tabId);
      setCurrentPage('AUTH');
      window.scrollTo(0, 0);
      return;
    }
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

  // Profile handlers
  const handleProfileSetupSave = async ({ name, phone }) => {
    if (!authUser) return;
    await createProfile(authUser.uid, { name, phone });
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
    if (!userProfile?.addresses?.length) {
      setCurrentPage('PROFILE_ADDRESS');
      return;
    }
    setShowAddressPicker(true);
  };

  const handleAddressSelect = async (idx) => {
    if (!authUser) return;
    await setDefaultAddress(authUser.uid, idx);
    await fetchUserProfile(authUser.uid);
    setShowAddressPicker(false);
  };

  const handleGoToCheckout = () => {
    if (authUser?.isAnonymous) {
      setAuthRedirect('CHECKOUT');
      setCurrentPage('AUTH');
      return;
    }
    if (!userProfile) {
      setShowProfileSetup(true);
      return;
    }
    setCurrentPage('CHECKOUT');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      setUserProfile(null);
      setCart([]);
      setCurrentPage('HOME');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const renderContent = () => {
    // Format cloud restaurants for the UI
    const liveRestaurants = restaurants.map(rest => {
      const distKm = customerLocation
        ? calcDistanceKm(customerLocation.lat, customerLocation.lng, rest.latitude, rest.longitude)
        : null;
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


    switch (currentPage) {
      case 'HOME':
        return (
          <div className="app-container">
            <div className="home-header-fixed">
              <Header userProfile={userProfile} onClickLocation={handleChangeAddress} />
              <SearchBar />
              <FilterPills />
              <div className="section-header">
                <h2 className="section-title">Local Restaurants Managed by You</h2>
              </div>
              <div style={{ padding: '4px 16px', fontSize: '10px', opacity: 0.6, background: '#eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cloud Status: {debugStatus}</span>
                {dbError && <span style={{ color: 'red' }}>DB Er: {dbError}</span>}
              </div>
            </div>

            <div className="restaurants-list">
              {liveRestaurants.length === 0 ? (
                <div className="loading-state">
                  <p>Connecting to Food Suite Cloud...</p>
                </div>
              ) : (
                liveRestaurants.map(restaurant => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick(restaurant)}
                  />
                ))
              )}
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
              userProfile={userProfile}
              onEditProfile={handleEditProfile}
              onSignOut={handleSignOut}
            />
            <BottomNav activeTab="PROFILE" onTabClick={handleTabClick} />
          </div>
        );

      case 'PROFILE_ADDRESS':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <AddressPage
              onBack={() => setCurrentPage('PROFILE')}
              userProfile={userProfile}
              uid={authUser?.uid}
              onProfileUpdated={handleProfileUpdated}
            />
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
              items={cloudMenu}
              onBack={() => setCurrentPage('HOME')}
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

      case 'AUTH':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <AuthPage
              onBack={() => setCurrentPage('HOME')}
              onAuthSuccess={(user) => {
                if (authRedirect) {
                  setCurrentPage(authRedirect);
                  setAuthRedirect(null);
                } else {
                  setCurrentPage('HOME');
                }
              }}
            />
          </div>
        );

      case 'CHECKOUT':
        return (
          <div className="app-container" style={{ padding: 0 }}>
            <CheckoutPage
              cart={cart}
              onBack={() => setCurrentPage('DETAIL')}
              onPlaceOrder={handlePlaceOrder}
              userProfile={userProfile}
              onChangeAddress={handleChangeAddress}
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

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          onSave={handleProfileSetupSave}
          onClose={() => setShowProfileSetup(false)}
        />
      )}

      {/* Address Picker Modal */}
      {showAddressPicker && userProfile?.addresses?.length > 0 && (
        <AddressPicker
          addresses={userProfile.addresses}
          defaultIdx={userProfile.defaultAddressIndex || 0}
          onSelect={handleAddressSelect}
          onClose={() => setShowAddressPicker(false)}
        />
      )}
    </div>
  );
}

export default App;
