// backend/src/handlers/notes/getNotesByTag.handler.js
const { getNotesByTag } = require('../../../controllers/noteController'); // This imports getNotesByTagHandler
const { createHandler } = require('../../handlerUtils');

/**
 * Lambda handler for getting notes by tag.
 * It uses the getNotesByTag controller function (which is getNotesByTagHandler).
 */
exports.handler = createHandler(getNotesByTag);
