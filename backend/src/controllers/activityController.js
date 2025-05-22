// backend/src/controllers/activityController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @async
 * @function createActivity
 * @description Create a new activity.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const createActivity = asyncHandler(async (req, res) => {
  const { type, message, resourceId, details } = req.body;
  const userId = req.user.id; // Assuming req.user is populated by auth middleware

  if (!type || !message) {
    throw new AppError('Type and message are required fields', 400);
  }

  const timestamp = new Date().toISOString();
  const activityId = uuidv4();

  const activity = {
    id: activityId,
    userId,
    type,
    message,
    resourceId,
    details,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('activities'),
    Item: activity,
  }).promise();

  res.status(201).json({
    success: true,
    data: activity,
  });
});


/**
 * @async
 * @function getActivities
 * @description Get all activities for the authenticated user with pagination.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getActivities = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  const params = {
    TableName: getTableName('activities'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // To get newer items first, assuming a sort key like createdAt is part of the main table key or GSI.
                            // If not, this might not sort as expected without a specific sort key in the GSI.
                            // serverless.yml shows only 'userId' as GSI key, so sorting by 'createdAt' will be done implicitly if 'createdAt' is the table's sort key.
                            // For now, we'll retrieve in the order DynamoDB returns from the GSI.
  };

  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      // The exclusiveStartKey should be an object, e.g. { id: "someId", userId: "someUserId" }
      // Or if the GSI only has userId as HASH, and table has id as HASH, it would be { id: "activityId", userId: "userId" }
      // For a GSI with only a HASH key (userId), the primary keys of the table (id) are also projected.
      // So, the LastEvaluatedKey from a GSI query will contain the GSI HASH key (userId) AND the primary HASH key (id) of the item.
      // If there's also a primary SORT key, that would be included too.
      // For ActivitiesTable, primary key is 'id' (HASH). GSI 'userId-index' has 'userId' (HASH).
      // So LastEvaluatedKey will look like: { id: 'activityIdValue', userId: 'userIdValue' }
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format', 400);
    }
  }

  const result = await dynamoDB.query(params).promise();

  res.status(200).json({
    success: true,
    data: result.Items,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getActivityById
 * @description Get a single activity by its ID.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getActivityById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('activities'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Activity not found', 404);
  }

  if (result.Item.userId !== userId) {
    // Even if the item exists, if it's not for this user, treat as not found for security.
    throw new AppError('Activity not found or not authorized', 404);
  }

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updateActivity
 * @description Update an existing activity.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const updateActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { message, details } = req.body;

  // First, get the activity to ensure it exists and belongs to the user
  const currentActivity = await dynamoDB.get({
    TableName: getTableName('activities'),
    Key: { id },
  }).promise();

  if (!currentActivity.Item) {
    throw new AppError('Activity not found', 404);
  }

  if (currentActivity.Item.userId !== userId) {
    throw new AppError('Not authorized to update this activity', 403); // 403 Forbidden as user is known but not allowed
  }

  // Construct update expression
  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (message !== undefined) {
    updateExpressionParts.push('#msg = :message');
    expressionAttributeValues[':message'] = message;
    expressionAttributeNames['#msg'] = 'message';
  }

  if (details !== undefined) {
    updateExpressionParts.push('#det = :details');
    expressionAttributeValues[':details'] = details;
    expressionAttributeNames['#det'] = 'details';
  }

  if (updateExpressionParts.length === 0) {
    return res.status(200).json({ // Or 400 if no update fields provided is an error
      success: true,
      data: currentActivity.Item,
      message: 'No fields to update',
    });
  }

  const timestamp = new Date().toISOString();
  updateExpressionParts.push('#ua = :updatedAt');
  expressionAttributeValues[':updatedAt'] = timestamp;
  expressionAttributeNames['#ua'] = 'updatedAt';

  const params = {
    TableName: getTableName('activities'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();

  res.status(200).json({
    success: true,
    data: result.Attributes,
  });
});

/**
 * @async
 * @function deleteActivity
 * @description Delete an activity.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // First, get the activity to ensure it exists and belongs to the user
  const currentActivity = await dynamoDB.get({
    TableName: getTableName('activities'),
    Key: { id },
  }).promise();

  if (!currentActivity.Item) {
    throw new AppError('Activity not found', 404);
  }

  if (currentActivity.Item.userId !== userId) {
    // Even if the item exists, if it's not for this user, treat as not found for security for delete.
    throw new AppError('Activity not found or not authorized', 404);
  }

  await dynamoDB.delete({
    TableName: getTableName('activities'),
    Key: { id },
    // Optionally, add a ConditionExpression to ensure it still belongs to the user,
    // though the check above mostly covers this unless there's a race condition.
    // ConditionExpression: "userId = :userId",
    // ExpressionAttributeValues: { ":userId": userId }
  }).promise();

  res.status(204).json({
    success: true,
    data: null, // Or use res.status(204).send();
  });
});

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
};
