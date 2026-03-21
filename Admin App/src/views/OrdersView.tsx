import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Search, X } from 'lucide-react';
import { db } from '../firebase';
import Spinner from '../components/Spinner';

const OrdersView = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setOrders(list);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus
      });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update status.");
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (order.customerInfo?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Spinner message="Loading orders..." />;

  return (
    <div className="content-area fade-in">
      <div className="page-header">
        <h2 className="page-title">Orders Management</h2>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, Customer, or Restaurant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="preparing">Preparing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
              return (
                <tr key={order.id}>
                  <td><small>{order.id.substring(0, 8)}...</small></td>
                  <td><small>{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small></td>
                  <td>{order.customerInfo?.name || 'Anonymous'}<br/><small>{order.customerInfo?.phone}</small></td>
                  <td>{order.restaurantName || 'Unknown'}</td>
                  <td><strong>₹{order.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                  <td>
                    <span className={`badge ${
                      order.status === 'delivered' ? 'success' : 
                      order.status === 'cancelled' ? 'danger' : 'warning'
                    }`}>
                      {order.status || 'placed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        value={order.status || 'placed'} 
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        <option value="placed">Placed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button 
                        className="btn" 
                        style={{ border: '1px solid var(--border)', fontSize: '0.875rem', padding: '4px 8px', backgroundColor: 'var(--background)' }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No orders found matching criteria</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details <small style={{ color: 'var(--text-secondary)' }}>#{selectedOrder.id}</small></h3>
              <button className="btn-icon" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {selectedOrder.customerInfo?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerInfo?.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {selectedOrder.deliveryAddress?.street || 'N/A'}, {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.zipCode}</p>
              </div>

              <div className="modal-section">
                <h4>Restaurant Information</h4>
                <p><strong>Name:</strong> {selectedOrder.restaurantName || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h4>Order Items</h4>
                <table className="data-table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item: any, index: number) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>x{item.quantity}</td>
                        <td>₹{(item.price || 0).toFixed(2)}</td>
                        <td>₹{((item.price || 0) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '16px' }}>Total Amount:</td>
                      <td style={{ fontWeight: 'bold', paddingTop: '16px' }}>₹{selectedOrder.totalAmount?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
