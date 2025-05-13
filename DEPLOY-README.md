# AWS Deployment Script for Personal Website Frontend

This repository includes a deployment script (`deploy.sh`) that automates the process of building and deploying your React/Vite application to AWS. The script handles:

1. Building the project
2. Creating an S3 bucket for hosting
3. Uploading the built files to S3
4. Creating an SSL certificate
5. Setting up a CloudFront distribution
6. Configuring a subdomain under your existing domain
7. Linking everything together

## Prerequisites

Before using this script, ensure you have:

1. **AWS CLI installed and configured** with appropriate permissions
   ```bash
   # Install AWS CLI
   pip install awscli

   # Configure AWS CLI with your credentials
   aws configure
   ```

2. **An existing Route53 hosted zone** for your parent domain

3. **Node.js and npm** installed on your system

## Configuration

Edit the following variables at the top of the `deploy.sh` script:

```bash
# Configuration - MODIFY THESE VALUES
PROJECT_NAME="personal-website"
AWS_REGION="us-east-1"  # Region for S3, CloudFront, and ACM
PARENT_DOMAIN=""  # Your existing domain with hosted zone (leave empty to select from available domains)
SUBDOMAIN="personalpod"  # Subdomain to create (will result in subdomain.yourdomain.com)
```

If you leave `PARENT_DOMAIN` empty, the script will automatically list all available hosted zones in your AWS account and prompt you to select one. This makes it easy to deploy without having to look up your domain names in advance.

## Usage

1. Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Run the script:
   ```bash
   ./deploy.sh
   ```

3. Wait for the deployment to complete. The script will output the URL of your deployed website.

## Important Notes

- The script uses the AWS region specified in the configuration for S3 and other resources.
- **CloudFront certificates must be in us-east-1 region** - The script automatically handles this requirement by requesting and managing certificates in us-east-1 regardless of your configured AWS region.
- SSL certificate validation is done via DNS validation, which requires access to your Route53 hosted zone.
- CloudFront distribution deployment can take 15-30 minutes to complete.
- The script configures CloudFront to handle single-page application routing (404s redirect to index.html).
- The S3 bucket is configured to only allow access via CloudFront for security.
- S3 bucket names are automatically generated using the format: `project-name-subdomain-domainprefix`
  - For example, if your project is "personal-website", subdomain is "personalpod", and domain is "example.com",
    the bucket name would be "personal-website-personalpod-example"
  - The script ensures bucket names are valid by limiting length to 63 characters and using only allowed characters
- The script handles existing AWS resources intelligently:
  - Reuses existing CloudFront distributions for the same domain
  - Updates existing distributions with new certificate and S3 bucket information
  - Reuses existing Origin Access Controls if they have the same name
  - Properly handles region-specific requirements for different AWS services

## Troubleshooting

If the script fails:

1. Check the error message for details
2. Verify your AWS credentials have the necessary permissions
3. Ensure your Route53 hosted zone is properly set up
4. Check if resources with the same names already exist

## Cleanup

A cleanup script (`cleanup.sh`) is provided to automatically remove all AWS resources created by the deployment script. This script will:

1. Find the CloudFront distribution associated with your domain
2. Check if the distribution is used by multiple domains and prompt before deletion
3. Safely remove your domain from the distribution if you choose not to delete it
4. Remove DNS records from Route53
5. Delete the SSL certificate
6. Empty and delete the S3 bucket

To use the cleanup script:

1. Make sure the configuration variables at the top of `cleanup.sh` match those in your `deploy.sh` script
2. Make the script executable:
   ```bash
   chmod +x cleanup.sh
   ```
3. Run the script:
   ```bash
   ./cleanup.sh
   ```

The script includes safety features to prevent accidental deletion of CloudFront distributions that are serving multiple domains. If the script detects that a distribution is used by other domains, it will:

1. List all domains using the distribution
2. Ask for confirmation before proceeding with deletion
3. Offer to remove just your domain from the distribution's aliases instead of deleting it entirely

This ensures you don't accidentally disrupt other websites when cleaning up your resources.

Alternatively, you can manually remove the resources using the AWS Management Console or AWS CLI.