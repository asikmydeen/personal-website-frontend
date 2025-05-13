import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Search, Plus } from 'lucide-react';
import AnimatedModal from '../../components/animated/AnimatedModal';
import AddEditNoteComponent from '../../components/notes/AddEditNoteComponent';

const NotesListPage = () => {
  const { notes, fetchNotes } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);

  // Extract all unique tags from notes for filter menu
  const allTags = [...new Set((notes || []).flatMap(note => note?.tags || []))];

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setError('');
      try {
        await fetchNotes();
      } catch (err) {
        setError('Failed to load notes. Please try again.');
        console.error('Error fetching notes:', err);
      }
      setLoading(false);
    };

    loadNotes();
  }, [fetchNotes]);

  const handleOpenCreateModal = () => {
    setCurrentNote(null); // Reset to ensure we're creating a new note
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setCurrentNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentNote(null);
  };

  const handleSaveSuccess = async (savedNote) => {
    // Refresh notes list
    await fetchNotes();
    handleCloseModal();
  };

  // Filter notes based on selected tag and search query
  const filteredNotes = (notes || []).filter(note => {
    if (!note) return false;

    const matchesTag = !activeTag || (note.tags && note.tags.includes(activeTag));
    const matchesSearch = !searchQuery ||
      (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTag && matchesSearch;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Notes</h1>
        <Button
          className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
          onClick={handleOpenCreateModal}
        >
          <Plus className="h-4 w-4" />
          Create New Note
        </Button>
      </div>

      {/* Note editing modal */}
      <AnimatedModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        animationType="zoom"
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {currentNote ? 'Edit Note' : 'Create New Note'}
          </h2>
          <AddEditNoteComponent
            noteData={currentNote}
            onClose={handleCloseModal}
            onSaveSuccess={handleSaveSuccess}
          />
        </div>
      </AnimatedModal>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Left sidebar with filters */}
        <div className="md:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="font-semibold text-gray-700 mb-2">Tags</h2>
            <div className="space-y-2">
              <div
                className={`cursor-pointer px-3 py-2 rounded-md ${!activeTag ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTag(null)}
              >
                All Notes
              </div>
              {allTags.map(tag => (
                <div
                  key={tag}
                  className={`cursor-pointer px-3 py-2 rounded-md ${activeTag === tag ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                >
                  {tag}
                </div>
              ))}
              {allTags.length === 0 && (
                <div className="text-gray-500 text-sm italic">No tags found</div>
              )}
            </div>
          </div>
        </div>

        {/* Notes grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading notes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">{searchQuery || activeTag ? 'No notes match your filters' : 'No notes yet'}</p>
              <Button
                onClick={handleOpenCreateModal}
                variant="outline"
                className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
              >
                Create your first note
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div key={note.id} onClick={() => handleOpenEditModal(note)}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{note.title}</CardTitle>
                      <CardDescription>
                        {new Date(note.lastModified || note.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3">
                        {note.content ? note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '') : 'No content'}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      {note.tags && note.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="bg-gray-100">{tag}</Badge>
                      ))}
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesListPage;
