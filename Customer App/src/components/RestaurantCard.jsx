import { Heart, Clock, Route } from 'lucide-react';

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

export default RestaurantCard;
