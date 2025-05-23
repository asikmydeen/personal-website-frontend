const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification,
  getUnreadNotifications,
} = require('../controllers/notificationController');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/unread')
  .get(getUnreadNotifications);

router.route('/:id')
  .get(getNotificationById)
  .put(markNotificationAsRead)
  .delete(deleteNotification);

module.exports = router;