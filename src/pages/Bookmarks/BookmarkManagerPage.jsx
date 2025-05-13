import React, { useState, useEffect } from 'react';
import useStore from '@core/store/useStore';
import { Search, Plus, ExternalLink, Star, Trash2, Edit, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tooltip } from '../../components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../components/ui/dropdown-menu';
import AnimatedModal from '../../components/animated/AnimatedModal';
import { deleteBookmark } from '@core/services/bookmarkService';
import AddEditBookmarkComponent from '../../components/bookmarks/AddEditBookmarkComponent';

const BookmarkManagerPage = () => {
  const { bookmarks, fetchBookmarks, setBookmarks } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBookmark, setCurrentBookmark] = useState(null);

  // Extract unique tags for filter dropdown
  const allTags = [...new Set((bookmarks || []).flatMap(bookmark => bookmark?.tags || []))];

  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      try {
        await fetchBookmarks();
      } catch (err) {
        setError('Failed to load bookmarks. Please try again.');
        console.error('Error fetching bookmarks:', err);
      }
      setLoading(false);
    };

    loadBookmarks();
  }, [fetchBookmarks]);

  const handleSaveSuccess = (savedBookmark) => {
    if (currentBookmark && currentBookmark.id) {
      // Update existing bookmark in the local state
      setBookmarks((bookmarks || []).map(b =>
        b && b.id === currentBookmark?.id ? savedBookmark : b
      ));
    } else {
      // Add new bookmark to the local state
      setBookmarks([...(bookmarks || []), savedBookmark]);
    }
    setIsDialogOpen(false);
    setCurrentBookmark(null);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      setLoading(true);
      try {
        const response = await deleteBookmark(bookmarkId);
        if (response.success) {
          setBookmarks((bookmarks || []).filter(b => b && b.id !== bookmarkId));
        } else {
          setError('Failed to delete bookmark: ' + response.error);
        }
      } catch (err) {
        setError('An error occurred while deleting the bookmark.');
        console.error('Delete bookmark error:', err);
      }
      setLoading(false);
    }
  };

  const openBookmarkDialog = (bookmark = null) => {
    setCurrentBookmark(bookmark);
    setIsDialogOpen(true);
  };

  // Filter bookmarks based on search query and active tag
  const filteredBookmarks = (bookmarks || []).filter(bookmark => {
    if (!bookmark) return false;

    const matchesSearch = !searchQuery ||
      (bookmark.title && bookmark.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bookmark.url && bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !activeTag ||
      (bookmark.tags && bookmark.tags.includes(activeTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Bookmarks</h1>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-white font-medium"
          onClick={() => openBookmarkDialog()}
          style={{
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Plus size={16} />
          Add Bookmark
        </Button>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 glass-effect">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
            >
              <Filter size={16} />
              {activeTag ? `Tag: ${activeTag}` : 'Filter by Tag'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-effect">
            <DropdownMenuItem onClick={() => setActiveTag('')}>
              All Bookmarks
            </DropdownMenuItem>
            {allTags.map(tag => (
              <DropdownMenuItem key={tag} onClick={() => setActiveTag(tag)}>
                {tag}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Bookmarks list */}
      {loading && (!bookmarks || bookmarks.length === 0) ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading bookmarks...</p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg glass-effect">
          <p className="text-gray-600 mb-4">
            {searchQuery || activeTag ? 'No bookmarks match your filters' : 'No bookmarks yet'}
          </p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            onClick={() => openBookmarkDialog()}
            style={{
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
            }}
          >
            Add your first bookmark
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map(bookmark => (
            <Card key={bookmark.id} className="hover:shadow-md transition-all glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold truncate flex items-start justify-between">
                  <span>{bookmark.title}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openBookmarkDialog(bookmark)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                      aria-label="Edit bookmark"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      className="text-gray-500 hover:text-red-600 p-1"
                      aria-label="Delete bookmark"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center truncate"
                >
                  {bookmark.url}
                  <ExternalLink size={14} className="ml-1 inline" />
                </a>
              </CardContent>
              <CardFooter className="pt-2 flex flex-wrap gap-2">
                {bookmark.tags && bookmark.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-blue-50 cursor-pointer"
                    onClick={() => setActiveTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Bookmark Dialog */}
      <AnimatedModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        animationType="zoom"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{currentBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}</h2>
          <AddEditBookmarkComponent
            bookmarkData={currentBookmark}
            onClose={() => setIsDialogOpen(false)}
            onSaveSuccess={handleSaveSuccess}
          />
        </div>
      </AnimatedModal>
    </div>
  );
};

export default BookmarkManagerPage;
