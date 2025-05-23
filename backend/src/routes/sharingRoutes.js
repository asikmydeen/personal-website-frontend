const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getSharingLinks,
  accessSharedLink,
  createSharingLink,
  deleteSharingLink,
  getUserPermissions,
  getUserPermissionById,
  grantUserPermission,
  revokeUserPermission,
} = require('../controllers/sharingController');

const router = express.Router();

// Public route for accessing shared links by token
router.get('/links/:token', accessSharedLink);

// All other routes require authentication
router.use(protect);

router.route('/links')
  .get(getSharingLinks)
  .post(createSharingLink);

router.route('/links/:id')
  .delete(deleteSharingLink);

router.route('/permissions')
  .get(getUserPermissions)
  .post(grantUserPermission);

router.route('/permissions/:id')
  .get(getUserPermissionById)
  .delete(revokeUserPermission);

module.exports = router;