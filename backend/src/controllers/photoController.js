// backend/src/controllers/photoController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, s3, getTableName, getBucketName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const path = require('path'); // For sanitizing filenames

const PRESIGNED_URL_EXPIRES_IN = 300; // 5 minutes for GET URLs
const PRESIGNED_POST_EXPIRES_IN = 300; // 5 minutes for POST URLs
const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
const MAX_PHOTO_SIZE_MB = 50; // Max 50MB for photos, adjust as needed

// Helper to sanitize filename
const sanitizeFilename = (filename) => {
  return path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

/**
 * @async
 * @function initiatePhotoUpload
 * @description Initiates a photo upload by generating a presigned POST URL.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const initiatePhotoUpload = asyncHandler(async (req, res) => {
  const { fileName, contentType, albumId, tags, caption, location, dateTaken } = req.body;
  const userId = req.user.id;

  if (!fileName || !contentType) {
    throw new AppError('fileName and contentType are required.', 400);
  }
  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType.toLowerCase())) {
      throw new AppError(`Invalid contentType. Allowed types: ${ALLOWED_IMAGE_CONTENT_TYPES.join(', ')}`, 400);
  }

  // Validate albumId if provided
  if (albumId) {
    const albumResult = await dynamoDB.get({
      TableName: getTableName('albums'),
      Key: { id: albumId },
    }).promise();
    if (!albumResult.Item || albumResult.Item.userId !== userId) {
      throw new AppError('Album not found or not authorized.', 404);
    }
  }

  const sanitizedFileName = sanitizeFilename(fileName);
  const photoId = uuidv4();
  const s3AlbumKey = albumId || 'user-root-photos'; // Use a specific string if no albumId
  const s3Key = `photos/${userId}/${s3AlbumKey}/${photoId}-${sanitizedFileName}`;
  
  const timestamp = new Date().toISOString();

  const photoMetadata = {
    id: photoId,
    userId,
    originalFileName: fileName,
    s3Key,
    contentType,
    albumId: albumId || null,
    tags: tags || [],
    caption: caption || null,
    location: location || null,
    dateTaken: dateTaken || null, // Should be ISO string if provided
    fileSize: null,
    width: null,
    height: null,
    uploadStatus: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('photos'),
    Item: photoMetadata,
  }).promise();

  const bucketName = getBucketName();
  const postParams = {
    Bucket: bucketName,
    Fields: {
      key: s3Key,
      'Content-Type': contentType,
    },
    Conditions: [
      ['content-length-range', 0, MAX_PHOTO_SIZE_MB * 1024 * 1024], 
      { 'Content-Type': contentType },
    ],
    Expires: PRESIGNED_POST_EXPIRES_IN,
  };

  const presignedPostData = await new Promise((resolve, reject) => {
    s3.createPresignedPost(postParams, (err, data) => {
      if (err) {
        console.error('Failed to create presigned POST URL for photo:', err);
        return reject(new AppError('Failed to initiate photo upload.', 500));
      }
      resolve(data);
    });
  });

  res.status(201).json({
    success: true,
    message: 'Upload initiated. Use the presignedPostData to upload the photo.',
    photoId,
    presignedPostData,
  });
});

/**
 * @async
 * @function finalizePhotoUpload
 * @description Finalizes a photo upload, updating its status and metadata.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const finalizePhotoUpload = asyncHandler(async (req, res) => {
  const { id } = req.params; // This is photoId
  const userId = req.user.id;
  const { fileSize, width, height } = req.body;

  if (fileSize === undefined || fileSize === null) {
    throw new AppError('fileSize is required to finalize.', 400);
  }
   if (typeof fileSize !== 'number' || fileSize < 0) {
      throw new AppError('Invalid fileSize.', 400)
  }
  if ((width !== undefined && typeof width !== 'number') || (height !== undefined && typeof height !== 'number')) {
      throw new AppError('Invalid width or height. Must be numbers.', 400);
  }


  const currentPhotoResult = await dynamoDB.get({
    TableName: getTableName('photos'),
    Key: { id },
  }).promise();

  if (!currentPhotoResult.Item) {
    throw new AppError('Photo not found.', 404);
  }
  if (currentPhotoResult.Item.userId !== userId) {
    throw new AppError('Not authorized to finalize this photo.', 403);
  }
   if (currentPhotoResult.Item.uploadStatus === 'completed') {
    return res.status(200).json({ success: true, message: 'Photo already finalized.', data: currentPhotoResult.Item });
  }
  
  try {
    await s3.headObject({ Bucket: getBucketName(), Key: currentPhotoResult.Item.s3Key }).promise();
  } catch (error) {
    console.error('S3 object not found or inaccessible during finalize photo:', error);
    throw new AppError('File not found in storage. Upload may have failed or is still in progress.', 404);
  }

  const updateExpressionParts = ['#uploadStatus = :completedStatus', '#fileSize = :fileSize', '#updatedAt = :updatedAt'];
  const expressionAttributeValues = {
    ':completedStatus': 'completed',
    ':fileSize': fileSize,
    ':updatedAt': new Date().toISOString(),
  };
  const expressionAttributeNames = {
    '#uploadStatus': 'uploadStatus',
    '#fileSize': 'fileSize',
    '#updatedAt': 'updatedAt',
  };

  if (width !== undefined) {
    updateExpressionParts.push('#width = :width');
    expressionAttributeValues[':width'] = width;
    expressionAttributeNames['#width'] = 'width';
  }
  if (height !== undefined) {
    updateExpressionParts.push('#height = :height');
    expressionAttributeValues[':height'] = height;
    expressionAttributeNames['#height'] = 'height';
  }
  
  const params = {
    TableName: getTableName('photos'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();

  res.status(200).json({
    success: true,
    message: 'Photo upload finalized.',
    data: result.Attributes,
  });
});

// Helper to generate presigned GET URL for photos
const generatePresignedGetUrlForPhoto = async (s3Key) => {
  try {
    return await s3.getSignedUrlPromise('getObject', {
      Bucket: getBucketName(),
      Key: s3Key,
      Expires: PRESIGNED_URL_EXPIRES_IN,
    });
  } catch (error) {
    console.error(`Error generating presigned GET URL for photo ${s3Key}:`, error);
    return null;
  }
};

/**
 * @async
 * @function getPhotos
 * @description Get all completed photos for the user with presigned URLs.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getPhotos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { albumId, limit, exclusiveStartKey } = req.query;

  const params = {
    TableName: getTableName('photos'),
    IndexName: 'userId-index', // Assumes GSI on userId for PhotosTable
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
    },
    FilterExpression: 'uploadStatus = :completed',
  };
  
  const filterParts = [params.FilterExpression];

  if (albumId === 'null' || albumId === 'root' || albumId === '') {
    filterParts.push('(attribute_not_exists(albumId) OR albumId = :nullAlbumId)');
    params.ExpressionAttributeValues[':nullAlbumId'] = null;
  } else if (albumId) {
    filterParts.push('albumId = :albumIdVal');
    params.ExpressionAttributeValues[':albumIdVal'] = albumId;
  }
  // If albumId is not provided, only the uploadStatus = 'completed' filter applies.

  params.FilterExpression = filterParts.join(' AND ');


  if (limit) params.Limit = parseInt(limit, 10);
  if (exclusiveStartKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(exclusiveStartKey));
    } catch (error) {
      throw new AppError('Invalid exclusiveStartKey format', 400);
    }
  }

  const result = await dynamoDB.query(params).promise();
  const itemsWithUrls = await Promise.all(
    result.Items.map(async (item) => {
      item.url = await generatePresignedGetUrlForPhoto(item.s3Key);
      return item;
    })
  );

  res.status(200).json({
    success: true,
    data: itemsWithUrls,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getPhotoById
 * @description Get a single photo by ID with presigned URL.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getPhotoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('photos'),
    Key: { id },
  }).promise();

  if (!result.Item || result.Item.uploadStatus !== 'completed') {
    throw new AppError('Photo not found or not yet finalized.', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Photo not found or not authorized.', 404);
  }

  result.Item.url = await generatePresignedGetUrlForPhoto(result.Item.s3Key);

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updatePhoto
 * @description Update photo metadata. S3 key and originalFileName do not change.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updatePhoto = asyncHandler(async (req, res) => {
  const { id } = req.params; // photoId
  const userId = req.user.id;
  const { caption, tags, albumId, location, dateTaken, width, height } = req.body;

  const currentPhotoResult = await dynamoDB.get({
    TableName: getTableName('photos'),
    Key: { id },
  }).promise();

  if (!currentPhotoResult.Item) {
    throw new AppError('Photo not found.', 404);
  }
  if (currentPhotoResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this photo.', 403);
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (caption !== undefined) {
    updateExpressionParts.push('#caption = :caption');
    expressionAttributeValues[':caption'] = caption;
    expressionAttributeNames['#caption'] = 'caption';
  }
  if (tags !== undefined) {
    updateExpressionParts.push('#tags = :tags');
    expressionAttributeValues[':tags'] = tags;
    expressionAttributeNames['#tags'] = 'tags';
  }
  if (albumId !== undefined) { // Allows moving to root by passing null or empty string
    const newAlbumId = albumId === '' ? null : albumId;
    if (newAlbumId) { // Validate new albumId if it's not root
        const albumResult = await dynamoDB.get({
            TableName: getTableName('albums'), // Corrected to 'albums'
            Key: { id: newAlbumId }
        }).promise();
        if (!albumResult.Item || albumResult.Item.userId !== userId) {
            throw new AppError('Target album not found or not authorized.', 404);
        }
    }
    updateExpressionParts.push('#albumId = :albumId');
    expressionAttributeValues[':albumId'] = newAlbumId;
    expressionAttributeNames['#albumId'] = 'albumId';
  }
  if (location !== undefined) {
    updateExpressionParts.push('#location = :location');
    expressionAttributeValues[':location'] = location;
    expressionAttributeNames['#location'] = 'location';
  }
  if (dateTaken !== undefined) {
    updateExpressionParts.push('#dateTaken = :dateTaken');
    expressionAttributeValues[':dateTaken'] = dateTaken;
    expressionAttributeNames['#dateTaken'] = 'dateTaken';
  }
   if (width !== undefined) {
    updateExpressionParts.push('#width = :width');
    expressionAttributeValues[':width'] = width;
    expressionAttributeNames['#width'] = 'width';
  }
  if (height !== undefined) {
    updateExpressionParts.push('#height = :height');
    expressionAttributeValues[':height'] = height;
    expressionAttributeNames['#height'] = 'height';
  }
  
  if (updateExpressionParts.length === 0) {
    currentPhotoResult.Item.url = await generatePresignedGetUrlForPhoto(currentPhotoResult.Item.s3Key);
    return res.status(200).json({ success: true, data: currentPhotoResult.Item, message: 'No fields to update.' });
  }

  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('photos'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();
  result.Attributes.url = await generatePresignedGetUrlForPhoto(result.Attributes.s3Key);

  res.status(200).json({
    success: true,
    data: result.Attributes,
  });
});

/**
 * @async
 * @function deletePhoto
 * @description Delete a photo (S3 object and DynamoDB record).
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deletePhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('photos'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Photo not found.', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this photo.', 403);
  }

  try {
    await s3.deleteObject({
      Bucket: getBucketName(),
      Key: result.Item.s3Key,
    }).promise();
  } catch (s3Error) {
    console.error(`Failed to delete S3 object ${result.Item.s3Key} for photo ${id}:`, s3Error);
    // Log and proceed to delete DynamoDB record.
  }

  await dynamoDB.delete({
    TableName: getTableName('photos'),
    Key: { id },
  }).promise();

  res.status(204).send();
});

/**
 * @async
 * @function searchPhotos
 * @description Search photos by caption, tags, location, or originalFileName.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const searchPhotos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, limit, exclusiveStartKey } = req.query;

  if (!q) {
    throw new AppError('Search query (q) is required', 400);
  }

  const params = {
    TableName: getTableName('photos'),
    FilterExpression: 'userId = :userId AND uploadStatus = :completed AND (' +
                      'contains(#caption, :q) OR ' +
                      'contains(#tags, :q_tag) OR ' + 
                      'contains(#location, :q) OR ' +
                      'contains(#originalFileName, :q)' +
                      ')',
    ExpressionAttributeNames: {
      '#caption': 'caption',
      '#tags': 'tags',
      '#location': 'location',
      '#originalFileName': 'originalFileName',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
      ':q': q, 
      ':q_tag': q, 
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

  const result = await dynamoDB.scan(params).promise();
  const itemsWithUrls = await Promise.all(
    result.Items.map(async (item) => {
      item.url = await generatePresignedGetUrlForPhoto(item.s3Key);
      return item;
    })
  );

  res.status(200).json({
    success: true,
    data: itemsWithUrls,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getPhotosByTag
 * @description Get photos by a specific tag.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getPhotosByTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { tag, limit, exclusiveStartKey } = req.query;

  if (!tag) {
    throw new AppError('Tag query parameter is required', 400);
  }

  const params = {
    TableName: getTableName('photos'),
    FilterExpression: 'userId = :userId AND uploadStatus = :completed AND contains(#tags, :tagVal)',
    ExpressionAttributeNames: {
      '#tags': 'tags',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
      ':tagVal': tag,
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

  const result = await dynamoDB.scan(params).promise();
  const itemsWithUrls = await Promise.all(
    result.Items.map(async (item) => {
      item.url = await generatePresignedGetUrlForPhoto(item.s3Key);
      return item;
    })
  );

  res.status(200).json({
    success: true,
    data: itemsWithUrls,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

module.exports = {
  initiatePhotoUpload,
  finalizePhotoUpload,
  getPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  searchPhotos,
  getPhotosByTag,
};
