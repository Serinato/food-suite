import React, { useRef, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { RestaurantProfile } from '../hooks/useMerchantState';
import './Dashboard.css';

interface DashboardContext {
  restaurantId: string;
  restaurantProfile: RestaurantProfile;
  setRestaurantProfile: React.Dispatch<React.SetStateAction<RestaurantProfile>>;
  setRestaurantName: React.Dispatch<React.SetStateAction<string>>;
}

const Dashboard: React.FC = () => {
  const { restaurantId, restaurantProfile, setRestaurantProfile, setRestaurantName } = useOutletContext<DashboardContext>();
  const [profileSyncing, setProfileSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  
  const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return;
    if (document.getElementById('google-maps-script')) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_KEY]);

  const attachAutocomplete = (inputEl: HTMLInputElement) => {
    if (autocompleteRef.current) return;
    const ac = new google.maps.places.Autocomplete(inputEl, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry', 'name']
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const addr = place.name
        ? `${place.name}, ${place.formatted_address}`
        : place.formatted_address || '';

      setRestaurantProfile(prev => ({
        ...prev,
        address: addr,
        latitude: lat,
        longitude: lng
      }));
      setIsEditingLocation(false);
    });

    autocompleteRef.current = ac;
  };

  const locationInputCallbackRef = (node: HTMLInputElement | null) => {
    autocompleteInputRef.current = node;
    if (!node) return;
    if (window.google?.maps?.places) {
      attachAutocomplete(node);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval);
        attachAutocomplete(node);
      }
    }, 200);
    setTimeout(() => clearInterval(interval), 15000);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setRestaurantProfile(prev => ({ ...prev, latitude, longitude }));
        if (window.google?.maps) {
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            if (result.results?.[0]) {
              const fullAddress = result.results[0].formatted_address;
              setRestaurantProfile(prev => ({ ...prev, address: fullAddress, latitude, longitude }));
              setIsEditingLocation(false);
              if (autocompleteInputRef.current) autocompleteInputRef.current.value = fullAddress;
            } else throw new Error('No address results.');
          } catch (err) {
            setRestaurantProfile(prev => ({ ...prev, address: 'Detected Location', latitude, longitude }));
            setIsEditingLocation(false);
          }
        } else {
          setRestaurantProfile(prev => ({ ...prev, address: 'Detected Location', latitude, longitude }));
          setIsEditingLocation(false);
        }
        setLocatingUser(false);
      },
      (error) => {
        setLocatingUser(false);
        alert('Location error: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSyncing(true);
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await setDoc(docRef, restaurantProfile, { merge: true });
      setRestaurantName(restaurantProfile.name);
      alert('Profile updated successfully!');
    } catch (_error) {
      alert('Failed to update profile');
    } finally {
      setProfileSyncing(false);
    }
  };

  const handleToggleOpen = async () => {
    const newIsOpen = !restaurantProfile.isOpen;
    setRestaurantProfile(prev => ({ ...prev, isOpen: newIsOpen }));
    try {
      await setDoc(doc(db, 'restaurants', restaurantId), { isOpen: newIsOpen }, { merge: true });
    } catch (_err) {
      setRestaurantProfile(prev => ({ ...prev, isOpen: !newIsOpen }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setUploadSuccess(false);
    try {
      const storageRef = ref(storage, `restaurant/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setRestaurantProfile(prev => ({ ...prev, image: downloadURL }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (_error) {
      alert("Failed to upload image. Ensure Firebase Storage rules allow uploads.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="status-card highlight-card">
        <div>
          <h2>We are currently:</h2>
          <div className="status-badge-lg" data-open={restaurantProfile.isOpen}>
            {restaurantProfile.isOpen ? 'OPEN' : 'CLOSED'}
          </div>
        </div>
        <div className="toggle-group" onClick={handleToggleOpen} role="button">
          <div className={`switch ${restaurantProfile.isOpen ? 'on' : 'off'}`}>
            <div className="knob"></div>
          </div>
        </div>
      </div>

      <section className="profile-section card-box">
        <h2>Restaurant Profile</h2>
        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="input-group">
            <label>Restaurant Name</label>
            <input
              type="text"
              value={restaurantProfile.name}
              onChange={(e) => setRestaurantProfile({ ...restaurantProfile, name: e.target.value })}
              placeholder="e.g. Amara Curry House"
              className="styled-input"
            />
          </div>
          <div className="input-group">
            <label>Cuisine Type</label>
            <input
              type="text"
              value={restaurantProfile.cuisine}
              onChange={(e) => setRestaurantProfile({ ...restaurantProfile, cuisine: e.target.value })}
              placeholder="e.g. Indian, Chinese"
              className="styled-input"
            />
          </div>

          <div className="input-group">
            <label>Header Image</label>
            <div className="image-options">
              <input type="file" accept="image/*" onChange={handleImageUpload} id="header-image-upload" className="file-input-hidden" />
              <label htmlFor="header-image-upload" className="upload-btn styled-btn-outline">
                <ImageIcon size={18} /> {uploadingImage ? '...' : uploadSuccess ? 'Uploaded!' : 'Gallery'}
              </label>

              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} id="header-image-camera" className="file-input-hidden" />
              <label htmlFor="header-image-camera" className="upload-btn styled-btn-outline">
                <Camera size={18} /> {uploadingImage ? '...' : uploadSuccess ? 'Done!' : 'Camera'}
              </label>
            </div>

            {restaurantProfile.image && (
              <div className="image-preview-box">
                <div className="preview-header">
                  <span className="tiny-caps">Customer App Preview</span>
                  <button type="button" onClick={() => { setRestaurantProfile({ ...restaurantProfile, image: '' }); setUploadSuccess(false); }} className="remove-btn">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <div className="preview-image-wrapper">
                  <img src={restaurantProfile.image} alt="Header" />
                  <div className="preview-gradient-overlay"></div>
                  <div className="preview-content">
                    <div className="preview-logo">
                        <img src={restaurantProfile.image} alt="Logo" />
                    </div>
                    <div className="preview-text">
                        <h3>{restaurantProfile.name || 'Your Kitchen'}</h3>
                        <p>{restaurantProfile.cuisine || 'Cuisine'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <div className="location-container">
              {(!restaurantProfile.latitude || isEditingLocation) ? (
                <div className="location-editing">
                  <div className="location-input-wrapper">
                    <input
                      ref={locationInputCallbackRef}
                      type="text"
                      defaultValue={restaurantProfile.address}
                      onChange={(e) => setRestaurantProfile({ ...restaurantProfile, address: e.target.value })}
                      placeholder="Enter restaurant address..."
                      className="styled-input"
                    />
                    <button type="button" className="styled-btn-secondary mt-2 w-full" onClick={handleUseMyLocation} disabled={locatingUser}>
                      {locatingUser ? 'Locating...' : 'Use Current Location'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="location-display-card">
                  <div className="card-map-pin"></div>
                  <div className="card-content">
                    <div className="location-label">Verified Restaurant Location</div>
                    <div className="location-address">{restaurantProfile.address}</div>
                    <button type="button" className="text-btn change-loc-btn mt-2" onClick={() => setIsEditingLocation(true)}>Change Address</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="styled-btn-primary mt-4" disabled={profileSyncing}>
            {profileSyncing ? 'Saving...' : 'Update Settings'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Dashboard;
