const express = require('express');
const { 
  getUserProfile, 
  updateUserProfile, 
  getUserSettings, 
  updateUserSettings,
  changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.route('/settings')
  .get(getUserSettings)
  .put(updateUserSettings);

router.put('/password', changePassword);

module.exports = router;