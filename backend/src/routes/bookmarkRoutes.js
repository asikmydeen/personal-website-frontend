const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const bookmarkController = require('../controllers/bookmarkController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Setup routes to use controller functions
router.get('/', bookmarkController.getBookmarks);
router.get('/:id', bookmarkController.getBookmarkById);
router.post('/', bookmarkController.createBookmark);
router.put('/:id', bookmarkController.updateBookmark);
router.delete('/:id', bookmarkController.deleteBookmark);

// The routes /search and /tags were removed as they are not part of the current scope.
// They can be added later if search and tag functionalities are implemented.

module.exports = router;