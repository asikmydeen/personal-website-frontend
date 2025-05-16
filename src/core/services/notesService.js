// /src/services/notesService.js

import api from '@core/services/backendIntegration';

/**
 * List text notes with optional filters
 * @param {object} filters (optional, e.g., tags, isPinned, isTrashed)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const listNotes = async (filters = {}) => {
  console.log("[NotesService] Listing notes with filters:", filters);

  // Convert filters to query parameters
  const queryParams = {};

  if (filters.tags) {
    queryParams.tags_like = filters.tags;
  }

  if (filters.query) {
    queryParams.q = filters.query;
  }

  if (filters.isPinned !== undefined) {
    queryParams.isPinned = filters.isPinned;
  }

  if (filters.isTrashed !== undefined) {
    queryParams.isTrashed = filters.isTrashed;
  }

  try {
    const response = await api.get('/api/v1/notes', { params: queryParams });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error listing notes:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch notes'
    };
  }
};

/**
 * Get a specific text note
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const getNote = async (noteId) => {
  console.log("[NotesService] Getting note:", noteId);
  
  try {
    const response = await api.get(`/api/v1/notes/${noteId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error getting note:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch note'
    };
  }
};

/**
 * Create a new text note
 * @param {object} noteData - { title, content, tags (optional), color (optional), isPinned (optional) }
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const createNote = async (noteData) => {
  console.log("[NotesService] Creating note:", noteData);

  try {
    const response = await api.post('/api/v1/notes', noteData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error creating note:', error);
    return {
      success: false,
      error: error.message || 'Failed to create note'
    };
  }
};

/**
 * Update an existing text note
 * @param {string} noteId
 * @param {object} updateData - { title (optional), content (optional), tags (optional), color (optional), isPinned (optional) }
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const updateNote = async (noteId, updateData) => {
  console.log("[NotesService] Updating note:", noteId, "Data:", updateData);

  try {
    const response = await api.put(`/api/v1/notes/${noteId}`, updateData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error updating note:', error);
    return {
      success: false,
      error: error.message || 'Failed to update note'
    };
  }
};

/**
 * Move a note to trash
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const trashNote = async (noteId) => {
  console.log("[NotesService] Moving note to trash:", noteId);
  
  try {
    const response = await api.delete(`/api/v1/notes/${noteId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error trashing note:', error);
    return {
      success: false,
      error: error.message || 'Failed to move note to trash'
    };
  }
};

/**
 * Permanently delete a note
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteNote = async (noteId) => {
  console.log("[NotesService] Permanently deleting note:", noteId);
  
  try {
    const response = await api.delete(`/api/v1/notes/${noteId}/permanent`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error deleting note:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete note'
    };
  }
};

/**
 * Restore a note from trash
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const restoreNote = async (noteId) => {
  console.log("[NotesService] Restoring note from trash:", noteId);
  
  try {
    const response = await api.put(`/api/v1/notes/${noteId}/restore`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error restoring note:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore note'
    };
  }
};

/**
 * Search text notes
 * @param {string} query (search term for title or content)
 * @param {object} filters (optional, e.g., isTrashed)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const searchNotes = async (query, filters = {}) => {
  console.log("[NotesService] Searching notes with query:", query, "Filters:", filters);

  try {
    const queryParams = { q: query };
    
    if (filters.isTrashed !== undefined) {
      queryParams.isTrashed = filters.isTrashed;
    }
    
    const response = await api.get('/api/v1/notes/search', { params: queryParams });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error searching notes:', error);
    return {
      success: false,
      error: error.message || 'Failed to search notes'
    };
  }
};

/**
 * Get notes by tag
 * @param {string} tag
 * @param {object} filters (optional, e.g., isTrashed)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const getNotesByTag = async (tag, filters = {}) => {
  console.log("[NotesService] Getting notes by tag:", tag);
  
  try {
    const queryParams = { tag };
    
    if (filters.isTrashed !== undefined) {
      queryParams.isTrashed = filters.isTrashed;
    }
    
    const response = await api.get('/api/v1/notes/tags', { params: queryParams });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[NotesService] Error getting notes by tag:', error);
    return {
      success: false,
      error: error.message || 'Failed to get notes by tag'
    };
  }
};
