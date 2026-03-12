import { useState } from 'react';
import {
  ArrowLeft, Share2, Heart, Star, Clock, MapPin,
  Plus, Minus
} from 'lucide-react';

const RestaurantDetail = ({ restaurant, items, onBack, onAddToCart, onRemoveFromCart, cart }) => {
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

export default RestaurantDetail;
