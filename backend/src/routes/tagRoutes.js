const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder for tag routes
// These will be implemented with actual controllers later
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tag routes not yet implemented',
    data: []
  });
});

router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tag routes not yet implemented',
    data: {}
  });
});

router.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Tag routes not yet implemented',
    data: {}
  });
});

router.put('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tag routes not yet implemented',
    data: {}
  });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tag routes not yet implemented',
    data: {}
  });
});

module.exports = router;