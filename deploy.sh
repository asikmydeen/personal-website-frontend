#!/bin/bash

# Exit on error
set -e

# Configuration - MODIFY THESE VALUES
PROJECT_NAME="personal-website"
AWS_REGION="us-west-2"  # Region for S3 bucket and other resources
# CloudFront requires certificates to be in us-east-1 region
PARENT_DOMAIN=""  # Your existing domain with hosted zone (leave empty to select from available domains)
SUBDOMAIN="personalpod"  # Subdomain to create (will result in subdomain.yourdomain.com)

# Build directory
BUILD_DIR="dist"  # Vite's default build directory

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display step information
step() {
  echo -e "${GREEN}==>${NC} $1"
}

# Function to display warnings
warn() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

# Function to display errors and exit
error() {
  echo -e "${RED}ERROR:${NC} $1"
  exit 1
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  error "AWS CLI is not installed. Please install it first: https://aws.amazon.com/cli/"
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
  error "AWS CLI is not configured. Please run 'aws configure' first."
fi

# If PARENT_DOMAIN is empty, list available hosted zones and let user select one
if [ -z "$PARENT_DOMAIN" ]; then
  step "No parent domain specified. Listing available hosted zones..."

  # Get list of hosted zones
  ZONES=$(aws route53 list-hosted-zones --query "HostedZones[].{ID:Id,Name:Name,Private:Config.PrivateZone}" --output json)
  ZONE_COUNT=$(echo "$ZONES" | jq length)

  if [ "$ZONE_COUNT" -eq 0 ]; then
    error "No hosted zones found in your AWS account. Please create a hosted zone first."
  fi

  echo "Available hosted zones:"
  echo "$ZONES" | jq -r '.[] | select(.Private == false) | [.ID, .Name] | @tsv' |
    sed 's/\/hostedzone\///' |
    nl -w2 -s") " |
    sed 's/\.\s*$//'

  # Prompt user to select a zone
  read -p "Select a hosted zone number: " ZONE_NUMBER

  # Validate input
  if ! [[ "$ZONE_NUMBER" =~ ^[0-9]+$ ]] || [ "$ZONE_NUMBER" -lt 1 ] || [ "$ZONE_NUMBER" -gt "$ZONE_COUNT" ]; then
    error "Invalid selection. Please run the script again and select a valid number."
  fi

  # Get the selected domain name
  PARENT_DOMAIN=$(echo "$ZONES" | jq -r '.[] | select(.Private == false) | .Name' |
    sed 's/\.\s*$//' |
    sed -n "${ZONE_NUMBER}p")

  echo "Selected domain: $PARENT_DOMAIN"
fi

# Set the full domain and derived values
FULL_DOMAIN="${SUBDOMAIN}.${PARENT_DOMAIN}"

# Create a valid S3 bucket name
# Extract the first part of the domain (before the first dot)
DOMAIN_PREFIX=$(echo "$PARENT_DOMAIN" | cut -d. -f1)
S3_BUCKET="${PROJECT_NAME}-${SUBDOMAIN}-${DOMAIN_PREFIX}"

# Ensure S3 bucket name is valid (lowercase, no underscores, etc.)
S3_BUCKET=$(echo "$S3_BUCKET" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

# Ensure bucket name is not too long (max 63 chars)
if [ ${#S3_BUCKET} -gt 63 ]; then
  # Truncate to 63 chars
  S3_BUCKET="${S3_BUCKET:0:63}"
  # Ensure it doesn't end with a hyphen
  S3_BUCKET="${S3_BUCKET%-}"
fi

echo "Using S3 bucket name: $S3_BUCKET"

# Build the project
step "Building the project..."
npm ci
npm run build

if [ ! -d "$BUILD_DIR" ]; then
  error "Build directory '$BUILD_DIR' not found. Build may have failed."
fi

# Create S3 bucket if it doesn't exist
step "Creating/checking S3 bucket: $S3_BUCKET"
if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  echo "Bucket already exists"
else
  echo "Creating bucket..."
  # For us-east-1, don't specify LocationConstraint
  if [ "$AWS_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION"
  else
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  fi
fi

# Configure S3 bucket for static website hosting
step "Configuring S3 bucket for static website hosting..."
aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html

# Set bucket policy to allow CloudFront access only
step "Setting bucket policy..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file:///tmp/bucket-policy.json

# Upload files to S3
step "Uploading files to S3..."
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" --delete

# Request SSL certificate (always in us-east-1 for CloudFront)
step "Requesting SSL certificate for $FULL_DOMAIN in us-east-1 region (required for CloudFront)..."
CERTIFICATE_ARN=$(aws acm request-certificate --domain-name "$FULL_DOMAIN" \
  --validation-method DNS --region "us-east-1" --query 'CertificateArn' --output text)

echo "Certificate ARN: $CERTIFICATE_ARN"

# Wait for certificate details to be available
step "Waiting for certificate details..."
sleep 10

# Get certificate validation CNAME records
step "Getting certificate validation records..."
VALIDATION_RECORD=$(aws acm describe-certificate --certificate-arn "$CERTIFICATE_ARN" \
  --region "us-east-1" --query 'Certificate.DomainValidationOptions[0].ResourceRecord')

VALIDATION_NAME=$(echo "$VALIDATION_RECORD" | grep -o '"Name": "[^"]*' | cut -d'"' -f4)
VALIDATION_VALUE=$(echo "$VALIDATION_RECORD" | grep -o '"Value": "[^"]*' | cut -d'"' -f4)

echo "Validation record: $VALIDATION_NAME -> $VALIDATION_VALUE"

# Get the hosted zone ID for the parent domain
step "Getting hosted zone ID for $PARENT_DOMAIN..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$PARENT_DOMAIN" \
  --query 'HostedZones[0].Id' --output text | sed 's/\/hostedzone\///')

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" == "None" ]; then
  error "Could not find hosted zone for $PARENT_DOMAIN"
fi

echo "Hosted Zone ID: $HOSTED_ZONE_ID"

# Create DNS validation record
step "Creating DNS validation record..."
cat > /tmp/validation-record.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$VALIDATION_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$VALIDATION_VALUE"
          }
        ]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch file:///tmp/validation-record.json

# Wait for certificate validation
step "Waiting for certificate validation (this may take several minutes)..."
aws acm wait certificate-validated --certificate-arn "$CERTIFICATE_ARN" --region "us-east-1"

# Create or get existing CloudFront origin access control
OAC_NAME="$S3_BUCKET-OAC"
step "Checking for existing CloudFront origin access control with name: $OAC_NAME..."

# List all OACs and check if one with our name exists
OAC_LIST=$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='$OAC_NAME']" --output json)
OAC_COUNT=$(echo "$OAC_LIST" | jq length)

if [ "$OAC_COUNT" -gt 0 ]; then
  # OAC already exists, use it
  OAC_ID=$(echo "$OAC_LIST" | jq -r '.[0].Id')
  echo "Found existing Origin Access Control with ID: $OAC_ID"
else
  # Create new OAC
  step "Creating new CloudFront origin access control..."
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{\"Name\":\"$OAC_NAME\",\"Description\":\"OAC for $S3_BUCKET\",\"SigningProtocol\":\"sigv4\",\"SigningBehavior\":\"always\",\"OriginAccessControlOriginType\":\"s3\"}" \
    --query 'OriginAccessControl.Id' --output text)
  echo "Created new Origin Access Control with ID: $OAC_ID"
fi

# Check if CloudFront distribution already exists for the domain
step "Checking for existing CloudFront distribution for $FULL_DOMAIN..."
EXISTING_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '$FULL_DOMAIN')].Id" --output text)

