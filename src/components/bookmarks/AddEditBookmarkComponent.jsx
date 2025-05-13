import React, { useState, useEffect } from 'react';
import { addBookmark, updateBookmark } from '../../services/bookmarkService';

const AddEditBookmarkComponent = ({ bookmarkData, onClose, onSaveSuccess }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookmarkData && bookmarkData.id) {
      setTitle(bookmarkData.title || '');
      setUrl(bookmarkData.url || '');
      setTags(Array.isArray(bookmarkData.tags) ? bookmarkData.tags.join(', ') : '');
    } else {
      // Reset fields for new bookmark
      setTitle('');
      setUrl('');
      setTags('');
    }
  }, [bookmarkData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookmarkDataToSave = {
        title,
        url,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let response;
      if (bookmarkData && bookmarkData.id) {
        response = await updateBookmark(bookmarkData.id, bookmarkDataToSave);
      } else {
        response = await addBookmark(bookmarkDataToSave);
      }

      if (response.success && response.data) {
        if (typeof onSaveSuccess === 'function') {
          onSaveSuccess(response.data);
        }
      } else {
        setError(response.error || `Failed to ${bookmarkData && bookmarkData.id ? 'update' : 'add'} bookmark.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred while ${bookmarkData && bookmarkData.id ? 'updating' : 'creating'} the bookmark.`);
      console.error('Save bookmark error:', err);
    }

    setLoading(false);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title*</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="Bookmark Title"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL*</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className={inputClass}
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="e.g., work, reference, important"
          />
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
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (bookmarkData && bookmarkData.id ? 'Save Changes' : 'Add Bookmark')}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddEditBookmarkComponent;