const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  getFilesInFolder,
} = require('../../src/controllers/folderController');
const { AppError } = require('../../src/middleware/errorHandler');
const { dynamoDB, getTableName } = require('../../src/config/aws');
const { v4: uuidv4 } = require('uuid');

// Mock external dependencies
jest.mock('../../src/config/aws', () => ({
  dynamoDB: {
    put: jest.fn(),
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('Folder Controller', () => {
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
      send: jest.fn().mockReturnThis(), 
    };
    mockNext = jest.fn();

    uuidv4.mockReset();
    getTableName.mockClear();
    
    // Reset and provide default mock implementations for DynamoDB methods
    const mockPromise = jest.fn().mockResolvedValue({}); // Default to empty resolved promise
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        // Ensure each method returns an object with a promise function
        method.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      }
    });
  });

  // --- createFolder ---
  describe('createFolder', () => {
    it('should create a root folder successfully', async () => {
      mockReq.body = { name: 'My Root Folder' };
      uuidv4.mockReturnValue('folder-uuid-root');
      dynamoDB.put.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({}) }); // For the create operation

      await createFolder(mockReq, mockRes, mockNext);

      expect(uuidv4).toHaveBeenCalled();
      expect(getTableName).toHaveBeenCalledWith('folders');
      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({ id: 'folder-uuid-root', name: 'My Root Folder', parentId: null }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'folder-uuid-root' }) }));
    });

    it('should create a sub-folder successfully', async () => {
      mockReq.body = { name: 'My Subfolder', parentId: 'parent-id-123' };
      uuidv4.mockReturnValue('folder-uuid-sub');
      // Mock for parentId validation
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Item: { id: 'parent-id-123', userId: 'testUserId' } }) });
      dynamoDB.put.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({}) });


      await createFolder(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('folders'), Key: { id: 'parent-id-123' } });
      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({ id: 'folder-uuid-sub', name: 'My Subfolder', parentId: 'parent-id-123' }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if name is missing', async () => {
      mockReq.body = {};
      await createFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Folder name is required');
    });

    it('should return 404 if parentId is invalid', async () => {
      mockReq.body = { name: 'Sub', parentId: 'invalid-parent' };
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Item: null }) }); // Parent not found
      await createFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  // --- getFolders ---
  describe('getFolders', () => {
    it('should get root folders when parentId is "root"', async () => {
      mockReq.query = { parentId: 'root' };
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Items: [] }) });
      await getFolders(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: '(attribute_not_exists(parentId) OR parentId = :nullParentId)',
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
    
    it('should get sub-folders when parentId is provided', async () => {
      mockReq.query = { parentId: 'parent1' };
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Items: [] }) });
      await getFolders(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: 'parentId = :parentIdVal',
        ExpressionAttributeValues: expect.objectContaining({':parentIdVal': 'parent1'})
      }));
    });

    it('should handle pagination for getFolders', async () => {
      const startKey = { id: 'lastFolderId', userId: 'testUserId' };
      const encodedStartKey = encodeURIComponent(JSON.stringify(startKey));
      mockReq.query = { limit: '5', exclusiveStartKey: encodedStartKey };
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null }) });

      await getFolders(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ ExclusiveStartKey: startKey, Limit: 5 }));
    });
  });

  // --- getFolderById ---
  describe('getFolderById', () => {
    it('should get a folder successfully', async () => {
      mockReq.params.id = 'folder1';
      const mockFolder = { id: 'folder1', userId: 'testUserId', name: 'Folder 1' };
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Item: mockFolder }) });
      await getFolderById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('folders'), Key: { id: 'folder1' } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockFolder });
    });
    // Add tests for not found and unauthorized
  });

  // --- updateFolder ---
  describe('updateFolder', () => {
    const folderId = 'folderToUpdate';
    const currentFolder = { id: folderId, userId: 'testUserId', name: 'Original Name' };
    beforeEach(() => {
      mockReq.params.id = folderId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: currentFolder }) });
    });

    it('should update folder name successfully', async () => {
      mockReq.body = { name: 'Updated Name' };
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Attributes: { ...currentFolder, name: 'Updated Name' } }) });
      await updateFolder(mockReq, mockRes, mockNext);
      expect(dynamoDB.update).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Updated Name' } }));
    });
    
    it('should prevent self-parenting', async () => {
      mockReq.body = { parentId: folderId };
      await updateFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Cannot set a folder as its own parent');
    });
  });

  // --- deleteFolder ---
  describe('deleteFolder', () => {
    const folderId = 'emptyFolderToDelete';
    const folderToDelete = { id: folderId, userId: 'testUserId', name: 'Empty Folder' };
    beforeEach(() => {
      mockReq.params.id = folderId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: folderToDelete }) });
    });

    it('should delete an empty folder successfully', async () => {
      // Mock check for sub-folders (empty)
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
      // Mock check for files (empty)
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({}) });

      await deleteFolder(mockReq, mockRes, mockNext);
      expect(dynamoDB.delete).toHaveBeenCalledWith({ TableName: expect.stringContaining('folders'), Key: { id: folderId } });
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('should return 400 if folder contains sub-folders', async () => {
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Items: [{ id: 'sub1', userId: 'testUserId' }] }) }); // Has sub-folders
      await deleteFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('sub-folders');
    });

    it('should return 400 if folder contains files', async () => {
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Items: [] }) }); // No sub-folders
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Items: [{ id: 'file1', userId: 'testUserId' }] }) }); // Has files
      await deleteFolder(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('files');
    });
  });

  // --- getFilesInFolder ---
  describe('getFilesInFolder', () => {
    const folderId = 'folderWithFiles';
    const existingFolder = { id: folderId, userId: 'testUserId', name: 'My Docs' };
    beforeEach(() => {
      mockReq.params.id = folderId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingFolder }) });
    });

    it('should get files in folder successfully', async () => {
      const mockFiles = [{ id: 'file1', name: 'Doc1.pdf', folderId: folderId, userId: 'testUserId' }];
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({ Items: mockFiles }) });
      await getFilesInFolder(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('files'),
        IndexName: 'folderId-index',
        KeyConditionExpression: 'folderId = :folderId',
        FilterExpression: 'userId = :userId',
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockFiles }));
    });
    
    it('should return 404 if folder for getFilesInFolder not found', async () => {
        dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: null }) });
        await getFilesInFolder(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });
});
