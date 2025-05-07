import React, { useState, useEffect } from "react";
import { generateShareLink, listSharedLinksForItem, revokeShareLink } from "../../../services/sharingService"; // Adjust path

const ShareModalComponent = ({ itemId, itemType, itemName, onClose }) => {
  const [existingLinks, setExistingLinks] = useState([]);
  const [newLink, setNewLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  // Configuration for new link (example)
  const [expiresIn, setExpiresIn] = useState("7d"); // e.g., 1h, 1d, 7d, 0 (never)
  const [password, setPassword] = useState(""); // Optional password protection
  const [permissions, setPermissions] = useState("view"); // e.g., view, edit (if applicable)

  useEffect(() => {
    const fetchExistingLinks = async () => {
      if (!itemId || !itemType) return;
      setLoading(true);
      setError("");
      try {
        const response = await listSharedLinksForItem(itemId, itemType);
        if (response.success && response.data.sharedLinks) {
          setExistingLinks(response.data.sharedLinks);
        } else {
          setError(response.error || "Failed to load existing share links.");
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching links.");
        console.error("Fetch share links error:", err);
      }
      setLoading(false);
    };
    fetchExistingLinks();
  }, [itemId, itemType]);

  const handleGenerateLink = async () => {
    setGenerating(true);
    setNewLink("");
    setError("");
    try {
      const options = {
        expiresIn: expiresIn === "0" ? null : expiresIn, // API might expect null for never
        password: password || null,
        permissions: permissions,
      };
      const response = await generateShareLink(itemId, itemType, options);
      if (response.success && response.data.shareLink) {
        setNewLink(response.data.shareLink);
        // Optionally, refresh existing links list
        const refreshResponse = await listSharedLinksForItem(itemId, itemType);
        if (refreshResponse.success) setExistingLinks(refreshResponse.data.sharedLinks || []);
      } else {
        setError(response.error || "Failed to generate share link.");
      }
    } catch (err) {
      setError("An unexpected error occurred during link generation.");
      console.error("Generate link error:", err);
    }
    setGenerating(false);
  };

  const handleRevokeLink = async (linkId) => {
    if (window.confirm("Are you sure you want to revoke this share link?")) {
      setLoading(true);
      try {
        const response = await revokeShareLink(linkId);
        if (response.success) {
          setExistingLinks(prev => prev.filter(link => link.id !== linkId));
          if (newLink === linkId) setNewLink(""); // Clear if it was the newly generated one
        } else {
          setError(response.error || "Failed to revoke link.");
        }
      } catch (err) {
        setError("Error revoking link.");
      }
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert("Link copied to clipboard!");
    }).catch(err => {
        alert("Failed to copy link.");
        console.error("Clipboard copy error:", err);
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center p-4 z-[80]">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Share "{itemName || itemType}"</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-100 p-3 rounded-md">{error}</p>}

        {/* Generate New Link Section */}
        <div className="border p-4 rounded-md space-y-3 bg-gray-50">
          <h4 className="text-md font-semibold text-gray-700">Create New Share Link</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="expiresIn" className="block text-xs font-medium text-gray-600">Expires In</label>
              <select id="expiresIn" value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className="mt-1 block w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="0">Never</option>
              </select>
            </div>
            <div>
              <label htmlFor="permissions" className="block text-xs font-medium text-gray-600">Permissions</label>
              <select id="permissions" value={permissions} onChange={(e) => setPermissions(e.target.value)} className="mt-1 block w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                <option value="view">View Only</option>
                {/* Add other permission types if applicable, e.g., "edit" for documents */}
                {/* <option value="edit">View & Edit</option> */}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-600">Password (Optional)</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Leave blank for no password" />
          </div>
          <button 
            onClick={handleGenerateLink} 
            disabled={generating}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Link"}
          </button>
          {newLink && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800 font-semibold">New Link:</p>
              <div className="flex items-center">
                <input type="text" readOnly value={newLink} className="flex-grow p-1 border rounded-l bg-white text-xs" />
                <button onClick={() => copyToClipboard(newLink)} className="px-2 py-1 bg-green-600 text-white text-xs rounded-r hover:bg-green-700">Copy</button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Links Section */}
        <div className="mt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">Existing Share Links</h4>
          {loading && <p className="text-sm text-gray-500">Loading links...</p>}
          {!loading && existingLinks.length === 0 && <p className="text-sm text-gray-500 italic">No active share links for this item.</p>}
          {existingLinks.length > 0 && (
            <ul className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {existingLinks.map(link => (
                <li key={link.id} className="text-xs p-2 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 break-all" title={link.url}>{link.url.length > 50 ? link.url.substring(0,50) + "..." : link.url}</span>
                    <div>
                        <button onClick={() => copyToClipboard(link.url)} className="text-green-600 hover:text-green-800 mr-2 text-xs">Copy</button>
                        <button onClick={() => handleRevokeLink(link.id)} className="text-red-500 hover:text-red-700 text-xs">Revoke</button>
                    </div>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">
                    <span>Expires: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}</span>
                    {link.hasPassword && <span className="ml-2">· Password Protected</span>}
                    {link.permissions && <span className="ml-2">· Permissions: {link.permissions}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModalComponent;

