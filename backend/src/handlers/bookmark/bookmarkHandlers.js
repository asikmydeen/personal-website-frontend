// backend/src/handlers/bookmark/bookmarkHandlers.js
const {
  createBookmark,
  getBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
  getBookmarksByTag,
} = require('../../controllers/bookmarkController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleCreateBookmark
 * @description Handles the request to create a new bookmark.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleCreateBookmark = createHandler(createBookmark);

/**
 * @function handleGetBookmarks
 * @description Handles the request to get all bookmarks.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetBookmarks = createHandler(getBookmarks);

/**
 * @function handleGetBookmarkById
 * @description Handles the request to get a single bookmark by its ID.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetBookmarkById = createHandler(getBookmarkById);

/**
 * @function handleUpdateBookmark
 * @description Handles the request to update an existing bookmark.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleUpdateBookmark = createHandler(updateBookmark);

/**
 * @function handleDeleteBookmark
 * @description Handles the request to delete a bookmark.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleDeleteBookmark = createHandler(deleteBookmark);

/**
 * @function handleSearchBookmarks
 * @description Handles the request to search bookmarks.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleSearchBookmarks = createHandler(searchBookmarks);

/**
 * @function handleGetBookmarksByTag
 * @description Handles the request to get bookmarks by tag.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetBookmarksByTag = createHandler(getBookmarksByTag);
