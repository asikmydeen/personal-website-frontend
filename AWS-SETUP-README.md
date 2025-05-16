# AWS Backend Setup and Integration

This guide explains how to set up the AWS backend and integrate it with the frontend.

## Overview

The backend has been successfully deployed to AWS using the Serverless Framework. The API is available at:

```
https://lp8whfim49.execute-api.us-east-1.amazonaws.com/dev
```

This guide will help you:
1. Populate the AWS backend with test data
2. Update the frontend to use the AWS backend
3. Test the integration

## Prerequisites

- Node.js 18+
- npm or yarn
- AWS account with appropriate permissions

## Step 1: Install Dependencies

First, install the required dependencies for the scripts:

```bash
npm install axios bcryptjs
```

## Step 2: Populate the AWS Backend

### Option A: Using the API Directly (Manual Registration)

Since the automated script is encountering 502 errors, you can manually register users through the frontend:

1. Update the frontend to use the AWS API (see Step 3)
2. Start the frontend application
3. Register a new user through the registration page
4. Login with the new user
5. Create test data through the frontend UI

### Option B: Troubleshooting the Populate Script

If you want to try fixing the populate script:

1. Check the API Gateway logs in AWS CloudWatch
2. Verify that the Lambda functions are configured correctly
3. Check for any CORS issues
4. Try modifying the script to add delay between requests:

```javascript
// Add this function to populate-aws-backend.js
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Then add a delay before each request
await delay(1000); // 1 second delay
```

### Option C: Using Postman or curl

You can also use Postman or curl to create test data:

```bash
# Register a user
curl -X POST https://lp8whfim49.execute-api.us-east-1.amazonaws.com/dev/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test User"}'

# Login to get a token
curl -X POST https://lp8whfim49.execute-api.us-east-1.amazonaws.com/dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Create a note (replace TOKEN with the token from login response)
curl -X POST https://lp8whfim49.execute-api.us-east-1.amazonaws.com/dev/api/v1/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Test Note","content":"This is a test note","tags":["test"]}'
```

## Step 3: Update Frontend Integration

The `update-frontend-integration.js` script will update the frontend to use the AWS backend instead of the mock API.

```bash
node update-frontend-integration.js
```

This script will:
1. Update the `backendIntegration.js` file to use the real AWS API URL
2. Set `USE_REAL_BACKEND` to true by default
3. Create a `.env` file with the API URL

## Step 4: Start the Frontend

Start the frontend application:

```bash
npm run dev
```

## Step 5: Test the Integration

1. Open the frontend application in your browser
2. Register a new user or login with existing credentials
3. Create some test data through the UI
4. Verify that the data is saved to the AWS backend

## Troubleshooting

### 502 Bad Gateway Errors

If you're getting 502 Bad Gateway errors:

1. Check the Lambda function configuration in AWS
2. Verify that the Lambda function has the correct permissions
3. Check the CloudWatch logs for any errors
4. Make sure the Lambda function timeout is set appropriately
5. Check that the API Gateway and Lambda integration is correct

### Authentication Issues

If you encounter authentication issues:
1. Check that the user was successfully created in the backend
2. Try registering a new user through the frontend
3. Verify that the token is being sent in the Authorization header

### API Connection Issues

If the frontend can't connect to the API:
1. Check that the API URL is correct in `backendIntegration.js`
2. Verify that CORS is enabled on the API Gateway
3. Check the browser console for error messages

### Data Issues

If you don't see any data:
1. Check that you've created data through the frontend
2. Verify that you're logged in as the correct user
3. Check the browser console for any API errors

## Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [DynamoDB Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)

## Next Steps

1. Implement the remaining backend controllers
2. Add file upload functionality using S3
3. Set up CloudFront for content delivery
4. Configure monitoring and logging