// backend/src/handlers/notes/searchNotes.handler.js
const { searchNotes } = require('../../../controllers/noteController'); // This imports searchNotesHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for searching notes.
 * It uses the searchNotes controller function (which is searchNotesHandler).
 */
exports.handler = createHandler(searchNotes);
