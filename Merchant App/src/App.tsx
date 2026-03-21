import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MenuManager from './pages/MenuManager';
import OrdersPage from './pages/Orders';
import Login from './pages/Login';
import { useMerchantState } from './hooks/useMerchantState';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import './index.css';
import './App.css';

function App() {
  const merchantState = useMerchantState();
  const { user, loading, notifEnabled, setNotifEnabled } = merchantState;

  if (loading) return <div className="app-loading fade-in"><div className="loader"></div></div>;

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route element={
          <Layout 
            restaurantName={merchantState.restaurantName}
            userEmail={user.email}
            notifEnabled={notifEnabled}
            onToggleNotif={() => setNotifEnabled(!notifEnabled)}
            onLogout={() => signOut(auth)}
            context={merchantState}
          />
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/menu" element={<MenuManager />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
