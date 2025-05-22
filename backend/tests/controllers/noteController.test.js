const {
  createNote: createNoteHandler,
  getNotes: getNotesHandler,
  getNote: getNoteHandler,
  updateNote: updateNoteHandler,
  trashNote: trashNoteHandler,
  deleteNote: deleteNoteHandler,
  restoreNote: restoreNoteHandler,
  searchNotes: searchNotesHandler,
  getNotesByTag: getNotesByTagHandler,
} = require('../../src/controllers/noteController');
const noteService = require('../../src/services/noteService');
const { AppError } = require('../../src/middleware/errorHandler');

// Mock the entire noteService
jest.mock('../../src/services/noteService');

describe('Note Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'testUserId' },
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Reset all mocks from noteService
    Object.values(noteService).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
  });

  // --- createNoteHandler ---
  describe('createNoteHandler', () => {
    it('should create a note successfully and return 201', async () => {
      mockReq.body = { title: 'Test Note', content: 'Content here', tags: ['test'], color: '#FFF', isPinned: false };
      const mockCreatedNote = { id: 'note1', ...mockReq.body, userId: 'testUserId' };
      noteService.createNote.mockResolvedValueOnce(mockCreatedNote);

      await createNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.createNote).toHaveBeenCalledWith('testUserId', {
        title: 'Test Note',
        content: 'Content here',
        tags: ['test'],
        color: '#FFF',
        isPinned: false,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockCreatedNote });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if title is missing', async () => {
      mockReq.body = { content: 'No title' }; // Missing title
      await createNoteHandler(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Title is required');
      expect(noteService.createNote).not.toHaveBeenCalled();
    });

    it('should call createNote with empty string for content if not provided', async () => {
      mockReq.body = { title: 'Test Note Only Title' };
      const mockCreatedNote = { id: 'note1', ...mockReq.body, content: '', userId: 'testUserId' };
      noteService.createNote.mockResolvedValueOnce(mockCreatedNote);
      
      await createNoteHandler(mockReq, mockRes, mockNext);
      
      expect(noteService.createNote).toHaveBeenCalledWith('testUserId', {
        title: 'Test Note Only Title',
        content: '', // Ensure content defaults to empty string
        tags: undefined, 
        color: undefined, 
        isPinned: undefined 
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors from noteService.createNote', async () => {
      mockReq.body = { title: 'Error Note' };
      const serviceError = new Error('Service failure');
      noteService.createNote.mockRejectedValueOnce(serviceError);
      await createNoteHandler(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  // --- getNotesHandler ---
  describe('getNotesHandler', () => {
    it('should get notes successfully', async () => {
      mockReq.query = { isPinned: 'true', isTrashed: 'false', limit: '10', nextToken: 'token123' };
      const mockResult = { notes: [{id: 'note1'}], nextToken: 'newToken' };
      noteService.getNotes.mockResolvedValueOnce(mockResult);

      await getNotesHandler(mockReq, mockRes, mockNext);

      expect(noteService.getNotes).toHaveBeenCalledWith('testUserId', {
        isPinned: true,
        isTrashed: false,
        limit: 10,
        lastEvaluatedKey: 'token123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockResult.notes, pagination: { nextToken: 'newToken' } });
    });
    
    it('should use default options if not provided in query for getNotes', async () => {
      mockReq.query = {}; // No query params
      const mockResult = { notes: [], nextToken: null };
      noteService.getNotes.mockResolvedValueOnce(mockResult);

      await getNotesHandler(mockReq, mockRes, mockNext);

      expect(noteService.getNotes).toHaveBeenCalledWith('testUserId', {
        isPinned: undefined,
        isTrashed: undefined, // Default behavior in controller if not specified
        limit: 100, // Default limit
        lastEvaluatedKey: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // --- getNoteHandler ---
  describe('getNoteHandler', () => {
    it('should get a note by ID successfully', async () => {
      mockReq.params.id = 'note123';
      const mockNote = { id: 'note123', title: 'Found Note' };
      noteService.getNoteById.mockResolvedValueOnce(mockNote);

      await getNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.getNoteById).toHaveBeenCalledWith('note123', 'testUserId');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockNote });
    });

    it('should return 404 if noteService.getNoteById returns null', async () => {
      mockReq.params.id = 'notFoundId';
      noteService.getNoteById.mockResolvedValueOnce(null);
      await getNoteHandler(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Note not found');
    });
  });

  // --- updateNoteHandler ---
  describe('updateNoteHandler', () => {
    it('should update a note successfully', async () => {
      mockReq.params.id = 'noteToUpdate';
      mockReq.body = { title: 'Updated Title', content: 'Updated Content' };
      const mockUpdatedNote = { id: 'noteToUpdate', ...mockReq.body };
      noteService.updateNote.mockResolvedValueOnce(mockUpdatedNote);

      await updateNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.updateNote).toHaveBeenCalledWith('noteToUpdate', 'testUserId', {
        title: 'Updated Title',
        content: 'Updated Content',
        tags: undefined,
        color: undefined,
        isPinned: undefined
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockUpdatedNote });
    });
     it('should build updateData with only provided fields', async () => {
      mockReq.params.id = 'noteToUpdatePartial';
      mockReq.body = { title: 'Only Title Updated' }; // Only title is provided
      const mockUpdatedNote = { id: 'noteToUpdatePartial', title: 'Only Title Updated' };
      noteService.updateNote.mockResolvedValueOnce(mockUpdatedNote);

      await updateNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.updateNote).toHaveBeenCalledWith('noteToUpdatePartial', 'testUserId', {
        title: 'Only Title Updated',
        // content, tags, color, isPinned should be undefined as they are not in req.body
        content: undefined, 
        tags: undefined,
        color: undefined,
        isPinned: undefined
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // --- trashNoteHandler ---
  describe('trashNoteHandler', () => {
    it('should trash a note successfully', async () => {
      mockReq.params.id = 'noteToTrash';
      noteService.trashNote.mockResolvedValueOnce({ success: true }); // Assuming service confirms

      await trashNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.trashNote).toHaveBeenCalledWith('noteToTrash', 'testUserId');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Note moved to trash' });
    });
  });

  // --- deleteNoteHandler (Permanent Delete) ---
  describe('deleteNoteHandler', () => {
    it('should permanently delete a note successfully', async () => {
      mockReq.params.id = 'noteToDeletePermanently';
      noteService.deleteNote.mockResolvedValueOnce({ success: true });

      await deleteNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.deleteNote).toHaveBeenCalledWith('noteToDeletePermanently', 'testUserId');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Note permanently deleted' });
    });
  });

  // --- restoreNoteHandler ---
  describe('restoreNoteHandler', () => {
    it('should restore a note successfully', async () => {
      mockReq.params.id = 'noteToRestore';
      noteService.restoreNote.mockResolvedValueOnce({ success: true });

      await restoreNoteHandler(mockReq, mockRes, mockNext);

      expect(noteService.restoreNote).toHaveBeenCalledWith('noteToRestore', 'testUserId');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Note restored from trash' });
    });
  });

  // --- searchNotesHandler ---
  describe('searchNotesHandler', () => {
    it('should search notes successfully', async () => {
      mockReq.query = { q: 'search term', isTrashed: 'false', limit: '15', nextToken: 'searchToken' };
      const mockSearchResult = { notes: [{id: 'searchResult1'}], nextToken: 'nextSearchToken' };
      noteService.searchNotes.mockResolvedValueOnce(mockSearchResult);

      await searchNotesHandler(mockReq, mockRes, mockNext);

      expect(noteService.searchNotes).toHaveBeenCalledWith('testUserId', 'search term', {
        isTrashed: false,
        limit: 15,
        lastEvaluatedKey: 'searchToken',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockSearchResult.notes, pagination: { nextToken: 'nextSearchToken' } });
    });

    it('should return 400 if search query q is missing', async () => {
      mockReq.query = {}; // Missing q
      await searchNotesHandler(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Search query is required');
      expect(noteService.searchNotes).not.toHaveBeenCalled();
    });
    
     it('should default isTrashed to false if not provided for searchNotes', async () => {
      mockReq.query = { q: 'search term' };
      const mockSearchResult = { notes: [], nextToken: null };
      noteService.searchNotes.mockResolvedValueOnce(mockSearchResult);

      await searchNotesHandler(mockReq, mockRes, mockNext);

      expect(noteService.searchNotes).toHaveBeenCalledWith('testUserId', 'search term', {
        isTrashed: false, // Default
        limit: 100, // Default
        lastEvaluatedKey: undefined,
      });
    });
  });

  // --- getNotesByTagHandler ---
  describe('getNotesByTagHandler', () => {
    it('should get notes by tag successfully', async () => {
      mockReq.query = { tag: 'important', isTrashed: 'true', limit: '5', nextToken: 'tagToken' };
      const mockTagResult = { notes: [{id: 'tagResult1'}], nextToken: 'nextTagToken' };
      noteService.getNotesByTag.mockResolvedValueOnce(mockTagResult);

      await getNotesByTagHandler(mockReq, mockRes, mockNext);

      expect(noteService.getNotesByTag).toHaveBeenCalledWith('testUserId', 'important', {
        isTrashed: true,
        limit: 5,
        lastEvaluatedKey: 'tagToken',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockTagResult.notes, pagination: { nextToken: 'nextTagToken' } });
    });

    it('should return 400 if tag is missing', async () => {
      mockReq.query = {}; // Missing tag
      await getNotesByTagHandler(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Tag is required');
      expect(noteService.getNotesByTag).not.toHaveBeenCalled();
    });
    
    it('should default isTrashed to false if not provided for getNotesByTag', async () => {
      mockReq.query = { tag: 'work' };
      const mockTagResult = { notes: [], nextToken: null };
      noteService.getNotesByTag.mockResolvedValueOnce(mockTagResult);

      await getNotesByTagHandler(mockReq, mockRes, mockNext);

      expect(noteService.getNotesByTag).toHaveBeenCalledWith('testUserId', 'work', {
        isTrashed: false, // Default
        limit: 100, // Default
        lastEvaluatedKey: undefined,
      });
    });
  });
});
