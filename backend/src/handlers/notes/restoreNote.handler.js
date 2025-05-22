// backend/src/handlers/notes/restoreNote.handler.js
const { restoreNote } = require('../../../controllers/noteController'); // This imports restoreNoteHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for restoring a note from trash.
 * It uses the restoreNote controller function (which is restoreNoteHandler).
 */
exports.handler = createHandler(restoreNote);
