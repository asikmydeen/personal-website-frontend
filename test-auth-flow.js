/**
 * Test script to demonstrate the authentication flow
 * 
 * This script will:
 * 1. Register a new user
 * 2. Login to get a token
 * 3. Use the token to access protected endpoints
 */

const axios = require('axios');

// API URL - Replace with your actual API Gateway URL
const API_URL = 'https://1lhwq5uq57.execute-api.us-east-1.amazonaws.com/dev';

// Test user credentials
const TEST_USER = {
  email: 'test-user@example.com',
  password: 'Password123!',
  name: 'Test User'
};

// Store the authentication token
let authToken = '';

// Helper function for making requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'post' || method === 'put')) {
      config.data = data;
    }

    console.log(`Making ${method.toUpperCase()} request to ${endpoint}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error with ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Step 1: Register a new user
const registerUser = async () => {
  try {
    console.log('Step 1: Registering a new user...');
    const response = await makeRequest('post', '/api/v1/auth/register', TEST_USER);
    console.log('Registration successful!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Extract token from response
    authToken = response.data.token;
    console.log('Auth token:', authToken);
    
    return response;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
      console.log('User already exists, proceeding to login...');
      return null;
    }
    throw error;
  }
};

// Step 2: Login to get a token
const loginUser = async () => {
  try {
    console.log('\nStep 2: Logging in...');
    const response = await makeRequest('post', '/api/v1/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Extract token from response
    authToken = response.data.token;
    console.log('Auth token:', authToken);
    
    return response;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
};

// Step 3: Get notes (protected endpoint)
const getNotes = async () => {
  try {
    console.log('\nStep 3: Getting notes (protected endpoint)...');
    const response = await makeRequest('get', '/api/v1/notes', null, authToken);
    console.log('Notes retrieved successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Failed to get notes:', error.message);
    throw error;
  }
};

// Step 4: Create a note (protected endpoint)
const createNote = async () => {
  try {
    console.log('\nStep 4: Creating a note (protected endpoint)...');
    const noteData = {
      title: 'Test Note',
      content: 'This is a test note created by the test script',
      tags: ['test', 'script']
    };
    const response = await makeRequest('post', '/api/v1/notes', noteData, authToken);
    console.log('Note created successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Failed to create note:', error.message);
    throw error;
  }
};

// Main function to run the test
const runTest = async () => {
  try {
    console.log('Starting authentication flow test...');
    console.log(`Using API URL: ${API_URL}`);
    
    // Step 1: Register a new user
    try {
      await registerUser();
    } catch (error) {
      console.log('Registration failed, trying to login instead...');
    }
    
    // Step 2: Login to get a token
    await loginUser();
    
    // Step 3: Get notes (protected endpoint)
    await getNotes();
    
    // Step 4: Create a note (protected endpoint)
    await createNote();
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
};

// Run the test
runTest();