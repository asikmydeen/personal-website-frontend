// backend/src/handlers/comment/commentHandlers.js
const commentController = require('../../controllers/commentController');
const { handleRequest, handleError } = require('../handlerUtils'); // Assuming handlerUtils.js is in the parent directory

/**
 * @async
 * @function handleGetComments
 * @description Handles the request to get all comments.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetComments(event, context) {
  return handleRequest(async () => {
    // For GET, query parameters are in event.queryStringParameters
    const req = { query: event.queryStringParameters || {} };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await commentController.getComments(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleGetCommentById
 * @description Handles the request to get a single comment by its ID.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetCommentById(event, context) {
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
    await commentController.getCommentById(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleCreateComment
 * @description Handles the request to create a new comment.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleCreateComment(event, context) {
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
    await commentController.createComment(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleUpdateComment
 * @description Handles the request to update an existing comment.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleUpdateComment(event, context) {
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
    await commentController.updateComment(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleDeleteComment
 * @description Handles the request to delete a comment.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleDeleteComment(event, context) {
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
    await commentController.deleteComment(req, res);
    return resData;
  }, event);
}

module.exports = {
  handleGetComments,
  handleGetCommentById,
  handleCreateComment,
  handleUpdateComment,
  handleDeleteComment,
};
