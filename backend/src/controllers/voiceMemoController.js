// backend/src/controllers/voiceMemoController.js
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
 * @function initiateVoiceMemoUpload
 * @description Initiates a voice memo upload by generating a presigned POST URL.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const initiateVoiceMemoUpload = asyncHandler(async (req, res) => {
  const { title, fileName, contentType, duration, tags } = req.body;
  const userId = req.user.id;

  if (!fileName || !contentType) {
    throw new AppError('fileName and contentType are required.', 400);
  }

  const sanitizedFileName = sanitizeFilename(fileName);
  const voiceMemoId = uuidv4();
  const s3Key = `voicememos/${userId}/${voiceMemoId}-${sanitizedFileName}`;
  
  const timestamp = new Date().toISOString();

  const voiceMemoMetadata = {
    id: voiceMemoId,
    userId,
    title: title || sanitizedFileName,
    originalFileName: fileName, // Store original for reference
    s3Key,
    contentType,
    duration: duration || null,
    tags: tags || [],
    fileSize: null, // Will be updated in finalize
    uploadStatus: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Store initial metadata in DynamoDB
  await dynamoDB.put({
    TableName: getTableName('voiceMemos'),
    Item: voiceMemoMetadata,
  }).promise();

  // Generate S3 presigned POST URL
  const bucketName = getBucketName();
  const postParams = {
    Bucket: bucketName,
    Fields: {
      key: s3Key,
      'Content-Type': contentType,
      // ACL: 'private', // Or 'public-read' depending on your needs, ensure bucket policy allows this
      // success_action_status: '201', // Optional: if your client expects a 201 from S3
    },
    Conditions: [
      ['content-length-range', 0, 100 * 1024 * 1024], // Max 100MB, adjust as needed
      { 'Content-Type': contentType },
      // { acl: 'private' },
      // { success_action_status: '201' }
    ],
    Expires: PRESIGNED_POST_EXPIRES_IN,
  };

  const presignedPostData = await new Promise((resolve, reject) => {
    s3.createPresignedPost(postParams, (err, data) => {
      if (err) {
        console.error('Failed to create presigned POST URL:', err);
        return reject(new AppError('Failed to initiate file upload.', 500));
      }
      resolve(data);
    });
  });

  res.status(201).json({
    success: true,
    message: 'Upload initiated. Use the presignedPostData to upload the file.',
    voiceMemoId,
    s3Key, // Client might not need this if using presignedPostData.url directly
    presignedPostData,
  });
});


/**
 * @async
 * @function finalizeVoiceMemoUpload
 * @description Finalizes a voice memo upload, updating its status and metadata.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const finalizeVoiceMemoUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { fileSize, duration } = req.body; // duration could be updated here if more accurate version is available

  if (!fileSize && !duration) {
      throw new AppError('At least fileSize or duration must be provided to finalize.', 400);
  }

  const currentMemoResult = await dynamoDB.get({
    TableName: getTableName('voiceMemos'),
    Key: { id },
  }).promise();

  if (!currentMemoResult.Item) {
    throw new AppError('Voice memo not found.', 404);
  }
  if (currentMemoResult.Item.userId !== userId) {
    throw new AppError('Not authorized to finalize this voice memo.', 403);
  }
  // Optionally check if currentMemoResult.Item.uploadStatus is 'pending'

  // Check if file exists in S3 (optional but good practice)
  try {
    await s3.headObject({ Bucket: getBucketName(), Key: currentMemoResult.Item.s3Key }).promise();
  } catch (error) {
    console.error('S3 object not found or inaccessible during finalize:', error);
    throw new AppError('File not found in storage. Upload may have failed or is still in progress.', 404);
  }

  const updateExpressionParts = ['#uploadStatus = :completedStatus', '#updatedAt = :updatedAt'];
  const expressionAttributeValues = {
    ':completedStatus': 'completed',
    ':updatedAt': new Date().toISOString(),
  };
  const expressionAttributeNames = {
    '#uploadStatus': 'uploadStatus',
    '#updatedAt': 'updatedAt',
  };

  if (fileSize !== undefined) {
    updateExpressionParts.push('#fileSize = :fileSize');
    expressionAttributeValues[':fileSize'] = fileSize;
    expressionAttributeNames['#fileSize'] = 'fileSize';
  }
  if (duration !== undefined) {
    updateExpressionParts.push('#duration = :duration');
    expressionAttributeValues[':duration'] = duration;
    expressionAttributeNames['#duration'] = 'duration';
  }
  
  const params = {
    TableName: getTableName('voiceMemos'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();

  res.status(200).json({
    success: true,
    message: 'Voice memo upload finalized.',
    data: result.Attributes,
  });
});


// Helper to generate presigned GET URL
const generatePresignedGetUrl = async (s3Key) => {
  try {
    return await s3.getSignedUrlPromise('getObject', {
      Bucket: getBucketName(),
      Key: s3Key,
      Expires: PRESIGNED_URL_EXPIRES_IN,
    });
  } catch (error) {
    console.error(`Error generating presigned GET URL for ${s3Key}:`, error);
    return null; // Or handle error as appropriate
  }
};


/**
 * @async
 * @function getVoiceMemos
 * @description Get all completed voice memos for the user with presigned URLs.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getVoiceMemos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  const params = {
    TableName: getTableName('voiceMemos'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    FilterExpression: 'uploadStatus = :completed', // Only completed uploads
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
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

  const result = await dynamoDB.query(params).promise();
  
  const itemsWithUrls = await Promise.all(
    result.Items.map(async (item) => {
      item.url = await generatePresignedGetUrl(item.s3Key);
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
 * @function getVoiceMemoById
 * @description Get a single voice memo by ID with presigned URL.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getVoiceMemoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('voiceMemos'),
    Key: { id },
  }).promise();

  if (!result.Item || result.Item.uploadStatus !== 'completed') {
    throw new AppError('Voice memo not found or not yet finalized.', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Voice memo not found or not authorized.', 404);
  }

  result.Item.url = await generatePresignedGetUrl(result.Item.s3Key);

  res.status(200).json({
    success: true,
    data: result.Item,
  });
});


/**
 * @async
 * @function updateVoiceMemo
 * @description Update voice memo metadata (title, tags).
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updateVoiceMemo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, tags, duration } = req.body;

  const currentMemoResult = await dynamoDB.get({
    TableName: getTableName('voiceMemos'),
    Key: { id },
  }).promise();

  if (!currentMemoResult.Item) {
    throw new AppError('Voice memo not found.', 404);
  }
  if (currentMemoResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this voice memo.', 403);
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (title !== undefined) {
    updateExpressionParts.push('#title = :title');
    expressionAttributeValues[':title'] = title;
    expressionAttributeNames['#title'] = 'title';
  }
  if (tags !== undefined) {
    updateExpressionParts.push('#tags = :tags');
    expressionAttributeValues[':tags'] = tags;
    expressionAttributeNames['#tags'] = 'tags';
  }
   if (duration !== undefined) { // Allow updating duration if needed post-upload
    updateExpressionParts.push('#duration = :duration');
    expressionAttributeValues[':duration'] = duration;
    expressionAttributeNames['#duration'] = 'duration';
  }

  if (updateExpressionParts.length === 0) {
    currentMemoResult.Item.url = await generatePresignedGetUrl(currentMemoResult.Item.s3Key);
    return res.status(200).json({ success: true, data: currentMemoResult.Item, message: 'No fields to update.' });
  }

  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('voiceMemos'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();
  result.Attributes.url = await generatePresignedGetUrl(result.Attributes.s3Key);

  res.status(200).json({
    success: true,
    data: result.Attributes,
  });
});


/**
 * @async
 * @function deleteVoiceMemo
 * @description Delete a voice memo (S3 object and DynamoDB record).
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deleteVoiceMemo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('voiceMemos'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Voice memo not found.', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this voice memo.', 403);
  }

  // Delete S3 object
  try {
    await s3.deleteObject({
      Bucket: getBucketName(),
      Key: result.Item.s3Key,
    }).promise();
  } catch (s3Error) {
    console.error(`Failed to delete S3 object ${result.Item.s3Key}:`, s3Error);
    // Decide if this is a critical error. For now, we'll proceed to delete DynamoDB record.
    // throw new AppError('Failed to delete voice memo file from storage.', 500);
  }

  // Delete DynamoDB record
  await dynamoDB.delete({
    TableName: getTableName('voiceMemos'),
    Key: { id },
  }).promise();

  res.status(204).send();
});


/**
 * @async
 * @function searchVoiceMemos
 * @description Search voice memos by title or tags.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const searchVoiceMemos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, limit, exclusiveStartKey } = req.query;

  if (!q) {
    throw new AppError('Search query (q) is required', 400);
  }

  const params = {
    TableName: getTableName('voiceMemos'),
    FilterExpression: 'userId = :userId AND uploadStatus = :completed AND (' +
                      'contains(#title, :q) OR ' +
                      'contains(#tags, :q_tag)' + 
                      ')',
    ExpressionAttributeNames: {
      '#title': 'title',
      '#tags': 'tags',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':completed': 'completed',
      ':q': q.toLowerCase(), 
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
      item.url = await generatePresignedGetUrl(item.s3Key);
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
 * @function getVoiceMemosByTag
 * @description Get voice memos by a specific tag.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getVoiceMemosByTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { tag, limit, exclusiveStartKey } = req.query;

  if (!tag) {
    throw new AppError('Tag query parameter is required', 400);
  }

  const params = {
    TableName: getTableName('voiceMemos'),
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
  
  // Note: If VoiceMemosTable has a GSI on userId and tags (e.g. for efficient querying),
  // this could be a Query operation instead of a Scan.
  // For now, using Scan with FilterExpression.

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
      item.url = await generatePresignedGetUrl(item.s3Key);
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
  initiateVoiceMemoUpload,
  finalizeVoiceMemoUpload,
  getVoiceMemos,
  getVoiceMemoById,
  updateVoiceMemo,
  deleteVoiceMemo,
  searchVoiceMemos,
  getVoiceMemosByTag,
};
