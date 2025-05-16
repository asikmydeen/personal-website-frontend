# Frontend-Backend Integration Guide

This guide explains how to integrate the frontend with the new AWS backend.

## Overview

The backend is now running on port 3000, and you can start using it with your frontend application. We've created a transition layer that allows you to switch between the mock API (json-server) and the new AWS backend.

## How to Test the Backend

1. Make sure the backend server is running:
   ```bash
   cd backend
   npm run dev
   ```

2. You can test the API endpoints using curl or a tool like Postman. For example:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/v1/notes
   ```

## How to Use the Backend in the Frontend

We've already updated two key services to work with the new backend:

1. `authService.js` - For authentication (login, register, etc.)
2. `notesService.js` - For notes management

These services now use the `backendIntegration.js` file, which provides a seamless way to switch between the mock API and the AWS backend.

### Using the Backend Integration

The `backendIntegration.js` file provides a simple API for making requests to the backend:

```javascript
import api from '@core/services/backendIntegration';

// GET request
const response = await api.get('/api/v1/notes');

// POST request
const newNote = await api.post('/api/v1/notes', { title: 'New Note', content: 'Content' });

// PUT request
const updatedNote = await api.put(`/api/v1/notes/${noteId}`, { title: 'Updated Title' });

// DELETE request
await api.delete(`/api/v1/notes/${noteId}`);
```

### Switching Between Mock API and AWS Backend

By default, the system uses the mock API in development and the AWS backend in production. You can manually switch between them:

```javascript
import { setUseRealBackend } from '@core/services/backendIntegration';

// Switch to real backend
setUseRealBackend(true);

// Switch to mock API
setUseRealBackend(false);
```

## Updating Other Services

To update other services to use the new backend, follow the pattern used in `authService.js` and `notesService.js`:

1. Import the `api` object from `backendIntegration.js`
2. Replace direct fetch calls with `api.get()`, `api.post()`, etc.
3. Update the API paths to match the new backend structure

For example, to update a service:

```javascript
// Before
import { get, post } from './apiService';

export const getItems = async () => {
  return get('items');
};

// After
import api from '@core/services/backendIntegration';

export const getItems = async () => {
  try {
    const response = await api.get('/api/v1/items');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error getting items:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch items'
    };
  }
};
```

## Environment Configuration

For production deployment, you'll need to set the API URL in your environment:

```
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com
```

## Next Steps

1. Update the remaining frontend services to use the new backend integration
2. Test the integration thoroughly
3. Deploy the backend to AWS using the provided deployment script
4. Configure the frontend to use the deployed backend

## Troubleshooting

If you encounter issues:

1. Check that the backend server is running
2. Verify that the API endpoints match between the frontend and backend
3. Check the browser console for error messages
4. Check the backend server logs for error messages

For authentication issues, make sure you're including the JWT token in your requests. The `backendIntegration.js` file handles this automatically if you use the `api` object.