// backend/src/handlers/activity/activityHandlers.js
const activityController = require('../../controllers/activityController');
const { handleRequest, handleError } = require('../handlerUtils'); // Assuming handlerUtils.js is in the parent directory

/**
 * @async
 * @function handleGetActivities
 * @description Handles the request to get all activities.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetActivities(event, context) {
  return handleRequest(async () => {
    // Express-like req/res objects for the controller
    const req = { /* event details if needed by controller */ };
    let resData;
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          resData = { statusCode, body: JSON.stringify(data) };
        },
      }),
    };
    await activityController.getActivities(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleGetActivityById
 * @description Handles the request to get a single activity by its ID.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleGetActivityById(event, context) {
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
    await activityController.getActivityById(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleCreateActivity
 * @description Handles the request to create a new activity.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleCreateActivity(event, context) {
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
    await activityController.createActivity(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleUpdateActivity
 * @description Handles the request to update an existing activity.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleUpdateActivity(event, context) {
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
    await activityController.updateActivity(req, res);
    return resData;
  }, event);
}

/**
 * @async
 * @function handleDeleteActivity
 * @description Handles the request to delete an activity.
 * @param {object} event - API Gateway Lambda proxy input event
 * @param {object} context - Lambda context object
 * @returns {Promise<object>} - API Gateway Lambda proxy output event
 */
async function handleDeleteActivity(event, context) {
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
    await activityController.deleteActivity(req, res);
    return resData;
  }, event);
}

module.exports = {
  handleGetActivities,
  handleGetActivityById,
  handleCreateActivity,
  handleUpdateActivity,
  handleDeleteActivity,
};
