// backend/src/handlers/album/albumHandlers.js
const {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getPhotosInAlbum, // Added this import
} = require('../../controllers/albumController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleGetAlbums
 * @description Handles the request to get all albums.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetAlbums = createHandler(getAlbums);

/**
 * @function handleGetAlbumById
 * @description Handles the request to get a single album by its ID.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetAlbumById = createHandler(getAlbumById);

/**
 * @function handleCreateAlbum
 * @description Handles the request to create a new album.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleCreateAlbum = createHandler(createAlbum);

/**
 * @function handleUpdateAlbum
 * @description Handles the request to update an existing album.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleUpdateAlbum = createHandler(updateAlbum);

/**
 * @function handleDeleteAlbum
 * @description Handles the request to delete an album.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleDeleteAlbum = createHandler(deleteAlbum);

/**
 * @function handleGetPhotosInAlbum
 * @description Handles the request to get photos in a specific album.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetPhotosInAlbum = createHandler(getPhotosInAlbum); // Added this export
