import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, Users, ShoppingBag, LogOut } from 'lucide-react';
import './App.css';

import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import DashboardView from './views/DashboardView';
import RestaurantsView from './views/RestaurantsView';
import UsersView from './views/UsersView';
import OrdersView from './views/OrdersView';
import Spinner from './components/Spinner';
import type { User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Auto-grant admin to the owner
        const userEmail = (currentUser.email || '').toLowerCase().trim();
        if (userEmail === 'hitesh.redgreen@gmail.com') {
          try {
            await setDoc(doc(db, 'users', currentUser.uid), {
              email: currentUser.email,
              role: 'admin',
              name: currentUser.displayName || 'Super Admin'
            }, { merge: true });
          } catch (error) {
            console.error("Failed to auto-grant admin to DB:", error);
          }
          setUser(currentUser);
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Check if user is an admin
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setUser(currentUser);
            setIsAdmin(true);
          } else {
            // Not an admin
            await signOut(auth);
            setAuthError(`Access denied. ${currentUser.email} does not have admin privileges.`);
            setUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error reading user doc:", error);
          await signOut(auth);
          setAuthError('Error communicating with database.');
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the role check
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <Spinner fullscreen message="Authenticating Admin..." />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <h2>Admin Login</h2>
          {authError && <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>{authError}</p>}
          <button onClick={handleGoogleLogin} className="btn btn-primary login-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/restaurants', label: 'Restaurants', icon: <Store size={20} /> },
    { path: '/users', label: 'Users', icon: <Users size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
  ];

  return (
    <div className="admin-app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Food Suite Admin</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 500 }}>{user.email}</span>
            <button onClick={handleLogout} className="btn" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <LogOut size={18} color="var(--text-secondary)" />
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/restaurants" element={<RestaurantsView />} />
          <Route path="/users" element={<UsersView />} />
          <Route path="/orders" element={<OrdersView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
