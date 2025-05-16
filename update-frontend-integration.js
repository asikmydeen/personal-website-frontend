/**
 * Script to update the frontend integration to use the real AWS API
 * 
 * This script will:
 * 1. Update the backendIntegration.js file to use the real AWS API URL
 * 2. Set USE_REAL_BACKEND to true by default
 */

const fs = require('fs');
const path = require('path');

// API URL - Replace with your actual API Gateway URL
const API_URL = 'https://lp8whfim49.execute-api.us-east-1.amazonaws.com/dev';

// Path to the backendIntegration.js file
const integrationFilePath = path.join(__dirname, 'src', 'core', 'services', 'backendIntegration.js');

// Read the current file content
fs.readFile(integrationFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Update the configuration
  let updatedContent = data
    // Update the USE_REAL_BACKEND flag to true
    .replace(
      /const USE_REAL_BACKEND = process\.env\.NODE_ENV === 'production'/,
      'const USE_REAL_BACKEND = true // Always use real backend'
    )
    // Update the REAL_API_BASE_URL to use the actual API URL
    .replace(
      /const REAL_API_BASE_URL = process\.env\.REACT_APP_API_URL \|\| 'https:\/\/api\.yourdomain\.com'/,
      `const REAL_API_BASE_URL = '${API_URL}'`
    );

  // Write the updated content back to the file
  fs.writeFile(integrationFilePath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log(`Successfully updated ${integrationFilePath}`);
    console.log(`Frontend now uses the real API at: ${API_URL}`);
  });
});

// Create a .env file with the API URL
const envFilePath = path.join(__dirname, '.env');
const envContent = `REACT_APP_API_URL=${API_URL}\n`;

fs.writeFile(envFilePath, envContent, 'utf8', (err) => {
  if (err) {
    console.error('Error writing .env file:', err);
    return;
  }
  console.log(`Successfully created .env file with API URL`);
});

console.log('Frontend integration update complete!');
console.log('To test the integration:');
console.log('1. Run the populate-aws-backend.js script to populate the backend with test data');
console.log('2. Start the frontend application with: npm run dev');
console.log('3. Login with email: user@example.com and password: Password123!');