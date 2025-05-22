// backend/src/handlers/folder/folderHandlers.js
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  getFilesInFolder,
} = require('../../controllers/folderController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleCreateFolder
 * @description Handles the request to create a new folder.
 */
exports.handleCreateFolder = createHandler(createFolder);

/**
 * @function handleGetFolders
 * @description Handles the request to get all folders.
 */
exports.handleGetFolders = createHandler(getFolders);

/**
 * @function handleGetFolderById
 * @description Handles the request to get a single folder by its ID.
 */
exports.handleGetFolderById = createHandler(getFolderById);

/**
 * @function handleUpdateFolder
 * @description Handles the request to update an existing folder.
 */
exports.handleUpdateFolder = createHandler(updateFolder);

/**
 * @function handleDeleteFolder
 * @description Handles the request to delete a folder.
 */
exports.handleDeleteFolder = createHandler(deleteFolder);

/**
 * @function handleGetFilesInFolder
 * @description Handles the request to get files within a specific folder.
 */
exports.handleGetFilesInFolder = createHandler(getFilesInFolder);
