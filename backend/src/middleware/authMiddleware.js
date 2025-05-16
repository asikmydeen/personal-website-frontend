const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { getUserById } = require('../services/userService');
const { dynamoDB, getTableName } = require('../config/aws');

// In-memory store reference for development mode
const devMode = process.env.NODE_ENV === 'development';
const devStore = {
  users: {},
  authTokens: {}
};

/**
 * Middleware to protect routes that require authentication
 */
const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // In development mode, we don't need to check the token in DynamoDB
      if (!devMode) {
        // Check if token exists in database
        const result = await dynamoDB.scan({
          TableName: getTableName('authTokens'),
          FilterExpression: 'token = :token AND expires > :now',
          ExpressionAttributeValues: {
            ':token': token,
            ':now': new Date().toISOString()
          }
        }).promise();

        if (!result.Items || result.Items.length === 0) {
          throw new AppError('Invalid token', 401);
        }
      }
      
      // Get user from token
      const user = await getUserById(decoded.id);
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to certain roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    
    next();
  };
};

module.exports = {
  protect,
  authorize
};