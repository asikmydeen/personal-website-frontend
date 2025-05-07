import React, { useState, useEffect, useCallback } from 'react';
import { listAllMySharedLinks, revokeShareLink, getShareAnalytics } from '../../services/sharingService'; // Adjust path

const SharedItemsManagementPage = () => {
  const [sharedLinks, setSharedLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null); // For a selected link
  const [selectedLinkIdForAnalytics, setSelectedLinkIdForAnalytics] = useState(null);

  const fetchSharedLinks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAllMySharedLinks(); // This service method needs to exist
      if (response.success && response.data.sharedLinks) {
        setSharedLinks(response.data.sharedLinks);
      } else {
        setError(response.error || 'Failed to load shared links.');
        setSharedLinks([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching shared links.');
      console.error('Fetch shared links error:', err);
      setSharedLinks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSharedLinks();
  }, [fetchSharedLinks]);

  const handleRevokeLink = async (linkId, linkUrl) => {
    if (window.confirm(`Are you sure you want to revoke the share link: ${linkUrl}?`)) {
      setLoading(true); // Indicate loading for the revoke operation
      try {
        const response = await revokeShareLink(linkId);
        if (response.success) {
          fetchSharedLinks(); // Refresh the list
          if (selectedLinkIdForAnalytics === linkId) {
            setAnalyticsData(null);
            setSelectedLinkIdForAnalytics(null);
          }
        } else {
          setError(response.error || 'Failed to revoke link.');
        }
      } catch (err) {
        setError('An unexpected error occurred during revocation.');
        console.error('Revoke link error:', err);
      }
      setLoading(false);
    }
  };

  const handleViewAnalytics = async (linkId) => {
    setSelectedLinkIdForAnalytics(linkId);
    setAnalyticsData(null); // Clear previous data
    // Placeholder: Fetch and display analytics for the linkId
    // This would typically be a modal or a dedicated section
    try {
        const response = await getShareAnalytics(linkId);
        if(response.success && response.data) {
            setAnalyticsData(response.data.analytics);
        } else {
            alert(response.error || "Could not fetch analytics.");
        }
    } catch (e) {
        alert("Error fetching analytics.");
    }
    // For now, just an alert
    // alert(`Placeholder: Analytics for link ID ${linkId} would be shown here.`);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert("Link copied to clipboard!");
    }).catch(err => {
        alert("Failed to copy link.");
        console.error("Clipboard copy error:", err);
    });
  };

  if (loading && sharedLinks.length === 0) {
    return <div className="p-4 text-center">Loading shared items...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Shared Items</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {sharedLinks.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name/Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share Link</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sharedLinks.map(link => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs" title={link.itemName || link.itemType}>{link.itemName || link.itemType || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 truncate max-w-xs">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url} className="hover:underline">
                      {link.url.length > 40 ? `${link.url.substring(0, 40)}...` : link.url}
                    </a>
                    <button onClick={() => copyToClipboard(link.url)} className="ml-2 text-xs text-gray-500 hover:text-gray-700">(Copy)</button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${new Date(link.expiresAt) < new Date() && link.expiresAt ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {new Date(link.expiresAt) < new Date() && link.expiresAt ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleViewAnalytics(link.id)} className="text-indigo-600 hover:text-indigo-900">Analytics</button>
                    <button onClick={() => handleRevokeLink(link.id, link.url)} className="text-red-600 hover:text-red-900">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 py-10 text-lg">You haven't shared any items yet.</p>
      )}

      {selectedLinkIdForAnalytics && analyticsData && (
        <div className="mt-8 p-4 border rounded-md bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Analytics for Link ID: ...{selectedLinkIdForAnalytics.slice(-6)}</h2>
            <p>Total Views: {analyticsData.views || 0}</p>
            <p>Unique Visitors: {analyticsData.uniqueVisitors || 0}</p>
            <p>Last Accessed: {analyticsData.lastAccessed ? new Date(analyticsData.lastAccessed).toLocaleString() : 'Never'}</p>
            {/* Add more analytics data as available */}
            <button onClick={() => { setSelectedLinkIdForAnalytics(null); setAnalyticsData(null);}} className="mt-3 text-sm text-indigo-600 hover:underline">Close Analytics</button>
        </div>
      )}
    </div>
  );
};

export default SharedItemsManagementPage;

