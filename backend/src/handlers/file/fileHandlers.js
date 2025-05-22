// backend/src/handlers/file/fileHandlers.js
const {
  initiateFileUpload,
  finalizeFileUpload,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  searchFiles,
  getFilesByTag,
} = require('../../controllers/fileController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleInitiateFileUpload
 * @description Handles the request to initiate a file upload.
 */
exports.handleInitiateFileUpload = createHandler(initiateFileUpload);

/**
 * @function handleFinalizeFileUpload
 * @description Handles the request to finalize a file upload.
 */
exports.handleFinalizeFileUpload = createHandler(finalizeFileUpload);

/**
 * @function handleGetFiles
 * @description Handles the request to get all files.
 */
exports.handleGetFiles = createHandler(getFiles);

/**
 * @function handleGetFileById
 * @description Handles the request to get a single file by its ID.
 */
exports.handleGetFileById = createHandler(getFileById);

/**
 * @function handleUpdateFile
 * @description Handles the request to update an existing file's metadata.
 */
exports.handleUpdateFile = createHandler(updateFile);

/**
 * @function handleDeleteFile
 * @description Handles the request to delete a file.
 */
exports.handleDeleteFile = createHandler(deleteFile);

/**
 * @function handleSearchFiles
 * @description Handles the request to search files.
 */
exports.handleSearchFiles = createHandler(searchFiles);

/**
 * @function handleGetFilesByTag
 * @description Handles the request to get files by tag.
 */
exports.handleGetFilesByTag = createHandler(getFilesByTag);
