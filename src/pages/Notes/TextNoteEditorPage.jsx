import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNote, createNote, updateNote } from '../../services/notesService'; // Adjust path

const TextNoteEditorPage = () => {
  const { noteId } = useParams(); // For editing existing notes, e.g., /notes/edit/:noteId
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated string
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewNote, setIsNewNote] = useState(true);

  useEffect(() => {
    if (noteId) {
      setIsNewNote(false);
      setLoading(true);
      const fetchNoteData = async () => {
        try {
          const response = await getNote(noteId);
          if (response.success && response.data) {
            const note = response.data;
            setTitle(note.title || '');
            setContent(note.content || '');
            setTags(Array.isArray(note.tags) ? note.tags.join(', ') : '');
          } else {
            setError(response.error || 'Failed to load note.');
          }
        } catch (err) {
          setError('An unexpected error occurred while fetching the note.');
          console.error('Fetch note error:', err);
        }
        setLoading(false);
      };
      fetchNoteData();
    } else {
      setIsNewNote(true);
      // Reset fields for new note
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [noteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const noteData = {
        title,
        content,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let response;
      if (isNewNote) {
        response = await createNote(noteData);
      } else {
        response = await updateNote(noteId, noteData);
      }

      if (response.success && response.data) {
        // Navigate to the note view page or notes list
        navigate(isNewNote ? `/notes/${response.data.id}` : `/notes/${noteId}`);
      } else {
        setError(response.error || `Failed to ${isNewNote ? 'create' : 'update'} note.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred while ${isNewNote ? 'creating' : 'updating'} the note.`);
      console.error('Save note error:', err);
    }
    setLoading(false);
  };

  if (loading && !isNewNote) {
    return <div className="p-4 text-center">Loading note editor...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {isNewNote ? 'Create New Note' : 'Edit Note'}
      </h1>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Note Title"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="10"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Write your note here..."
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., work, personal, ideas"
          />
        </div>
        <div className="flex justify-end space-x-3">
            <button
                type="button"
                onClick={() => navigate(noteId ? `/notes/${noteId}` : '/notes')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {loading ? 'Saving...' : (isNewNote ? 'Create Note' : 'Save Changes')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default TextNoteEditorPage;
