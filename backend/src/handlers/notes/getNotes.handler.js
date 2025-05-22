// backend/src/handlers/notes/getNotes.handler.js
const { getNotes } = require('../../../controllers/noteController'); // This imports getNotesHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for getting all notes for the authenticated user.
 * It uses the getNotes controller function (which is getNotesHandler).
 */
exports.handler = createHandler(getNotes);
