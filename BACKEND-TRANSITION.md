# Transitioning from Mock API to AWS Backend

This document outlines the steps to transition from the json-server mock API to the new AWS-based backend.

## Overview

The project has been set up with two backend options:

1. **Mock API (json-server)** - Used for development and testing
2. **AWS Backend** - Production-ready serverless backend

The frontend code has been updated to support both backends, with a seamless transition between them.

## Architecture

### Mock API (json-server)
- Simple JSON file-based REST API
- Defined in `db.json` and `routes.json`
- Runs locally on port 3000
- Great for development and testing

### AWS Backend
- Serverless architecture using AWS services
- API Gateway, Lambda, DynamoDB, S3, Cognito
- Scalable, secure, and production-ready
- Follows the same API structure as the mock API

## Directory Structure

```
/
├── db.json                  # Mock API data
├── routes.json              # Mock API routes
├── src/
│   └── core/
│       └── services/
│           ├── apiService.js            # Original service for mock API
│           ├── backendIntegration.js    # New service for AWS backend
│           ├── authService.js           # Updated to use new backend
│           └── notesService.js          # Updated to use new backend
└── backend/                 # New AWS backend code
    ├── src/                 # Backend source code
    │   ├── controllers/     # Request handlers
    │   ├── models/          # Data models
    │   ├── routes/          # API routes
    │   ├── services/        # Business logic
    │   ├── middleware/      # Middleware functions
    │   ├── utils/           # Utility functions
    │   ├── config/          # Configuration
    │   └── index.js         # Entry point
    ├── serverless.yml       # AWS infrastructure as code
    └── package.json         # Dependencies
```

## How to Switch Between Backends

The `backendIntegration.js` file provides a mechanism to switch between the mock API and the AWS backend. By default, it uses the mock API in development and the AWS backend in production.

To manually switch between backends:

```javascript
import { setUseRealBackend } from '@core/services/backendIntegration';

// Switch to real backend
setUseRealBackend(true);

// Switch to mock API
setUseRealBackend(false);
```

## Updated Services

The following frontend services have been updated to use the new backend integration:

1. **authService.js** - Authentication (login, register, logout, etc.)
2. **notesService.js** - Notes management (CRUD operations)

Other services should be updated following the same pattern.

## Running the Backend Locally

To run the AWS backend locally for development:

```bash
cd backend
./dev.sh
```

This will start the Express server locally, which mimics the AWS Lambda functions.

## Deploying to AWS

To deploy the backend to AWS:

```bash
cd backend
./deploy.sh [stage]
```

Where `[stage]` is the deployment environment (e.g., `dev`, `staging`, `production`). If not specified, it defaults to `dev`.

## Next Steps

To complete the transition:

1. Update the remaining frontend services to use the new backend integration
2. Implement the remaining backend services (bookmarks, passwords, files, etc.)
3. Set up CI/CD for automated deployment
4. Configure proper environment variables for different stages
5. Add comprehensive testing

## Testing the Integration

To test the integration between the frontend and the new backend:

1. Start the backend locally: `cd backend && ./dev.sh`
2. Start the frontend: `npm run dev`
3. In the frontend code, use `setUseRealBackend(true)` to switch to the local backend
4. Test the functionality to ensure it works with the new backend

## Security Considerations

The AWS backend implements several security measures:

- JWT-based authentication
- Password hashing
- HTTPS for all API endpoints
- Fine-grained IAM permissions
- Data encryption at rest and in transit

Make sure to properly configure these security features before deploying to production.