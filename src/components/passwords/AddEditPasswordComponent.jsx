import React, { useState, useEffect } from 'react';
import { addPassword, updatePassword, getPasswordDetails } from '../../../services/passwordService'; // Adjust path
import PasswordGeneratorComponent from './PasswordGeneratorComponent'; // Adjust path

const AddEditPasswordComponent = ({ passwordData, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (passwordData && passwordData.id) {
      // Fetch full details if only partial data is passed (e.g., for editing)
      // This is a placeholder; in a real app, you might already have full details or fetch them.
      // For now, assume passwordData contains necessary fields or is null for new.
      setFormData({
        name: passwordData.name || '',
        url: passwordData.url || '',
        username: passwordData.username || '',
        password: passwordData.password || '', // Password should ideally not be pre-filled from list view for security
        notes: passwordData.notes || ''
      });
      // If passwordData.password is a placeholder like '••••••••', clear it
      if (passwordData.password && passwordData.password.startsWith('•')) {
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } else {
      setFormData({ name: '', url: '', username: '', password: '', notes: '' });
    }
  }, [passwordData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratedPassword = (generatedPassword) => {
    setFormData(prev => ({ ...prev, password: generatedPassword }));
    setShowGenerator(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let response;
      const payload = { ...formData };
      // Ensure URL has a protocol if not empty
      if (payload.url && !payload.url.match(/^(\w+:)?\/\//)) {
        payload.url = `https://${payload.url}`;
      }

      if (passwordData && passwordData.id) {
        response = await updatePassword(passwordData.id, payload);
      } else {
        response = await addPassword(payload);
      }

      if (response.success) {
        onSaveSuccess();
      } else {
        setError(response.error || `Failed to ${passwordData && passwordData.id ? 'update' : 'add'} password.`);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Save password error:', err);
    }
    setLoading(false);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{passwordData && passwordData.id ? 'Edit' : 'Add New'} Password</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Service/Website Name*</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="e.g., Google, Amazon" />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
            <input type="text" name="url" id="url" value={formData.url} onChange={handleChange} className={inputClass} placeholder="e.g., google.com" />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username/Email*</label>
            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className={inputClass} placeholder="your_username or email@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password*</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                id="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                className="flex-1 block w-full min-w-0 rounded-none rounded-l-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                placeholder="Enter password or generate"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button type="button" onClick={() => setShowGenerator(true)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">Generate Strong Password</button>
          </div>
          {showGenerator && (
            <PasswordGeneratorComponent 
              onPasswordGenerated={handleGeneratedPassword} 
              onClose={() => setShowGenerator(false)} 
            />
          )}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows="3" className={inputClass} placeholder="Security questions, recovery codes, etc."></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {loading ? 'Saving...' : (passwordData && passwordData.id ? 'Save Changes' : 'Add Password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditPasswordComponent;

