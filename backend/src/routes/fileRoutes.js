const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  initiateFileUpload,
  finalizeFileUpload,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  searchFiles,
  getFilesByTag,
} = require('../controllers/fileController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Route for initiating file upload
router.post('/', initiateFileUpload);

// Search and tag routes should come before /:id to avoid conflict
router.get('/search', searchFiles); // Expects ?q=query
router.get('/tags', getFilesByTag);   // Expects ?tag=tagName

// Routes for specific file by ID
router.route('/:id')
  .get(getFileById)
  .put(updateFile)
  .delete(deleteFile);

// Route for finalizing file upload
router.post('/:id/finalize', finalizeFileUpload);

// Route for getting all files (potentially filtered by folderId)
router.get('/', getFiles); // General GET should be last for this path

module.exports = router;