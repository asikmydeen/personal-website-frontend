// /src/services/notesService.js

const API_BASE_URL = "/api/v1"; // Or process.env.REACT_APP_API_URL

/**
 * Placeholder for listing text notes
 * @param {object} filters (optional, e.g., tags, date range)
 * @returns {Promise<object>} - { success: boolean, data: { notes: [] } | error: string }
 */
export const listNotes = async (filters) => {
  console.log("[NotesService] Listing notes with filters:", filters);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    success: true,
    data: {
      notes: [
        { id: "note1", title: "Meeting Summary", lastModified: "2023-04-01", tags: ["work", "meeting"] },
        { id: "note2", title: "Grocery List", lastModified: "2023-04-05", tags: ["personal"] },
      ]
    }
  };
};

/**
 * Placeholder for getting a specific text note
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean, data: { note: {} } | error: string }
 */
export const getNote = async (noteId) => {
  console.log("[NotesService] Getting note:", noteId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, data: { note: { id: noteId, title: "Meeting Summary", content: "Detailed notes from the meeting...", tags: ["work", "meeting"], createdAt: "2023-04-01" } } };
};

/**
 * Placeholder for creating a new text note
 * @param {object} noteData - { title, content, tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: { note: {} } | error: string }
 */
export const createNote = async (noteData) => {
  console.log("[NotesService] Creating note:", noteData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, data: { note: { id: "newNote789", ...noteData, lastModified: new Date().toISOString() } } };
};

/**
 * Placeholder for updating an existing text note
 * @param {string} noteId
 * @param {object} updateData - { title (optional), content (optional), tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: { note: {} } | error: string }
 */
export const updateNote = async (noteId, updateData) => {
  console.log("[NotesService] Updating note:", noteId, "Data:", updateData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, data: { note: { id: noteId, ...updateData, lastModified: new Date().toISOString() } } };
};

/**
 * Placeholder for deleting a text note
 * @param {string} noteId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteNote = async (noteId) => {
  console.log("[NotesService] Deleting note:", noteId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

/**
 * Placeholder for searching text notes
 * @param {string} query (search term for title or content)
 * @param {object} filters (optional, e.g., tags)
 * @returns {Promise<object>} - { success: boolean, data: { results: [] } | error: string }
 */
export const searchNotes = async (query, filters) => {
  console.log("[NotesService] Searching notes with query:", query, "Filters:", filters);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    success: true,
    data: {
      results: [
        { id: "note1", title: "Meeting Summary", snippet: "...summary of the meeting...", tags: ["work"] }
      ]
    }
  };
};

