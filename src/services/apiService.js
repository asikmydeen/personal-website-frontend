// /src/services/apiService.js

const API_BASE_URL = 'http://localhost:3001/api/v1';

/**
 * Common fetch wrapper with error handling for API requests
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data or error
 */
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Handle non-JSON responses
      if (!response.ok) {
        return {
          success: false,
          error: `Error: ${response.status} ${response.statusText}`,
          statusCode: response.status,
        };
      }
      data = { message: await response.text() };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API Request Failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {object} queryParams - Query parameters object
 * @returns {Promise<object>} Response data or error
 */
export const get = async (endpoint, queryParams = {}) => {
  const queryString = new URLSearchParams(queryParams).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return fetchAPI(url, { method: 'GET' });
};

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise<object>} Response data or error
 */
export const post = async (endpoint, data = {}) => {
  return fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise<object>} Response data or error
 */
export const put = async (endpoint, data = {}) => {
  return fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise<object>} Response data or error
 */
export const patch = async (endpoint, data = {}) => {
  return fetchAPI(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<object>} Response data or error
 */
export const del = async (endpoint) => {
  return fetchAPI(endpoint, { method: 'DELETE' });
};

export default {
  get,
  post,
  put,
  patch,
  delete: del,
};
