// /src/services/passwordService.js

import { get, post, put, del } from './apiService';

/**
 * List stored passwords
 * @param {object} filters (optional, e.g., category, search term)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const listPasswords = async (filters = {}) => {
  console.log("[PasswordService] Listing passwords with filters:", filters);

  // Convert filters to query parameters if needed
  const queryParams = {};

  if (filters.category) {
    queryParams.category = filters.category;
  }

  if (filters.query) {
    queryParams.q = filters.query;
  }

  return get('passwords', queryParams);
};

/**
 * Get password details
 * @param {string} passwordId
 * @param {string} masterPasswordOrToken - For decryption key derivation
 * @returns {Promise<object>} - { success: boolean, data: { passwordDetails: {} } | error: string }
 */
export const getPasswordDetails = async (passwordId, masterPasswordOrToken) => {
  console.log("[PasswordService] Getting details for password:", passwordId);

  // In a real app, the master password would be used for server-side decryption
  // For demo purposes, we'll use it for auth with correct-master-password
  if (masterPasswordOrToken === "correct-master-password") {
    try {
      const response = await get(`passwords/${passwordId}`);
      if (response.success) {
        return {
          success: true,
          data: {
            passwordDetails: {
              ...response.data,
              // In a real app, the password would be decrypted server-side
              // For this demo, we'll pretend it's decrypted
              password: "decrypted_password_value"
            }
          }
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to get password details"
      };
    }
  }

  return {
    success: false,
    error: "Invalid master password or decryption failed"
  };
};

/**
 * Add a new password
 * @param {object} passwordData - { serviceName, username, password, notes (optional), website (optional) }
 * @param {string} masterPasswordOrToken - For encryption key derivation
 * @returns {Promise<object>} - { success: boolean, data: { password: {} } | error: string }
 */
export const addPassword = async (passwordData, masterPasswordOrToken) => {
  console.log("[PasswordService] Adding password for:", passwordData.serviceName);

  // In a real app, the master password would be used for server-side encryption
  // For demo purposes, we'll add default fields and save to API
  const payload = {
    ...passwordData,
    userId: 'user1', // Default user
    lastUsed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
  };

  try {
    return post('passwords', payload);
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to add password"
    };
  }
};

/**
 * Update an existing password
 * @param {string} passwordId
 * @param {object} updateData - { serviceName (optional), username (optional), password (optional), notes (optional) }
 * @param {string} masterPasswordOrToken - For re-encryption
 * @returns {Promise<object>} - { success: boolean, data: { password: {} } | error: string }
 */
export const updatePassword = async (passwordId, updateData, masterPasswordOrToken) => {
  console.log("[PasswordService] Updating password:", passwordId, "Data:", updateData);

  // Add updated timestamp
  const payload = {
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  try {
    return put(`passwords/${passwordId}`, payload);
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update password"
    };
  }
};

/**
 * Delete a password
 * @param {string} passwordId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deletePassword = async (passwordId) => {
  console.log("[PasswordService] Deleting password:", passwordId);
  try {
    return del(`passwords/${passwordId}`);
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete password"
    };
  }
};

/**
 * Generate a strong password
 * @param {object} options - { length, includeUppercase, includeNumbers, includeSymbols }
 * @returns {Promise<object>} - { success: boolean, data: { generatedPassword: string } | error: string }
 */
export const generateStrongPassword = async (options = {}) => {
  console.log("[PasswordService] Generating strong password with options:", options);

  // Default options
  const length = options.length || 16;
  const includeUppercase = options.includeUppercase !== false; // default to true
  const includeLowercase = options.includeLowercase !== false; // default to true
  const includeNumbers = options.includeNumbers !== false; // default to true
  const includeSymbols = options.includeSymbols !== false; // default to true

  // Basic password generation - this could also be an API call
  let chars = "";
  if (includeLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (includeUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) chars += "0123456789";
  if (includeSymbols) chars += "!@#$%^&*()_+-=[]{};':\",./<>?";

  if (chars === "") {
    return {
      success: false,
      error: "At least one character type must be selected"
    };
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return {
    success: true,
    data: { generatedPassword: password }
  };
};

/**
 * Search passwords
 * @param {string} query
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const searchPasswords = async (query) => {
  console.log("[PasswordService] Searching passwords with query:", query);
  return get(`passwords/search`, { query });
};

/**
 * Get passwords by category
 * @param {string} category
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const getPasswordsByCategory = async (category) => {
  console.log("[PasswordService] Getting passwords by category:", category);
  return get(`passwords/category/${category}`);
};
