import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { db } from '../firebase';
import Spinner from '../components/Spinner';

const RestaurantsView = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'restaurants'));
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRestaurants(list);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'restaurants', id), {
        isVerified: !currentStatus
      });
      fetchRestaurants();
    } catch (error) {
      console.error("Error updating verification:", error);
      alert("Failed to update status.");
    }
  };

  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = 
      rest.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rest.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rest.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rest.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      verificationFilter === 'all' || 
      (verificationFilter === 'verified' && rest.isVerified) ||
      (verificationFilter === 'unverified' && !rest.isVerified);

    return matchesSearch && matchesFilter;
  });

  if (loading) return <Spinner message="Loading restaurants..." />;

  return (
    <div className="content-area fade-in">
      <div className="page-header">
        <h2 className="page-title">Restaurants Management</h2>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, Email, or Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRestaurants.map(rest => (
              <tr key={rest.id}>
                <td><small>{rest.id.substring(0, 8)}...</small></td>
                <td><strong>{rest.name || 'Unnamed'}</strong><br/><small>{rest.email || rest.phone}</small></td>
                <td>
                  <span className={`badge ${rest.isOpen ? 'success' : 'danger'}`}>
                    {rest.isOpen ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${rest.isVerified ? 'success' : 'warning'}`}>
                    {rest.isVerified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn" 
                    style={{ border: '1px solid var(--border)', fontSize: '0.875rem', padding: '4px 8px', backgroundColor: 'var(--background)' }}
                    onClick={() => toggleVerification(rest.id, !!rest.isVerified)}
                  >
                    {rest.isVerified ? 'Revoke' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredRestaurants.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No restaurants found matching criteria</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RestaurantsView;
