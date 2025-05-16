const express = require('express');
const { 
  createNote, 
  getNotes, 
  getNote, 
  updateNote, 
  trashNote, 
  deleteNote, 
  restoreNote, 
  searchNotes, 
  getNotesByTag 
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Search routes
router.get('/search', searchNotes);
router.get('/tags', getNotesByTag);

// CRUD routes
router.route('/')
  .post(createNote)
  .get(getNotes);

router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(trashNote);

// Special operations
router.delete('/:id/permanent', deleteNote);
router.put('/:id/restore', restoreNote);

module.exports = router;