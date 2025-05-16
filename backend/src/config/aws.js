const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Initialize S3 client
const s3 = new AWS.S3();

// Initialize Cognito Identity Provider
const cognito = new AWS.CognitoIdentityServiceProvider();

// Initialize SES for email
const ses = new AWS.SES();

// Table name prefix based on environment
const getTableName = (tableName) => {
  const stage = process.env.NODE_ENV || 'dev';
  return `${stage}-${tableName}`;
};

// S3 bucket name based on environment
const getBucketName = () => {
  const stage = process.env.NODE_ENV || 'dev';
  return `${stage}-personal-website-files`;
};

// Cognito User Pool ID
const getUserPoolId = () => {
  return process.env.COGNITO_USER_POOL_ID;
};

// Cognito App Client ID
const getUserPoolClientId = () => {
  return process.env.COGNITO_CLIENT_ID;
};

module.exports = {
  dynamoDB,
  s3,
  cognito,
  ses,
  getTableName,
  getBucketName,
  getUserPoolId,
  getUserPoolClientId
};