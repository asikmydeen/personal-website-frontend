const { createUser, loginUser, getUserByEmail } = require('../services/userService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName, ses } = require('../config/aws');
const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password || !name) {
    throw new AppError('Please provide email, password and name', 400);
  }

  // Create user
  const user = await createUser({ email, password, name });

  // Generate token
  const token = require('../services/userService').generateToken(user.id);

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Authenticate user
  const { user, token } = await loginUser(email, password);

  res.status(200).json({
    success: true,
    data: {
      user,
      token
    }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  let token;
  
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('No token provided', 400);
  }

  try {
    console.log('Logging out token:', token);
    
    // Try to find the token in the database
    let result;
    
    try {
      // Try using the GSI first, using expression attribute names for reserved keyword 'token'
      result = await dynamoDB.query({
        TableName: getTableName('authTokens'),
        IndexName: 'token-index',
        KeyConditionExpression: '#tokenAttr = :token',
        ExpressionAttributeNames: {
          '#tokenAttr': 'token'
        },
        ExpressionAttributeValues: {
          ':token': token
        }
      }).promise();
      console.log('Token query result:', JSON.stringify(result));
    } catch (queryError) {
      console.error('Error querying token:', queryError);
      // Fall back to scan if GSI query fails
      result = await dynamoDB.scan({
        TableName: getTableName('authTokens'),
        FilterExpression: '#tokenAttr = :token',
        ExpressionAttributeNames: {
          '#tokenAttr': 'token'
        },
        ExpressionAttributeValues: {
          ':token': token
        }
      }).promise();
      console.log('Token scan result:', JSON.stringify(result));
    }

    // Delete the token or expire it
    if (result.Items && result.Items.length > 0) {
      const authToken = result.Items[0];
      console.log('Found token to delete:', authToken.id);
      
      try {
        // Option 1: Delete the token
        await dynamoDB.delete({
          TableName: getTableName('authTokens'),
          Key: { id: authToken.id }
        }).promise();
        console.log('Token deleted successfully');
      } catch (deleteError) {
        console.error('Error deleting token:', deleteError);
        
        // Option 2: If delete fails, expire the token
        try {
          await dynamoDB.update({
            TableName: getTableName('authTokens'),
            Key: { id: authToken.id },
            UpdateExpression: 'SET expires = :expires',
            ExpressionAttributeValues: {
              ':expires': new Date(0).toISOString() // Set to expired
            }
          }).promise();
          console.log('Token expired successfully');
        } catch (updateError) {
          console.error('Error expiring token:', updateError);
          // Continue even if both operations fail
        }
      }
    } else {
      console.log('Token not found in database');
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error during logout:', error);
    throw new AppError('Error during logout', 500);
  }
});

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/password-reset
 * @access  Public
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide an email address', 400);
  }

  // Check if user exists
  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal that the user doesn't exist
    return res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  }

  // Generate reset token
  const resetToken = uuidv4();
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  // Store reset token
  await dynamoDB.put({
    TableName: getTableName('passwordResetTokens'),
    Item: {
      id: uuidv4(),
      userId: user.id,
      token: resetToken,
      expires: resetTokenExpiry.toISOString(),
      used: false,
      createdAt: new Date().toISOString()
    }
  }).promise();

  // Send email with reset link
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  try {
    await ses.sendEmail({
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Password Reset Request'
        },
        Body: {
          Html: {
            Data: `
              <h1>Password Reset</h1>
              <p>You requested a password reset. Please click the link below to reset your password:</p>
              <a href="${resetUrl}">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you did not request this, please ignore this email.</p>
            `
          }
        }
      }
    }).promise();
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Continue even if email fails - we have the token in the database
  }

  res.status(200).json({
    success: true,
    message: 'If your email is registered, you will receive a password reset link'
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/password-reset/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    throw new AppError('Invalid request', 400);
  }

  // Find reset token
  const result = await dynamoDB.scan({
    TableName: getTableName('passwordResetTokens'),
    FilterExpression: 'token = :token AND used = :used AND expires > :now',
    ExpressionAttributeValues: {
      ':token': token,
      ':used': false,
      ':now': new Date().toISOString()
    }
  }).promise();

  if (!result.Items || result.Items.length === 0) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const resetToken = result.Items[0];

  // Get user
  const userResult = await dynamoDB.get({
    TableName: getTableName('users'),
    Key: { id: resetToken.userId }
  }).promise();

  if (!userResult.Item) {
    throw new AppError('User not found', 404);
  }

  const user = userResult.Item;

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update user password
  await dynamoDB.update({
    TableName: getTableName('users'),
    Key: { id: user.id },
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

  // Mark reset token as used
  await dynamoDB.update({
    TableName: getTableName('passwordResetTokens'),
    Key: { id: resetToken.id },
    UpdateExpression: 'SET #used = :used',
    ExpressionAttributeNames: {
      '#used': 'used'
    },
    ExpressionAttributeValues: {
      ':used': true
    }
  }).promise();

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully'
  });
});

/**
 * @desc    Verify token
 * @route   POST /api/v1/auth/verify-token
 * @access  Public
 */
const verifyToken = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  let token;
  
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('No token provided', 400);
  }

  try {
    // First verify JWT signature and expiration
    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      throw new AppError('Invalid or expired token', 401);
    }
    
    if (!decoded || !decoded.id) {
      throw new AppError('Invalid token format', 401);
    }
    
    // Now check if token exists in database and is not expired
    // Query by token directly, using expression attribute names because 'token' is a reserved keyword
    const params = {
      TableName: getTableName('authTokens'),
      IndexName: 'token-index', // Make sure this GSI exists as defined in serverless.yml
      KeyConditionExpression: '#tokenAttr = :token',
      FilterExpression: '#expiresAttr > :now',
      ExpressionAttributeNames: {
        '#tokenAttr': 'token',
        '#expiresAttr': 'expires'
      },
      ExpressionAttributeValues: {
        ':token': token,
        ':now': new Date().toISOString()
      }
    };
    
    console.log('Token verification params:', JSON.stringify(params));
    
    let result;
    try {
      // Try to use query with the GSI first
      result = await dynamoDB.query(params).promise();
      console.log('Token verification query result:', JSON.stringify(result));
    } catch (dbError) {
      console.error('DynamoDB query error:', dbError);
      // Fall back to scan if query fails (e.g., if index doesn't exist yet)
      console.log('Falling back to scan operation');
      result = await dynamoDB.scan({
        TableName: getTableName('authTokens'),
        FilterExpression: '#tokenAttr = :token AND #expiresAttr > :now',
        ExpressionAttributeNames: {
          '#tokenAttr': 'token',
          '#expiresAttr': 'expires'
        },
        ExpressionAttributeValues: {
          ':token': token,
          ':now': new Date().toISOString()
        }
      }).promise();
      console.log('Token verification scan result:', JSON.stringify(result));
    }
    
    if (!result.Items || result.Items.length === 0) {
      console.log('Token not found in database or expired');
      throw new AppError('Token not found or expired', 401);
    }

    // Get user
    const userService = require('../services/userService');
    const user = await userService.getUserById(decoded.id);
    
    if (!user) {
      console.log('User not found:', decoded.id);
      throw new AppError('User not found', 404);
    }

    console.log('Token verification successful for user:', user.id);
    
    res.status(200).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Token verification error details:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid token', 401);
  }
});

module.exports = {
  register,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  verifyToken
};