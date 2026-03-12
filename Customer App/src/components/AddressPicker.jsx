import { MapPin, X, Check } from 'lucide-react';

const AddressPicker = ({ addresses, defaultIdx, onSelect, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>Select Address</h3>
          <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)', width: 32, height: 32 }} onClick={onClose}>
            <X size={16} />
          </div>
        </div>
        <div className="saved-addresses-list" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className={`address-card ${idx === defaultIdx ? 'selected-address' : ''}`}
              onClick={() => onSelect(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="address-icon-bg">
                <MapPin size={18} />
              </div>
              <div className="address-info">
                <div className="address-name-row">
                  <span className="address-name">{addr.label}</span>
                  {idx === defaultIdx && <span className="default-badge">DEFAULT</span>}
                </div>
                <p className="address-detail-text">
                  {addr.flatNo && `${addr.flatNo}, `}
                  {addr.tower && `${addr.tower}, `}
                  {addr.googleAddress}
                </p>
              </div>
              {idx === defaultIdx && <Check size={18} color="var(--accent-primary)" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddressPicker;
