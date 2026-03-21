import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { scanMenuFromImage } from '../aiService';
import type { MenuItem, RestaurantProfile } from '../hooks/useMerchantState';
import './MenuManager.css';

interface MenuContext {
  restaurantId: string;
  restaurantProfile: RestaurantProfile;
  menuItems: MenuItem[];
}

const MenuManager: React.FC = () => {
  const { restaurantId, menuItems } = useOutletContext<MenuContext>();
  const [syncing, setSyncing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  const [uploadingDishImage, setUploadingDishImage] = useState(false);
  const [dishImageSuccess, setDishImageSuccess] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '',
    isVeg: '',
    description: '',
    imageUrl: ''
  });

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDishImage(true);
    setDishImageSuccess(false);
    try {
      const storageRef = ref(storage, `dishes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setNewItem(prev => ({ ...prev, imageUrl: downloadURL }));
      setDishImageSuccess(true);
      setTimeout(() => setDishImageSuccess(false), 3000);
    } catch (error) {
      alert("Failed to upload dish image.");
    } finally {
      setUploadingDishImage(false);
      e.target.value = '';
    }
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || newItem.isVeg === '') return;
    setSyncing(true);
    try {
      const itemData = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        isVeg: newItem.isVeg === 'true',
        description: newItem.description,
        imageUrl: newItem.imageUrl,
        isAvailable: true,
        updatedAt: new Date().toISOString(),
        ...(editingItemId ? {} : { createdAt: new Date().toISOString() })
      };

      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
      if (editingItemId) {
        await setDoc(doc(db, 'restaurants', restaurantId, 'menu', editingItemId), itemData, { merge: true });
        setEditingItemId(null);
      } else {
        await addDoc(menuRef, itemData);
      }
      setNewItem({ name: '', price: '', category: '', isVeg: '', description: '', imageUrl: '' });
      setDishImageSuccess(false);
    } catch (_error) {
      alert("Failed to sync with cloud.");
    } finally {
      setSyncing(false);
    }
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      price: item.price.toString(),
      category: item.category || '',
      isVeg: item.isVeg !== undefined ? item.isVeg.toString() : '',
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
    setDishImageSuccess(!!item.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleDishAvailable = async (itemId: string, currentAvail: boolean) => {
    const newAvail = !currentAvail;
    try {
      await setDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId), { isAvailable: newAvail }, { merge: true });
    } catch (_err) {
       // handled optimistically in parent if managed there, else it will just re-sync from firebase
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId));
    } catch (_error) {}
  };

  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setShowScanner(true);
    setScanError(null);
    setScanResults([]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const results = await scanMenuFromImage(base64);
        setScanResults(results);
      } catch (err: any) {
        setScanError(err.message || "Failed to scan menu.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmScan = async () => {
    setSyncing(true);
    try {
      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
      const promises = scanResults.map(item => addDoc(menuRef, {
        ...item,
        isAvailable: true,
        createdAt: new Date().toISOString()
      }));
      await Promise.all(promises);
      alert(`${scanResults.length} items added successfully!`);
      setShowScanner(false);
      setScanResults([]);
    } catch (err) {
      alert("Failed to save scans.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="menu-container">
      <section className="menu-form-section card-box slide-up">
        <div className="section-header-flex">
          <h2>{editingItemId ? 'Edit Dish' : 'Add New Dish'}</h2>
          {!editingItemId && (
            <div className="scan-button-wrapper">
              <input type="file" accept="image/*" onChange={handleScanUpload} id="menu-scan-upload" className="file-input-hidden" />
              <label htmlFor="menu-scan-upload" className="scan-badge">
                ✨ Scan Menu
              </label>
            </div>
          )}
        </div>

        <form onSubmit={handleAddOrEdit} className="menu-form">
          <div className="input-group">
            <label>Dish Name</label>
            <input type="text" value={newItem.name} required onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Paneer Butter Masala" className="styled-input" />
          </div>

          <div className="input-group">
            <label>Dietary Preference</label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="isVeg" value="true" checked={newItem.isVeg === 'true'} onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value })} required />
                <span className="dot veg">●</span> Veg
              </label>
              <label className="radio-label">
                <input type="radio" name="isVeg" value="false" checked={newItem.isVeg === 'false'} onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value })} required />
                <span className="dot non-veg">●</span> Non-Veg
              </label>
            </div>
          </div>

          <div className="input-grid">
            <div className="input-group">
              <label>Price (₹)</label>
              <input type="number" value={newItem.price} required onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="250" className="styled-input" />
            </div>
            <div className="input-group">
              <label>Cuisine / Category</label>
              <input type="text" placeholder="e.g. North Indian" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="styled-input" />
            </div>
          </div>

          <div className="input-group">
            <label>Description (Optional)</label>
            <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Tell customers about this dish..." className="styled-input" />
          </div>

          <div className="input-group">
            <label>Dish Image (Optional)</label>
            <div className="image-options">
              <input type="file" accept="image/*" onChange={handleDishImageUpload} id="dish-image-upload" className="file-input-hidden" />
              <label htmlFor="dish-image-upload" className="upload-btn styled-btn-outline">
                <ImageIcon size={18} /> {uploadingDishImage ? '...' : dishImageSuccess ? 'Uploaded!' : 'Gallery'}
              </label>
              <input type="file" accept="image/*" capture="environment" onChange={handleDishImageUpload} id="dish-image-camera" className="file-input-hidden" />
              <label htmlFor="dish-image-camera" className="upload-btn styled-btn-outline">
                <Camera size={18} /> {uploadingDishImage ? '...' : dishImageSuccess ? 'Done!' : 'Camera'}
              </label>
            </div>
            {newItem.imageUrl && (
              <div className="image-preview-box">
                <div className="preview-header">
                  <span className="tiny-caps">Image Preview</span>
                  <button type="button" onClick={() => { setNewItem({ ...newItem, imageUrl: '' }); setDishImageSuccess(false); }} className="remove-btn">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <div className="preview-image-wrapper">
                  <img src={newItem.imageUrl} alt="Dish" />
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="styled-btn-primary" disabled={syncing}>
              {syncing ? 'Saving...' : editingItemId ? 'Update Dish' : 'Add to Menu'}
            </button>
            {editingItemId && (
              <button type="button" className="styled-btn-secondary" disabled={syncing} onClick={() => {
                setEditingItemId(null);
                setNewItem({ name: '', price: '', category: '', isVeg: '', description: '', imageUrl: '' });
                setDishImageSuccess(false);
              }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="menu-preview-section">
        <div className="preview-header-main">
          <h2>Live Menu Preview</h2>
        </div>
        <div className="preview-list">
          {menuItems.length === 0 ? (
            <p className="empty-msg">No items added yet. Your customers will see an empty menu.</p>
          ) : (
            menuItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(item => (
              <div key={item.id} className={`preview-card ${item.isAvailable === false ? 'unavailable' : ''}`}>
                <div className="card-image-box">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
                </div>
                <div className="card-info">
                  <h3>
                    {item.isVeg !== undefined && (
                      <span className={`dot ${item.isVeg ? 'veg' : 'non-veg'}`}>●</span>
                    )}
                    {item.name}
                  </h3>
                  {item.category && <span className="category-badge">{item.category}</span>}
                  <p className="desc">{item.description}</p>
                </div>
                <div className="card-actions">
                  <div className="price">₹{item.price}</div>
                  <div className="action-buttons">
                    <div className={`switch ${item.isAvailable !== false ? 'on' : 'off'}`} onClick={() => handleToggleDishAvailable(item.id, item.isAvailable !== false)}>
                      <div className="knob"></div>
                    </div>
                    <button className="icon-btn edit-btn" onClick={() => handleEditClick(item)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => handleDelete(item.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="scanner-overlay fade-in">
          <div className="scanner-modal slide-up">
            <div className="modal-header">
              <h3>✨ AI Menu Scanner</h3>
              <button className="close-btn" onClick={() => setShowScanner(false)}>×</button>
            </div>
            <div className="modal-body">
              {scanning ? (
                <div className="scan-loading">
                  <div className="spinner"></div>
                  <p>Gemini is reading your menu...</p>
                </div>
              ) : scanError ? (
                <div className="scan-error">
                  <p>⚠️ {scanError}</p>
                  <label htmlFor="menu-scan-upload" className="styled-btn-secondary">Try different image</label>
                </div>
              ) : (
                <div className="results-list">
                  <p className="hint">Verified {scanResults.length} items.</p>
                  {scanResults.map((item, idx) => (
                    <div key={idx} className="result-item">
                      <input className="item-name" value={item.name} onChange={(e) => {
                        const next = [...scanResults];
                        next[idx].name = e.target.value;
                        setScanResults(next);
                      }} />
                      <div className="item-meta">
                        <input type="number" className="item-price" value={item.price} onChange={(e) => {
                          const next = [...scanResults];
                          next[idx].price = parseFloat(e.target.value);
                          setScanResults(next);
                        }} />
                        <input className="item-cat" placeholder="Cuisine" value={item.category} onChange={(e) => {
                          const next = [...scanResults];
                          next[idx].category = e.target.value;
                          setScanResults(next);
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!scanning && !scanError && (
              <div className="modal-footer">
                <button className="styled-btn-secondary" onClick={() => setShowScanner(false)}>Cancel</button>
                <button className="styled-btn-primary" onClick={handleConfirmScan} disabled={syncing}>
                  {syncing ? 'Adding...' : `Add ${scanResults.length} Items`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
