// /src/services/fileService.js

import { get, post, put, del } from './apiService';

/**
 * List files and folders
 * @param {string} path (optional, defaults to root)
 * @returns {Promise<object>} - { success: boolean, data: { items: [] } | error: string }
 */
export const listDirectoryContents = async (path = "/") => {
  console.log("[FileService] Listing contents for path:", path);

  try {
    // Fetch files first
    const filesResponse = await get('files');

    // Also fetch folders for a complete directory listing
    const foldersResponse = await get('folders');

    if (filesResponse.success && foldersResponse.success) {
      // Combine and format files and folders
      const items = [
        // Map folders to the expected format
        ...foldersResponse.data.map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          description: folder.description,
          color: folder.color,
          lastModified: folder.updatedAt
        })),

        // Map files to the expected format
        ...filesResponse.data.map(file => ({
          id: file.id,
          name: file.name,
          type: 'file',
          mimeType: file.mimeType,
          size: file.size,
          url: file.url,
          thumbnailUrl: file.thumbnailUrl,
          folderId: file.folderId,
          tags: file.tags,
          lastModified: file.updatedAt
        }))
      ];

      return {
        success: true,
        data: { items }
      };
    } else {
      return {
        success: false,
        error: filesResponse.error || foldersResponse.error || "Failed to fetch directory contents"
      };
    }
  } catch (err) {
    console.error('[FileService] Error listing directory contents:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Upload a file
 * @param {File} file
 * @param {string} path (optional, where to upload)
 * @returns {Promise<object>} - { success: boolean, data: { file: {} } | error: string }
 */
export const uploadFile = async (file, path = "/") => {
  console.log("[FileService] Uploading file:", file.name, "to path:", path);

  // In a real implementation, you might:
  // 1. First get a pre-signed URL from the backend
  // 2. Upload the file to blob storage directly
  // 3. Then notify the backend that the upload is complete

  // For this mock API, we'll create a file record
  try {
    const fileData = {
      userId: 'user1', // Default user ID for testing
      name: file.name,
      type: determineFileType(file.name),
      mimeType: file.type,
      size: file.size,
      url: `/media/files/${file.name}`, // Mock URL
      thumbnailUrl: `/media/thumbnails/${file.name}`, // Mock thumbnail URL
      folderId: null, // Assumes root folder if not specified
      tags: [],
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = await post('files', fileData);

    if (response.success) {
      return {
        success: true,
        data: {
          file: {
            id: response.data.id,
            name: response.data.name,
            path: path,
            size: `${(response.data.size / 1024 / 1024).toFixed(2)}MB`,
            type: response.data.type,
            createdAt: response.data.createdAt
          }
        }
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to upload file"
      };
    }
  } catch (err) {
    console.error('[FileService] Upload error:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during upload"
    };
  }
};

/**
 * Download a file
 * @param {string} fileId
 * @returns {Promise<object>} - { success: boolean, data: { downloadUrl: string } | error: string }
 */
export const downloadFile = async (fileId) => {
  console.log("[FileService] Requesting download for file:", fileId);

  try {
    // Get file details first
    const response = await get(`files/${fileId}`);

    if (response.success && response.data) {
      // In a real app, this might be a presigned URL from S3/Azure/etc.
      // For the mock API, we'll just return the URL from the file record
      return {
        success: true,
        data: {
          downloadUrl: response.data.url || `/api/v1/files/${fileId}/download`
        }
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to retrieve file download information"
      };
    }
  } catch (err) {
    console.error('[FileService] Download error:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while requesting download"
    };
  }
};

/**
 * Delete a file or folder
 * @param {string} itemId (fileId or folderId)
 * @param {string} itemType ('file' or 'folder')
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteItem = async (itemId, itemType) => {
  console.log("[FileService] Deleting", itemType, ":", itemId);

  try {
    // Choose the appropriate endpoint based on type
    const endpoint = itemType === 'folder' ? `folders/${itemId}` : `files/${itemId}`;

    const response = await del(endpoint);

    return {
      success: response.success,
      ...(response.error && { error: response.error })
    };
  } catch (err) {
    console.error(`[FileService] Error deleting ${itemType}:`, err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during deletion"
    };
  }
};

/**
 * Search files
 * @param {string} query
 * @param {string} path (optional, to search within a specific path)
 * @returns {Promise<object>} - { success: boolean, data: { results: [] } | error: string }
 */
export const searchFiles = async (query, path) => {
  console.log("[FileService] Searching files with query:", query, "in path:", path);

  try {
    // Use the search endpoint from routes.json
    const response = await get('files/search', { q: query });

    if (response.success) {
      // Transform to expected format
      const results = response.data.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        path: path || '/',
        mimeType: file.mimeType,
        size: file.size,
        lastModified: file.updatedAt
      }));

      return {
        success: true,
        data: { results }
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to search files"
      };
    }
  } catch (err) {
    console.error('[FileService] Search error:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during search"
    };
  }
};

/**
 * Helper function to determine file type from file name
 * @param {string} fileName
 * @returns {string} file type
 */
const determineFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();

  const typeMap = {
    // Documents
    'pdf': 'document',
    'doc': 'document',
    'docx': 'document',
    'txt': 'document',
    'rtf': 'document',

    // Spreadsheets
    'xls': 'spreadsheet',
    'xlsx': 'spreadsheet',
    'csv': 'spreadsheet',

    // Presentations
    'ppt': 'presentation',
    'pptx': 'presentation',

    // Images
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    'webp': 'image',

    // Audio
    'mp3': 'audio',
    'wav': 'audio',
    'ogg': 'audio',

    // Video
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'wmv': 'video',

    // Archives
    'zip': 'archive',
    'rar': 'archive',
    'tar': 'archive',
    '7z': 'archive',

    // Code
    'js': 'code',
    'html': 'code',
    'css': 'code',
    'json': 'code',
    'py': 'code',
    'java': 'code',
  };

  return typeMap[extension] || 'other';
};
