import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../../services/fileService'; // Adjust path as needed

const FileUploadComponent = ({ currentPath, onFileUploaded, onClose }) => {
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    setFilesToUpload(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file => Object.assign(file, {
        // No preview for generic files, but could add if type is image
      }))
    ]);
    setError(''); // Clear previous errors on new drop
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true // Allow multiple files
  });

  const handleRemoveFile = (fileName) => {
    setFilesToUpload(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }
    setUploading(true);
    setError('');

    let allUploadsSuccessful = true;
    for (const file of filesToUpload) {
      try {
        const response = await uploadFile(file, currentPath);
        if (response.success && response.data.file) {
          console.log('Upload successful for', file.name, response.data.file);
          if (onFileUploaded) {
            onFileUploaded(response.data.file);
          }
        } else {
          allUploadsSuccessful = false;
          setError(prevError => `${prevError}Upload failed for ${file.name}: ${response.error || 'Unknown error'}. `);
        }
      } catch (err) {
        allUploadsSuccessful = false;
        setError(prevError => `${prevError}An unexpected error occurred during upload of ${file.name}: ${err.message}. `);
        console.error('Upload error for', file.name, err);
      }
    }
    setUploading(false);
    if (allUploadsSuccessful) {
        setFilesToUpload([]); // Clear files only if all succeed
        if (onClose) onClose(); // Optionally close modal after successful upload attempt
    } else {
        // Keep files in list if some failed, so user can retry or remove them
    }
  };

  const fileList = filesToUpload.map(file => (
    <div key={file.name} className="border border-gray-300 rounded-md p-2 mb-2 flex justify-between items-center">
      <span className="text-sm truncate" title={file.name}>{file.name} - {(file.size / 1024).toFixed(2)} KB</span>
      <button 
        onClick={() => handleRemoveFile(file.name)} 
        className="text-red-500 hover:text-red-700 text-xs font-semibold"
        title="Remove file"
      >
        Remove
      </button>
    </div>
  ));

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto">
      <h3 className="text-lg font-semibold mb-4">Upload Files to {currentPath}</h3>
      {error && <p className="text-red-500 text-sm mb-3 whitespace-pre-wrap">{error}</p>}
      
      <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-md cursor-pointer ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-indigo-600">Drop the files here ...</p>
        ) : (
          <p className="text-center text-gray-500">Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {filesToUpload.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto">
          {fileList}
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
          disabled={uploading || filesToUpload.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {uploading ? `Uploading ${filesToUpload.length} file(s)...` : `Upload ${filesToUpload.length} File(s)`}
        </button>
      </div>
    </div>
  );
};

export default FileUploadComponent;

