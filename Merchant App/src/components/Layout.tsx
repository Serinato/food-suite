import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

interface LayoutProps {
  restaurantName: string;
  userEmail: string | null;
  notifEnabled: boolean;
  onToggleNotif: () => void;
  onLogout: () => void;
  context: any; // The full merchant state to pass to pages
}

const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className="app-layout">
      <TopBar 
        restaurantName={props.restaurantName}
        userEmail={props.userEmail}
        notifEnabled={props.notifEnabled}
        onToggleNotif={props.onToggleNotif}
        onLogout={props.onLogout}
      />
      <main className="main-content fade-in">
        <Outlet context={props.context} />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
