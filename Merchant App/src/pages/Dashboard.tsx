import React, { useRef, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Camera, Image as ImageIcon, Trash2, Plus, X, Loader2, CheckCircle2, LocateFixed, Pencil, Check } from 'lucide-react';
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
  
  const [editingPhoneIdx, setEditingPhoneIdx] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [draftPhone, setDraftPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

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

  useEffect(() => {
    if (showMapModal && mapRef.current && mapLocation && (window as any).google?.maps) {
      const gMaps = (window as any).google.maps;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new gMaps.Map(mapRef.current, {
          center: { lat: mapLocation.lat, lng: mapLocation.lng },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });

        markerRef.current = new gMaps.Marker({
          position: { lat: mapLocation.lat, lng: mapLocation.lng },
          map: mapInstanceRef.current,
          draggable: true,
          animation: gMaps.Animation.DROP
        });

        markerRef.current.addListener('dragend', async () => {
          const pos = markerRef.current?.getPosition();
          if (!pos) return;
          const lat = pos.lat();
          const lng = pos.lng();
          
          try {
            const geocoder = new gMaps.Geocoder();
            const result = await geocoder.geocode({ location: { lat, lng } });
            if (result.results?.[0]) {
              setMapLocation({ lat, lng, address: result.results[0].formatted_address });
            } else {
              setMapLocation({ lat, lng, address: 'Custom Pin Location' });
            }
          } catch (err) {
             setMapLocation({ lat, lng, address: 'Custom Pin Location' });
          }
        });
      } else {
        mapInstanceRef.current.setCenter({ lat: mapLocation.lat, lng: mapLocation.lng });
        markerRef.current?.setPosition({ lat: mapLocation.lat, lng: mapLocation.lng });
      }
    }
  }, [showMapModal]); // Only run when modal opens

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
        let addr = 'Detected Location';
        if (window.google?.maps) {
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            if (result.results?.[0]) {
              addr = result.results[0].formatted_address;
            }
          } catch (err) {
            console.error('Geocoder failed', err);
          }
        }
        setMapLocation({ lat: latitude, lng: longitude, address: addr });
        setShowMapModal(true);
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
    if (editingPhoneIdx !== null || isAddingNew) {
      setPhoneError('Please save (✅) or cancel (❌) this number first.');
      return;
    }
    if (uploadingImage) return; // Prevent saving while uploading
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length <= 100) {
      setRestaurantProfile({ ...restaurantProfile, description: text });
    } else {
      // Truncate to 100 words
      setRestaurantProfile({ ...restaurantProfile, description: words.slice(0, 100).join(' ') + ' ' });
    }
  };

  const addPhone = () => {
    const phones = restaurantProfile.phones || [];
    if (phones.length < 3) {
      setIsAddingNew(true);
      setEditingPhoneIdx(null);
      setDraftPhone('');
      setPhoneError('');
    }
  };

  const removePhone = (idx: number) => {
    const next = [...(restaurantProfile.phones || [])];
    next.splice(idx, 1);
    setRestaurantProfile({ ...restaurantProfile, phones: next });
    if (editingPhoneIdx === idx) {
      cancelPhoneEdit();
    }
  };

  const startEditingPhone = (idx: number, currentVal: string) => {
    setEditingPhoneIdx(idx);
    setIsAddingNew(false);
    setDraftPhone(currentVal);
    setPhoneError('');
  };

  const savePhoneEdit = () => {
    if (draftPhone.length < 10) {
      setPhoneError('Invalid number. Must be 10 digits.');
      return;
    }
    const next = [...(restaurantProfile.phones || [])];
    if (isAddingNew) {
      next.push(draftPhone);
    } else if (editingPhoneIdx !== null) {
      next[editingPhoneIdx] = draftPhone;
    }
    setRestaurantProfile({ ...restaurantProfile, phones: next });
    setEditingPhoneIdx(null);
    setIsAddingNew(false);
    setDraftPhone('');
    setPhoneError('');
  };

  const cancelPhoneEdit = () => {
    setEditingPhoneIdx(null);
    setIsAddingNew(false);
    setDraftPhone('');
    setPhoneError('');
  };

  const handlePhoneBlur = () => {
    if (draftPhone.length > 0 && draftPhone.length < 10) {
      setPhoneError('Invalid number. Must be 10 digits. Click ✅ to save.');
    } else if (draftPhone.length === 10) {
      setPhoneError('Click ✅ to save this number, or ❌ to cancel.');
    } else {
      setPhoneError('Click ❌ to cancel if empty.');
    }
  };

  const currentWordCount = restaurantProfile.description ? restaurantProfile.description.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const safePhones = restaurantProfile.phones || [];

  return (
    <div className="dashboard-container">
      <div className="status-card highlight-card">
        <div>
          <h2>We are currently:</h2>
          <div className="status-badge-lg" data-open={restaurantProfile.isOpen}>
            {restaurantProfile.isOpen && <span className="pulse-dot"></span>}
            {restaurantProfile.isOpen ? 'OPEN' : 'CLOSED'}
          </div>
        </div>
        <div className="toggle-group" onClick={handleToggleOpen} role="button">
          <div className={`switch ${restaurantProfile.isOpen ? 'on' : 'off'}`}>
            <div className="knob"></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="profile-form-container">
        {/* Card 1: Identity */}
        <div className="card-box card-basic card-animation" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title">
            <div className="card-icon">🍳</div>
            Kitchen Identity
          </h2>
          <div className="profile-form">
            <div className="input-group">
              <input
                type="text"
                value={restaurantProfile.name}
                onChange={(e) => setRestaurantProfile({ ...restaurantProfile, name: e.target.value })}
                placeholder="Kitchen's Name"
                className="styled-input"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={restaurantProfile.cuisine}
                onChange={(e) => setRestaurantProfile({ ...restaurantProfile, cuisine: e.target.value })}
                placeholder="Cuisine Type (e.g. Punjabi, Home Cooked)"
                className="styled-input"
                required
              />
            </div>
            <div className="input-group">
              <textarea
                value={restaurantProfile.description}
                onChange={handleDescriptionChange}
                placeholder="You can describe your kitchen here in 100 words.."
                className="styled-input"
                rows={4}
              />
              <div className="word-count">
                {currentWordCount}/100 words
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Location */}
        <div className="card-box card-contact card-animation" style={{ animationDelay: '0.2s' }}>
          <h2 className="card-title">
            <div className="card-icon">📍</div>
            Contact & Location
          </h2>
          <div className="profile-form">
            <div className="input-group">
              <label>Contact Numbers (Up to 3)</label>
              {safePhones.map((phone, idx) => {
                const isEditing = editingPhoneIdx === idx && !isAddingNew;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: '4px' }}>
                    <div className="phone-row" style={{ marginBottom: isEditing && phoneError ? '2px' : '8px' }}>
                      {isEditing ? (
                        <div className="phone-wrapper">
                          <span className="phone-prefix">+91</span>
                          <input
                            type="tel"
                            value={draftPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setDraftPhone(val);
                              if (val.length === 10) setPhoneError('');
                            }}
                            onBlur={handlePhoneBlur}
                            placeholder="98765 43210"
                            className="phone-input"
                            maxLength={10}
                            autoFocus
                          />
                          <button type="button" onClick={savePhoneEdit} onMouseDown={(e) => e.preventDefault()} className="phone-action-btn save" title="Save Number">
                            <Check size={18} />
                          </button>
                          <button type="button" onClick={cancelPhoneEdit} onMouseDown={(e) => e.preventDefault()} className="phone-action-btn cancel" title="Cancel">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="phone-readonly-wrapper">
                          <span className="phone-prefix">+91</span>
                          <span className="phone-display">{phone}</span>
                          <button type="button" onClick={() => startEditingPhone(idx, phone)} className="phone-action-btn edit" title="Edit Number">
                            <Pencil size={16} />
                          </button>
                          {safePhones.length > 1 && (
                            <button type="button" onClick={() => removePhone(idx)} className="phone-action-btn cancel" title="Remove Number" style={{ marginLeft: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing && phoneError && <span className="phone-error-text">{phoneError}</span>}
                  </div>
                );
              })}

              {isAddingNew && (
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '4px' }}>
                  <div className="phone-row" style={{ marginBottom: phoneError ? '2px' : '8px' }}>
                    <div className="phone-wrapper">
                      <span className="phone-prefix">+91</span>
                      <input
                        type="tel"
                        value={draftPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setDraftPhone(val);
                          if (val.length === 10) setPhoneError('');
                        }}
                        onBlur={handlePhoneBlur}
                        placeholder="98765 43210"
                        className="phone-input"
                        maxLength={10}
                        autoFocus
                      />
                      <button type="button" onClick={savePhoneEdit} onMouseDown={(e) => e.preventDefault()} className="phone-action-btn save" title="Save Number">
                        <Check size={18} />
                      </button>
                      <button type="button" onClick={cancelPhoneEdit} onMouseDown={(e) => e.preventDefault()} className="phone-action-btn cancel" title="Cancel">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  {phoneError && <span className="phone-error-text">{phoneError}</span>}
                </div>
              )}

              {!isAddingNew && safePhones.length < 3 && editingPhoneIdx === null && (
                <button type="button" onClick={addPhone} className="add-number-btn">
                  <Plus size={16} /> Add Number
                </button>
              )}
            </div>

            <div className="input-group">
              <label>Kitchen Address</label>
              <div className="location-container" style={{ marginBottom: '12px' }}>
                {(!restaurantProfile.latitude || isEditingLocation) ? (
                  <div className="location-editing">
                    <div className="location-input-wrapper with-icon">
                      <input
                        ref={locationInputCallbackRef}
                        type="text"
                        defaultValue={restaurantProfile.address}
                        onChange={(e) => setRestaurantProfile({ ...restaurantProfile, address: e.target.value })}
                        placeholder="Search Google Places..."
                        className="styled-input pr-12"
                      />
                      <button type="button" className={`inline-locate-btn ${locatingUser ? 'pulsing' : ''}`} onClick={handleUseMyLocation} disabled={locatingUser} title="Drop pin on map">
                        {locatingUser ? <Loader2 size={18} className="spin-anim" /> : <LocateFixed size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="location-display-card">
                    <div className="card-map-pin"></div>
                    <div className="card-content">
                      <div className="location-label">Verified Kitchen Location</div>
                      <div className="location-address">{restaurantProfile.address}</div>
                      <button type="button" className="text-btn change-loc-btn mt-2" onClick={() => setIsEditingLocation(true)}>Change Area Focus</button>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                type="text"
                value={restaurantProfile.detailedAddress || ''}
                onChange={(e) => setRestaurantProfile({ ...restaurantProfile, detailedAddress: e.target.value })}
                placeholder="Flat/House no., Building, Street (Optional)"
                className="styled-input"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Banner */}
        <div className="card-box card-media card-animation" style={{ animationDelay: '0.3s' }}>
          <h2 className="card-title">
            <div className="card-icon">📸</div>
            Kitchen Banner
          </h2>
          <div className="profile-form">
            <div className="input-group" style={{ marginTop: '12px' }}>
              <label>Kitchen Banner Image (Optional)</label>
              <div className="image-options">
                <input type="file" accept="image/*" onChange={handleImageUpload} id="header-image-upload" className="file-input-hidden" disabled={uploadingImage} />
                <label htmlFor="header-image-upload" className={`upload-btn styled-btn-outline ${uploadingImage ? 'disabled' : ''}`}>
                  {uploadingImage ? (
                    <><Loader2 size={18} className="spin-anim" /> Uploading...</>
                  ) : uploadSuccess ? (
                    <><CheckCircle2 size={18} color="#22c55e" /> Uploaded!</>
                  ) : (
                    <><ImageIcon size={18} /> Gallery</>
                  )}
                </label>

                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} id="header-image-camera" className="file-input-hidden" disabled={uploadingImage} />
                <label htmlFor="header-image-camera" className={`upload-btn styled-btn-outline ${uploadingImage ? 'disabled' : ''}`}>
                  {uploadingImage ? (
                    <><Loader2 size={18} className="spin-anim" /> Uploading...</>
                  ) : uploadSuccess ? (
                    <><CheckCircle2 size={18} color="#22c55e" /> Done!</>
                  ) : (
                    <><Camera size={18} /> Camera</>
                  )}
                </label>
              </div>

              {restaurantProfile.image && (
                <div className="image-preview-box">
                  <div className="preview-header">
                    <span className="tiny-caps">Preview</span>
                    <button type="button" onClick={() => { setRestaurantProfile({ ...restaurantProfile, image: '' }); setUploadSuccess(false); }} className="remove-btn">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  <div className="preview-image-wrapper">
                    <img src={restaurantProfile.image} alt="Header" />
                    <div className="preview-gradient-overlay"></div>
                    <div className="preview-content">
                      <div className="preview-text">
                          <h3>{restaurantProfile.name || "Kitchen's Name"}</h3>
                          <p>{restaurantProfile.cuisine || 'Cuisine Type'}</p>
                      </div>
                    </div>
                  </div>
                  <p className="preview-note">
                    This is how kitchen's image will appear to customers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="submit-section card-animation" style={{ animationDelay: '0.4s' }}>
          <button type="submit" className="styled-btn-primary save-btn" disabled={profileSyncing || uploadingImage}>
            {uploadingImage ? 'Image Uploading...' : profileSyncing ? 'Saving Updates...' : 'Save Kitchen Details'}
          </button>
        </div>
      </form>

      {/* Map Modal */}
      {showMapModal && mapLocation && (
        <div className="modal-overlay fade-in map-overlay-override">
          <div className="map-modal-content slide-up">
            <div className="modal-header">
              <h3>Set Exact Location</h3>
              <button type="button" className="close-btn" onClick={() => setShowMapModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-map-container" ref={mapRef}></div>
            <div className="modal-footer modal-map-footer">
              <p className="map-address-text">{mapLocation.address}</p>
              <button type="button" className="styled-btn-primary full-width" onClick={() => {
                setRestaurantProfile(prev => ({ ...prev, address: mapLocation.address, latitude: mapLocation.lat, longitude: mapLocation.lng }));
                setIsEditingLocation(false);
                setShowMapModal(false);
                if (autocompleteInputRef.current) autocompleteInputRef.current.value = mapLocation.address;
              }}>
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
