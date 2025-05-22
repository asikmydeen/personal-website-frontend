// backend/src/handlers/photo/photoHandlers.js
const {
  initiatePhotoUpload,
  finalizePhotoUpload,
  getPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  searchPhotos,
  getPhotosByTag,
} = require('../../controllers/photoController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleInitiatePhotoUpload
 * @description Handles the request to initiate a photo upload.
 */
exports.handleInitiatePhotoUpload = createHandler(initiatePhotoUpload);

/**
 * @function handleFinalizePhotoUpload
 * @description Handles the request to finalize a photo upload.
 */
exports.handleFinalizePhotoUpload = createHandler(finalizePhotoUpload);

/**
 * @function handleGetPhotos
 * @description Handles the request to get all photos.
 */
exports.handleGetPhotos = createHandler(getPhotos);

/**
 * @function handleGetPhotoById
 * @description Handles the request to get a single photo by its ID.
 */
exports.handleGetPhotoById = createHandler(getPhotoById);

/**
 * @function handleUpdatePhoto
 * @description Handles the request to update an existing photo's metadata.
 */
exports.handleUpdatePhoto = createHandler(updatePhoto);

/**
 * @function handleDeletePhoto
 * @description Handles the request to delete a photo.
 */
exports.handleDeletePhoto = createHandler(deletePhoto);

/**
 * @function handleSearchPhotos
 * @description Handles the request to search photos.
 */
exports.handleSearchPhotos = createHandler(searchPhotos);

/**
 * @function handleGetPhotosByTag
 * @description Handles the request to get photos by tag.
 */
exports.handleGetPhotosByTag = createHandler(getPhotosByTag);
