# AWS Deployment Guide

This guide explains how to deploy the backend to AWS.

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions.
2. **AWS CLI**: Install and configure the AWS CLI with your credentials.
3. **Serverless Framework**: The deployment uses the Serverless Framework.

## Setup

### 1. Install Dependencies

```bash
npm install -g serverless
cd backend
npm install
```

### 2. Configure AWS Credentials

If you haven't already configured AWS CLI:

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, default region, and output format.

### 3. Environment Variables

For development, the `.env` file contains the necessary environment variables. For production, you have two options:

#### Option 1: Use AWS SSM Parameter Store (Recommended for Production)

Store sensitive values in AWS SSM Parameter Store:

```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET: $JWT_SECRET"

# Create JWT secret in SSM
aws ssm put-parameter \
  --name "/personal-website/prod/JWT_SECRET" \
  --value "j8Bhq2xPkRmT9sLw5vZy3FcXnG7dA6eK" \
  --type "SecureString"
```

Example output:
```
{
    "Version": 1,
    "Tier": "Standard"
}
```

Then update `serverless.yml` to use SSM:

```yaml
provider:
  environment:
    # Comment out the local value
    # JWT_SECRET: ${env:JWT_SECRET, 'your_jwt_secret_for_development_only'}
    # Uncomment the SSM line
    JWT_SECRET: ${ssm:/personal-website/${self:provider.stage}/JWT_SECRET}
```

#### Option 2: Use Environment Variables

You can also pass environment variables directly during deployment:

```bash
JWT_SECRET=j8Bhq2xPkRmT9sLw5vZy3FcXnG7dA6eK serverless deploy --stage prod
```

### 4. Update Bucket Names (Optional)

S3 bucket names must be globally unique. You might need to update the bucket name in `serverless.yml`:

```yaml
FilesBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: ${self:provider.stage}-your-unique-name-personal-website-files
```

## Deployment

### Deploy to Development

```bash
cd backend
./deploy.sh dev
```

### Deploy to Production

```bash
cd backend
./deploy.sh prod
```

## Post-Deployment

After deployment, Serverless Framework will output the API Gateway endpoint URL. Update your frontend configuration to use this URL:

```
API endpoint: https://abcdefghij.execute-api.us-east-1.amazonaws.com/dev
```

Update your frontend environment variables:

```
REACT_APP_API_URL=https://abcdefghij.execute-api.us-east-1.amazonaws.com/dev
```

## Monitoring and Logs

### CloudWatch Logs

You can view logs for each Lambda function in CloudWatch:

1. Go to AWS CloudWatch console
2. Navigate to "Log groups"
3. Find log groups with names like `/aws/lambda/personal-website-backend-dev-login`

### Monitoring with Serverless Framework

```bash
# Monitor a specific function
serverless logs -f login -t

# Monitor all functions
serverless logs -t
```

## Troubleshooting

### Deployment Errors

1. **Resource Already Exists**: If resources like DynamoDB tables already exist, you may need to remove them or use a different stage name.

2. **Permission Issues**: Ensure your AWS user has the necessary permissions for creating all resources.

3. **SSM Parameter Not Found**: If using SSM parameters, ensure they exist in the correct region and with the correct path.

### Runtime Errors

1. **Lambda Timeouts**: If functions time out, check the execution time and consider increasing the timeout in `serverless.yml`.

2. **CORS Issues**: If the frontend can't access the API due to CORS, check the CORS configuration in `serverless.yml`.

## Cleanup

To remove all deployed resources:

```bash
serverless remove --stage dev
```

This will delete all AWS resources created by the deployment.

## Additional Resources

- [Serverless Framework Documentation](https://www.serverless.com/framework/docs/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)