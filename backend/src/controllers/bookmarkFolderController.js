// backend/src/controllers/bookmarkFolderController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const bookmarkController = require('./bookmarkController'); // To use getBookmarks

/**
 * @async
 * @function createBookmarkFolder
 * @description Create a new bookmark folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const createBookmarkFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const userId = req.user.id;

  if (!name) {
    throw new AppError('Folder name is required', 400);
  }

  // Optional: Validate parentId if provided (check if it exists and belongs to user)
  if (parentId) {
    const parentFolder = await dynamoDB.get({
      TableName: getTableName('bookmark-folders'),
      Key: { id: parentId },
    }).promise();
    if (!parentFolder.Item || parentFolder.Item.userId !== userId) {
      throw new AppError('Parent folder not found or not authorized', 404);
    }
  }

  const timestamp = new Date().toISOString();
  const folderId = uuidv4();

  const folder = {
    id: folderId,
    userId,
    name,
    parentId: parentId || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('bookmark-folders'),
    Item: folder,
  }).promise();

  res.status(201).json({
    success: true,
    data: folder,
  });
});

/**
 * @async
 * @function getBookmarkFolders
 * @description Get bookmark folders for the authenticated user.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getBookmarkFolders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { parentId, limit, exclusiveStartKey } = req.query;

  // DynamoDB query parameters
  const params = {
    TableName: getTableName('bookmark-folders'),
    IndexName: 'userId-index', // Assuming a GSI on userId
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Optional: sort by a sort key if GSI has one (e.g., createdAt/updatedAt)
  };

  const filterExpressionParts = [];

  if (parentId === 'null' || parentId === 'root' || parentId === '') {
    // Requesting root folders
    filterExpressionParts.push('(attribute_not_exists(parentId) OR parentId = :nullParentId)');
    params.ExpressionAttributeValues[':nullParentId'] = null;
  } else if (parentId) {
    // Requesting subfolders of a specific parent
    filterExpressionParts.push('parentId = :parentId');
    params.ExpressionAttributeValues[':parentId'] = parentId;
  }
  // If parentId is not provided at all, no filter on parentId is added, returning all folders for the user.

  if (filterExpressionParts.length > 0) {
    params.FilterExpression = filterExpressionParts.join(' AND ');
  }
  
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

  const result = await dynamoDB.query(params).promise();

  res.status(200).json({
    success: true,
    data: result.Items,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getBookmarkFolderById
 * @description Get a single bookmark folder by its ID.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getBookmarkFolderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('bookmark-folders'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Bookmark folder not found', 404);
  }

  if (result.Item.userId !== userId) {
    throw new AppError('Bookmark folder not found or not authorized', 404);
  }

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updateBookmarkFolder
 * @description Update an existing bookmark folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updateBookmarkFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, parentId } = req.body;

  const currentFolderResult = await dynamoDB.get({
    TableName: getTableName('bookmark-folders'),
    Key: { id },
  }).promise();

  if (!currentFolderResult.Item) {
    throw new AppError('Bookmark folder not found', 404);
  }

  if (currentFolderResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this folder', 403);
  }

  // Cycle prevention: cannot set parentId to self
  if (parentId && parentId === id) {
    throw new AppError('Cannot set a folder as its own parent', 400);
  }

  // Optional: More complex cycle prevention (checking if new parentId is a descendant)
  // This would require a recursive query or maintaining a denormalized path.
  // For now, only direct self-parenting is prevented.

  // Validate new parentId if provided
  if (parentId) {
    const parentFolder = await dynamoDB.get({
      TableName: getTableName('bookmark-folders'),
      Key: { id: parentId },
    }).promise();
    if (!parentFolder.Item || parentFolder.Item.userId !== userId) {
      throw new AppError('New parent folder not found or not authorized', 404);
    }
  }
  
  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (name !== undefined) {
    updateExpressionParts.push('#name = :name');
    expressionAttributeValues[':name'] = name;
    expressionAttributeNames['#name'] = 'name';
  }
  if (parentId !== undefined) { // Allows setting parentId to null or a value
    updateExpressionParts.push('#parentId = :parentId');
    expressionAttributeValues[':parentId'] = parentId || null; // Ensure null if empty string
    expressionAttributeNames['#parentId'] = 'parentId';
  }

  if (updateExpressionParts.length === 0) {
    return res.status(200).json({
      success: true,
      data: currentFolderResult.Item,
      message: 'No fields to update',
    });
  }

  const timestamp = new Date().toISOString();
  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = timestamp;
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('bookmark-folders'),
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
 * @function deleteBookmarkFolder
 * @description Delete a bookmark folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deleteBookmarkFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const folderResult = await dynamoDB.get({
    TableName: getTableName('bookmark-folders'),
    Key: { id },
  }).promise();

  if (!folderResult.Item) {
    throw new AppError('Bookmark folder not found', 404);
  }

  if (folderResult.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this folder', 403);
  }

  // 1. Check for sub-folders
  const subFoldersParams = {
    TableName: getTableName('bookmark-folders'),
    IndexName: 'userId-index', // Assuming GSI on userId, filter on parentId
    KeyConditionExpression: 'userId = :userId',
    FilterExpression: 'parentId = :parentId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':parentId': id,
    },
  };
  const subFoldersResult = await dynamoDB.query(subFoldersParams).promise();
  if (subFoldersResult.Items && subFoldersResult.Items.length > 0) {
    throw new AppError('Cannot delete folder: it contains sub-folders. Please delete or move them first.', 400);
  }

  // 2. Disassociate bookmarks (set their folderId to null)
  // Query bookmarks by folderId (and userId for security, though folder ownership implies bookmark ownership)
  // This might require a GSI on folderId for BookmarksTable, or a scan.
  // For now, assuming we can query BookmarksTable by folderId.
  // If BookmarksTable only has userId-index, we'd query by userId and filter for this folderId.
  
  let exclusiveStartKeyForBookmarks;
  const bookmarksTableName = getTableName('bookmarks');
  
  do {
    const bookmarkQueryParams = {
        TableName: bookmarksTableName,
        IndexName: 'userId-index', // Query by user
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'folderId = :folderId', // Filter for this specific folder
        ExpressionAttributeValues: {
            ':userId': userId,
            ':folderId': id
        },
        ExclusiveStartKey: exclusiveStartKeyForBookmarks
    };
    const bookmarksInFolder = await dynamoDB.query(bookmarkQueryParams).promise();

    if (bookmarksInFolder.Items && bookmarksInFolder.Items.length > 0) {
        const batchWriteRequests = bookmarksInFolder.Items.map(bookmark => ({
            PutRequest: {
                Item: { ...bookmark, folderId: null, updatedAt: new Date().toISOString() }
            }
        }));
        
        // DynamoDB BatchWriteItem has a limit of 25 items per request
        for (let i = 0; i < batchWriteRequests.length; i += 25) {
            const batch = batchWriteRequests.slice(i, i + 25);
            await dynamoDB.batchWrite({
                RequestItems: { [bookmarksTableName]: batch }
            }).promise();
        }
    }
    exclusiveStartKeyForBookmarks = bookmarksInFolder.LastEvaluatedKey;
  } while (exclusiveStartKeyForBookmarks);


  // 3. Delete the folder itself
  await dynamoDB.delete({
    TableName: getTableName('bookmark-folders'),
    Key: { id },
  }).promise();

  res.status(204).json({
    success: true,
    data: null,
  });
});

/**
 * @async
 * @function getBookmarksInFolder
 * @description Get bookmarks within a specific folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getBookmarksInFolder = asyncHandler(async (req, res) => {
  const { id: folderId } = req.params;
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  // 1. Verify folder existence and ownership
  const folderResult = await dynamoDB.get({
    TableName: getTableName('bookmark-folders'),
    Key: { id: folderId },
  }).promise();

  if (!folderResult.Item) {
    throw new AppError('Bookmark folder not found', 404);
  }

  if (folderResult.Item.userId !== userId) {
    throw new AppError('Bookmark folder not found or not authorized', 404);
  }

  // 2. Fetch bookmarks using the same logic as getBookmarks, but filtered by this folderId
  const params = {
    TableName: getTableName('bookmarks'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    FilterExpression: 'folderId = :folderId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':folderId': folderId,
    },
    ScanIndexForward: false,
  };
  
  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format for bookmarks', 400);
    }
  }
  
  const bookmarksResult = await dynamoDB.query(params).promise();

  res.status(200).json({
    success: true,
    data: bookmarksResult.Items,
    lastEvaluatedKey: bookmarksResult.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(bookmarksResult.LastEvaluatedKey)) : null,
  });
});


module.exports = {
  createBookmarkFolder,
  getBookmarkFolders,
  getBookmarkFolderById,
  updateBookmarkFolder,
  deleteBookmarkFolder,
  getBookmarksInFolder,
};
