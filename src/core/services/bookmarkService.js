// /src/services/bookmarkService.js

import { get, post, put, del } from './apiService';

/**
 * List bookmarks with optional filters
 * @param {object} filters (optional, e.g., tags, category)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const listBookmarks = async (filters = {}) => {
  console.log("[BookmarkService] Listing bookmarks with filters:", filters);

  // Convert filters to query parameters if needed
  const queryParams = {};

  if (filters.tags) {
    queryParams.tags_like = filters.tags;
  }

  if (filters.category) {
    queryParams.category = filters.category;
  }

  if (filters.query) {
    queryParams.q = filters.query;
  }

  return get('bookmarks', queryParams);
};

/**
 * Add a new bookmark
 * @param {object} bookmarkData - { url, title (optional), description (optional), tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const addBookmark = async (bookmarkData) => {
  console.log("[BookmarkService] Adding bookmark:", bookmarkData);

  // Add required fields if not provided
  const bookmark = {
    ...bookmarkData,
    userId: bookmarkData.userId || 'user1', // Default to user1 for testing
    title: bookmarkData.title || `Bookmark for ${bookmarkData.url}`,
    createdAt: new Date().toISOString()
  };

  return post('bookmarks', bookmark);
};

/**
 * Update an existing bookmark
 * @param {string} bookmarkId
 * @param {object} updateData - { url (optional), title (optional), description (optional), tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const updateBookmark = async (bookmarkId, updateData) => {
  console.log("[BookmarkService] Updating bookmark:", bookmarkId, "Data:", updateData);
  return put(`bookmarks/${bookmarkId}`, updateData);
};

/**
 * Delete a bookmark
 * @param {string} bookmarkId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteBookmark = async (bookmarkId) => {
  console.log("[BookmarkService] Deleting bookmark:", bookmarkId);
  return del(`bookmarks/${bookmarkId}`);
};

/**
 * Get a specific bookmark
 * @param {string} bookmarkId
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const getBookmark = async (bookmarkId) => {
  console.log("[BookmarkService] Getting bookmark:", bookmarkId);
  return get(`bookmarks/${bookmarkId}`);
};

/**
 * Search bookmarks
 * @param {string} query (search term for title, url, or description)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const searchBookmarks = async (query) => {
  console.log("[BookmarkService] Searching bookmarks with query:", query);
  return get(`bookmarks/search`, { query });
};

/**
 * Get bookmarks by tag
 * @param {string} tag
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const getBookmarksByTag = async (tag) => {
  console.log("[BookmarkService] Getting bookmarks by tag:", tag);
  return get(`bookmarks/tags`, { tag });
};
