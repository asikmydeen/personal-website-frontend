import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../../services/authService'; // Assuming authService is in src/services

// Mock user ID and token for placeholder - in a real app, this would come from auth context/storage
const MOCK_USER_ID = '1';
const MOCK_TOKEN = 'fake-jwt-token';

const UserProfilePage = () => {
  const [profile, setProfile] = useState({ name: '', email: '', bio: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getUserProfile(MOCK_USER_ID, MOCK_TOKEN);
        if (response.success && response.data.user) {
          setProfile(response.data.user);
        } else {
          setError(response.error || 'Failed to fetch profile.');
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching profile.');
        console.error('Fetch profile error:', err);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({ ...prevProfile, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Remove 'id' and other non-updatable fields if necessary before sending
      const { id, email, ...updateData } = profile; 
      const response = await updateUserProfile(MOCK_USER_ID, updateData, MOCK_TOKEN);
      if (response.success && response.data.user) {
        setProfile(response.data.user);
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
      } else {
        setError(response.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError('An unexpected error occurred while updating profile.');
      console.error('Update profile error:', err);
    }
    setLoading(false);
  };

  if (loading && !profile.email) { // Show loading only on initial fetch
    return <div className="p-4 text-center">Loading profile...</div>;
  }

  if (error && !profile.email) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Profile</h1>
      {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      {!editing ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <strong className="block text-gray-700">Name:</strong>
            <p className="text-gray-900">{profile.name}</p>
          </div>
          <div className="mb-4">
            <strong className="block text-gray-700">Email:</strong>
            <p className="text-gray-900">{profile.email}</p>
          </div>
          <div className="mb-4">
            <strong className="block text-gray-700">Bio:</strong>
            <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || 'Not set'}</p>
          </div>
          <button 
            onClick={() => { setEditing(true); setSuccessMessage(''); setError(''); }}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={profile.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (cannot be changed)</label>
            <input
              type="email"
              name="email"
              id="email"
              value={profile.email}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              id="bio"
              rows="4"
              value={profile.bio}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(''); setSuccessMessage(''); /* TODO: Optionally refetch profile to discard changes */ }}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfilePage;

