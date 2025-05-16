/**
 * Utility functions for Lambda handlers
 */

/**
 * Create a mock Express request object from Lambda event
 * @param {Object} event - Lambda event object
 * @returns {Object} - Mock Express request object
 */
exports.createMockRequest = (event) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const headers = event.headers || {};
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  
  return {
    body,
    headers: {
      authorization: headers.Authorization || headers.authorization
    },
    params: pathParams,
    query: queryParams,
    user: event.requestContext?.authorizer?.claims
  };
};

/**
 * Create a mock Express response object
 * @returns {Object} - Mock Express response object
 */
exports.createMockResponse = () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS support
      'Access-Control-Allow-Credentials': true
    },
    body: '',
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    }
  };
};

/**
 * Create a Lambda response from mock Express response
 * @param {Object} res - Mock Express response object
 * @returns {Object} - Lambda response object
 */
exports.createLambdaResponse = (res) => {
  return {
    statusCode: res.statusCode,
    headers: res.headers,
    body: res.body
  };
};

/**
 * Handle errors in Lambda handlers
 * @param {Error} error - Error object
 * @returns {Object} - Lambda response object with error details
 */
exports.handleError = (error) => {
  console.error('Error in handler:', error);
  
  // Handle known application errors
  if (error.name === 'AppError') {
    return {
      statusCode: error.statusCode || 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: error.message
        }
      })
    };
  }
  
  // Handle unknown errors
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      success: false,
      error: {
        message: 'Internal server error'
      }
    })
  };
};

/**
 * Create a wrapper for Lambda handlers
 * @param {Function} controllerFn - Express controller function
 * @returns {Function} - Lambda handler function
 */
exports.createHandler = (controllerFn) => {
  return async (event, context) => {
    try {
      const req = this.createMockRequest(event);
      const res = this.createMockResponse();
      
      await controllerFn(req, res);
      
      return this.createLambdaResponse(res);
    } catch (error) {
      return this.handleError(error);
    }
  };
};
