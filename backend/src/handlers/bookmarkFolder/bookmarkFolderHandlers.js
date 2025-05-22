// backend/src/handlers/bookmarkFolder/bookmarkFolderHandlers.js
const {
  createBookmarkFolder,
  getBookmarkFolders,
  getBookmarkFolderById,
  updateBookmarkFolder,
  deleteBookmarkFolder,
  getBookmarksInFolder,
} = require('../../controllers/bookmarkFolderController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleCreateBookmarkFolder
 * @description Handles the request to create a new bookmark folder.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleCreateBookmarkFolder = createHandler(createBookmarkFolder);

/**
 * @function handleGetBookmarkFolders
 * @description Handles the request to get all bookmark folders.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetBookmarkFolders = createHandler(getBookmarkFolders);

/**
 * @function handleGetBookmarkFolderById
 * @description Handles the request to get a single bookmark folder by its ID.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetBookmarkFolderById = createHandler(getBookmarkFolderById);

/**
 * @function handleUpdateBookmarkFolder
 * @description Handles the request to update an existing bookmark folder.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleUpdateBookmarkFolder = createHandler(updateBookmarkFolder);

/**
 * @function handleDeleteBookmarkFolder
 * @description Handles the request to delete a bookmark folder.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleDeleteBookmarkFolder = createHandler(deleteBookmarkFolder);

/**
 * @function handleGetBookmarksInFolder
 * @description Handles the request to get bookmarks in a specific folder.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetBookmarksInFolder = createHandler(getBookmarksInFolder);
