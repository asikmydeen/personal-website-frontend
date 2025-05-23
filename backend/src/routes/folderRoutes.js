const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  getFilesInFolder,
} = require('../controllers/folderController');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getFolders)
  .post(createFolder);

router.route('/:id')
  .get(getFolderById)
  .put(updateFolder)
  .delete(deleteFolder);

router.get('/:id/files', getFilesInFolder); // Get files within a folder

module.exports = router;