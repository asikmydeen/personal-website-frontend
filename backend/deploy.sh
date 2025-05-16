#!/bin/bash

# Deploy script for the backend

# Check if stage is provided
if [ -z "$1" ]; then
  STAGE="dev"
else
  STAGE=$1
fi

echo "Deploying to $STAGE environment..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Deploy using Serverless Framework
echo "Deploying with Serverless Framework..."
npx serverless@3.40.0 deploy --stage $STAGE

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "Deployment successful!"
  
  # Get the API endpoint
  API_URL=$(npx serverless info --stage $STAGE | grep -o 'ServiceEndpoint: .*' | cut -d' ' -f2)
  
  echo "API is available at: $API_URL"
else
  echo "Deployment failed!"
  exit 1
fi