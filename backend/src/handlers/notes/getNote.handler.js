// backend/src/handlers/notes/getNote.handler.js
const { getNote } = require('../../../controllers/noteController'); // This imports getNoteHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for getting a specific note by ID.
 * It uses the getNote controller function (which is getNoteHandler).
 */
exports.handler = createHandler(getNote);
