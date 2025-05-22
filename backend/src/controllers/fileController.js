// backend/src/controllers/fileController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, s3, getTableName, getBucketName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const path = require('path'); // For sanitizing filenames

const PRESIGNED_URL_EXPIRES_IN = 300; // 5 minutes for GET URLs
const PRESIGNED_POST_EXPIRES_IN = 300; // 5 minutes for POST URLs

// Helper to sanitize filename
const sanitizeFilename = (filename) => {
  return path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

/**
 * @async
 * @function initiateFileUpload
 * @description Initiates a file upload by generating a presigned POST URL.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const initiateFileUpload = asyncHandler(async (req, res) => {
  const { fileName, contentType, folderId, tags } = req.body;
  const userId = req.user.id;

  if (!fileName || !contentType) {
    throw new AppError('fileName and contentType are required.', 400);
  }

  // Validate folderId if provided
  if (folderId) {
    const folderResult = await dynamoDB.get({
      TableName: getTableName('folders'),
      Key: { id: folderId },
    }).promise();
    if (!folderResult.Item || folderResult.Item.userId !== userId) {
      throw new AppError('Folder not found or not authorized.', 404);
    }
  }

  const sanitizedFileName = sanitizeFilename(fileName);
  const fileId = uuidv4();
  const s3FolderKey = folderId || 'user-root'; // Use 'user-root' if no folderId
  const s3Key = `files/${userId}/${s3FolderKey}/${fileId}-${sanitizedFileName}`;
  
  const timestamp = new Date().toISOString();

  const fileMetadata = {
    id: fileId,
    userId,
    originalFileName: fileName,
    s3Key,
    contentType,
    folderId: folderId || null,
    tags: tags || [],
    fileSize: null,
    uploadStatus: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('files'),
    Item: fileMetadata,
  }).promise();

  const bucketName = getBucketName();
  const postParams = {
    Bucket: bucketName,
    Fields: {
      key: s3Key,
      'Content-Type': contentType,
    },
    Conditions: [
      ['content-length-range', 0, 500 * 1024 * 1024], // Max 500MB, adjust as needed
      { 'Content-Type': contentType },
    ],
    Expires: PRESIGNED_POST_EXPIRES_IN,
  };

  const presignedPostData = await new Promise((resolve, reject) => {
    s3.createPresignedPost(postParams, (err, data) => {
      if (err) {
        console.error('Failed to create presigned POST URL for file:', err);
        return reject(new AppError('Failed to initiate file upload.', 500));
      }
      resolve(data);
    });
  });

  res.status(201).json({
    success: true,
    message: 'Upload initiated. Use the presignedPostData to upload the file.',
    fileId,
    presignedPostData,
  });
});

/**
 * @async
 * @function finalizeFileUpload
 * @description Finalizes a file upload, updating its status and metadata.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const finalizeFileUpload = asyncHandler(async (req, res) => {
  const { id } = req.params; // This is fileId
  const userId = req.user.id;
  const { fileSize } = req.body;

  if (fileSize === undefined || fileSize === null) { // fileSize can be 0
    throw new AppError('fileSize is required to finalize.', 400);
  }
  if (typeof fileSize !== 'number' || fileSize < 0) {
      throw new AppError('Invalid fileSize.', 400)
  }


  const currentFileResult = await dynamoDB.get({
    TableName: getTableName('files'),
    Key: { id },
  }).promise();

  if (!currentFileResult.Item) {
    throw new AppError('File not found.', 404);
  }
  if (currentFileResult.Item.userId !== userId) {
    throw new AppError('Not authorized to finalize this file.', 403);
  }
  if (currentFileResult.Item.uploadStatus === 'completed') {
    return res.status(200).json({ success: true, message: 'File already finalized.', data: currentFileResult.Item });
  }
  
  try {
    await s3.headObject({ Bucket: getBucketName(), Key: currentFileResult.Item.s3Key }).promise();
  } catch (error) {
    console.error('S3 object not found or inaccessible during finalize file:', error);
    throw new AppError('File not found in storage. Upload may have failed or is still in progress.', 404);
  }

  const params = {
    TableName: getTableName('files'),
    Key: { id },
    UpdateExpression: 'SET #uploadStatus = :completedStatus, #fileSize = :fileSize, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#uploadStatus': 'uploadStatus',
      '#fileSize': 'fileSize',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':completedStatus': 'completed',
      ':fileSize': fileSize,
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();

  res.status(200).json({
    success: true,
    message: 'File upload finalized.',
    data: result.Attributes,
  });
});

// Helper to generate presigned GET URL for files
const generatePresignedGetUrlForFile = async (s3Key) => {
  try {
    return await s3.getSignedUrlPromise('getObject', {
      Bucket: getBucketName(),
      Key: s3Key,
      Expires: PRESIGNED_URL_EXPIRES_IN,
    });
  } catch (error) {
    console.error(`Error generating presigned GET URL for file ${s3Key}:`, error);
    return null;
  }
};

/**
 * @async
 * @function getFiles
 * @description Get all completed files for the user with presigned URLs.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { folderId, limit, exclusiveStartKey } = req.query;

  const params = {
    TableName: getTableName('files'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
    },
    FilterExpression: 'uploadStatus = :completed',
  };

  const filterParts = [params.FilterExpression]; // Start with existing uploadStatus filter

  if (folderId === 'null' || folderId === 'root' || folderId === '') {
    filterParts.push('(attribute_not_exists(folderId) OR folderId = :nullFolderId)');
    params.ExpressionAttributeValues[':nullFolderId'] = null;
  } else if (folderId) {
    filterParts.push('folderId = :folderIdVal');
    params.ExpressionAttributeValues[':folderIdVal'] = folderId;
  }
  // If folderId is not provided, only the uploadStatus = 'completed' filter applies.

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
      item.url = await generatePresignedGetUrlForFile(item.s3Key);
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
 * @function getFileById
 * @description Get a single file by ID with presigned URL.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getFileById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('files'),
    Key: { id },
  }).promise();

  if (!result.Item || result.Item.uploadStatus !== 'completed') {
    throw new AppError('File not found or not yet finalized.', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('File not found or not authorized.', 404);
  }

  result.Item.url = await generatePresignedGetUrlForFile(result.Item.s3Key);

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});

/**
 * @async
 * @function updateFile
 * @description Update file metadata (originalFileName, tags, folderId). S3 key does not change.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updateFile = asyncHandler(async (req, res) => {
  const { id } = req.params; // fileId
  const userId = req.user.id;
  const { fileName, tags, folderId } = req.body;

  const currentFileResult = await dynamoDB.get({
    TableName: getTableName('files'),
    Key: { id },
  }).promise();

  if (!currentFileResult.Item) {
    throw new AppError('File not found.', 404);
  }
  if (currentFileResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this file.', 403);
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (fileName !== undefined) {
    updateExpressionParts.push('#originalFileName = :originalFileName');
    expressionAttributeValues[':originalFileName'] = fileName;
    expressionAttributeNames['#originalFileName'] = 'originalFileName';
    // Note: s3Key is NOT changed as per requirement "S3 object key might not change"
  }
  if (tags !== undefined) {
    updateExpressionParts.push('#tags = :tags');
    expressionAttributeValues[':tags'] = tags;
    expressionAttributeNames['#tags'] = 'tags';
  }
  if (folderId !== undefined) { // Allows moving to root by passing null or empty string for folderId
    const newFolderId = folderId === '' ? null : folderId;
    if (newFolderId) { // Validate new folderId if it's not root
        const folderResult = await dynamoDB.get({
            TableName: getTableName('folders'),
            Key: { id: newFolderId }
        }).promise();
        if (!folderResult.Item || folderResult.Item.userId !== userId) {
            throw new AppError('Target folder not found or not authorized.', 404);
        }
    }
    updateExpressionParts.push('#folderId = :folderId');
    expressionAttributeValues[':folderId'] = newFolderId;
    expressionAttributeNames['#folderId'] = 'folderId';
  }
  
  if (updateExpressionParts.length === 0) {
    currentFileResult.Item.url = await generatePresignedGetUrlForFile(currentFileResult.Item.s3Key);
    return res.status(200).json({ success: true, data: currentFileResult.Item, message: 'No fields to update.' });
  }

  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('files'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();
  result.Attributes.url = await generatePresignedGetUrlForFile(result.Attributes.s3Key);

  res.status(200).json({
    success: true,
    data: result.Attributes,
  });
});

/**
 * @async
 * @function deleteFile
 * @description Delete a file (S3 object and DynamoDB record).
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('files'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('File not found.', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this file.', 403);
  }

  try {
    await s3.deleteObject({
      Bucket: getBucketName(),
      Key: result.Item.s3Key,
    }).promise();
  } catch (s3Error) {
    console.error(`Failed to delete S3 object ${result.Item.s3Key} for file ${id}:`, s3Error);
    // Potentially allow proceeding to delete DynamoDB record even if S3 fails, or throw
    // For now, we'll log and proceed.
  }

  await dynamoDB.delete({
    TableName: getTableName('files'),
    Key: { id },
  }).promise();

  res.status(204).send();
});

/**
 * @async
 * @function searchFiles
 * @description Search files by originalFileName or tags.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const searchFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, limit, exclusiveStartKey } = req.query;

  if (!q) {
    throw new AppError('Search query (q) is required', 400);
  }

  const params = {
    TableName: getTableName('files'),
    FilterExpression: 'userId = :userId AND uploadStatus = :completed AND (' +
                      'contains(#originalFileName, :q) OR ' +
                      'contains(#tags, :q_tag)' + 
                      ')',
    ExpressionAttributeNames: {
      '#originalFileName': 'originalFileName',
      '#tags': 'tags',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
      ':q': q, // DynamoDB `contains` is case-sensitive for strings
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
      item.url = await generatePresignedGetUrlForFile(item.s3Key);
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
 * @function getFilesByTag
 * @description Get files by a specific tag.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getFilesByTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { tag, limit, exclusiveStartKey } = req.query;

  if (!tag) {
    throw new AppError('Tag query parameter is required', 400);
  }

  const params = {
    TableName: getTableName('files'),
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
      item.url = await generatePresignedGetUrlForFile(item.s3Key);
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
  initiateFileUpload,
  finalizeFileUpload,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  searchFiles,
  getFilesByTag,
};
