import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Navigation, Star, Phone, MessageCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const TrackingPage = ({ orderId, onBack, restaurantName }) => {
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setOrderData({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [orderId]);

  const stages = ['placed', 'confirmed', 'preparing', 'on_way', 'delivered'];
  const statusLabels = {
    'placed': 'PLACED',
    'confirmed': 'CONFIRMED',
    'preparing': 'PREPARING',
    'on_way': 'ON WAY',
    'delivered': 'DELIVERED'
  };

  const statusMessages = {
    'placed': 'Your order is placed. Waiting for restaurant to confirm.',
    'confirmed': 'Restaurant has confirmed your order.',
    'preparing': 'Your food is being prepared.',
    'on_way': 'Your order is out for delivery.',
    'delivered': 'Your order has been delivered! Enjoy your meal.'
  };

  const currentStatus = orderData?.status || 'placed';
  const currentIndex = stages.indexOf(currentStatus);
  const progressPercent = currentIndex >= 0 ? (currentIndex * 100) / (stages.length - 1) : 0;

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
          <h2 className="arriving-text">{currentStatus === 'delivered' ? 'Delivered' : 'Arriving Soon'}</h2>
          <p className="order-info-small">Order #{orderId ? orderId.slice(-4).toUpperCase() : '----'} • {orderData?.restaurantName || restaurantName}</p>
        </div>

        <div className="stepper-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div className="stepper-track" style={{ height: '6px', background: '#333', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            <div className="stepper-progress" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progressPercent}%`, background: '#ffc107', transition: 'width 0.5s ease' }}></div>
          </div>
          <div className="stepper-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', fontWeight: 'bold' }}>
            {stages.map((stage, idx) => (
              <span key={stage} className={`step-label ${idx <= currentIndex ? 'active' : ''}`} style={{ color: idx <= currentIndex ? '#ffc107' : '#888' }}>
                {statusLabels[stage]}
              </span>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <p className="status-update-text" style={{ margin: 0, fontSize: '12px' }}>
            <b>Latest update:</b> {statusMessages[currentStatus]}
          </p>
        </div>

        {currentIndex >= 3 && (
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
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
