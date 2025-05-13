import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNote, deleteNote } from '../../services/notesService';
import AnimatedModal from '../../components/animated/AnimatedModal';
import AddEditNoteComponent from '../../components/notes/AddEditNoteComponent';

const TextNoteViewPage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      {/* Edit Note Modal */}
      <AnimatedModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        animationType="zoom"
        className="w-full max-w-4xl"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Note</h2>
          <AddEditNoteComponent
            noteData={note}
            onClose={() => setIsEditModalOpen(false)}
            onSaveSuccess={() => {
              setIsEditModalOpen(false);
              // Refresh note data after edit
              const fetchUpdatedNote = async () => {
                setLoading(true);
                try {
                  const response = await getNote(noteId);
                  if (response.success && response.data) {
                    setNote(response.data);
                  }
                } catch (err) {
                  console.error('Error refreshing note data:', err);
                }
                setLoading(false);
              };
              fetchUpdatedNote();
            }}
          />
        </div>
      </AnimatedModal>

      <div className="mb-6 flex justify-between items-center">
        <Link to="/notes" className="text-indigo-600 hover:text-indigo-800">&larr; Back to Notes List</Link>
        <div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="mr-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Edit Note
          </button>
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
          {/* Display HTML content from WYSIWYG editor */}
          <div dangerouslySetInnerHTML={{ __html: note.content || '' }} />
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
