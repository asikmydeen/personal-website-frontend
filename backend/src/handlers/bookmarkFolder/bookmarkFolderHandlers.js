// backend/src/handlers/bookmarkFolder/bookmarkFolderHandlers.js
const bookmarkFolderController = require('../../controllers/bookmarkFolderController');
const { handleRequest, handleError } = require('../handlerUtils'); // Assuming handlerUtils.js is in the parent directory

/**
 * @async
 * @function handleGetBookmarkFolders
 * @description Handles the request to get all bookmark folders.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetBookmarkFolders(event, context) {
  return handleRequest(async () => {
    const req = { /* event details if needed by controller */ };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await bookmarkFolderController.getBookmarkFolders(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleGetBookmarkFolderById
 * @description Handles the request to get a single bookmark folder by its ID.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetBookmarkFolderById(event, context) {
  return handleRequest(async () => {
    const req = { params: event.pathParameters };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await bookmarkFolderController.getBookmarkFolderById(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleCreateBookmarkFolder
 * @description Handles the request to create a new bookmark folder.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleCreateBookmarkFolder(event, context) {
  return handleRequest(async () => {
    const req = { body: JSON.parse(event.body || '{}') };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await bookmarkFolderController.createBookmarkFolder(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleUpdateBookmarkFolder
 * @description Handles the request to update an existing bookmark folder.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleUpdateBookmarkFolder(event, context) {
  return handleRequest(async () => {
    const req = { params: event.pathParameters, body: JSON.parse(event.body || '{}') };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await bookmarkFolderController.updateBookmarkFolder(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleDeleteBookmarkFolder
 * @description Handles the request to delete a bookmark folder.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleDeleteBookmarkFolder(event, context) {
  return handleRequest(async () => {
    const req = { params: event.pathParameters };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await bookmarkFolderController.deleteBookmarkFolder(req, res);
    return resData;
  }, event);
}

module.exports = {
  handleGetBookmarkFolders,
  handleGetBookmarkFolderById,
  handleCreateBookmarkFolder,
  handleUpdateBookmarkFolder,
  handleDeleteBookmarkFolder,
};
