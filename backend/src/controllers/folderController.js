// backend/src/controllers/folderController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @async
 * @function createFolder
 * @description Create a new folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const createFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const userId = req.user.id;

  if (!name) {
    throw new AppError('Folder name is required', 400);
  }

  // Optional: Validate parentId if provided
  if (parentId) {
    const parentFolder = await dynamoDB.get({
      TableName: getTableName('folders'),
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
    parentId: parentId || null, // Store null if no parentId
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('folders'),
    Item: folder,
  }).promise();

  res.status(201).json({
    success: true,
    data: folder,
  });
});

/**
 * @async
 * @function getFolders
 * @description Get folders for the authenticated user.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getFolders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { parentId, limit, exclusiveStartKey } = req.query;

  const params = {
    TableName: getTableName('folders'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: true, // Optional: sort by name or createdAt if GSI has sort key
  };

  const filterExpressionParts = [];
  if (parentId === 'null' || parentId === 'root' || parentId === '') {
    filterExpressionParts.push('(attribute_not_exists(parentId) OR parentId = :nullParentId)');
    params.ExpressionAttributeValues[':nullParentId'] = null;
  } else if (parentId) {
    filterExpressionParts.push('parentId = :parentIdVal'); // Renamed to avoid conflict if :parentId is used in KeyCondition
    params.ExpressionAttributeValues[':parentIdVal'] = parentId;
  }

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
 * @function getFolderById
 * @description Get a single folder by its ID.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getFolderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('folders'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Folder not found', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Folder not found or not authorized', 404);
  }

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updateFolder
 * @description Update an existing folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updateFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, parentId } = req.body;

  const currentFolderResult = await dynamoDB.get({
    TableName: getTableName('folders'),
    Key: { id },
  }).promise();

  if (!currentFolderResult.Item) {
    throw new AppError('Folder not found', 404);
  }
  if (currentFolderResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this folder', 403);
  }

  if (parentId === id) { // Cycle prevention
    throw new AppError('Cannot set a folder as its own parent', 400);
  }

  if (parentId) { // Validate new parentId if provided
    const parentFolder = await dynamoDB.get({
      TableName: getTableName('folders'),
      Key: { id: parentId },
    }).promise();
    if (!parentFolder.Item || parentFolder.Item.userId !== userId) {
      throw new AppError('New parent folder not found or not authorized', 404);
    }
    // Add more complex cycle detection if needed (e.g. new parent is not a descendant)
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (name !== undefined) {
    updateExpressionParts.push('#name = :name');
    expressionAttributeValues[':name'] = name;
    expressionAttributeNames['#name'] = 'name';
  }
  if (parentId !== undefined) {
    updateExpressionParts.push('#parentId = :parentId');
    expressionAttributeValues[':parentId'] = parentId || null;
    expressionAttributeNames['#parentId'] = 'parentId';
  }

  if (updateExpressionParts.length === 0) {
    return res.status(200).json({ success: true, data: currentFolderResult.Item, message: 'No fields to update' });
  }

  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('folders'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();
  res.status(200).json({ success: true, data: result.Attributes });
});

/**
 * @async
 * @function deleteFolder
 * @description Delete a folder. Prevents deletion if not empty.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deleteFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const folderResult = await dynamoDB.get({
    TableName: getTableName('folders'),
    Key: { id },
  }).promise();

  if (!folderResult.Item) {
    throw new AppError('Folder not found', 404);
  }
  if (folderResult.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this folder', 403);
  }

  // Check for sub-folders
  const subFoldersParams = {
    TableName: getTableName('folders'),
    IndexName: 'parentFolderId-index', // Assumes GSI on parentId
    KeyConditionExpression: 'parentId = :parentId',
    ExpressionAttributeValues: { ':parentId': id },
    Limit: 1, // We only need to know if at least one exists
  };
  const subFoldersResult = await dynamoDB.query(subFoldersParams).promise();
  // Filter by userId if parentFolderId-index does not include it as a key
  if (subFoldersResult.Items && subFoldersResult.Items.some(sf => sf.userId === userId)) {
    throw new AppError('Cannot delete folder: it contains sub-folders. Please delete or move them first.', 400);
  }


  // Check for files in this folder
  const filesParams = {
    TableName: getTableName('files'),
    IndexName: 'folderId-index', // Assumes GSI on folderId for FilesTable
    KeyConditionExpression: 'folderId = :folderId',
    ExpressionAttributeValues: { ':folderId': id },
    Limit: 1,
  };
  const filesResult = await dynamoDB.query(filesParams).promise();
   // Filter by userId if folderId-index does not include it as a key
  if (filesResult.Items && filesResult.Items.some(f => f.userId === userId)) {
    throw new AppError('Cannot delete folder: it contains files. Please delete or move them first.', 400);
  }


  await dynamoDB.delete({
    TableName: getTableName('folders'),
    Key: { id },
  }).promise();

  res.status(204).send();
});

/**
 * @async
 * @function getFilesInFolder
 * @description Get files within a specific folder.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getFilesInFolder = asyncHandler(async (req, res) => {
  const { id: folderId } = req.params;
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  // 1. Verify folder existence and ownership
  const folderResult = await dynamoDB.get({
    TableName: getTableName('folders'),
    Key: { id: folderId },
  }).promise();

  if (!folderResult.Item) {
    throw new AppError('Folder not found', 404);
  }
  if (folderResult.Item.userId !== userId) {
    throw new AppError('Folder not found or not authorized', 404);
  }

  // 2. Fetch files using folderId-index and filter by userId
  const params = {
    TableName: getTableName('files'),
    IndexName: 'folderId-index',
    KeyConditionExpression: 'folderId = :folderId',
    FilterExpression: 'userId = :userId', // FilesTable's folderId-index might not include userId as a key
    ExpressionAttributeValues: {
      ':folderId': folderId,
      ':userId': userId,
    },
  };

  if (limit) params.Limit = parseInt(limit, 10);
  if (exclusiveStartKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format', 400);
    }
  }

  const filesResult = await dynamoDB.query(params).promise();
  // Note: Actual file download/streaming would be handled by a separate fileController and presigned URLs

  res.status(200).json({
    success: true,
    data: filesResult.Items,
    lastEvaluatedKey: filesResult.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(filesResult.LastEvaluatedKey)) : null,
  });
});

module.exports = {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  getFilesInFolder,
};
