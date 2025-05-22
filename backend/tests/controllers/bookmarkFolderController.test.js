const {
  createBookmarkFolder,
  getBookmarkFolders,
  getBookmarkFolderById,
  updateBookmarkFolder,
  deleteBookmarkFolder,
  getBookmarksInFolder,
} = require('../../src/controllers/bookmarkFolderController');
const { AppError } = require('../../src/middleware/errorHandler');
const { dynamoDB, getTableName } = require('../../src/config/aws');
const { v4: uuidv4 } = require('uuid');

// Mock AWS SDK and UUID
jest.mock('../../src/config/aws', () => ({
  dynamoDB: {
    put: jest.fn(() => ({ promise: jest.fn() })),
    query: jest.fn(() => ({ promise: jest.fn() })),
    get: jest.fn(() => ({ promise: jest.fn() })),
    update: jest.fn(() => ({ promise: jest.fn() })),
    delete: jest.fn(() => ({ promise: jest.fn() })),
    batchWrite: jest.fn(() => ({ promise: jest.fn() })), // Mock for batch operations
  },
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('BookmarkFolder Controller', () => {
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
      send: jest.fn().mockReturnThis(), // For 204 responses
    };
    mockNext = jest.fn();

    // Reset all DynamoDB mocks
    const mockPromise = jest.fn().mockResolvedValue({});
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReturnValue({ promise: mockPromise });
      }
    });
    
    uuidv4.mockReset();
    getTableName.mockClear();
  });

  // --- createBookmarkFolder ---
  describe('createBookmarkFolder', () => {
    it('should create a folder successfully and return 201', async () => {
      const mockFolderId = 'folder-uuid-123';
      uuidv4.mockReturnValue(mockFolderId);
      mockReq.body = { name: 'My Links', parentId: 'parent-folder-id' };

      // Mock parent folder check
      dynamoDB.get.mockReturnValueOnce({ 
        promise: jest.fn().mockResolvedValueOnce({ Item: { id: 'parent-folder-id', userId: 'testUserId' } }) 
      });
      dynamoDB.put.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({}) });


      await createBookmarkFolder(mockReq, mockRes, mockNext);

      expect(uuidv4).toHaveBeenCalled();
      expect(getTableName).toHaveBeenCalledWith('bookmark-folders');
      expect(dynamoDB.put).toHaveBeenCalledWith({
        TableName: expect.stringContaining('bookmark-folders'),
        Item: expect.objectContaining({
          id: mockFolderId,
          userId: 'testUserId',
          name: 'My Links',
          parentId: 'parent-folder-id',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: mockFolderId, name: 'My Links' }),
      });
    });

    it('should return 400 if name is missing', async () => {
      mockReq.body = { parentId: 'parent1' };
      await createBookmarkFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Folder name is required');
    });

    it('should return 404 if parentId is provided but parent folder not found', async () => {
      mockReq.body = { name: 'Subfolder', parentId: 'nonExistentParent' };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: null }) });
      await createBookmarkFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Parent folder not found or not authorized');
    });
  });

  // --- getBookmarkFolders ---
  describe('getBookmarkFolders', () => {
    it('should get root folders successfully when parentId is "root"', async () => {
      const mockFolders = [{ id: 'folder1', name: 'Root Folder 1' }];
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: mockFolders, LastEvaluatedKey: null }) });
      mockReq.query = { parentId: 'root' };

      await getBookmarkFolders(mockReq, mockRes, mockNext);
      expect(getTableName).toHaveBeenCalledWith('bookmark-folders');
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: '(attribute_not_exists(parentId) OR parentId = :nullParentId)',
        ExpressionAttributeValues: expect.objectContaining({ ':userId': 'testUserId', ':nullParentId': null }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockFolders, lastEvaluatedKey: null });
    });
    
    it('should get subfolders successfully when parentId is provided', async () => {
      const mockFolders = [{ id: 'folder2', name: 'Subfolder 1', parentId: 'parent1' }];
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: mockFolders, LastEvaluatedKey: null }) });
      mockReq.query = { parentId: 'parent1' };

      await getBookmarkFolders(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: 'parentId = :parentId',
        ExpressionAttributeValues: expect.objectContaining({ ':userId': 'testUserId', ':parentId': 'parent1' }),
      }));
    });

    it('should get all folders if no parentId is specified', async () => {
      const mockFolders = [{ id: 'folder3', name: 'Folder A' }];
       dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: mockFolders, LastEvaluatedKey: null }) });
      mockReq.query = {}; // No parentId

      await getBookmarkFolders(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: undefined, // No filter on parentId
      }));
    });
  });

  // --- getBookmarkFolderById ---
  describe('getBookmarkFolderById', () => {
    it('should get a folder by ID successfully', async () => {
      const mockFolder = { id: 'folder123', userId: 'testUserId', name: 'My Folder' };
      mockReq.params.id = 'folder123';
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: mockFolder }) });
      await getBookmarkFolderById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('bookmark-folders'), Key: { id: 'folder123' } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockFolder });
    });
     it('should return 404 if folder not found', async () => {
      mockReq.params.id = 'nonExistentId';
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: null }) });
      await getBookmarkFolderById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  // --- updateBookmarkFolder ---
  describe('updateBookmarkFolder', () => {
    const folderId = 'folderToUpdate';
    const currentFolder = { id: folderId, userId: 'testUserId', name: 'Old Name' };

    beforeEach(() => { 
      mockReq.params.id = folderId; 
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: currentFolder }) });
    });
    
    it('should update folder name successfully', async () => {
      mockReq.body = { name: 'New Name' };
      const updatedAttrs = { ...currentFolder, name: 'New Name', updatedAt: expect.any(String) };
      dynamoDB.update.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Attributes: updatedAttrs }) });
      await updateBookmarkFolder(mockReq, mockRes, mockNext);
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: folderId } }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedAttrs });
    });

    it('should return 400 if trying to set parentId to self', async () => {
      mockReq.body = { parentId: folderId };
      await updateBookmarkFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Cannot set a folder as its own parent');
    });
    
    it('should return 404 if new parent folder not found', async () => {
        mockReq.body = { parentId: 'nonExistentParent' };
        // Mock for current folder
        dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: currentFolder }) });
        // Mock for parent folder check
        dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: null }) });
        await updateBookmarkFolder(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
        expect(mockNext.mock.calls[0][0].message).toBe('New parent folder not found or not authorized');
    });
  });

  // --- deleteBookmarkFolder ---
  describe('deleteBookmarkFolder', () => {
    const folderId = 'folderToDelete';
    const currentFolder = { id: folderId, userId: 'testUserId', name: 'To Delete' };

    beforeEach(() => { 
      mockReq.params.id = folderId;
      // Mock get for the folder being deleted
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: currentFolder }) });
    });

    it('should delete a folder and disassociate bookmarks successfully', async () => {
      // Mock check for sub-folders (no sub-folders)
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: [] }) });
      // Mock query for bookmarks in folder (finds some bookmarks)
      const bookmarksInFolder = [{ id: 'bm1', folderId: folderId, userId: 'testUserId', data: 'data1' }, { id: 'bm2', folderId: folderId, userId: 'testUserId', data: 'data2' }];
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: bookmarksInFolder, LastEvaluatedKey: null }) });
      // Mock batchWrite to disassociate bookmarks
      dynamoDB.batchWrite.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({}) });
      // Mock delete for the folder itself
      dynamoDB.delete.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({}) });

      await deleteBookmarkFolder(mockReq, mockRes, mockNext);

      expect(getTableName).toHaveBeenCalledWith('bookmark-folders'); // For subfolder check & delete
      expect(getTableName).toHaveBeenCalledWith('bookmarks');    // For bookmark disassociation
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ FilterExpression: 'parentId = :parentId', ExpressionAttributeValues: {':userId': 'testUserId', ':parentId': folderId} })); // Subfolder check
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ FilterExpression: 'folderId = :folderId', ExpressionAttributeValues: {':userId': 'testUserId', ':folderId': folderId} })); // Bookmarks in folder
      expect(dynamoDB.batchWrite).toHaveBeenCalled();
      expect(dynamoDB.delete).toHaveBeenCalledWith({ TableName: expect.stringContaining('bookmark-folders'), Key: { id: folderId } });
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('should return 400 if folder contains sub-folders', async () => {
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: [{ id: 'subfolder1' }] }) }); // Has sub-folders
      await deleteBookmarkFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Cannot delete folder: it contains sub-folders. Please delete or move them first.');
    });
  });

  // --- getBookmarksInFolder ---
  describe('getBookmarksInFolder', () => {
    const folderId = 'targetFolderId';
    const existingFolder = { id: folderId, userId: 'testUserId', name: 'Tech Links' };

    beforeEach(() => { 
        mockReq.params.id = folderId;
    });

    it('should get bookmarks in a folder successfully', async () => {
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: existingFolder }) }); // Folder exists
      const mockBookmarks = [{ id: 'bm1', folderId: folderId, url: 'https://tech.com' }];
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Items: mockBookmarks, LastEvaluatedKey: null }) });
      mockReq.query = { limit: '10' };

      await getBookmarksInFolder(mockReq, mockRes, mockNext);

      expect(getTableName).toHaveBeenCalledWith('bookmark-folders'); // For folder check
      expect(getTableName).toHaveBeenCalledWith('bookmarks');    // For bookmarks query
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('bookmark-folders'), Key: { id: folderId } });
      expect(dynamoDB.query).toHaveBeenCalledWith({
        TableName: expect.stringContaining('bookmarks'),
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'folderId = :folderId',
        ExpressionAttributeValues: { ':userId': 'testUserId', ':folderId': folderId },
        ScanIndexForward: false,
        Limit: 10,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockBookmarks, lastEvaluatedKey: null });
    });
    
    it('should return 404 if folder not found for getBookmarksInFolder', async () => {
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: null }) }); // Folder does not exist
      await getBookmarksInFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Bookmark folder not found');
      expect(dynamoDB.query).not.toHaveBeenCalled(); // Should not query bookmarks
    });
  });
});
