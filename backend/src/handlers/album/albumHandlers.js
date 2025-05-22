// backend/src/handlers/album/albumHandlers.js
const albumController = require('../../controllers/albumController');
const { handleRequest, handleError } = require('../handlerUtils'); // Assuming handlerUtils.js is in the parent directory

/**
 * @async
 * @function handleGetAlbums
 * @description Handles the request to get all albums.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetAlbums(event, context) {
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
    await albumController.getAlbums(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleGetAlbumById
 * @description Handles the request to get a single album by its ID.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetAlbumById(event, context) {
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
    await albumController.getAlbumById(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleCreateAlbum
 * @description Handles the request to create a new album.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleCreateAlbum(event, context) {
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
    await albumController.createAlbum(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleUpdateAlbum
 * @description Handles the request to update an existing album.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleUpdateAlbum(event, context) {
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
    await albumController.updateAlbum(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleDeleteAlbum
 * @description Handles the request to delete an album.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleDeleteAlbum(event, context) {
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
    await albumController.deleteAlbum(req, res);
    return resData;
  }, event);
}

module.exports = {
  handleGetAlbums,
  handleGetAlbumById,
  handleCreateAlbum,
  handleUpdateAlbum,
  handleDeleteAlbum,
};
