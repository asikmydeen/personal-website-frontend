import React, { useState, useEffect, useCallback } from 'react';
import { listBookmarks, addBookmark, updateBookmark, deleteBookmark } from '../../services/bookmarkService'; // Adjust path

const BookmarkManagerPage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state for adding/editing bookmarks
  const [isEditing, setIsEditing] = useState(false);
  const [currentBookmark, setCurrentBookmark] = useState({ id: null, url: '', title: '', description: '', tags: '' });
  const [showFormModal, setShowFormModal] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listBookmarks();
      if (response.success && response.data.bookmarks) {
        setBookmarks(response.data.bookmarks);
      } else {
        setError(response.error || 'Failed to load bookmarks.');
        setBookmarks([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching bookmarks.');
      console.error('Fetch bookmarks error:', err);
      setBookmarks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBookmark(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitBookmark = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const bookmarkData = {
        url: currentBookmark.url,
        title: currentBookmark.title,
        description: currentBookmark.description,
        tags: currentBookmark.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let response;
      if (isEditing && currentBookmark.id) {
        response = await updateBookmark(currentBookmark.id, bookmarkData);
      } else {
        response = await addBookmark(bookmarkData);
      }

      if (response.success && response.data.bookmark) {
        fetchBookmarks(); // Refresh the list
        setShowFormModal(false);
        resetForm();
      } else {
        setError(response.error || `Failed to ${isEditing ? 'update' : 'add'} bookmark.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred.`);
      console.error('Save bookmark error:', err);
    }
    setLoading(false);
  };

  const handleEdit = (bookmark) => {
    setIsEditing(true);
    setCurrentBookmark({
        id: bookmark.id,
        url: bookmark.url || '',
        title: bookmark.title || '',
        description: bookmark.description || '',
        tags: Array.isArray(bookmark.tags) ? bookmark.tags.join(', ') : ''
    });
    setShowFormModal(true);
  };

  const handleDelete = async (bookmarkId) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      setLoading(true);
      setError('');
      try {
        const response = await deleteBookmark(bookmarkId);
        if (response.success) {
          fetchBookmarks(); // Refresh list
        } else {
          setError(response.error || 'Failed to delete bookmark.');
        }
      } catch (err) {
        setError('An unexpected error occurred while deleting.');
        console.error('Delete bookmark error:', err);
      }
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setIsEditing(false);
    setCurrentBookmark({ id: null, url: '', title: '', description: '', tags: '' });
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  if (loading && bookmarks.length === 0) {
    return <div className="p-4 text-center">Loading bookmarks...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Bookmark Manager</h1>
        <button 
          onClick={openAddModal}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add Bookmark
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {showFormModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-lg">
            <form onSubmit={handleSubmitBookmark} className="space-y-4">
              <h2 className="text-xl font-semibold mb-3">{isEditing ? 'Edit' : 'Add New'} Bookmark</h2>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL*</label>
                <input type="url" name="url" id="url" value={currentBookmark.url} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="https://example.com" />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" id="title" value={currentBookmark.title} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Bookmark Title (optional, will try to fetch if empty)" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" value={currentBookmark.description} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Short description (optional)"></textarea>
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input type="text" name="tags" id="tags" value={currentBookmark.tags} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., tech, news, articles" />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => { setShowFormModal(false); resetForm(); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Bookmark')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map(bm => (
            <div key={bm.id} className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <a href={bm.url} target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                    {bm.title || bm.url}
                  </a>
                  {bm.title && <p className="text-sm text-gray-500 break-all">{bm.url}</p>}
                  {bm.description && <p className="text-gray-700 mt-1 text-sm">{bm.description}</p>}
                </div>
                <div className="flex-shrink-0 ml-4 space-x-2">
                  <button onClick={() => handleEdit(bm)} className="text-sm text-blue-500 hover:text-blue-700">Edit</button>
                  <button onClick={() => handleDelete(bm.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
              {bm.tags && bm.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {bm.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 py-5">No bookmarks saved yet. Click "Add Bookmark" to get started!</p>
      )}
    </div>
  );
};

export default BookmarkManagerPage;

