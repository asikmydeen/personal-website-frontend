const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dynamoDB, getTableName, cognito, getUserPoolId } = require('../config/aws');
const { AppError } = require('../middleware/errorHandler');

// In-memory store for development mode
const devMode = process.env.NODE_ENV === 'development';
const devStore = {
  users: {},
  authTokens: {}
};

/**
 * Create a new user
 */
const createUser = async (userData) => {
  const { email, password, name } = userData;

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists with that email', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      bio: '',
      profilePicture: '',
      createdAt: timestamp,
      lastLogin: timestamp,
      settings: {
        theme: 'light',
        notifications: true,
        twoFactorEnabled: false
      }
    };

    if (devMode) {
      // Store in memory for development
      devStore.users[userId] = user;
      devStore.users.byEmail = devStore.users.byEmail || {};
      devStore.users.byEmail[email] = userId;
    } else {
      // Save to DynamoDB
      await dynamoDB.put({
        TableName: getTableName('users'),
        Item: user
      }).promise();

      // Create user in Cognito (if using Cognito)
      try {
        await cognito.adminCreateUser({
          UserPoolId: getUserPoolId(),
          Username: email,
          TemporaryPassword: password,
          UserAttributes: [
            {
              Name: 'email',
              Value: email
            },
            {
              Name: 'name',
              Value: name
            },
            {
              Name: 'email_verified',
              Value: 'true'
            }
          ]
        }).promise();
      } catch (cognitoError) {
        console.error('Error creating user in Cognito:', cognitoError);
        // Continue even if Cognito fails - we have the user in DynamoDB
      }
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating user:', error);
    throw new AppError('Error creating user', 500);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  try {
    if (devMode) {
      // Get from memory for development
      const user = devStore.users[userId];
      if (!user) {
        return null;
      }
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } else {
      // Get from DynamoDB
      const result = await dynamoDB.get({
        TableName: getTableName('users'),
        Key: { id: userId }
      }).promise();

      if (!result.Item) {
        return null;
      }

      // Don't return password
      const { password, ...userWithoutPassword } = result.Item;
      return userWithoutPassword;
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new AppError('Error retrieving user', 500);
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  try {
    if (devMode) {
      // Get from memory for development
      const userId = devStore.users.byEmail?.[email];
      if (!userId) {
        return null;
      }
      return devStore.users[userId];
    } else {
      // Get from DynamoDB
      const result = await dynamoDB.query({
        TableName: getTableName('users'),
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      }).promise();

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return result.Items[0];
    }
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new AppError('Error retrieving user', 500);
  }
};

/**
 * Update user profile
 */
const updateUser = async (userId, updateData) => {
  try {
    // Don't allow updating email or password through this function
    const { email, password, id, createdAt, ...allowedUpdates } = updateData;

    if (devMode) {
      // Update in memory for development
      const user = devStore.users[userId];
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update user
      const updatedUser = {
        ...user,
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };
      devStore.users[userId] = updatedUser;

      // Don't return password
      const { password: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } else {
      // Build update expression
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.entries(allowedUpdates).forEach(([key, value]) => {
        if (key === 'settings') {
          // Handle nested settings object
          Object.entries(value).forEach(([settingKey, settingValue]) => {
            updateExpressions.push(`#settings.#${settingKey} = :${settingKey}`);
            expressionAttributeNames[`#${settingKey}`] = settingKey;
            expressionAttributeValues[`:${settingKey}`] = settingValue;
          });
          expressionAttributeNames['#settings'] = 'settings';
        } else {
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      // Add updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const updateExpression = `SET ${updateExpressions.join(', ')}`;

      const result = await dynamoDB.update({
        TableName: getTableName('users'),
        Key: { id: userId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }).promise();

      // Don't return password
      const { password: _, ...userWithoutPassword } = result.Attributes;
      return userWithoutPassword;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating user:', error);
    throw new AppError('Error updating user profile', 500);
  }
};

/**
 * Update user password
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    let user;
    
    if (devMode) {
      // Get from memory for development
      user = devStore.users[userId];
      if (!user) {
        throw new AppError('User not found', 404);
      }
    } else {
      // Get from DynamoDB
      const result = await dynamoDB.get({
        TableName: getTableName('users'),
        Key: { id: userId }
      }).promise();

      if (!result.Item) {
        throw new AppError('User not found', 404);
      }

      user = result.Item;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (devMode) {
      // Update in memory for development
      devStore.users[userId] = {
        ...user,
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Update password in DynamoDB
      await dynamoDB.update({
        TableName: getTableName('users'),
        Key: { id: userId },
        UpdateExpression: 'SET #password = :password, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#password': 'password',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':password': hashedPassword,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();

      // Update password in Cognito (if using Cognito)
      try {
        await cognito.adminSetUserPassword({
          UserPoolId: getUserPoolId(),
          Username: user.email,
          Password: newPassword,
          Permanent: true
        }).promise();
      } catch (cognitoError) {
        console.error('Error updating password in Cognito:', cognitoError);
        // Continue even if Cognito fails - we updated the password in DynamoDB
      }
    }

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating password:', error);
    throw new AppError('Error updating password', 500);
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Authenticate user and return token
 */
const loginUser = async (email, password) => {
  try {
    // Get user with password
    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    // Create auth token record
    const authToken = {
      id: uuidv4(),
      userId: user.id,
      token,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      ipAddress: '',
      userAgent: '',
      createdAt: new Date().toISOString()
    };

    console.log('Creating auth token:', JSON.stringify(authToken));

    if (devMode) {
      console.log('Development mode: storing token in memory');
      // Store in memory for development
      devStore.authTokens[authToken.id] = authToken;
      devStore.authTokens[token] = authToken; // Also index by token for easier lookup
      
      // Update last login
      devStore.users[user.id] = {
        ...devStore.users[user.id],
        lastLogin: new Date().toISOString()
      };
    } else {
      console.log('Production mode: storing token in DynamoDB');
      try {
        // Store in DynamoDB
        await dynamoDB.put({
          TableName: getTableName('authTokens'),
          Item: authToken
        }).promise();
        console.log('Token stored in DynamoDB successfully');
      } catch (dbError) {
        console.error('Error storing token in DynamoDB:', dbError);
        throw new AppError('Error storing authentication token', 500);
      }

      try {
        // Update last login
        await dynamoDB.update({
          TableName: getTableName('users'),
          Key: { id: user.id },
          UpdateExpression: 'SET lastLogin = :lastLogin',
          ExpressionAttributeValues: {
            ':lastLogin': new Date().toISOString()
          }
        }).promise();
        console.log('User last login updated successfully');
      } catch (updateError) {
        console.error('Error updating user last login:', updateError);
        // Non-critical error, don't throw
      }
    }

    // Return user without password and token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error logging in user:', error);
    throw new AppError('Error during login', 500);
  }
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  updatePassword,
  generateToken,
  loginUser
};