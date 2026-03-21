import React from 'react';
import { NavLink } from 'react-router-dom';
import { Store, ClipboardList, UtensilsCrossed } from 'lucide-react';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        end
      >
        <Store size={24} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        to="/menu"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <UtensilsCrossed size={24} />
        <span>Menu</span>
      </NavLink>
      <NavLink
        to="/orders"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <ClipboardList size={24} />
        <span>Orders</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
