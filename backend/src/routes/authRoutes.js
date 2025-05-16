const express = require('express');
const { 
  register, 
  login, 
  logout, 
  requestPasswordReset, 
  resetPassword, 
  verifyToken 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/password-reset', requestPasswordReset);
router.post('/password-reset/:token', resetPassword);
router.post('/verify-token', verifyToken);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router;