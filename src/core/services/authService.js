import api from '@core/services/backendIntegration'
import { WebStorage } from '../storage/storageInterface'

const storage = new WebStorage()
const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'

const authService = {
  /**
   * Perform login and store returned token and user
   * @param credentials {Object} – login payload (e.g. { email, password })
   * @returns response from API (should include token and user)
   */
  login: async (credentials) => {
    const response = await api.post('/api/v1/auth/login', credentials)
    console.log('API login response:', response)
    
    // Check if the response has the expected structure
    if (response && response.data && response.data.token) {
      await storage.set(TOKEN_KEY, response.data.token)
      
      if (response.data.user) {
        await storage.set(USER_KEY, JSON.stringify(response.data.user))
      }
      
      // Return a properly structured response
      return {
        success: true,
        data: response.data
      }
    }
    
    // If we get here, something went wrong with the response structure
    console.error('Unexpected API login response structure:', response)
    return {
      success: false,
      error: 'Login failed: Invalid response from server',
      originalResponse: response
    }
  },

  /**
   * Register a new user
   * @param userData {Object} - registration payload (e.g. { email, password, name })
   * @returns response from API
   */
  register: async (userData) => {
    const response = await api.post('/api/v1/auth/register', userData)
    console.log('API register response:', response)
    
    // Check if the response has the expected structure
    if (response && response.data && response.data.token) {
      // For registration, we don't store the token and user data
      // We want the user to explicitly log in after registration
      
      // Return a properly structured response
      return {
        success: true,
        data: response.data
      }
    }
    
    // If we get here, something went wrong with the response structure
    console.error('Unexpected API register response structure:', response)
    return {
      success: false,
      error: 'Registration failed: Invalid response from server',
      originalResponse: response
    }
  },

  /**
   * Remove stored auth token and user data (logout)
   */
  logout: async () => {
    const token = await storage.get(TOKEN_KEY)
    if (token) {
      try {
        // Call logout endpoint to invalidate token on server
        await api.post('/api/v1/auth/logout')
      } catch (error) {
        console.error('Error during logout:', error)
      }
    }
    
    // Remove local storage items regardless of server response
    await storage.remove(TOKEN_KEY)
    await storage.remove(USER_KEY)
  },

  /**
   * Request password reset
   * @param email {string} - user's email
   * @returns response from API
   */
  requestPasswordReset: async (email) => {
    const response = await api.post('/api/v1/auth/password-reset', { email })
    return response.data
  },

  /**
   * Reset password with token
   * @param token {string} - reset token
   * @param password {string} - new password
   * @returns response from API
   */
  resetPassword: async (token, password) => {
    const response = await api.post(`/api/v1/auth/password-reset/${token}`, { password })
    return response.data
  },

  /**
   * Verify token validity
   * @returns {Promise<Object>} user data if token is valid
   */
  verifyToken: async () => {
    const token = await storage.get(TOKEN_KEY)
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    const response = await api.post('/api/v1/auth/verify-token')
    return response.data
  },

  /**
   * Retrieve stored auth token
   * @returns {Promise<string|null>}
   */
  getToken: async () => {
    return await storage.get(TOKEN_KEY)
  },

  /**
   * Retrieve stored user data
   * @returns {Promise<Object|null>}
   */
  getUser: async () => {
    const userData = await storage.get(USER_KEY)
    return userData ? JSON.parse(userData) : null
  },

  /**
   * Check if user is authenticated (token present)
   * @returns {Promise<boolean>}
   */
  isAuthenticated: async () => {
    const token = await storage.get(TOKEN_KEY)
    return !!token
  }
}

export default authService
