import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // If navigating to file details
import { listDirectoryContents, downloadFile, deleteItem } from '../../services/fileService'; // Adjust path
import FileUploadComponent from '../../components/files/FileUploadComponent'; // Adjust path

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileManagerPage = () => {
  const [currentPath, setCurrentPath] = useState('/'); // Or an array for path segments
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchContents = useCallback(async (path) => {
    setLoading(true);
    setError('');
    try {
      const response = await listDirectoryContents(path);
      if (response.success && response.data.items) {
        setItems(response.data.items);
      } else {
        setError(response.error || `Failed to load contents for ${path}.`);
        setItems([]);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Fetch directory contents error:', err);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContents(currentPath);
  }, [currentPath, fetchContents]);

  const handleNavigate = (item) => {
    if (item.type === 'folder') {
      // Basic path concatenation, a more robust solution would handle this better
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    }
    // If item.type === 'file', could navigate to a file detail page or preview
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const segments = currentPath.split('/').filter(Boolean);
    segments.pop();
    setCurrentPath(segments.length > 0 ? `/${segments.join('/')}` : '/');
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await downloadFile(fileId);
      if (response.success && response.data.downloadUrl) {
        // In a real app, this might be a direct download link or trigger a download
        console.log('Download URL:', response.data.downloadUrl);
        // Forcing download for placeholder
        const link = document.createElement('a');
        link.href = response.data.downloadUrl; // This is a placeholder URL
        link.setAttribute('download', fileName); // Or use a real filename
        document.body.appendChild(link);
        link.click();
        link.remove();
        alert(`Placeholder: Download for ${fileName} would start from ${response.data.downloadUrl}`);
      } else {
        alert(`Failed to get download link: ${response.error}`);
      }
    } catch (err) {
      alert(`Error during download: ${err.message}`);
    }
  };

  const handleDelete = async (itemId, itemType, itemName) => {
    if (window.confirm(`Are you sure you want to delete ${itemType} "${itemName}"?`)) {
      setLoading(true);
      try {
        const response = await deleteItem(itemId, itemType);
        if (response.success) {
          fetchContents(currentPath); // Refresh contents
        } else {
          setError(response.error || `Failed to delete ${itemType}.`);
        }
      } catch (err) {
        setError(`Error deleting ${itemType}: ${err.message}`);
      }
      setLoading(false);
    }
  };
  
  const handleFileUploaded = (newFile) => {
    // Refetch contents to show the new file
    fetchContents(currentPath);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">File Manager</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Upload File
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Upload New File</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-700 hover:text-gray-900 text-2xl">&times;</button>
            </div>
            <FileUploadComponent 
                currentPath={currentPath} 
                onFileUploaded={handleFileUploaded} 
                onClose={() => setShowUploadModal(false)} 
            />
          </div>
        </div>
      )}

      <div className="mb-4 p-3 bg-gray-100 rounded-md flex items-center">
        {currentPath !== '/' && (
          <button onClick={handleGoUp} className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
            &uarr; Up
          </button>
        )}
        <span className="text-gray-600">Current Path: {currentPath}</span>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading files...</p>
      ) : items.length > 0 ? (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.type === 'folder' ? (
                      <button onClick={() => handleNavigate(item)} className="text-indigo-600 hover:text-indigo-800">
                        📁 {item.name}
                      </button>
                    ) : (
                      // Could be a link to a file detail page: <Link to={`/files/${item.id}`}>{item.name}</Link>
                      <span>📄 {item.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type === 'file' ? formatFileSize(parseInt(item.size) * 1024 || 0) : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastModified ? new Date(item.lastModified).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {item.type === 'file' && (
                      <button onClick={() => handleDownload(item.id, item.name)} className="text-blue-600 hover:text-blue-800">Download</button>
                    )}
                    <button onClick={() => handleDelete(item.id, item.type, item.name)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-5">This folder is empty.</p>
      )}
    </div>
  );
};

export default FileManagerPage;

