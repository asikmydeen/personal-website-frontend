import React, { useState, useEffect } from 'react';
import { addPassword, updatePassword } from '../../services/passwordService';
import PasswordGeneratorComponent from './PasswordGeneratorComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../../components/ui/dialog';

const AddEditPasswordComponent = ({ passwordData, onClose, onSaveSuccess, onSubmit, generatedPassword, loading: externalLoading }) => {
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
      setFormData({
        name: passwordData.name || passwordData.serviceName || '',
        url: passwordData.url || passwordData.website || '',
        username: passwordData.username || '',
        password: '', // Do not pre-fill password for security reasons
        notes: passwordData.notes || ''
      });
    }
  }, [passwordData]);

  // Effect to update password field when generatedPassword changes
  useEffect(() => {
    if (generatedPassword) {
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }));
    }
  }, [generatedPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!externalLoading) {
      setLoading(true);
    }
    setError('');
    try {
      // Map form field names to what the API expects
      const payload = {
        serviceName: formData.name,  // API expects 'serviceName' not 'name'
        website: formData.url,       // API expects 'website' not 'url'
        username: formData.username,
        password: formData.password,
        notes: formData.notes
      };

      // Add protocol to URL if missing
      if (payload.website && !payload.website.match(/^https?:\/\//)) {
        payload.website = `https://${payload.website}`;
      }

      // If onSubmit prop is provided, use it (from PasswordListPage)
      if (onSubmit) {
        onSubmit(payload);
        return;
      }

      // Legacy flow using direct API calls
      let response;
      if (passwordData && passwordData.id) {
        response = await updatePassword(passwordData.id, payload);
      } else {
        response = await addPassword(payload);
      }

      if (response.success) {
        if (typeof onSaveSuccess === 'function') {
          onSaveSuccess();
        }
      } else {
        setError(response.error || `Failed to ${passwordData && passwordData.id ? 'update' : 'add'} password.`);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Save password error:', err);
    } finally {
      if (!externalLoading) {
        setLoading(false);
      }
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <>
        {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Service/Website Name*</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className={inputClass} placeholder="e.g., Google, Amazon" />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
            <input type="text" name="url" id="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className={inputClass} placeholder="e.g., google.com" />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username/Email*</label>
            <input type="text" name="username" id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className={inputClass} placeholder="your_username or email@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password*</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              onPasswordGenerated={(password) => setFormData({ ...formData, password })}
              onClose={() => setShowGenerator(false)}
            />
          )}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className={inputClass} placeholder="Security questions, recovery codes, etc."></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={externalLoading || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {(externalLoading || loading) ? 'Saving...' : (passwordData && passwordData.id ? 'Save Changes' : 'Add Password')}
            </button>
          </div>
        </form>
    </>
  );
};

export default AddEditPasswordComponent;