if [ -n "$EXISTING_DISTRIBUTION_ID" ] && [ "$EXISTING_DISTRIBUTION_ID" != "None" ]; then
  # Distribution already exists
  DISTRIBUTION_ID=$EXISTING_DISTRIBUTION_ID
  echo "Found existing CloudFront distribution with ID: $DISTRIBUTION_ID"

  # Get the domain name of the existing distribution
  DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' --output text)

  # Update the distribution to use the new certificate and S3 bucket
  step "Updating existing CloudFront distribution..."

  # Get the current distribution config
  aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json > /tmp/dist-config.json
  ETAG=$(jq -r '.ETag' /tmp/dist-config.json)

  # Update the config
  jq --arg cert "$CERTIFICATE_ARN" --arg bucket "$S3_BUCKET" --arg region "$AWS_REGION" --arg oac "$OAC_ID" \
    '.DistributionConfig.ViewerCertificate.ACMCertificateArn = $cert |
     .DistributionConfig.Origins.Items[0].DomainName = ($bucket + ".s3." + $region + ".amazonaws.com") |
     .DistributionConfig.Origins.Items[0].OriginAccessControlId = $oac' \
    /tmp/dist-config.json > /tmp/dist-config-updated.json

  UPDATED_CONFIG=$(jq '.DistributionConfig' /tmp/dist-config-updated.json)

  # Apply the updated config
  aws cloudfront update-distribution --id "$DISTRIBUTION_ID" --distribution-config "$UPDATED_CONFIG" --if-match "$ETAG" > /dev/null

  echo "CloudFront distribution updated."
else
  # Create new distribution
  step "Creating new CloudFront distribution..."
  DISTRIBUTION_CONFIG=$(cat << EOF
{
  "CallerReference": "$(date +%s)",
  "Aliases": {
    "Quantity": 1,
    "Items": ["$FULL_DOMAIN"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "$S3_BUCKET.s3.$AWS_REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "$OAC_ID"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Comment": "Distribution for $FULL_DOMAIN",
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERTIFICATE_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2"
}
EOF
)

  DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG" \
    --query 'Distribution.Id' --output text)

  DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' --output text)

  echo "Created new CloudFront distribution with ID: $DISTRIBUTION_ID"
fi

echo "CloudFront Domain: $DISTRIBUTION_DOMAIN"

# Create DNS record for subdomain
step "Creating DNS record for $FULL_DOMAIN..."
cat > /tmp/subdomain-record.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$FULL_DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$DISTRIBUTION_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch file:///tmp/subdomain-record.json

# Wait for CloudFront distribution to deploy
step "Waiting for CloudFront distribution to deploy (this may take 15-30 minutes)..."
aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

# Clean up temporary files
rm -f /tmp/bucket-policy.json /tmp/validation-record.json /tmp/subdomain-record.json

# Success message
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "Website URL: https://${FULL_DOMAIN}"
echo -e "CloudFront URL: https://${DISTRIBUTION_DOMAIN}"
echo -e "${GREEN}============================================${NC}"