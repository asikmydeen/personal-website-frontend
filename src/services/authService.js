// /src/services/authService.js

import { get, post, put, del } from './apiService';

/**
 * User login
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} - { success: boolean, data: { user, token } | error: string }
 */
export const login = async (credentials) => {
  console.log("[AuthService] Logging in with:", credentials);

  try {
    const response = await post('auth/login', credentials);

    if (response.success) {
      // Store the token in localStorage for future API calls
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Login failed" };
  }
};

/**
 * User registration
 * @param {object} userData - { name, email, password }
 * @returns {Promise<object>} - { success: boolean, data: { user } | error: string }
 */
export const register = async (userData) => {
  console.log("[AuthService] Registering user:", userData);
  return post('auth/register', userData);
};

/**
 * User logout
 * @returns {Promise<object>} - { success: boolean }
 */
export const logout = async () => {
  console.log("[AuthService] Logging out user");

  // Get the stored token
  const token = localStorage.getItem('authToken');

  // Remove the token from localStorage
  localStorage.removeItem('authToken');

  // Call the logout endpoint if we have a token
  if (token) {
    return post('auth/logout', { token });
  }

  return { success: true };
};

/**
 * Password reset request
 * @param {string} email
 * @returns {Promise<object>} - { success: boolean, message: string | error: string }
 */
export const requestPasswordReset = async (email) => {
  console.log("[AuthService] Requesting password reset for:", email);
  return post('auth/password-reset', { email });
};

/**
 * Reset password with a token
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<object>} - { success: boolean, message: string | error: string }
 */
export const resetPassword = async (token, newPassword) => {
  console.log("[AuthService] Resetting password with token");
  return post(`auth/password-reset/${token}`, { newPassword });
};

/**
 * Verify authentication token
 * @param {string} token
 * @returns {Promise<object>} - { success: boolean, data: { isValid, user } | error: string }
 */
export const verifyToken = async (token) => {
  console.log("[AuthService] Verifying token");
  return post('auth/verify-token', { token });
};

/**
 * Get user profile
 * @param {string} userId
 * @returns {Promise<object>} - { success: boolean, data: { user } | error: string }
 */
export const getUserProfile = async (userId) => {
  console.log("[AuthService] Fetching profile for user:", userId);

  // Use the token from localStorage if it exists
  const token = localStorage.getItem('authToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return get(`users/profile`, { id: userId }, headers);
};

/**
 * Update user profile
 * @param {string} userId
 * @param {object} profileData
 * @returns {Promise<object>} - { success: boolean, data: { user } | error: string }
 */
export const updateUserProfile = async (userId, profileData) => {
  console.log("[AuthService] Updating profile for user:", userId, "Data:", profileData);

  // Use the token from localStorage if it exists
  const token = localStorage.getItem('authToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return put(`users/profile`, { id: userId, ...profileData }, headers);
};

/**
 * Update user settings
 * @param {string} userId
 * @param {object} settingsData
 * @returns {Promise<object>} - { success: boolean, data: { settings } | error: string }
 */
export const updateUserSettings = async (userId, settingsData) => {
  console.log("[AuthService] Updating settings for user:", userId, "Data:", settingsData);

  // Use the token from localStorage if it exists
  const token = localStorage.getItem('authToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return put(`users/settings`, { id: userId, ...settingsData }, headers);
};

/**
 * Get current user from token
 * @returns {Promise<object>} - { success: boolean, data: { user } | error: string }
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return { success: false, error: "No authentication token found" };
  }

  return verifyToken(token);
};
