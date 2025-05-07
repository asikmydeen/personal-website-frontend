import React, { useState, useEffect, useCallback } from 'react';
import { listPasswords, deletePassword } from '../../services/passwordService'; // Adjust path
import AddEditPasswordComponent from '../../components/passwords/AddEditPasswordComponent'; // Adjust path

const PasswordListPage = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState(null); // For editing
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPasswords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listPasswords();
      if (response.success && response.data.passwords) {
        setPasswords(response.data.passwords);
      } else {
        setError(response.error || 'Failed to load passwords.');
        setPasswords([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching passwords.');
      console.error('Fetch passwords error:', err);
      setPasswords([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const handleAddPassword = () => {
    setSelectedPassword(null);
    setShowAddEditModal(true);
  };

  const handleEditPassword = (password) => {
    setSelectedPassword(password);
    setShowAddEditModal(true);
  };

  const handleDeletePassword = async (passwordId, passwordName) => {
    if (window.confirm(`Are you sure you want to delete the password for "${passwordName}"?`)) {
      setLoading(true); // Indicate loading for the delete operation
      try {
        const response = await deletePassword(passwordId);
        if (response.success) {
          fetchPasswords(); // Refresh the list
        } else {
          setError(response.error || 'Failed to delete password.');
        }
      } catch (err) {
        setError('An unexpected error occurred during deletion.');
        console.error('Delete password error:', err);
      }
      setLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    setShowAddEditModal(false);
    fetchPasswords(); // Refresh list after save
  };

  const filteredPasswords = passwords.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && passwords.length === 0) {
    return <div className="p-4 text-center">Loading passwords...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Password Manager</h1>
        <button 
          onClick={handleAddPassword}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add New Password
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Search passwords (by name, username, URL)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {showAddEditModal && (
        <AddEditPasswordComponent 
          passwordData={selectedPassword}
          onClose={() => setShowAddEditModal(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {filteredPasswords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPasswords.map(pw => (
            <div key={pw.id} className="bg-white shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold text-indigo-700 mb-2 truncate" title={pw.name}>{pw.name}</h2>
              <p className="text-sm text-gray-600 mb-1 truncate"><strong>Username:</strong> {pw.username}</p>
              {pw.url && <p className="text-sm text-gray-600 mb-3 truncate"><strong>URL:</strong> <a href={pw.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{pw.url}</a></p>}
              {/* Password field itself should be masked or handled securely, not displayed directly */}
              {/* <p className="text-sm text-gray-600 mb-1"><strong>Password:</strong> •••••••• </p> */}
              <div className="mt-4 flex justify-end space-x-2">
                <button onClick={() => handleEditPassword(pw)} className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded">Edit</button>
                <button onClick={() => handleDeletePassword(pw.id, pw.name)} className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded">Delete</button>
              </div>
              {pw.lastModified && <p className="text-xs text-gray-400 mt-3 text-right">Last updated: {new Date(pw.lastModified).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 py-5">
          {searchTerm ? `No passwords found matching "${searchTerm}".` : "No passwords saved yet. Click 'Add New Password' to get started!"}
        </p>
      )}
    </div>
  );
};

export default PasswordListPage;

