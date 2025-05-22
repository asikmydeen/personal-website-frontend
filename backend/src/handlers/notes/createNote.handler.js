// backend/src/handlers/notes/createNote.handler.js
const { createNote } = require('../../../controllers/noteController'); // This imports createNoteHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for creating a new note.
 * It uses the createNote controller function (which is createNoteHandler).
 */
exports.handler = createHandler(createNote);
