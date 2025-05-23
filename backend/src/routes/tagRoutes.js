const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} = require('../controllers/tagController');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTags)
  .post(createTag);

router.route('/:id')
  .get(getTagById)
  .put(updateTag)
  .delete(deleteTag);

module.exports = router;