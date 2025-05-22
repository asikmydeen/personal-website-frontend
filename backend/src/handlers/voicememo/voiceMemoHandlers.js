// backend/src/handlers/voicememo/voiceMemoHandlers.js
const {
  initiateVoiceMemoUpload,
  finalizeVoiceMemoUpload,
  getVoiceMemos,
  getVoiceMemoById,
  updateVoiceMemo,
  deleteVoiceMemo,
  searchVoiceMemos,
  getVoiceMemosByTag,
} = require('../../controllers/voiceMemoController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleInitiateVoiceMemoUpload
 * @description Handles the request to initiate a voice memo upload.
 */
exports.handleInitiateVoiceMemoUpload = createHandler(initiateVoiceMemoUpload);

/**
 * @function handleFinalizeVoiceMemoUpload
 * @description Handles the request to finalize a voice memo upload.
 */
exports.handleFinalizeVoiceMemoUpload = createHandler(finalizeVoiceMemoUpload);

/**
 * @function handleGetVoiceMemos
 * @description Handles the request to get all voice memos.
 */
exports.handleGetVoiceMemos = createHandler(getVoiceMemos);

/**
 * @function handleGetVoiceMemoById
 * @description Handles the request to get a single voice memo by its ID.
 */
exports.handleGetVoiceMemoById = createHandler(getVoiceMemoById);

/**
 * @function handleUpdateVoiceMemo
 * @description Handles the request to update an existing voice memo's metadata.
 */
exports.handleUpdateVoiceMemo = createHandler(updateVoiceMemo);

/**
 * @function handleDeleteVoiceMemo
 * @description Handles the request to delete a voice memo.
 */
exports.handleDeleteVoiceMemo = createHandler(deleteVoiceMemo);

/**
 * @function handleSearchVoiceMemos
 * @description Handles the request to search voice memos.
 */
exports.handleSearchVoiceMemos = createHandler(searchVoiceMemos);

/**
 * @function handleGetVoiceMemosByTag
 * @description Handles the request to get voice memos by tag.
 */
exports.handleGetVoiceMemosByTag = createHandler(getVoiceMemosByTag);
