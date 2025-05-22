// backend/src/handlers/notes/permanentlyDeleteNote.handler.js
const { deleteNote } = require('../../../controllers/noteController'); // This imports deleteNoteHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for permanently deleting a note.
 * It uses the deleteNote controller function (which is deleteNoteHandler).
 */
exports.handler = createHandler(deleteNote);
