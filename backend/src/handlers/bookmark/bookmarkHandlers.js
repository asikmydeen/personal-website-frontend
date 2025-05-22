// backend/src/handlers/bookmark/bookmarkHandlers.js
const bookmarkController = require('../../controllers/bookmarkController');
const { handleRequest, handleError } = require('../handlerUtils'); // Assuming handlerUtils.js is in the parent directory

/**
 * @async
 * @function handleGetBookmarks
 * @description Handles the request to get all bookmarks.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetBookmarks(event, context) {
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
    await bookmarkController.getBookmarks(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleGetBookmarkById
 * @description Handles the request to get a single bookmark by its ID.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetBookmarkById(event, context) {
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
    await bookmarkController.getBookmarkById(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleCreateBookmark
 * @description Handles the request to create a new bookmark.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleCreateBookmark(event, context) {
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
    await bookmarkController.createBookmark(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleUpdateBookmark
 * @description Handles the request to update an existing bookmark.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleUpdateBookmark(event, context) {
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
    await bookmarkController.updateBookmark(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleDeleteBookmark
 * @description Handles the request to delete a bookmark.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleDeleteBookmark(event, context) {
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
    await bookmarkController.deleteBookmark(req, res);
    return resData;
  }, event);
}

module.exports = {
  handleGetBookmarks,
  handleGetBookmarkById,
  handleCreateBookmark,
  handleUpdateBookmark,
  handleDeleteBookmark,
};
