import React from 'react';
import { LogOut, Bell } from 'lucide-react';
import './TopBar.css';

interface TopBarProps {
  restaurantName: string;
  userEmail: string | null;
  notifEnabled: boolean;
  onToggleNotif: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ restaurantName, userEmail, notifEnabled, onToggleNotif, onLogout }) => {
  return (
    <header className="top-bar">
      <div className="top-bar-content">
        <div className="top-bar-brand">
          <h1>{restaurantName || 'Merchant Portal'}</h1>
          <span className="user-email">{userEmail}</span>
        </div>
        <div className="top-bar-actions">
          <button 
            className={`action-btn notif-btn ${notifEnabled ? 'enabled' : 'disabled'}`}
            onClick={onToggleNotif}
            title={notifEnabled ? 'Disable Alerts' : 'Enable Alerts'}
          >
            <Bell size={20} className={notifEnabled ? 'ringing' : ''} />
          </button>
          <button className="action-btn logout-btn" onClick={onLogout} title="Log Out">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
