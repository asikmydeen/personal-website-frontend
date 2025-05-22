// backend/src/controllers/bookmarkController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @async
 * @function createBookmark
 * @description Create a new bookmark.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const createBookmark = asyncHandler(async (req, res) => {
  const { url, title, description, tags, folderId } = req.body;
  const userId = req.user.id;

  if (!url) {
    throw new AppError('Bookmark URL is required', 400);
  }
  // Basic URL validation (can be enhanced)
  try {
    new URL(url);
  } catch (error) {
    throw new AppError('Invalid URL format', 400);
  }

  const timestamp = new Date().toISOString();
  const bookmarkId = uuidv4();

  const bookmark = {
    id: bookmarkId,
    userId,
    url,
    title: title || null,
    description: description || null,
    tags: tags || [], // Default to empty array if not provided
    folderId: folderId || null, // Assign null if not provided or empty
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('bookmarks'),
    Item: bookmark,
  }).promise();

  res.status(201).json({
    success: true,
    data: bookmark,
  });
});

/**
 * @async
 * @function getBookmarks
 * @description Get all bookmarks for the authenticated user with pagination and folder filtering.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getBookmarks = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit, exclusiveStartKey, folderId } = req.query;

  const params = {
    TableName: getTableName('bookmarks'),
    IndexName: 'userId-index', // Assumes BookmarksTable has a GSI on userId
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Optional: get newer bookmarks first
  };

  const filterParts = [];
  if (folderId && folderId !== 'null' && folderId !== 'none' && folderId !== 'root') {
    filterParts.push('folderId = :folderId');
    params.ExpressionAttributeValues[':folderId'] = folderId;
  } else if (folderId === 'null' || folderId === 'none' || folderId === 'root') {
    // Filter for bookmarks where folderId does not exist or is null
    // DynamoDB doesn't directly support "is null" in a KeyConditionExpression or simple FilterExpression for GSIs easily.
    // This might require attribute_not_exists(folderId) or a specific value for "no folder".
    // For simplicity with GSI, if `folderId` is a projected attribute or part of the primary key,
    // this query will get all user's bookmarks, and we'd have to filter client-side or add a specific GSI.
    // Using attribute_not_exists in FilterExpression:
    filterParts.push('attribute_not_exists(folderId) OR folderId = :nullFolderId');
    params.ExpressionAttributeValues[':nullFolderId'] = null; // Explicitly check for null value if it can be set
  }

  if (filterParts.length > 0) {
    params.FilterExpression = filterParts.join(' AND ');
  }


  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      // For BookmarksTable's userId-index, LastEvaluatedKey will be { id: 'bookmarkId', userId: 'userIdValue', ...other GSI/primary keys }
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
 * @function getBookmarkById
 * @description Get a single bookmark by its ID.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getBookmarkById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('bookmarks'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Bookmark not found', 404);
  }

  if (result.Item.userId !== userId) {
    throw new AppError('Bookmark not found or not authorized', 404);
  }

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updateBookmark
 * @description Update an existing bookmark.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const updateBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { url, title, description, tags, folderId } = req.body;

  const currentBookmarkResult = await dynamoDB.get({
    TableName: getTableName('bookmarks'),
    Key: { id },
  }).promise();

  if (!currentBookmarkResult.Item) {
    throw new AppError('Bookmark not found', 404);
  }

  if (currentBookmarkResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this bookmark', 403);
  }
  
  if (url) {
     try {
        new URL(url);
      } catch (error) {
        throw new AppError('Invalid URL format', 400);
      }
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (url !== undefined) {
    updateExpressionParts.push('#url = :url');
    expressionAttributeValues[':url'] = url;
    expressionAttributeNames['#url'] = 'url';
  }
  if (title !== undefined) {
    updateExpressionParts.push('#title = :title');
    expressionAttributeValues[':title'] = title;
    expressionAttributeNames['#title'] = 'title';
  }
  if (description !== undefined) {
    updateExpressionParts.push('#desc = :description');
    expressionAttributeValues[':description'] = description;
    expressionAttributeNames['#desc'] = 'description';
  }
  if (tags !== undefined) {
    updateExpressionParts.push('#tags = :tags');
    expressionAttributeValues[':tags'] = tags; // Assuming tags is an array
    expressionAttributeNames['#tags'] = 'tags';
  }
  if (folderId !== undefined) { // Allows setting folderId to null or a value
    updateExpressionParts.push('#folderId = :folderId');
    expressionAttributeValues[':folderId'] = folderId;
    expressionAttributeNames['#folderId'] = 'folderId';
  }


  if (updateExpressionParts.length === 0) {
    return res.status(200).json({
      success: true,
      data: currentBookmarkResult.Item,
      message: 'No fields to update',
    });
  }

  const timestamp = new Date().toISOString();
  updateExpressionParts.push('#ua = :updatedAt');
  expressionAttributeValues[':updatedAt'] = timestamp;
  expressionAttributeNames['#ua'] = 'updatedAt';

  const params = {
    TableName: getTableName('bookmarks'),
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
 * @function deleteBookmark
 * @description Delete a bookmark.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const bookmarkResult = await dynamoDB.get({
    TableName: getTableName('bookmarks'),
    Key: { id },
  }).promise();

  if (!bookmarkResult.Item) {
    throw new AppError('Bookmark not found', 404);
  }

  if (bookmarkResult.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this bookmark', 403);
  }

  await dynamoDB.delete({
    TableName: getTableName('bookmarks'),
    Key: { id },
  }).promise();

  res.status(204).json({
    success: true,
    data: null,
  });
});

/**
 * @async
 * @function searchBookmarks
 * @description Search bookmarks by query string in title, url, description, tags.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const searchBookmarks = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, limit, exclusiveStartKey } = req.query;

  if (!q) {
    throw new AppError('Search query (q) is required', 400);
  }

  const params = {
    TableName: getTableName('bookmarks'),
    FilterExpression: 'userId = :userId AND (' +
                      'contains(#title, :q) OR ' +
                      'contains(#url, :q) OR ' +
                      'contains(#description, :q) OR ' +
                      'contains(#tags, :q_tag)' + // 'contains' for lists needs exact match of an element
                      ')',
    ExpressionAttributeNames: {
      '#title': 'title',
      '#url': 'url',
      '#description': 'description',
      '#tags': 'tags',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':q': q.toLowerCase(), // Assuming case-insensitive search is desired by converting query to lower
      ':q_tag': q, // For tags, 'contains' checks if the list has an element equal to q
    },
  };
   // Note: DynamoDB `contains` on string attributes is case-sensitive.
   // For truly case-insensitive search on title, url, description without specific GSIs,
   // data would need to be duplicated in lowercase, or filtering done client-side after a broader scan.
   // The current filter will be case-sensitive for :q on string attributes.
   // For tags, it checks if the query string `q` is an exact match for one of the tags in the list.

  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format', 400);
    }
  }

  const result = await dynamoDB.scan(params).promise();

  res.status(200).json({
    success: true,
    data: result.Items,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getBookmarksByTag
 * @description Get bookmarks by a specific tag.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getBookmarksByTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { tag, limit, exclusiveStartKey } = req.query;

  if (!tag) {
    throw new AppError('Tag query parameter is required', 400);
  }

  const params = {
    TableName: getTableName('bookmarks'),
    FilterExpression: 'userId = :userId AND contains(#tags, :tag)',
    ExpressionAttributeNames: {
      '#tags': 'tags',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':tag': tag,
    },
  };

  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format', 400);
    }
  }

  // Note: This uses a Scan operation which can be inefficient on large tables.
  // For production, consider a GSI if tag-based querying is frequent and performance-critical.
  const result = await dynamoDB.scan(params).promise();

  res.status(200).json({
    success: true,
    data: result.Items,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});


module.exports = {
  createBookmark,
  getBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
  getBookmarksByTag,
};
