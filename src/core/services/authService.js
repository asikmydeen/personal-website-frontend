import apiService from '@core/services/apiService'
import { WebStorage } from '../storage/storageInterface'

const storage = new WebStorage()
const TOKEN_KEY = 'token'

const authService = {
  /**
   * Perform login and store returned token
   * @param credentials {Object} – login payload (e.g. { username, password })
   * @returns response from API (should include token)
   */
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials)
    if (response?.token) {
      await storage.set(TOKEN_KEY, response.token)
    }
    return response
  },

  /**
   * Remove stored auth token (logout)
   */
  logout: async () => {
    await storage.remove(TOKEN_KEY)
  },

  /**
   * Retrieve stored auth token
   * @returns {Promise<string|null>}
   */
  getToken: async () => {
    return await storage.get(TOKEN_KEY)
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
