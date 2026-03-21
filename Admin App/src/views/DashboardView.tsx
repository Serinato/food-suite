import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Spinner from '../components/Spinner';

const DashboardView = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    restaurants: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        let totalRevenue = 0;
        let totalOrders = 0;
        ordersSnap.forEach((doc) => {
          totalOrders++;
          const data = doc.data();
          if (data.status !== 'cancelled' && data.totalAmount) {
            totalRevenue += data.totalAmount;
          }
        });

        // Fetch all restaurants
        const restSnap = await getDocs(collection(db, 'restaurants'));
        const totalRestaurants = restSnap.size;

        // Fetch all users
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;

        setStats({
          revenue: totalRevenue,
          orders: totalOrders,
          restaurants: totalRestaurants,
          users: totalUsers
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Spinner message="Loading stats..." />;

  return (
    <div className="content-area fade-in">
      <div className="page-header">
        <h2 className="page-title">Dashboard Overview</h2>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">₹{stats.revenue.toFixed(2)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{stats.orders}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Restaurants</span>
          <span className="stat-value">{stats.restaurants}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Registered Users</span>
          <span className="stat-value">{stats.users}</span>
        </div>
      </div>
      
      <div className="card">
        <h3>Platform Notes</h3>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
          Welcome to the Food Suite Admin Portal. From here you can manage all entities within the ecosystem. 
          Use the sidebar to navigate between Restaurants, Users, and Orders management.
        </p>
      </div>
    </div>
  );
};

export default DashboardView;
