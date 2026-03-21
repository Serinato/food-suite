import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { db } from '../firebase';
import Spinner from '../components/Spinner';

const UsersView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setUsers(list);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (id: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', id), {
        role: newRole
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      roleFilter === 'all' || 
      (roleFilter === 'admin' && user.role === 'admin') ||
      (roleFilter === 'user' && user.role !== 'admin');

    return matchesSearch && matchesFilter;
  });

  if (loading) return <Spinner message="Loading users..." />;

  return (
    <div className="content-area fade-in">
      <div className="page-header">
        <h2 className="page-title">Users Management</h2>
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact Info</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td><small>{user.id.substring(0, 8)}...</small></td>
                <td><strong>{user.name || 'Anonymous'}</strong></td>
                <td>{user.email || user.phone || 'N/A'}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'danger' : 'success'}`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn" 
                    style={{ border: '1px solid var(--border)', fontSize: '0.875rem', padding: '4px 8px', backgroundColor: 'var(--background)' }}
                    onClick={() => toggleAdmin(user.id, user.role)}
                  >
                    {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No users found matching criteria</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersView;
