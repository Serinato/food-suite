import { MapPin, Bell } from 'lucide-react';

const Header = ({ userProfile, onClickLocation }) => {
  const addresses = userProfile?.addresses || [];
  const defaultIdx = userProfile?.defaultAddressIndex || 0;
  const currentAddress = addresses[defaultIdx];

  let mainText = "Set Location";
  if (currentAddress) {
    if (currentAddress.googleAddress) {
      const parts = currentAddress.googleAddress.split(',');
      mainText = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
    } else if (currentAddress.landmark) {
      mainText = currentAddress.landmark;
    } else if (currentAddress.flatNo) {
      mainText = `Flat ${currentAddress.flatNo}`;
    }
  } else {
    mainText = "Kolshet, Thane";
  }

  return (
    <header className="header">
      <div className="location-group" onClick={onClickLocation} style={{ cursor: 'pointer' }}>
        <span className="delivering-label">DELIVERING TO</span>
        <div className="location-value active-location-transition">
          <MapPin size={16} color="var(--accent-primary)" />
          <span className="truncate" style={{ maxWidth: '180px' }}>{mainText}</span>
          <span style={{ fontSize: '10px', marginLeft: '2px' }}>▼</span>
        </div>
      </div>
      <div className="notification-bell">
        <Bell size={18} />
      </div>
    </header>
  );
};

export default Header;
