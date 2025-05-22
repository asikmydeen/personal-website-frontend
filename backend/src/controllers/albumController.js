// backend/src/controllers/albumController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @async
 * @function createAlbum
 * @description Create a new album.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const createAlbum = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    throw new AppError('Album name is required', 400);
  }

  const timestamp = new Date().toISOString();
  const albumId = uuidv4();

  const album = {
    id: albumId,
    userId,
    name,
    description: description || null, // Optional field
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('albums'),
    Item: album,
  }).promise();

  res.status(201).json({
    success: true,
    data: album,
  });
});

/**
 * @async
 * @function getAlbums
 * @description Get all albums for the authenticated user with pagination.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getAlbums = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  const params = {
    TableName: getTableName('albums'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Optional: get newer albums first if sort key is time-based
  };

  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      // For AlbumsTable, primary key is 'id' (HASH). GSI 'userId-index' has 'userId' (HASH).
      // LastEvaluatedKey will look like: { id: 'albumIdValue', userId: 'userIdValue' }
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
 * @function getAlbumById
 * @description Get a single album by its ID.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getAlbumById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('albums'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Album not found', 404);
  }

  if (result.Item.userId !== userId) {
    throw new AppError('Album not found or not authorized', 404); // Treat as not found for security
  }

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updateAlbum
 * @description Update an existing album.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const updateAlbum = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, description } = req.body;

  // First, get the album to ensure it exists and belongs to the user
  const currentAlbumResult = await dynamoDB.get({
    TableName: getTableName('albums'),
    Key: { id },
  }).promise();

  if (!currentAlbumResult.Item) {
    throw new AppError('Album not found', 404);
  }

  if (currentAlbumResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this album', 403);
  }

  // Construct update expression
  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (name !== undefined) {
    updateExpressionParts.push('#n = :name');
    expressionAttributeValues[':name'] = name;
    expressionAttributeNames['#n'] = 'name';
  }

  if (description !== undefined) {
    updateExpressionParts.push('#d = :description');
    expressionAttributeValues[':description'] = description;
    expressionAttributeNames['#d'] = 'description';
  }

  if (updateExpressionParts.length === 0) {
    return res.status(200).json({
      success: true,
      data: currentAlbumResult.Item,
      message: 'No fields to update',
    });
  }

  const timestamp = new Date().toISOString();
  updateExpressionParts.push('#ua = :updatedAt');
  expressionAttributeValues[':updatedAt'] = timestamp;
  expressionAttributeNames['#ua'] = 'updatedAt';

  const params = {
    TableName: getTableName('albums'),
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
 * @function deleteAlbum
 * @description Delete an album.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteAlbum = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const albumResult = await dynamoDB.get({
    TableName: getTableName('albums'),
    Key: { id },
  }).promise();

  if (!albumResult.Item) {
    throw new AppError('Album not found', 404);
  }

  if (albumResult.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this album', 403); // Or 404 for obscurity
  }

  // TODO: Future enhancement - decide on and implement deletion/disassociation of photos in this album.
  // For now, only the album item is deleted.

  await dynamoDB.delete({
    TableName: getTableName('albums'),
    Key: { id },
  }).promise();

  res.status(204).json({ // Or res.status(204).send();
    success: true,
    data: null,
  });
});

/**
 * @async
 * @function getPhotosInAlbum
 * @description Get all photos in a specific album for the authenticated user with pagination.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const getPhotosInAlbum = asyncHandler(async (req, res) => {
  const { id: albumId } = req.params; // Album ID from path
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  // Step 1: Verify album existence and ownership
  const albumResult = await dynamoDB.get({
    TableName: getTableName('albums'),
    Key: { id: albumId },
  }).promise();

  if (!albumResult.Item) {
    throw new AppError('Album not found', 404);
  }

  if (albumResult.Item.userId !== userId) {
    // If album doesn't belong to user, they can't see its photos
    throw new AppError('Album not found or not authorized', 404);
  }

  // Step 2: Fetch photos from the album
  const params = {
    TableName: getTableName('photos'),
    IndexName: 'albumId-index', // Assumes PhotosTable has a GSI on albumId
    KeyConditionExpression: 'albumId = :albumId',
    ExpressionAttributeValues: {
      ':albumId': albumId,
    },
    // Optionally, add ScanIndexForward if photos have a sort key in the GSI or main table
  };

  if (limit) {
    params.Limit = parseInt(limit, 10);
  }

  if (exclusiveStartKey) {
    try {
      // For PhotosTable's albumId-index, LastEvaluatedKey will depend on PhotosTable's primary key and GSI definition.
      // Assuming PhotosTable primary key is 'id' (HASH) and GSI 'albumId-index' has 'albumId' (HASH).
      // LastEvaluatedKey would be like: { id: 'photoIdValue', albumId: 'albumIdValue' }
      // If PhotosTable also has a sort key, it would be included.
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format for photos', 400);
    }
  }

  const result = await dynamoDB.query(params).promise();

  res.status(200).json({
    success: true,
    data: result.Items,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  getPhotosInAlbum,
};
