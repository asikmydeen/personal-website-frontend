// backend/src/handlers/password/passwordHandlers.js
const {
  createPassword,
  getPasswords,
  getPasswordById,
  updatePassword,
  deletePassword,
  searchPasswords,
  getPasswordsByCategory,
} = require('../../controllers/passwordController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleCreatePassword
 * @description Handles the request to create a new password entry.
 */
exports.handleCreatePassword = createHandler(createPassword);

/**
 * @function handleGetPasswords
 * @description Handles the request to get all password entries.
 */
exports.handleGetPasswords = createHandler(getPasswords);

/**
 * @function handleGetPasswordById
 * @description Handles the request to get a single password entry by its ID.
 */
exports.handleGetPasswordById = createHandler(getPasswordById);

/**
 * @function handleUpdatePassword
 * @description Handles the request to update an existing password entry.
 */
exports.handleUpdatePassword = createHandler(updatePassword);

/**
 * @function handleDeletePassword
 * @description Handles the request to delete a password entry.
 */
exports.handleDeletePassword = createHandler(deletePassword);

/**
 * @function handleSearchPasswords
 * @description Handles the request to search password entries.
 */
exports.handleSearchPasswords = createHandler(searchPasswords);

/**
 * @function handleGetPasswordsByCategory
 * @description Handles the request to get password entries by category.
 */
exports.handleGetPasswordsByCategory = createHandler(getPasswordsByCategory);
