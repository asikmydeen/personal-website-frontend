/**
 * Backend Integration Service
 * 
 * This file provides utilities to switch between the mock API (json-server)
 * and the real AWS backend API.
 */

// Configuration
const USE_REAL_BACKEND = true // Always use real backend;
const MOCK_API_BASE_URL = 'http://localhost:3000';
const REAL_API_BASE_URL = 'https://1lhwq5uq57.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Get the base URL for API requests
 */
export const getApiBaseUrl = () => {
  return USE_REAL_BACKEND ? REAL_API_BASE_URL : MOCK_API_BASE_URL;
};

/**
 * Get headers for API requests
 */
export const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Make an API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const requestOptions = {
    headers: getHeaders(),
    ...options
  };

  try {
    const response = await fetch(url, requestOptions);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // Handle API error responses
      if (!response.ok) {
        throw {
          status: response.status,
          message: data.error?.message || 'An error occurred',
          errors: data.error?.errors
        };
      }
      
      return data;
    } else {
      // Handle non-JSON responses (like file downloads)
      if (!response.ok) {
        throw {
          status: response.status,
          message: 'An error occurred'
        };
      }
      
      return response;
    }
  } catch (error) {
    // Log error for debugging
    console.error('API Request Error:', error);
    
    // Rethrow for handling by the caller
    throw error;
  }
};

/**
 * Helper methods for common HTTP methods
 */
export const api = {
  get: (endpoint, options = {}) => {
    return apiRequest(endpoint, { method: 'GET', ...options });
  },
  
  post: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data),
      ...options 
    });
  },
  
  put: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data),
      ...options 
    });
  },
  
  patch: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
      ...options 
    });
  },
  
  delete: (endpoint, options = {}) => {
    return apiRequest(endpoint, { method: 'DELETE', ...options });
  }
};

/**
 * Toggle between mock API and real backend
 */
export const setUseRealBackend = (useReal) => {
  // This would typically be stored in localStorage or app state
  // For now, we'll just log it
  console.log(`Switching to ${useReal ? 'real' : 'mock'} backend`);
  // In a real app, you might do:
  // localStorage.setItem('useRealBackend', useReal);
};

export default api;