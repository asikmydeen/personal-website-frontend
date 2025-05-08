// /src/services/photoService.js

import { get, post, put, del } from './apiService';

/**
 * List all photos
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const listPhotos = async () => {
  console.log("[PhotoService] Listing all photos");

  try {
    const response = await get('photos');
    return response;
  } catch (err) {
    console.error('[PhotoService] Error listing photos:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * List albums
 * @returns {Promise<object>} - { success: boolean, data: { albums: [] } | error: string }
 */
export const listAlbums = async () => {
  console.log("[PhotoService] Listing albums");

  try {
    const response = await get('albums');

    if (response.success) {
      // Transform response data to include photo counts
      const albums = response.data.map(album => ({
        id: album.id,
        name: album.name,
        description: album.description,
        coverPhotoId: album.coverPhotoId,
        photoCount: 0, // Default count (will be updated if albumItems are fetched)
        createdAt: album.createdAt,
        updatedAt: album.updatedAt
      }));

      // Optionally fetch photo counts for each album
      // This would require an additional API call which might not be efficient
      // In a real app, the API might provide this count directly

      return {
        success: true,
        data: { albums }
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch albums"
      };
    }
  } catch (err) {
    console.error('[PhotoService] Error listing albums:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Get album details
 * @param {string} albumId
 * @returns {Promise<object>} - { success: boolean, data: { album: {} } | error: string }
 */
export const getAlbumDetails = async (albumId) => {
  console.log("[PhotoService] Getting details for album:", albumId);

  try {
    const response = await get(`albums/${albumId}`);

    if (response.success) {
      return {
        success: true,
        data: { album: response.data }
      };
    } else {
      return {
        success: false,
        error: response.error || `Failed to fetch album ${albumId}`
      };
    }
  } catch (err) {
    console.error('[PhotoService] Error getting album details:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * List photos in an album
 * @param {string} albumId
 * @returns {Promise<object>} - { success: boolean, data: { photos: [] } | error: string }
 */
export const listPhotosInAlbum = async (albumId) => {
  console.log("[PhotoService] Listing photos in album:", albumId);

  try {
    // Direct approach: Get photos filtered by the albumId
    const photosResponse = await get('photos', { albumId });

    if (photosResponse.success) {
      return {
        success: true,
        data: { photos: photosResponse.data }
      };
    } else {
      return {
        success: false,
        error: photosResponse.error || `Failed to fetch photos for album ${albumId}`
      };
    }
  } catch (err) {
    console.error('[PhotoService] Error listing photos in album:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Upload a photo
 * @param {File} photoFile
 * @param {string} albumId (optional)
 * @param {object} metadata (optional, e.g., title, description, tags)
 * @returns {Promise<object>} - { success: boolean, data: { photo: {} } | error: string }
 */
export const uploadPhoto = async (photoFile, albumId, metadata) => {
  console.log("[PhotoService] Uploading photo:", photoFile.name, "to album:", albumId, "Metadata:", metadata);

  try {
    // In a real implementation, you might:
    // 1. Get a pre-signed URL from your backend
    // 2. Upload the image to cloud storage (S3, GCS, etc.)
    // 3. Then send metadata to your backend to create the database record

    // For this mock API, we'll create a photo record directly
    const photoData = {
      userId: 'user1', // Default user for testing
      title: metadata?.title || photoFile.name,
      description: metadata?.description || '',
      url: `/media/photos/${photoFile.name.replace(/\s/g, '_')}`, // Mock URL
      thumbnailUrl: `/media/thumbnails/${photoFile.name.replace(/\s/g, '_')}`, // Mock thumbnail
      albumId: albumId || null,
      width: 1920, // Mock dimensions
      height: 1080,
      size: photoFile.size,
      mimeType: photoFile.type,
      tags: metadata?.tags || [],
      location: metadata?.location || null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      takenAt: metadata?.takenAt || new Date().toISOString()
    };

    const photoResponse = await post('photos', photoData);

    if (!photoResponse.success) {
      return {
        success: false,
        error: photoResponse.error || "Failed to upload photo"
      };
    }

    // If an album is specified, create the album-photo relationship
    if (albumId && photoResponse.success) {
      const albumItemData = {
        photoId: photoResponse.data.id,
        albumId,
        addedAt: new Date().toISOString()
      };

      const albumItemResponse = await post('photoAlbumItems', albumItemData);

      if (!albumItemResponse.success) {
        console.warn(`Photo uploaded but failed to add to album: ${albumItemResponse.error}`);
        // We could delete the photo here if adding to album fails
        // but for this example we'll consider the upload successful
      }
    }

    return {
      success: true,
      data: { photo: photoResponse.data }
    };
  } catch (err) {
    console.error('[PhotoService] Error uploading photo:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during upload"
    };
  }
};

/**
 * Get photo details
 * @param {string} photoId
 * @returns {Promise<object>} - { success: boolean, data: { photo: {} } | error: string }
 */
export const getPhotoDetails = async (photoId) => {
  console.log("[PhotoService] Getting details for photo:", photoId);

  try {
    // Directly fetch all photos and find the one with matching ID
    // This avoids issues with json-server's ID handling
    const allPhotosResponse = await get('photos');

    if (allPhotosResponse.success && Array.isArray(allPhotosResponse.data)) {
      const foundPhoto = allPhotosResponse.data.find(photo => photo.id === photoId);

      if (foundPhoto) {
        return {
          success: true,
          data: { photo: foundPhoto }
        };
      } else {
        return {
          success: false,
          error: `Photo with ID ${photoId} not found`
        };
      }
    }

    return {
      success: false,
      error: allPhotosResponse.error || "Failed to fetch photos"
    };
  } catch (err) {
    console.error('[PhotoService] Error getting photo details:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Update photo details (e.g., title, description, tags)
 * @param {string} photoId
 * @param {object} updateData
 * @returns {Promise<object>} - { success: boolean, data: { photo: {} } | error: string }
 */
export const updatePhotoDetails = async (photoId, updateData) => {
  console.log("[PhotoService] Updating photo:", photoId, "Data:", updateData);

  try {
    const response = await put(`photos/${photoId}`, updateData);

    if (response.success) {
      return {
        success: true,
        data: { photo: response.data }
      };
    } else {
      return {
        success: false,
        error: response.error || `Failed to update photo ${photoId}`
      };
    }
  } catch (err) {
    console.error('[PhotoService] Error updating photo:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Delete a photo
 * @param {string} photoId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deletePhoto = async (photoId) => {
  console.log("[PhotoService] Deleting photo:", photoId);

  try {
    const response = await del(`photos/${photoId}`);

    return {
      success: response.success,
      ...(response.error && { error: response.error })
    };
  } catch (err) {
    console.error('[PhotoService] Error deleting photo:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Search photos
 * @param {object} query (e.g., tags, location, date)
 * @returns {Promise<object>} - { success: boolean, data: { photos: [] } | error: string }
 */
export const searchPhotos = async (query) => {
  console.log("[PhotoService] Searching photos with query:", query);

  try {
    let endpoint = 'photos/search';
    const queryParams = {};

    // Handle different types of queries
    if (typeof query === 'string') {
      queryParams.q = query;
    } else if (typeof query === 'object') {
      // Convert object to query parameters
      if (query.tag) {
        endpoint = 'photos/tags';
        queryParams.tag = query.tag;
      } else if (query.q) {
        queryParams.q = query.q;
      } else if (query.recent) {
        // This would use a different endpoint in a real API
        // For now, we'll just get all photos sorted by date
        endpoint = 'photos';
        queryParams.sort = 'createdAt';
        queryParams.order = 'desc';
        queryParams.limit = 10;
      }
    }

    const response = await get(endpoint, queryParams);

    if (response.success) {
      return {
        success: true,
        data: { photos: response.data }
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to search photos"
      };
    }
  } catch (err) {
    console.error('[PhotoService] Error searching photos:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Generate a shareable link for a photo or album
 * @param {string} itemId (photoId or albumId)
 * @param {string} itemType ('photo' or 'album')
 * @param {object} shareOptions (e.g., expiry, password)
 * @returns {Promise<object>} - { success: boolean, data: { shareLink: string } | error: string }
 */
export const generateShareableLink = async (itemId, itemType, shareOptions) => {
  console.log("[PhotoService] Generating share link for:", itemType, itemId, "Options:", shareOptions);

  try {
    // Create a sharing link record
    const sharingData = {
      userId: 'user1', // Default user for testing
      resourceType: itemType,
      resourceId: itemId,
      token: `share_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`, // Generate a unique token
      expiresAt: shareOptions.expiry ? new Date(Date.now() + parseDuration(shareOptions.expiry)).toISOString() : null,
      password: shareOptions.password || null,
      accessType: shareOptions.accessType || 'view',
      allowsComments: shareOptions.allowsComments || false,
      viewCount: 0,
      createdAt: new Date().toISOString()
    };

    const response = await post('sharingLinks', sharingData);

    if (response.success) {
      // Construct a shareable URL
      // In a real app, this would be a proper URL to your frontend
      const shareLink = `https://yourdomain.com/share/${response.data.token}`;

      return {
        success: true,
        data: { shareLink, sharingId: response.data.id }
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to create sharing link"
      };
    }
  } catch (err) {
    console.error('[PhotoService] Error generating share link:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
};

/**
 * Helper function to parse duration strings like "7d", "24h" to milliseconds
 * @param {string} duration
 * @returns {number} milliseconds
 */
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([dhm])$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'm': return value * 60 * 1000; // minutes
    default: return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
}
