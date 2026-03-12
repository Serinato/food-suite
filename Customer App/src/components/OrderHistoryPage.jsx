import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft } from 'lucide-react';

const OrderHistoryPage = ({ onBack, userId }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!userId) { setLoadingOrders(false); return; }
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(o => o.customerId === userId);
      setOrders(list);
      setLoadingOrders(false);
    });
    return () => unsub();
  }, [userId]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  };

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
        {loadingOrders ? (
          <div className="loading-state"><p>Loading orders...</p></div>
        ) : orders.length === 0 ? (
          <div className="loading-state"><p>No orders yet. Start ordering!</p></div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-history-card">
              <div className="order-card-top">
                <div className="order-rest-logo" style={{ background: 'var(--surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', width: '44px', height: '44px', fontSize: '18px' }}>🍽️</div>
                <div className="order-info-main">
                  <h4 className="order-rest-name">{order.restaurantName || 'Restaurant'}</h4>
                  <p className="order-meta-info">{order.status} • {formatDate(order.createdAt)}</p>
                </div>
                <span className={`status-badge ${(order.status || '').toLowerCase()}`}>
                  {order.status || 'placed'}
                </span>
              </div>

              <p className="order-items-summary">
                {(order.items || []).map((item, i) => (
                  <span key={i}>
                    <span className="qty-bold">1x</span> {item.name}
                    {i < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>

              <div className="order-card-bottom">
                <span className="order-total-price">₹{(order.totalAmount || 0).toFixed(2)}</span>
                <div className="card-btns-row">
                  {order.status === 'cancelled' ? (
                    <button className="card-btn outline">Help</button>
                  ) : (
                    <button className="card-btn outline">Rate</button>
                  )}
                  <button className="card-btn primary">Reorder</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
