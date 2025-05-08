import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPhoto } from '../../services/photoService'; // Adjust path as needed

const PhotoUploadComponent = ({ albumId, onPhotoUploaded, onClose }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // For more granular progress if API supports
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState({ title: '', description: '', tags: '' });

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
    ]);
    setError(''); // Clear previous errors on new drop
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': []
    },
    multiple: true // Allow multiple files
  });

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one photo to upload.');
      return;
    }
    setUploading(true);
    setError('');
    setUploadProgress(0);

    // In a real scenario, you might upload files one by one or in a batch
    // For simplicity, this example uploads the first file in the array
    // A more robust solution would handle multiple uploads, progress, and errors for each.

    for (const file of files) {
        try {
            // For multiple files, you might want to pass specific metadata per file
            // or apply common metadata as done here.
            const currentFileMetadata = {
                title: metadata.title || file.name, // Use file name if title is not set
                description: metadata.description,
                tags: metadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            const response = await uploadPhoto(file, albumId, currentFileMetadata);
            if (response.success && response.data.photo) {
                console.log('Upload successful for', file.name, response.data.photo);
                if (onPhotoUploaded) {
                    onPhotoUploaded(response.data.photo);
                }
            } else {
                setError(`Upload failed for ${file.name}: ${response.error || 'Unknown error'}`);
                // Optionally, stop further uploads or collect all errors
            }
        } catch (err) {
            setError(`An unexpected error occurred during upload of ${file.name}: ${err.message}`);
            console.error('Upload error for', file.name, err);
            // Optionally, stop further uploads
        }
    }
    setUploading(false);
    setFiles([]); // Clear files after attempting upload
    onClose(); // Close modal after upload attempt
  };

  const thumbs = files.map(file => (
    <div key={file.name} className="border border-gray-300 rounded-md p-2 inline-flex mb-2 mr-2 relative">
      <div className="flex flex-col items-center">
        <img src={file.preview} alt={file.name} className="w-24 h-24 object-cover rounded" onLoad={() => URL.revokeObjectURL(file.preview)} />
        <p className="text-xs mt-1 truncate w-24" title={file.name}>{file.name}</p>
        <button
          onClick={() => handleRemoveFile(file.name)}
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          title="Remove file"
        >
          &times;
        </button>
      </div>
    </div>
  ));

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto">
      <h3 className="text-lg font-semibold mb-4">Upload Photos</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-md cursor-pointer ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-indigo-600">Drop the files here ...</p>
        ) : (
          <p className="text-center text-gray-500">Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {files.length > 0 && (
        <aside className="mt-4 max-h-48 overflow-y-auto">
          {thumbs}
        </aside>
      )}

      {files.length > 0 && (
          <div className="mt-4 space-y-3">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Common Title (optional)</label>
                <input type="text" name="title" id="title" value={metadata.title} onChange={handleMetadataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="E.g., Summer Vacation" />
                <p className="text-xs text-gray-500">If empty, filename will be used as title for each photo.</p>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Common Description (optional)</label>
                <textarea name="description" id="description" value={metadata.description} onChange={handleMetadataChange} rows="2" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Details about the photos"></textarea>
            </div>
            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Common Tags (comma-separated, optional)</label>
                <input type="text" name="tags" id="tags" value={metadata.tags} onChange={handleMetadataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="E.g., beach, sunset, travel" />
            </div>
          </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {uploading ? `Uploading ${files.length} photo(s)...` : `Upload ${files.length} Photo(s)`}
        </button>
      </div>
      {uploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadComponent;
