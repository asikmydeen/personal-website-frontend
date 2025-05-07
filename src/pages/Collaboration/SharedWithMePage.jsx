import React, { useState, useEffect, useCallback } from 'react';
import { listItemsSharedWithMe } from '../../services/collaborationService'; // Adjust path
// You might need a generic way to link to different item types, or specific components
// For simplicity, this example just lists them.

const SharedWithMePage = () => {
  const [sharedItems, setSharedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSharedItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listItemsSharedWithMe(); // This service needs to exist
      if (response.success && response.data.items) {
        setSharedItems(response.data.items);
      } else {
        setError(response.error || 'Failed to load items shared with you.');
        setSharedItems([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching shared items.');
      console.error('Fetch shared items error:', err);
      setSharedItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSharedItems();
  }, [fetchSharedItems]);

  const getItemTypeDisplayName = (type) => {
    switch (type) {
      case 'photo': return 'Photo';
      case 'album': return 'Photo Album';
      case 'file': return 'File';
      case 'folder': return 'Folder';
      case 'note': return 'Note';
      case 'resume': return 'Resume';
      // Add more as needed
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Placeholder for navigating to the item - requires a router and knowledge of item paths
  const handleViewItem = (item) => {
    alert(`Placeholder: Navigating to ${item.type} "${item.name}" (ID: ${item.id})`);
    // Example: navigate(`/${item.type}/${item.id}`);
  };

  if (loading && sharedItems.length === 0) {
    return <div className="p-4 text-center">Loading items shared with you...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Items Shared With Me</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {sharedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedItems.map(item => (
            <div 
              key={item.id} 
              className="bg-white shadow-lg rounded-xl p-5 hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between"
              onClick={() => handleViewItem(item)}
            >
              <div>
                <h2 className="text-xl font-semibold text-indigo-700 mb-2 truncate" title={item.name}>
                  {item.name || 'Untitled Item'}
                </h2>
                <p className="text-sm text-gray-500 mb-1">Type: {getItemTypeDisplayName(item.type)}</p>
                <p className="text-sm text-gray-500 mb-3">Shared by: <span className="font-medium text-gray-700">{item.sharedByEmail || 'Unknown User'}</span></p>
                {item.permissions && <p className="text-xs text-gray-400 mb-1">Your permissions: <span className="font-semibold">{item.permissions}</span></p>}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 text-right">
                <span className="text-xs text-gray-400">Shared on: {new Date(item.sharedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 py-10 text-lg">No items have been shared with you yet.</p>
      )}
    </div>
  );
};

export default SharedWithMePage;

