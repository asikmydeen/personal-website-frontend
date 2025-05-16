# AWS Architecture for Personal Website Backend

This document describes the AWS architecture used for the personal website backend.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Web Client    │────▶│  API Gateway    │────▶│  Lambda         │
│                 │     │                 │     │  Functions      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   CloudFront    │     │   Cognito       │◀───▶│   DynamoDB      │
│                 │     │   User Pool     │     │   Tables        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲
        │
┌───────┴───────┐
│               │
│   S3 Buckets  │
│               │
└───────────────┘
```

## Component Description

### API Gateway
- Handles all HTTP requests
- Provides API endpoints for the frontend
- Manages API versioning
- Handles CORS
- Routes requests to appropriate Lambda functions

### Lambda Functions
- Serverless compute service
- Executes backend logic
- Organized by resource (auth, users, notes, etc.)
- Scales automatically based on demand

### DynamoDB
- NoSQL database service
- Stores all application data
- Tables for users, notes, bookmarks, etc.
- Global Secondary Indexes for efficient queries
- Automatic scaling

### S3 Buckets
- Object storage for files, photos, and media
- Stores user uploads
- Serves static assets
- Encrypted at rest

### CloudFront
- Content Delivery Network (CDN)
- Caches and serves S3 content
- Improves performance and reduces latency
- HTTPS support

### Cognito User Pool
- User authentication and authorization
- Manages user accounts
- Handles sign-up, sign-in, and account recovery
- Multi-factor authentication
- Integration with social identity providers

## Data Flow

1. **User Authentication**:
   - User signs in through the frontend
   - Request goes to API Gateway
   - API Gateway routes to Lambda function
   - Lambda authenticates with Cognito
   - JWT token is returned to the client

2. **Data Access**:
   - Authenticated user makes API request
   - API Gateway validates JWT token
   - Request is routed to appropriate Lambda function
   - Lambda function queries DynamoDB
   - Data is returned to the client

3. **File Operations**:
   - User uploads file through frontend
   - File is sent to API Gateway
   - Lambda function processes the file
   - File is stored in S3
   - File metadata is stored in DynamoDB
   - CloudFront serves the file when requested

## Security Measures

- API Gateway with API keys and usage plans
- Lambda functions with least privilege IAM roles
- DynamoDB with fine-grained access control
- S3 with bucket policies and encryption
- CloudFront with signed URLs
- Cognito for secure user authentication
- All data encrypted at rest and in transit

## Monitoring and Logging

- CloudWatch for metrics and logs
- X-Ray for distributed tracing
- CloudTrail for API activity logging
- SNS for alerts and notifications

## Deployment

The infrastructure is deployed using the Serverless Framework, which creates and manages all AWS resources through CloudFormation.