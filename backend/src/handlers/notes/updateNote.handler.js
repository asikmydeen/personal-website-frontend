// backend/src/handlers/notes/updateNote.handler.js
const { updateNote } = require('../../../controllers/noteController'); // This imports updateNoteHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for updating a specific note by ID.
 * It uses the updateNote controller function (which is updateNoteHandler).
 */
exports.handler = createHandler(updateNote);
