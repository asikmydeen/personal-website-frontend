#!/bin/bash

# Exit on error
set -e

# Configuration - MODIFY THESE VALUES TO MATCH YOUR deploy.sh CONFIGURATION
PROJECT_NAME="personal-website"
AWS_REGION="us-west-2"  # Region for S3 bucket and other resources
# CloudFront requires certificates to be in us-east-1 region
PARENT_DOMAIN=""  # Your existing domain with hosted zone (leave empty to select from available domains)
SUBDOMAIN="personalpod"  # Subdomain to create (will result in subdomain.yourdomain.com)

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

# Get the hosted zone ID for the parent domain
step "Getting hosted zone ID for $PARENT_DOMAIN..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$PARENT_DOMAIN" \
  --query 'HostedZones[0].Id' --output text | sed 's/\/hostedzone\///')

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" == "None" ]; then
  warn "Could not find hosted zone for $PARENT_DOMAIN"
else
  echo "Hosted Zone ID: $HOSTED_ZONE_ID"
fi

# Find CloudFront distribution for the domain
step "Finding CloudFront distribution for $FULL_DOMAIN..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '$FULL_DOMAIN')].Id" --output text)

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
  warn "Could not find CloudFront distribution for $FULL_DOMAIN"
else
  echo "CloudFront Distribution ID: $DISTRIBUTION_ID"

  # Get the Origin Access Control ID
  OAC_ID=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DistributionConfig.Origins.Items[0].OriginAccessControlId' --output text)

  if [ -n "$OAC_ID" ] && [ "$OAC_ID" != "None" ]; then
    echo "Origin Access Control ID: $OAC_ID"
  fi

  # Get the certificate ARN
  CERTIFICATE_ARN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DistributionConfig.ViewerCertificate.ACMCertificateArn' --output text)

  if [ -n "$CERTIFICATE_ARN" ] && [ "$CERTIFICATE_ARN" != "None" ]; then
    echo "Certificate ARN: $CERTIFICATE_ARN"
  fi

  # Check if the distribution has other domains
  ALIASES=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DistributionConfig.Aliases.Items' --output json)
  ALIAS_COUNT=$(echo "$ALIASES" | jq 'length')

  if [ "$ALIAS_COUNT" -gt 1 ]; then
    warn "CloudFront distribution is associated with multiple domains:"
    echo "$ALIASES" | jq -r '.[]'
    read -p "Do you want to delete this distribution anyway? This will affect all domains listed above. (y/N): " CONFIRM

    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
      echo "Skipping CloudFront distribution deletion."

      # Remove just this domain from the distribution's aliases
      step "Removing $FULL_DOMAIN from CloudFront distribution aliases..."

      # Get the current distribution config
      aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json > /tmp/dist-config.json
      ETAG=$(jq -r '.ETag' /tmp/dist-config.json)

      # Update the config to remove this domain
      jq --arg domain "$FULL_DOMAIN" '.DistributionConfig.Aliases.Items = [.DistributionConfig.Aliases.Items[] | select(. != $domain)]' /tmp/dist-config.json > /tmp/dist-config-updated.json
      jq '.DistributionConfig.Aliases.Quantity = (.DistributionConfig.Aliases.Items | length)' /tmp/dist-config-updated.json > /tmp/dist-config-updated2.json
      UPDATED_CONFIG=$(jq '.DistributionConfig' /tmp/dist-config-updated2.json)

      # Apply the updated config
      aws cloudfront update-distribution --id "$DISTRIBUTION_ID" --distribution-config "$UPDATED_CONFIG" --if-match "$ETAG" > /dev/null

      echo "Domain removed from CloudFront distribution."

      # Skip to DNS record deletion
      goto_dns_deletion=true
    fi
  fi

  if [ "$goto_dns_deletion" != "true" ]; then
    # Disable CloudFront distribution
    step "Disabling CloudFront distribution..."

    # Get the current distribution config
    aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json > /tmp/dist-config.json
    ETAG=$(jq -r '.ETag' /tmp/dist-config.json)

    # Update the config to disable the distribution
    jq '.DistributionConfig.Enabled = false' /tmp/dist-config.json > /tmp/dist-config-updated.json
    UPDATED_CONFIG=$(jq '.DistributionConfig' /tmp/dist-config-updated.json)

    # Apply the updated config
    aws cloudfront update-distribution --id "$DISTRIBUTION_ID" --distribution-config "$UPDATED_CONFIG" --if-match "$ETAG" > /dev/null

    echo "CloudFront distribution is being disabled. This may take some time."
    echo "Waiting for distribution to be deployed with disabled status..."
    aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

    # Delete CloudFront distribution
    step "Deleting CloudFront distribution..."

    # Get the new ETag after disabling
    aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json > /tmp/dist-config.json
    ETAG=$(jq -r '.ETag' /tmp/dist-config.json)

    # Delete the distribution
    aws cloudfront delete-distribution --id "$DISTRIBUTION_ID" --if-match "$ETAG"

    # Delete Origin Access Control if found
    if [ -n "$OAC_ID" ] && [ "$OAC_ID" != "None" ]; then
      step "Deleting Origin Access Control..."
      aws cloudfront delete-origin-access-control --id "$OAC_ID" --if-match "$(aws cloudfront get-origin-access-control --id "$OAC_ID" --query 'ETag' --output text)"
    fi
  fi
fi

# Delete DNS record for subdomain
if [ -n "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
  step "Deleting DNS record for $FULL_DOMAIN..."

  # Check if the record exists
  RECORD_EXISTS=$(aws route53 list-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
    --query "ResourceRecordSets[?Name=='$FULL_DOMAIN.' && Type=='A']" --output text)

  if [ -n "$RECORD_EXISTS" ]; then
    # Get the target domain name for the alias record
    TARGET_DOMAIN=$(aws route53 list-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
      --query "ResourceRecordSets[?Name=='$FULL_DOMAIN.' && Type=='A'].AliasTarget.DNSName" --output text)

    # Create the change batch to delete the record
    cat > /tmp/delete-record.json << EOF
{
  "Changes": [
    {
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "$FULL_DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$TARGET_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

    aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
      --change-batch file:///tmp/delete-record.json

    echo "DNS record deleted."
  else
    warn "DNS record for $FULL_DOMAIN not found."
  fi
fi

# Delete SSL certificate
if [ -n "$CERTIFICATE_ARN" ] && [ "$CERTIFICATE_ARN" != "None" ]; then
  step "Deleting SSL certificate from us-east-1 region (CloudFront requirement)..."
  aws acm delete-certificate --certificate-arn "$CERTIFICATE_ARN" --region "us-east-1"
  echo "Certificate deleted."
fi

# Delete S3 bucket
step "Checking S3 bucket: $S3_BUCKET"
if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  step "Emptying S3 bucket..."
  aws s3 rm "s3://$S3_BUCKET" --recursive

  step "Deleting S3 bucket..."
  # For us-east-1, don't specify region
  if [ "$AWS_REGION" = "us-east-1" ]; then
    aws s3api delete-bucket --bucket "$S3_BUCKET"
  else
    aws s3api delete-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION"
  fi
  echo "S3 bucket deleted."
else
  warn "S3 bucket $S3_BUCKET not found."
fi

# Clean up temporary files
rm -f /tmp/dist-config.json /tmp/dist-config-updated.json /tmp/delete-record.json

# Success message
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Cleanup completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "All resources associated with ${FULL_DOMAIN} have been removed."
echo -e "${GREEN}============================================${NC}"