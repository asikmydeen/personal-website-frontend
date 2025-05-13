import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPhotoDetails, updatePhotoDetails, deletePhoto, generateShareableLink } from '@core/services/photoService';

// Mock: In a real app, user ID would come from auth context
const MOCK_USER_ID = "user123";

const PhotoDetailViewComponent = () => {
  const { photoId } = useParams(); // Assuming route is /photos/:photoId
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', tags: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    if (!photoId) return;

    const fetchPhoto = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getPhotoDetails(photoId);

        if (response.success && response.data.photo) {
          setPhoto(response.data.photo);
          setEditData({
            title: response.data.photo.title || '',
            description: response.data.photo.description || '',
            tags: Array.isArray(response.data.photo.tags) ? response.data.photo.tags.join(', ') : ''
          });
        } else {
          console.error('Failed to load photo:', response.error || 'Unknown error');
          setError(response.error || `Failed to load photo ${photoId}.`);
          // Set photo to null to ensure proper error display
          setPhoto(null);
        }
      } catch (err) {
        console.error('Fetch photo details error:', err);
        setError('An unexpected error occurred while fetching photo details.');
        // Set photo to null to ensure proper error display
        setPhoto(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [photoId]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const tagsArray = editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const updatePayload = { ...editData, tags: tagsArray };

      const response = await updatePhotoDetails(photoId, updatePayload);
      if (response.success && response.data.photo) {
        setPhoto(response.data.photo);
        setEditing(false);
      } else {
        setError(response.error || 'Failed to update photo details.');
      }
    } catch (err) {
      setError('An unexpected error occurred while updating photo.');
      console.error('Update photo error:', err);
    }
    setLoading(false);
  };

  const handleDeletePhoto = async () => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      setLoading(true);
      setError('');
      try {
        const response = await deletePhoto(photoId);
        if (response.success) {
          navigate('/photos'); // Redirect to gallery after deletion
        } else {
          setError(response.error || 'Failed to delete photo.');
        }
      } catch (err) {
        setError('An unexpected error occurred while deleting photo.');
        console.error('Delete photo error:', err);
      }
      setLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setShareLink('');
    setShareError('');
    try {
        const response = await generateShareableLink(photoId, 'photo', { expiry: '7d' }); // Example options
        if(response.success && response.data.shareLink) {
            setShareLink(response.data.shareLink);
        } else {
            setShareError(response.error || 'Could not generate share link.');
        }
    } catch (err) {
        setShareError('Error generating share link.');
        console.error('Share link error:', err);
    }
  };

  if (loading && !photo) {
    return <div className="p-4 text-center">Loading photo details...</div>;
  }

  if (error && !photo) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!photo) {
    return <div className="p-4 text-center">Photo not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link to={photo.albumId ? `/photos/album/${photo.albumId}` : "/photos"} className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to {photo.albumId ? 'Album' : 'Gallery'}
        </Link>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded">{error}</p>}

      <div className="bg-white shadow-lg rounded-lg overflow-hidden md:flex">
        <div className="md:w-1/2">
          <img
            src={photo.url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(photo.title)}`}
            alt={photo.title}
            className="w-full h-auto object-contain max-h-[70vh] bg-gray-100"
          />
        </div>
        <div className="md:w-1/2 p-6">
          {!editing ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{photo.title}</h1>
              {photo.description && <p className="text-gray-600 mb-4 whitespace-pre-wrap">{photo.description}</p>}
              <div className="mb-4">
                <strong className="text-gray-700">Tags:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.isArray(photo.tags) && photo.tags.length > 0 ? (
                    photo.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">{tag}</span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags</span>
                  )}
                </div>
              </div>
              {photo.location && <p className="text-sm text-gray-500 mb-1"><strong>Location:</strong> {photo.location}</p>}
              {photo.takenAt && <p className="text-sm text-gray-500 mb-4"><strong>Taken on:</strong> {new Date(photo.takenAt).toLocaleDateString()}</p>}

              <div className="space-y-3">
                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-150"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleGenerateShareLink}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150"
                >
                  Generate Share Link
                </button>
                {shareLink &&
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-700">Shareable Link:</p>
                        <input type="text" readOnly value={shareLink} className="w-full p-1 border rounded bg-white text-xs" onClick={(e) => e.target.select()} />
                    </div>
                }
                {shareError && <p className="text-red-500 text-xs mt-1">{shareError}</p>}
                <button
                  onClick={handleDeletePhoto}
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-150 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Photo'}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveChanges}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Photo Details</h2>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" id="title" value={editData.title} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" value={editData.description} onChange={handleEditChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input type="text" name="tags" id="tags" value={editData.tags} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              {/* Add fields for location, takenAt if they are editable */}
              <div className="flex space-x-3 mt-6">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} disabled={loading} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoDetailViewComponent;
