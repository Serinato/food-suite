import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Home as HomeIcon, Briefcase, Tag } from 'lucide-react';
import { addAddress, updateAddress } from '../userProfileService';

const AddressFormModal = ({ isOpen, onClose, userProfile, uid, onProfileUpdated, editAddress }) => {
  const [saving, setSaving] = useState(false);
  const [formLabel, setFormLabel] = useState('Home');
  const [formGoogleAddress, setFormGoogleAddress] = useState('');
  const [formFlatNo, setFormFlatNo] = useState('');
  const [formTower, setFormTower] = useState('');
  const [formFloor, setFormFloor] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formLat, setFormLat] = useState(null);
  const [formLng, setFormLng] = useState(null);
  const [formError, setFormError] = useState('');

  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editAddress) {
      setFormLabel(editAddress.label || 'Home');
      setFormGoogleAddress(editAddress.googleAddress || '');
      setFormFlatNo(editAddress.flatNo || '');
      setFormTower(editAddress.tower || '');
      setFormFloor(editAddress.floor || '');
      setFormLandmark(editAddress.landmark || '');
      setFormLat(editAddress.latitude || null);
      setFormLng(editAddress.longitude || null);
    } else {
      setFormLabel('Home');
      setFormGoogleAddress('');
      setFormFlatNo('');
      setFormTower('');
      setFormFloor('');
      setFormLandmark('');
      setFormLat(null);
      setFormLng(null);
    }
    setFormError('');
  }, [editAddress, isOpen]);

  const setupAutocomplete = useCallback((node) => {
    if (!node || autocompleteRef.current) return;
    inputRef.current = node;

    const tryAttach = () => {
      if (!window.google?.maps?.places) return false;
      const ac = new google.maps.places.Autocomplete(node, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        const addr = place.name
          ? `${place.name}, ${place.formatted_address}`
          : place.formatted_address || '';
        setFormGoogleAddress(addr);
        setFormLat(place.geometry.location.lat());
        setFormLng(place.geometry.location.lng());
      });
      autocompleteRef.current = ac;
      return true;
    };

    if (tryAttach()) return;
    const interval = setInterval(() => {
      if (tryAttach()) clearInterval(interval);
    }, 300);
    setTimeout(() => clearInterval(interval), 10000);
  }, []);

  const handleSave = async () => {
    if (!formGoogleAddress.trim() && !formFlatNo.trim()) {
      setFormError('Please provide either a Location Search or a Flat/House No.');
      return;
    }

    const address = {
      label: formLabel,
      googleAddress: formGoogleAddress,
      flatNo: formFlatNo.trim(),
      tower: formTower.trim(),
      floor: formFloor.trim(),
      landmark: formLandmark.trim(),
      latitude: formLat || 0,
      longitude: formLng || 0,
    };

    setSaving(true);
    try {
      if (editAddress?.id !== undefined) {
        await updateAddress(uid, editAddress.id, address);
      } else {
        await addAddress(uid, address);
      }
      await onProfileUpdated();
      onClose();
    } catch (err) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" onClick={onClose}></div>
        <div className="modal-header-row">
          <h3 className="modal-title">{editAddress ? 'Edit Address' : 'Add New Address'}</h3>
          <button className="modal-close-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {formError && <div className="modal-error">{formError}</div>}

        <div className="addr-form-section">
          <label className="modal-label">Search Location</label>
          <div className="addr-search-wrapper">
            <Search size={16} className="addr-search-icon" />
            <input
              ref={setupAutocomplete}
              type="text"
              className="modal-input addr-search-input"
              placeholder="Search for area, street name..."
              defaultValue={formGoogleAddress}
            />
          </div>
        </div>

        <div className="addr-form-section">
          <label className="modal-label">Address Details</label>
          <input type="text" className="modal-input" placeholder="Flat / House No. *" value={formFlatNo} onChange={e => setFormFlatNo(e.target.value)} />
          <div className="addr-row-2col">
            <input type="text" className="modal-input" placeholder="Tower / Wing" value={formTower} onChange={e => setFormTower(e.target.value)} />
            <input type="text" className="modal-input" placeholder="Floor" value={formFloor} onChange={e => setFormFloor(e.target.value)} />
          </div>
          <input type="text" className="modal-input" placeholder="Landmark (optional)" value={formLandmark} onChange={e => setFormLandmark(e.target.value)} />
        </div>

        <div className="addr-form-section">
          <label className="modal-label">Save As</label>
          <div className="addr-label-chips">
            {['Home', 'Work', 'Other'].map(opt => (
              <div
                key={opt}
                className={`addr-label-chip ${formLabel === opt ? 'active' : ''}`}
                onClick={() => setFormLabel(opt)}
              >
                {opt === 'Home' ? <HomeIcon size={14} /> : opt === 'Work' ? <Briefcase size={14} /> : <Tag size={14} />}
                <span>{opt}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : (editAddress ? 'Update Address' : 'Save Address')}
        </button>
      </div>
    </div>
  );
};

export default AddressFormModal;
