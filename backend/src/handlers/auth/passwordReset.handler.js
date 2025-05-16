const { requestPasswordReset } = require('../../controllers/authController');
const { createMockRequest, createMockResponse, createLambdaResponse, handleError } = require('../handlerUtils');

/**
 * Lambda handler for password reset request
 * This adapts the Express controller to work with AWS Lambda
 */
exports.handler = async (event, context) => {
  try {
    // Create a mock request object with the necessary properties
    const req = createMockRequest(event);
    
    // Create a mock response object
    const res = createMockResponse();
    
    // Call the controller function
    await requestPasswordReset(req, res);
    
    // Return the Lambda response
    return createLambdaResponse(res);
  } catch (error) {
    return handleError(error);
  }
};
