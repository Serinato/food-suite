import { Home as HomeIcon, ClipboardList, Search, User } from 'lucide-react';

const BottomNav = ({ activeTab, onTabClick }) => {
  const items = [
    { id: 'HOME', label: 'Home', icon: HomeIcon },
    { id: 'ORDERS', label: 'Orders', icon: ClipboardList },
    { id: 'SEARCH', label: 'Search', icon: Search },
    { id: 'PROFILE', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <div
          key={item.id}
          className={`nav-item ${activeTab === item.id || (activeTab === 'PROFILE_ORDERS' && item.id === 'PROFILE') || (activeTab === 'PROFILE_ADDRESS' && item.id === 'PROFILE') ? 'active' : ''}`}
          onClick={() => onTabClick(item.id)}
        >
          <item.icon size={22} />
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default BottomNav;
