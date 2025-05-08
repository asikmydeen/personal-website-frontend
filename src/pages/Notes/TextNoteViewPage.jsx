import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNote, deleteNote } from '../../services/notesService'; // Adjust path
import ReactMarkdown from 'react-markdown'; // For rendering markdown content if notes support it

const TextNoteViewPage = () => {
  const { noteId } = useParams(); // Assuming route is /notes/:noteId
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!noteId) return;
    setLoading(true);
    setError('');
    const fetchNote = async () => {
      try {
        const response = await getNote(noteId);
        if (response.success && response.data) {
          setNote(response.data);
        } else {
          setError(response.error || 'Failed to load note.');
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching the note.');
        console.error('Fetch note error:', err);
      }
      setLoading(false);
    };
    fetchNote();
  }, [noteId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setLoading(true);
      setError('');
      try {
        const response = await deleteNote(noteId);
        if (response.success) {
          navigate('/notes'); // Or to a notes list page
        } else {
          setError(response.error || 'Failed to delete note.');
          setLoading(false);
        }
      } catch (err) {
        setError('An unexpected error occurred while deleting the note.');
        console.error('Delete note error:', err);
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading note...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!note) {
    return <div className="p-4 text-center">Note not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/notes" className="text-indigo-600 hover:text-indigo-800">&larr; Back to Notes List</Link>
        <div>
          <Link
            to={`/notes/edit/${noteId}`}
            className="mr-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Edit Note
          </Link>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Note'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 break-words">{note.title}</h1>

        {note.tags && note.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {note.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-indigo max-w-none mt-6">
          {/* Using ReactMarkdown for content rendering. Install if not present: pnpm install react-markdown */}
          <ReactMarkdown>{note.content || ''}</ReactMarkdown>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
          {note.lastModified && <p>Last Modified: {new Date(note.lastModified).toLocaleString()}</p>}
        </div>
      </div>
    </div>
  );
};

export default TextNoteViewPage;
