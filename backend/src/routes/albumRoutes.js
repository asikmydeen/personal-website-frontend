const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const albumController = require('../controllers/albumController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Setup routes to use controller functions
router.get('/', albumController.getAlbums);
router.get('/:id', albumController.getAlbumById);
router.post('/', albumController.createAlbum);
router.put('/:id', albumController.updateAlbum);
router.delete('/:id', albumController.deleteAlbum);

// The route GET /:id/photos was removed as it's not part of the current scope.
// It can be added later if photo management within albums is implemented.

module.exports = router;