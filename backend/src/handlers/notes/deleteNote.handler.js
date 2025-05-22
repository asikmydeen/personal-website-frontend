// backend/src/handlers/notes/deleteNote.handler.js
const { trashNote } = require('../../../controllers/noteController'); // This imports trashNoteHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for moving a note to trash (soft delete).
 * It uses the trashNote controller function (which is trashNoteHandler).
 */
exports.handler = createHandler(trashNote);
