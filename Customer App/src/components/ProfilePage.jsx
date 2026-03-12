import { useState, useEffect } from 'react';
import {
  User, ArrowLeft, MapPin, Edit, Check, Trash2, Plus,
  Home as HomeIcon, Briefcase, Tag, ChevronRight, History, LogOut
} from 'lucide-react';
import { validatePhone, deleteAddress, setDefaultAddress } from '../userProfileService';

const ProfilePage = ({ onBack, onMenuItemClick, userProfile, onEditProfile, onSignOut, onDeleteAccount, uid, onProfileUpdated, onOpenAddressModal }) => {
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditName(userProfile?.name || '');
    setEditPhone(userProfile?.phone || '');
  }, [userProfile]);

  const handleSaveContact = async () => {
    if (!editName.trim()) { setError('Name is required'); return; }
    const normalized = validatePhone(editPhone);
    if (!normalized) { setError('Enter a valid 10-digit number'); return; }

    setSaving(true);
    await onEditProfile({ name: editName.trim(), phone: normalized });
    setSaving(false);
    setIsEditingContact(false);
  };

  const handleDeleteAddr = async (idx) => {
    if (!window.confirm("Delete this address?")) return;
    await deleteAddress(uid, idx);
    await onProfileUpdated();
  };

  const handleSetDefaultAddr = async (idx) => {
    await setDefaultAddress(uid, idx);
    await onProfileUpdated();
  };

  const addresses = userProfile?.addresses || [];
  const defaultIdx = userProfile?.defaultAddressIndex || 0;

  return (
    <div className="profile-page-new fade-in">
      <div className="profile-glass-header">
        <div className="icon-btn-circle" onClick={onBack}>
          <ArrowLeft size={18} />
        </div>
        <h2 className="profile-title-premium">My Profile</h2>
        <div style={{ width: '36px' }}></div>
      </div>

      <div className="profile-scroll-content">
        {/* Identity & Contact Section */}
        <div className="profile-section-premium">
          <div className="profile-identity-row">
            <div className="premium-avatar">
              <User size={32} color="var(--accent-primary)" />
            </div>
            {!isEditingContact ? (
              <div className="premium-user-info">
                <h3 className="premium-user-name">{userProfile?.name || 'Guest'}</h3>
                <p className="premium-user-phone">{userProfile?.phone || 'No phone set'}</p>
              </div>
            ) : (
              <div className="premium-edit-inline">
                <input
                  className="premium-inline-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your Name"
                />
                <input
                  className="premium-inline-input"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Phone Number"
                />
              </div>
            )}
            <button className="premium-edit-trigger" onClick={() => isEditingContact ? handleSaveContact() : setIsEditingContact(true)}>
              {isEditingContact ? (saving ? '...' : <Check size={18} />) : <Edit size={18} />}
            </button>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="profile-section-premium">
          <div className="section-header-premium">
            <h3 className="section-title-premium" style={{ color: 'white', opacity: 0.9 }}>Saved Addresses</h3>
          </div>

          <div className="premium-address-list">
            {addresses.length === 0 ? (
              <div className="premium-empty-state">
                <MapPin size={24} opacity={0.3} />
                <p>No addresses saved yet</p>
              </div>
            ) : (
              addresses.map((addr, idx) => (
                <div key={idx} className={`premium-address-card-v2 ${idx === defaultIdx ? 'v2-default' : ''}`}>
                  <div className="v2-card-icon-bg">
                    {addr.label === 'Home' ? <HomeIcon size={20} /> : addr.label === 'Work' ? <Briefcase size={20} /> : <Tag size={20} />}
                  </div>
                  <div className="v2-card-content">
                    <div className="v2-card-header">
                      <span className="v2-card-label">{addr.label}</span>
                      {idx === defaultIdx && <span className="v2-default-badge">DEFAULT</span>}
                      <div className="v2-card-actions">
                        <button className="v2-action-btn" onClick={() => onOpenAddressModal({ ...addr, id: idx })}><Edit size={16} /></button>
                        <button className="v2-action-btn" onClick={() => handleDeleteAddr(idx)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="v2-card-address">
                      {addr.flatNo && `${addr.flatNo}, `}
                      {addr.tower && `${addr.tower}, `}
                      {addr.floor && `Floor ${addr.floor}, `}
                      {addr.googleAddress}
                    </p>
                    {idx !== defaultIdx && (
                      <button className="v2-set-default-link" onClick={() => handleSetDefaultAddr(idx)}>Set as default</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="v2-add-new-btn-large" onClick={() => onOpenAddressModal(null)}>
            <Plus size={20} /> Add New Address
          </button>
        </div>

        {/* Quick Links Section */}
        <div className="profile-section-premium">
          <div className="premium-menu-item" onClick={() => onMenuItemClick('HISTORY')}>
            <div className="menu-icon-premium"><History size={20} /></div>
            <span>Order History</span>
            <ChevronRight size={18} className="menu-arrow" />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="profile-section-premium danger-zone-premium">
          <button className="danger-btn-premium" onClick={onSignOut}>
            <LogOut size={18} /> Sign Out
          </button>
          <button className="danger-btn-premium text-red" onClick={onDeleteAccount}>
            <Trash2 size={18} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
