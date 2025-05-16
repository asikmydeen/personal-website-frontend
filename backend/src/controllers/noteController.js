const { 
  createNote, 
  getNotes, 
  getNoteById, 
  updateNote, 
  trashNote, 
  deleteNote, 
  restoreNote, 
  searchNotes, 
  getNotesByTag 
} = require('../services/noteService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Create a new note
 * @route   POST /api/v1/notes
 * @access  Private
 */
const createNoteHandler = asyncHandler(async (req, res) => {
  const { title, content, tags, color, isPinned } = req.body;

  // Validate required fields
  if (!title) {
    throw new AppError('Title is required', 400);
  }

  const note = await createNote(req.user.id, { 
    title, 
    content: content || '', 
    tags, 
    color, 
    isPinned 
  });

  res.status(201).json({
    success: true,
    data: note
  });
});

/**
 * @desc    Get all notes for the authenticated user
 * @route   GET /api/v1/notes
 * @access  Private
 */
const getNotesHandler = asyncHandler(async (req, res) => {
  const { isPinned, isTrashed, limit, nextToken } = req.query;
  
  // Parse query parameters
  const options = {
    isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
    isTrashed: isTrashed === 'true' ? true : isTrashed === 'false' ? false : undefined,
    limit: limit ? parseInt(limit) : 100,
    lastEvaluatedKey: nextToken || undefined
  };

  const result = await getNotes(req.user.id, options);

  res.status(200).json({
    success: true,
    data: result.notes,
    pagination: {
      nextToken: result.nextToken
    }
  });
});

/**
 * @desc    Get a note by ID
 * @route   GET /api/v1/notes/:id
 * @access  Private
 */
const getNoteHandler = asyncHandler(async (req, res) => {
  const note = await getNoteById(req.params.id, req.user.id);
  
  if (!note) {
    throw new AppError('Note not found', 404);
  }

  res.status(200).json({
    success: true,
    data: note
  });
});

/**
 * @desc    Update a note
 * @route   PUT /api/v1/notes/:id
 * @access  Private
 */
const updateNoteHandler = asyncHandler(async (req, res) => {
  const { title, content, tags, color, isPinned } = req.body;
  
  // Build update data object with only provided fields
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (tags !== undefined) updateData.tags = tags;
  if (color !== undefined) updateData.color = color;
  if (isPinned !== undefined) updateData.isPinned = isPinned;

  const updatedNote = await updateNote(req.params.id, req.user.id, updateData);

  res.status(200).json({
    success: true,
    data: updatedNote
  });
});

/**
 * @desc    Move a note to trash
 * @route   DELETE /api/v1/notes/:id
 * @access  Private
 */
const trashNoteHandler = asyncHandler(async (req, res) => {
  await trashNote(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Note moved to trash'
  });
});

/**
 * @desc    Permanently delete a note
 * @route   DELETE /api/v1/notes/:id/permanent
 * @access  Private
 */
const deleteNoteHandler = asyncHandler(async (req, res) => {
  await deleteNote(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Note permanently deleted'
  });
});

/**
 * @desc    Restore a note from trash
 * @route   PUT /api/v1/notes/:id/restore
 * @access  Private
 */
const restoreNoteHandler = asyncHandler(async (req, res) => {
  await restoreNote(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Note restored from trash'
  });
});

/**
 * @desc    Search notes
 * @route   GET /api/v1/notes/search
 * @access  Private
 */
const searchNotesHandler = asyncHandler(async (req, res) => {
  const { q, isTrashed, limit, nextToken } = req.query;
  
  if (!q) {
    throw new AppError('Search query is required', 400);
  }

  // Parse query parameters
  const options = {
    isTrashed: isTrashed === 'true' ? true : false,
    limit: limit ? parseInt(limit) : 100,
    lastEvaluatedKey: nextToken || undefined
  };

  const result = await searchNotes(req.user.id, q, options);

  res.status(200).json({
    success: true,
    data: result.notes,
    pagination: {
      nextToken: result.nextToken
    }
  });
});

/**
 * @desc    Get notes by tag
 * @route   GET /api/v1/notes/tags
 * @access  Private
 */
const getNotesByTagHandler = asyncHandler(async (req, res) => {
  const { tag, isTrashed, limit, nextToken } = req.query;
  
  if (!tag) {
    throw new AppError('Tag is required', 400);
  }

  // Parse query parameters
  const options = {
    isTrashed: isTrashed === 'true' ? true : false,
    limit: limit ? parseInt(limit) : 100,
    lastEvaluatedKey: nextToken || undefined
  };

  const result = await getNotesByTag(req.user.id, tag, options);

  res.status(200).json({
    success: true,
    data: result.notes,
    pagination: {
      nextToken: result.nextToken
    }
  });
});

module.exports = {
  createNote: createNoteHandler,
  getNotes: getNotesHandler,
  getNote: getNoteHandler,
  updateNote: updateNoteHandler,
  trashNote: trashNoteHandler,
  deleteNote: deleteNoteHandler,
  restoreNote: restoreNoteHandler,
  searchNotes: searchNotesHandler,
  getNotesByTag: getNotesByTagHandler
};