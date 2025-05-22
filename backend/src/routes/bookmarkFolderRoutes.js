const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const bookmarkFolderController = require('../controllers/bookmarkFolderController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Setup routes to use controller functions
router.get('/', bookmarkFolderController.getBookmarkFolders);
router.get('/:id', bookmarkFolderController.getBookmarkFolderById);
router.post('/', bookmarkFolderController.createBookmarkFolder);
router.put('/:id', bookmarkFolderController.updateBookmarkFolder);
router.delete('/:id', bookmarkFolderController.deleteBookmarkFolder);

// The route GET /:id/bookmarks was removed as it's not part of the current scope.
// It can be added later if listing bookmarks within a folder is implemented.

module.exports = router;