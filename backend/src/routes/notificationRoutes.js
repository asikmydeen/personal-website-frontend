const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder for notification routes
// These will be implemented with actual controllers later
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification routes not yet implemented',
    data: []
  });
});

router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification routes not yet implemented',
    data: {}
  });
});

router.put('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification routes not yet implemented',
    data: {}
  });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification routes not yet implemented',
    data: {}
  });
});

router.get('/unread', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Unread notifications not yet implemented',
    data: []
  });
});

module.exports = router;