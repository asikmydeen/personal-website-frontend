// /src/services/notesService.js

import { get, post, put, del } from './apiService';

/**
 * List text notes with optional filters
 * @param {object} filters (optional, e.g., tags, date range)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const listNotes = async (filters = {}) => {
  console.log("[NotesService] Listing notes with filters:", filters);

  // Convert filters to query parameters if needed
  const queryParams = {};

  if (filters.tags) {
    queryParams.tags_like = filters.tags;
  }

  if (filters.query) {
    queryParams.q = filters.query;
  }

  return get('notes', queryParams);
};

/**
 * Get a specific text note
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const getNote = async (noteId) => {
  console.log("[NotesService] Getting note:", noteId);
  return get(`notes/${noteId}`);
};

/**
 * Create a new text note
 * @param {object} noteData - { title, content, tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const createNote = async (noteData) => {
  console.log("[NotesService] Creating note:", noteData);

  // Add required fields if not provided
  const note = {
    ...noteData,
    userId: noteData.userId || 'user1', // Default to user1 for testing
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: noteData.isPinned || false,
    isTrashed: false,
  };

  return post('notes', note);
};

/**
 * Update an existing text note
 * @param {string} noteId
 * @param {object} updateData - { title (optional), content (optional), tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const updateNote = async (noteId, updateData) => {
  console.log("[NotesService] Updating note:", noteId, "Data:", updateData);

  // Add updated timestamp
  const updates = {
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  return put(`notes/${noteId}`, updates);
};

/**
 * Delete a text note
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteNote = async (noteId) => {
  console.log("[NotesService] Deleting note:", noteId);
  return del(`notes/${noteId}`);
};

/**
 * Search text notes
 * @param {string} query (search term for title or content)
 * @param {object} filters (optional, e.g., tags)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const searchNotes = async (query, filters = {}) => {
  console.log("[NotesService] Searching notes with query:", query, "Filters:", filters);

  // Use the search endpoint from routes.json
  return get(`notes/search`, { query });
};

/**
 * Get notes by tag
 * @param {string} tag
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const getNotesByTag = async (tag) => {
  console.log("[NotesService] Getting notes by tag:", tag);
  return get(`notes/tags`, { tag });
};
