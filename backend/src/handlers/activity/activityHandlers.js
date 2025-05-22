// backend/src/handlers/activity/activityHandlers.js
const {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} = require('../../controllers/activityController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleGetActivities
 * @description Handles the request to get all activities.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetActivities = createHandler(getActivities);

/**
 * @function handleGetActivityById
 * @description Handles the request to get a single activity by its ID.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleGetActivityById = createHandler(getActivityById);

/**
 * @function handleCreateActivity
 * @description Handles the request to create a new activity.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleCreateActivity = createHandler(createActivity);

/**
 * @function handleUpdateActivity
 * @description Handles the request to update an existing activity.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleUpdateActivity = createHandler(updateActivity);

/**
 * @function handleDeleteActivity
 * @description Handles the request to delete an activity.
 *              Uses createHandler to adapt the Express-style controller.
 */
exports.handleDeleteActivity = createHandler(deleteActivity);
