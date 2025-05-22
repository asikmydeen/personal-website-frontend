// backend/src/controllers/walletCardController.js
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const encryptionService = require('../services/encryptionService');

// Helper function to validate MM/YY format
const isValidExpiryDate = (dateStr) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(dateStr);

// Helper function to validate CVV (3 or 4 digits)
const isValidCvv = (cvvStr) => /^\d{3,4}$/.test(cvvStr);

// Helper function to validate card number (basic Luhn check can be added or use a library)
const isValidCardNumber = (numStr) => /^\d{13,19}$/.test(numStr); // Basic length check

/**
 * @async
 * @function createWalletCard
 * @description Create a new wallet card. Encrypts sensitive details.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const createWalletCard = asyncHandler(async (req, res) => {
  const { cardholderName, cardNumber, expiryDate, cvv, cardType, bankName, notes } = req.body;
  const userId = req.user.id;

  // Validation
  if (!cardholderName || !cardNumber || !expiryDate || !cvv) {
    throw new AppError('Cardholder name, card number, expiry date, and CVV are required', 400);
  }
  if (!isValidCardNumber(cardNumber)) {
    throw new AppError('Invalid card number format/length.', 400);
  }
  if (!isValidExpiryDate(expiryDate)) {
    throw new AppError('Invalid expiry date format. Use MM/YY.', 400);
  }
  if (!isValidCvv(cvv)) {
    throw new AppError('Invalid CVV format. Must be 3 or 4 digits.', 400);
  }
  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  // Encrypt sensitive fields
  const encCardholderName = encryptionService.encrypt(cardholderName);
  const encCardNumber = encryptionService.encrypt(cardNumber);
  const encExpiryDate = encryptionService.encrypt(expiryDate);
  const encCvv = encryptionService.encrypt(cvv);

  const timestamp = new Date().toISOString();
  const cardId = uuidv4();

  const walletCardItem = {
    id: cardId,
    userId,
    // Encrypted fields
    ivCardholderName: encCardholderName.iv,
    encryptedCardholderName: encCardholderName.encryptedData,
    authTagCardholderName: encCardholderName.authTag,
    ivCardNumber: encCardNumber.iv,
    encryptedCardNumber: encCardNumber.encryptedData,
    authTagCardNumber: encCardNumber.authTag,
    ivExpiryDate: encExpiryDate.iv,
    encryptedExpiryDate: encExpiryDate.encryptedData,
    authTagExpiryDate: encExpiryDate.authTag,
    ivCvv: encCvv.iv,
    encryptedCvv: encCvv.encryptedData,
    authTagCvv: encCvv.authTag,
    // Non-sensitive fields
    cardType: cardType || null,
    bankName: bankName || null,
    notes: notes || null,
    // Last 4 digits of card number for display (optional, but useful)
    last4Digits: cardNumber.slice(-4),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB.put({
    TableName: getTableName('walletCards'), // Ensure 'WalletCardsTable' matches serverless.yml
    Item: walletCardItem,
  }).promise();

  // Prepare response data (excluding raw encrypted parts and IVs/authTags)
  const responseData = {
    id: walletCardItem.id,
    userId: walletCardItem.userId,
    cardType: walletCardItem.cardType,
    bankName: walletCardItem.bankName,
    notes: walletCardItem.notes,
    last4Digits: walletCardItem.last4Digits,
    createdAt: walletCardItem.createdAt,
    updatedAt: walletCardItem.updatedAt,
  };

  res.status(201).json({
    success: true,
    data: responseData,
  });
});

// Helper function to decrypt card data for responses
const decryptCardData = (item) => {
  const decryptedItem = { ...item }; // Clone the item
  const fieldsToDecrypt = [
    { name: 'cardholderName', ivKey: 'ivCardholderName', dataKey: 'encryptedCardholderName', authTagKey: 'authTagCardholderName' },
    { name: 'cardNumber', ivKey: 'ivCardNumber', dataKey: 'encryptedCardNumber', authTagKey: 'authTagCardNumber' },
    { name: 'expiryDate', ivKey: 'ivExpiryDate', dataKey: 'encryptedExpiryDate', authTagKey: 'authTagExpiryDate' },
    { name: 'cvv', ivKey: 'ivCvv', dataKey: 'encryptedCvv', authTagKey: 'authTagCvv' },
  ];

  let overallDecryptionError = false;

  fieldsToDecrypt.forEach(field => {
    if (item[field.ivKey] && item[field.dataKey] && item[field.authTagKey]) {
      try {
        decryptedItem[field.name] = encryptionService.decrypt({
          iv: item[field.ivKey],
          encryptedData: item[field.dataKey],
          authTag: item[field.authTagKey],
        });
      } catch (error) {
        console.error(`Failed to decrypt ${field.name} for card ID ${item.id}: ${error.message}`);
        decryptedItem[field.name] = null; // Or some error indicator
        decryptedItem[`${field.name}DecryptionError`] = true;
        overallDecryptionError = true;
      }
    } else {
      // Field might not have been encrypted or is missing parts
      decryptedItem[field.name] = null; 
    }
    // Remove encryption-specific fields from the final decrypted item
    delete decryptedItem[field.ivKey];
    delete decryptedItem[field.dataKey];
    delete decryptedItem[field.authTagKey];
  });
  
  // Add a general error flag if any field failed
  if(overallDecryptionError) decryptedItem.decryptionError = true;

  // Remove other raw encrypted fields that might have been missed if not in fieldsToDecrypt
  // This is a safeguard, ideally fieldsToDecrypt covers all encrypted attributes
  Object.keys(decryptedItem).forEach(key => {
      if (key.startsWith('iv') || key.startsWith('encrypted') || key.startsWith('authTag')) {
          if (!fieldsToDecrypt.find(f => f.ivKey === key || f.dataKey === key || f.authTagKey === key)) {
              delete decryptedItem[key];
          }
      }
  });
  
  return decryptedItem;
};


/**
 * @async
 * @function getWalletCards
 * @description Get all wallet cards for the user. Decrypts sensitive details.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getWalletCards = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit, exclusiveStartKey } = req.query;

  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const params = {
    TableName: getTableName('walletCards'),
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
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
  const decryptedItems = result.Items.map(item => decryptCardData(item));

  res.status(200).json({
    success: true,
    data: decryptedItems,
    lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
  });
});

/**
 * @async
 * @function getWalletCardById
 * @description Get a single wallet card by ID. Decrypts sensitive details.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getWalletCardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const result = await dynamoDB.get({
    TableName: getTableName('walletCards'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Wallet card not found', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Wallet card not found or not authorized', 404);
  }

  const decryptedCard = decryptCardData(result.Item);
  if (decryptedCard.decryptionError && !Object.values(decryptedCard).some(val => val !== null && val !== undefined && val !== false && val !== true && typeof val !== 'object')) {
      // If all main fields are null due to decryption error, it's a critical failure for this single item
      throw new AppError('Failed to decrypt critical card data.', 500);
  }


  res.status(200).json({
    success: true,
    data: decryptedCard,
  });
});

/**
 * @async
 * @function updateWalletCard
 * @description Update an existing wallet card. Encrypts sensitive fields if provided.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updateWalletCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { cardholderName, cardNumber, expiryDate, cvv, cardType, bankName, notes } = req.body;

  if (!encryptionService.isKeyConfigured()) {
    throw new AppError('Encryption service is not properly configured.', 500);
  }

  const currentCardResult = await dynamoDB.get({
    TableName: getTableName('walletCards'),
    Key: { id },
  }).promise();

  if (!currentCardResult.Item) {
    throw new AppError('Wallet card not found', 404);
  }
  if (currentCardResult.Item.userId !== userId) {
    throw new AppError('Not authorized to update this wallet card', 403);
  }

  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  // Helper to add encrypted field to update params
  const addEncryptedField = (fieldName, plainValue, baseKeyName) => {
    if (plainValue !== undefined) {
      const encrypted = encryptionService.encrypt(plainValue);
      updateExpressionParts.push(`#iv${baseKeyName} = :iv${baseKeyName}, #enc${baseKeyName} = :enc${baseKeyName}, #auth${baseKeyName} = :auth${baseKeyName}`);
      expressionAttributeValues[`:iv${baseKeyName}`] = encrypted.iv;
      expressionAttributeValues[`:enc${baseKeyName}`] = encrypted.encryptedData;
      expressionAttributeValues[`:auth${baseKeyName}`] = encrypted.authTag;
      expressionAttributeNames[`#iv${baseKeyName}`] = `iv${baseKeyName}`;
      expressionAttributeNames[`#enc${baseKeyName}`] = `encrypted${baseKeyName}`;
      expressionAttributeNames[`#auth${baseKeyName}`] = `authTag${baseKeyName}`;
    }
  };
  
  // Validate and add fields for update
  if (cardholderName !== undefined) addEncryptedField('cardholderName', cardholderName, 'CardholderName');
  if (cardNumber !== undefined) {
    if (!isValidCardNumber(cardNumber)) throw new AppError('Invalid card number format/length.', 400);
    addEncryptedField('cardNumber', cardNumber, 'CardNumber');
    updateExpressionParts.push('#last4 = :last4'); // Update last4Digits if card number changes
    expressionAttributeValues[':last4'] = cardNumber.slice(-4);
    expressionAttributeNames['#last4'] = 'last4Digits';
  }
  if (expiryDate !== undefined) {
    if (!isValidExpiryDate(expiryDate)) throw new AppError('Invalid expiry date format. Use MM/YY.', 400);
    addEncryptedField('expiryDate', expiryDate, 'ExpiryDate');
  }
  if (cvv !== undefined) {
    if (!isValidCvv(cvv)) throw new AppError('Invalid CVV format. Must be 3 or 4 digits.', 400);
    addEncryptedField('cvv', cvv, 'Cvv');
  }

  if (cardType !== undefined) {
    updateExpressionParts.push('#cardType = :cardType');
    expressionAttributeValues[':cardType'] = cardType;
    expressionAttributeNames['#cardType'] = 'cardType';
  }
  if (bankName !== undefined) {
    updateExpressionParts.push('#bankName = :bankName');
    expressionAttributeValues[':bankName'] = bankName;
    expressionAttributeNames['#bankName'] = 'bankName';
  }
  if (notes !== undefined) {
    updateExpressionParts.push('#notes = :notes');
    expressionAttributeValues[':notes'] = notes;
    expressionAttributeNames['#notes'] = 'notes';
  }

  if (updateExpressionParts.length === 0) {
    const decryptedCurrentCard = decryptCardData(currentCardResult.Item);
    return res.status(200).json({
      success: true,
      data: decryptedCurrentCard,
      message: 'No fields to update',
    });
  }

  const timestamp = new Date().toISOString();
  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = timestamp;
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const params = {
    TableName: getTableName('walletCards'),
    Key: { id },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamoDB.update(params).promise();
  const decryptedUpdatedCard = decryptCardData(result.Attributes);
   if (decryptedUpdatedCard.decryptionError && !Object.values(decryptedUpdatedCard).some(val => val !== null && val !== undefined && val !== false && val !== true && typeof val !== 'object')) {
      throw new AppError('Failed to decrypt critical card data after update.', 500);
  }


  res.status(200).json({
    success: true,
    data: decryptedUpdatedCard,
  });
});

/**
 * @async
 * @function deleteWalletCard
 * @description Delete a wallet card.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deleteWalletCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await dynamoDB.get({
    TableName: getTableName('walletCards'),
    Key: { id },
  }).promise();

  if (!result.Item) {
    throw new AppError('Wallet card not found', 404);
  }
  if (result.Item.userId !== userId) {
    throw new AppError('Not authorized to delete this wallet card', 403);
  }

  await dynamoDB.delete({
    TableName: getTableName('walletCards'),
    Key: { id },
  }).promise();

  res.status(204).json({ // Or .send()
    success: true,
    data: null,
  });
});

module.exports = {
  createWalletCard,
  getWalletCards,
  getWalletCardById,
  updateWalletCard,
  deleteWalletCard,
};
