const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const commentController = require('../controllers/commentController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Setup routes to use controller functions
router.get('/', commentController.getComments); // Can filter by req.query.resourceId
router.get('/:id', commentController.getCommentById);
router.post('/', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

// The route GET /resource/:type/:id was removed.
// Filtering comments by resource can be done via query parameters on GET /
// e.g., GET /comments?resourceId=someResourceId

module.exports = router;