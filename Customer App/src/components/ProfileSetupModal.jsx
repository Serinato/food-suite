import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { validatePhone } from '../userProfileService';

const ProfileSetupModal = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!phone.trim()) { setError('Please enter your phone number'); return; }

    const normalized = validatePhone(phone);
    if (!normalized) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setSaving(true);
    setError('');
    await onSave({ name: name.trim(), phone: normalized });
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <h3 className="modal-title">Welcome! Let's set up your profile</h3>
        <p className="modal-subtitle">We need your details to deliver your order</p>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-field">
          <label className="modal-label">Your Name</label>
          <input
            type="text"
            className="modal-input"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Phone Number</label>
          <div className="modal-phone-row">
            <span className="modal-phone-prefix">+91</span>
            <input
              type="tel"
              className="modal-input"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={12}
            />
          </div>
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Continue'}
          {!saving && <ChevronRight size={18} />}
        </button>

        <button className="modal-skip-btn" onClick={onClose}>
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default ProfileSetupModal;
