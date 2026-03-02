import { useState } from 'react';
import './App.css';
import type { MenuItem } from '@food-suite/shared';

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'Main Course',
    description: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category,
      description: newItem.description,
      isAvailable: true
    };

    setMenuItems([...menuItems, item]);
    setNewItem({ name: '', price: '', category: 'Main Course', description: '' });
  };

  return (
    <div className="merchant-container">
      <header className="merchant-header">
        <h1>Merchant Portal</h1>
        <p>Manage your restaurant menu in real-time</p>
      </header>

      <div className="merchant-layout">
        <section className="menu-form-section">
          <h2>Add New Dish</h2>
          <form onSubmit={handleAdd} className="menu-form">
            <div className="input-group">
              <label>Dish Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Paneer Butter Masala"
              />
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="250"
                />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option>Starters</option>
                  <option>Main Course</option>
                  <option>Desserts</option>
                  <option>Beverages</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Delicious creamy gravy with fresh cottage cheese..."
              />
            </div>

            <button type="submit" className="primary-btn">Add to Menu</button>
          </form>
        </section>

        <section className="menu-preview-section">
          <h2>Live Menu Preview</h2>
          <div className="preview-list">
            {menuItems.length === 0 ? (
              <p className="empty-msg">No items added yet. Your customers will see an empty menu.</p>
            ) : (
              menuItems.map(item => (
                <div key={item.id} className="preview-card">
                  <div className="card-info">
                    <h3>{item.name}</h3>
                    <p className="category-badge">{item.category}</p>
                    <p className="desc">{item.description}</p>
                  </div>
                  <div className="card-price">
                    ₹{item.price}
                    <button className="delete-btn">×</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {menuItems.length > 0 && (
            <button className="sync-btn" onClick={() => alert('Connect Firebase to Sync!')}>
              Sync with Customer App
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
