const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder for activity routes
// These will be implemented with actual controllers later
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Activity routes not yet implemented',
    data: []
  });
});

router.get('/user/:userId', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User activities not yet implemented',
    data: []
  });
});

module.exports = router;