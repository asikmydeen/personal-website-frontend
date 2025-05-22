// backend/src/controllers/passwordController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const encryptionService = require('../services/encryptionService');

/**
 * @async
 * @function createPassword
 * @description Create a new password entry. Encrypts the password.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const createPassword = asyncHandler(async (req, res) => {
  const { siteName, username, password, url, category, notes } = req.body;
  const userId = req.user.id;

  if (!siteName || !username || !password) {
    throw new AppError('Site name, username, and password are required', 400);
  }

  if (!encryptionService.isKeyConfigured()) {
      throw new AppError('Encryption service is not properly configured.', 500);
  }

  const encryptedPasswordPayload = encryptionService.encrypt(password);

  const timestamp = new Date().toISOString();
  const entryId = uuidv4();

  const passwordEntry = {
    id: entryId,
    userId,
    siteName,
    username,
    iv: encryptedPasswordPayload.iv,
    encryptedPassword: encryptedPasswordPayload.encryptedData,
    authTag: encryptedPasswordPayload.authTag,
    url: url || null,
    category: category || null,
    notes: notes || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('passwords'),
    Item: passwordEntry,
  }).promise();

  // Return the created entry, excluding sensitive encrypted fields directly if preferred,
  // but for this task, we'll return most fields for clarity, excluding plaintext password.
  const { encryptedPassword, iv, authTag, ...responsePayload } = passwordEntry;
  // Add id back to response, which was destructured out
  responsePayload.id = passwordEntry.id;


  res.status(201).json({
    success: true,
    data: responsePayload, // Does not include plaintext password
  });
});

/**
 * @async
 * @function getPasswords
 * @description Get all password entries for the user. Decrypts passwords.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getPasswords = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit, exclusiveStartKey, category } = req.query; // Added category for potential pre-filtering

  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const params = {
    TableName: getTableName('passwords'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };
  
  // Optional: Add category filtering if category is provided
  // This assumes 'category' is an attribute that can be filtered on this GSI or primary table.
  // If 'category' is part of a GSI sort key with 'userId', it would be more efficient.
  // For now, adding as a FilterExpression if provided.
  if (category) {
      params.FilterExpression = 'category = :categoryVal';
      params.ExpressionAttributeValues[':categoryVal'] = category;
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

  const decryptedItems = result.Items.map(item => {
    try {
      const decryptedPassword = encryptionService.decrypt({ 
        iv: item.iv, 
        encryptedData: item.encryptedPassword,
        authTag: item.authTag 
      });
      // Return item with decrypted password, removing encryption-specific fields
      const { encryptedPassword, iv, authTag, ...rest } = item;
      return { ...rest, password: decryptedPassword };
    } catch (err) {
      console.error(`Failed to decrypt password for item ID ${item.id}: ${err.message}`);
      // Return item as is but without password fields, or with an error indicator
      const { encryptedPassword, iv, authTag, ...rest } = item;
      return { ...rest, password: null, decryptionError: true };
    }
  });

  res.status(200).json({
    success: true,
    data: decryptedItems,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getPasswordById
 * @description Get a single password entry by ID. Decrypts the password.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getPasswordById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const result = await dynamoDB.get({
    TableName: getTableName('passwords'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Password entry not found', 404);
  }

  if (result.Item.userId !== userId) {
    throw new AppError('Password entry not found or not authorized', 404);
  }

  let decryptedPassword;
  try {
    decryptedPassword = encryptionService.decrypt({
        iv: result.Item.iv, 
        encryptedData: result.Item.encryptedPassword,
        authTag: result.Item.authTag
    });
  } catch (err) {
      console.error(`Failed to decrypt password for item ID ${result.Item.id}: ${err.message}`);
      throw new AppError('Failed to decrypt password data.', 500);
  }

  const { encryptedPassword, iv, authTag, ...responsePayload } = result.Item;
  responsePayload.password = decryptedPassword;


  res.status(200).json({
    success: true,
    data: responsePayload,
  });
});

/**
 * @async
 * @function updatePassword
 * @description Update an existing password entry. Encrypts new password if provided.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { siteName, username, password, url, category, notes } = req.body;

  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const currentEntryResult = await dynamoDB.get({
    TableName: getTableName('passwords'),
    Key: { id },
  }).promise();

  if (!currentEntryResult.Item) {
    throw new AppError('Password entry not found', 404);
  }

  if (currentEntryResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this password entry', 403);
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (siteName !== undefined) {
    updateExpressionParts.push('#siteName = :siteName');
    expressionAttributeValues[':siteName'] = siteName;
    expressionAttributeNames['#siteName'] = 'siteName';
  }
  if (username !== undefined) {
    updateExpressionParts.push('#username = :username');
    expressionAttributeValues[':username'] = username;
    expressionAttributeNames['#username'] = 'username';
  }
  if (password !== undefined) {
    const encryptedPayload = encryptionService.encrypt(password);
    updateExpressionParts.push('#iv = :iv, #encPass = :encPass, #authTag = :authTag');
    expressionAttributeValues[':iv'] = encryptedPayload.iv;
    expressionAttributeValues[':encPass'] = encryptedPayload.encryptedData;
    expressionAttributeValues[':authTag'] = encryptedPayload.authTag;
    expressionAttributeNames['#iv'] = 'iv';
    expressionAttributeNames['#encPass'] = 'encryptedPassword';
    expressionAttributeNames['#authTag'] = 'authTag';
  }
  if (url !== undefined) {
    updateExpressionParts.push('#url = :url');
    expressionAttributeValues[':url'] = url;
    expressionAttributeNames['#url'] = 'url';
  }
  if (category !== undefined) {
    updateExpressionParts.push('#category = :category');
    expressionAttributeValues[':category'] = category;
    expressionAttributeNames['#category'] = 'category';
  }
  if (notes !== undefined) {
    updateExpressionParts.push('#notes = :notes');
    expressionAttributeValues[':notes'] = notes;
    expressionAttributeNames['#notes'] = 'notes';
  }
  
  if (updateExpressionParts.length === 0) {
    // If we return here, decrypt existing password for response consistency
    const decryptedPass = encryptionService.decrypt(currentEntryResult.Item);
    const {encryptedPassword, iv, authTag, ...currentRest} = currentEntryResult.Item;
    return res.status(200).json({
        success: true,
        data: {...currentRest, password: decryptedPass},
        message: 'No fields to update',
    });
  }

  const timestamp = new Date().toISOString();
  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = timestamp;
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('passwords'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();
  
  // Decrypt password for the response
  let decryptedPasswordForResult;
  try {
    decryptedPasswordForResult = encryptionService.decrypt({
        iv: result.Attributes.iv,
        encryptedData: result.Attributes.encryptedPassword,
        authTag: result.Attributes.authTag
    });
  } catch(err) {
      console.error(`Failed to decrypt password for updated item ID ${result.Attributes.id}: ${err.message}`);
      throw new AppError('Failed to decrypt password data for updated item.', 500);
  }

  const { encryptedPassword, iv, authTag, ...updatedResponsePayload } = result.Attributes;
  updatedResponsePayload.password = decryptedPasswordForResult;


  res.status(200).json({
    success: true,
    data: updatedResponsePayload,
  });
});

/**
 * @async
 * @function deletePassword
 * @description Delete a password entry.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deletePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('passwords'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Password entry not found', 404);
  }

  if (result.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this password entry', 403);
  }

  await dynamoDB.delete({
    TableName: getTableName('passwords'),
    Key: { id },
  }).promise();

  res.status(204).json({ // Or .send() for 204
    success: true,
    data: null,
  });
});

/**
 * @async
 * @function searchPasswords
 * @description Search password entries by siteName, username, or url. Decrypts passwords.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const searchPasswords = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, limit, exclusiveStartKey } = req.query;

  if (!q) {
    throw new AppError('Search query (q) is required', 400);
  }
  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const params = {
    TableName: getTableName('passwords'),
    FilterExpression: 'userId = :userId AND (' +
                      'contains(#siteName, :q) OR ' +
                      'contains(#username, :q) OR ' +
                      'contains(#url, :q)' +
                      ')',
    ExpressionAttributeNames: {
      '#siteName': 'siteName',
      '#username': 'username',
      '#url': 'url',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':q': q, // DynamoDB contains is case-sensitive. For case-insensitive, store lowercased fields.
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

  const result = await dynamoDB.scan(params).promise();

  const decryptedItems = result.Items.map(item => {
    try {
      const decryptedPassword = encryptionService.decrypt({
        iv: item.iv, 
        encryptedData: item.encryptedPassword,
        authTag: item.authTag
      });
      const { encryptedPassword, iv, authTag, ...rest } = item;
      return { ...rest, password: decryptedPassword };
    } catch (err) {
      console.error(`Failed to decrypt password for item ID ${item.id} during search: ${err.message}`);
      const { encryptedPassword, iv, authTag, ...rest } = item;
      return { ...rest, password: null, decryptionError: true };
    }
  });

  res.status(200).json({
    success: true,
    data: decryptedItems,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getPasswordsByCategory
 * @description Get password entries by category. Decrypts passwords.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getPasswordsByCategory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { category } = req.params; // Category from path parameter
  const { limit, exclusiveStartKey } = req.query;

  if (!category) {
    throw new AppError('Category parameter is required', 400);
  }
  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }
  
  // Querying by category efficiently requires a GSI.
  // Assuming 'userId-category-index' GSI: userId (HASH), category (RANGE)
  // Or, if category is not high cardinality, 'category-userId-index': category (HASH), userId (RANGE)
  // For this example, we'll use the primary 'userId-index' and filter by category.
  // This is less efficient for large datasets without a proper GSI.
  const params = {
    TableName: getTableName('passwords'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    FilterExpression: 'category = :categoryVal',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':categoryVal': category,
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

  const result = await dynamoDB.query(params).promise();

  const decryptedItems = result.Items.map(item => {
    try {
      const decryptedPassword = encryptionService.decrypt({
        iv: item.iv, 
        encryptedData: item.encryptedPassword,
        authTag: item.authTag
      });
      const { encryptedPassword, iv, authTag, ...rest } = item;
      return { ...rest, password: decryptedPassword };
    } catch(err) {
      console.error(`Failed to decrypt password for item ID ${item.id} in category fetch: ${err.message}`);
      const { encryptedPassword, iv, authTag, ...rest } = item;
      return { ...rest, password: null, decryptionError: true };
    }
  });

  res.status(200).json({
    success: true,
    data: decryptedItems,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

module.exports = {
  createPassword,
  getPasswords,
  getPasswordById,
  updatePassword,
  deletePassword,
  searchPasswords,
  getPasswordsByCategory,
};
