const {
  createBookmark,
  getBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
  getBookmarksByTag,
} = require('../../src/controllers/bookmarkController');
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
    scan: jest.fn(() => ({ promise: jest.fn() })), // Added scan mock
  },
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('Bookmark Controller', () => {
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

    // Reset all DynamoDB mocks
    dynamoDB.put().promise.mockReset();
    dynamoDB.query().promise.mockReset();
    dynamoDB.get().promise.mockReset();
    dynamoDB.update().promise.mockReset();
    dynamoDB.delete().promise.mockReset();
    dynamoDB.scan().promise.mockReset(); // Reset scan mock
    
    uuidv4.mockReset();
    getTableName.mockClear();
  });

  // --- createBookmark ---
  describe('createBookmark', () => {
    it('should create a bookmark successfully and return 201', async () => {
      const mockBookmarkId = 'mockBookmarkId';
      uuidv4.mockReturnValue(mockBookmarkId);
      mockReq.body = { url: 'https://example.com', title: 'Example', folderId: 'folder1' };
      dynamoDB.put().promise.mockResolvedValueOnce({});

      await createBookmark(mockReq, mockRes, mockNext);

      expect(uuidv4).toHaveBeenCalled();
      expect(getTableName).toHaveBeenCalledWith('bookmarks');
      expect(dynamoDB.put).toHaveBeenCalledWith({
        TableName: expect.stringContaining('bookmarks'),
        Item: expect.objectContaining({
          id: mockBookmarkId,
          userId: 'testUserId',
          url: 'https://example.com',
          title: 'Example',
          folderId: 'folder1',
          tags: [],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: mockBookmarkId, url: 'https://example.com' }),
      });
    });

    it('should return 400 if URL is missing', async () => {
      mockReq.body = { title: 'No URL' };
      await createBookmark(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Bookmark URL is required');
    });

    it('should return 400 if URL is invalid', async () => {
      mockReq.body = { url: 'not-a-valid-url', title: 'Invalid URL' };
      await createBookmark(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid URL format');
    });
  });

  // --- getBookmarks ---
  describe('getBookmarks', () => {
    it('should get bookmarks for a user successfully (no folderId)', async () => {
      const mockBookmarks = [{ id: 'bm1', url: 'https://site1.com' }];
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: mockBookmarks, LastEvaluatedKey: null });
      mockReq.query = { limit: '10' };

      await getBookmarks(mockReq, mockRes, mockNext);

      expect(getTableName).toHaveBeenCalledWith('bookmarks');
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('bookmarks'),
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': 'testUserId' },
        Limit: 10,
        FilterExpression: undefined // No folderId filter
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockBookmarks, lastEvaluatedKey: null });
    });

    it('should filter by folderId if provided', async () => {
      mockReq.query = { folderId: 'folder123' };
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });
      await getBookmarks(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: 'folderId = :folderId',
        ExpressionAttributeValues: expect.objectContaining({ ':folderId': 'folder123' }),
      }));
    });

    it('should filter for "no folder" if folderId is "null"', async () => {
      mockReq.query = { folderId: 'null' };
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });
      await getBookmarks(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: 'attribute_not_exists(folderId) OR folderId = :nullFolderId',
        ExpressionAttributeValues: expect.objectContaining({ ':nullFolderId': null }),
      }));
    });
     it('should handle pagination for getBookmarks', async () => {
      const startKey = { id: 'lastBookmarkId', userId: 'testUserId' };
      const encodedStartKey = encodeURIComponent(JSON.stringify(startKey));
      mockReq.query = { limit: '5', exclusiveStartKey: encodedStartKey };
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });

      await getBookmarks(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ ExclusiveStartKey: startKey }));
    });
  });

  // --- getBookmarkById ---
  describe('getBookmarkById', () => {
    it('should get a bookmark by ID successfully', async () => {
      const mockBookmark = { id: 'bm123', userId: 'testUserId', url: 'https://test.com' };
      mockReq.params.id = 'bm123';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: mockBookmark });
      await getBookmarkById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('bookmarks'), Key: { id: 'bm123' } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockBookmark });
    });

    it('should return 404 if bookmark not found', async () => {
      mockReq.params.id = 'nonExistentId';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });
      await getBookmarkById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('should return 404 if bookmark belongs to another user', async () => {
      const mockBookmark = { id: 'bm123', userId: 'anotherUserId' };
      mockReq.params.id = 'bm123';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: mockBookmark });
      await getBookmarkById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  // --- updateBookmark ---
  describe('updateBookmark', () => {
    const bookmarkId = 'bmToUpdate';
    const currentBookmark = { id: bookmarkId, userId: 'testUserId', url: 'https://original.com', title: 'Original' };

    beforeEach(() => { mockReq.params.id = bookmarkId; });

    it('should update a bookmark successfully', async () => {
      mockReq.body = { url: 'https://updated.com', title: 'Updated' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentBookmark });
      const updatedAttrs = { ...currentBookmark, ...mockReq.body, updatedAt: expect.any(String) };
      dynamoDB.update().promise.mockResolvedValueOnce({ Attributes: updatedAttrs });

      await updateBookmark(mockReq, mockRes, mockNext);

      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        Key: { id: bookmarkId },
        UpdateExpression: expect.stringContaining('SET #url = :url, #title = :title'),
        ExpressionAttributeValues: expect.objectContaining({ ':url': 'https://updated.com', ':title': 'Updated' }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedAttrs });
    });
    
    it('should return 400 if updated URL is invalid', async () => {
      mockReq.body = { url: 'invalid-update-url' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentBookmark });
      await updateBookmark(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid URL format');
    });

    it('should return 404 if bookmark to update is not found', async () => {
      mockReq.body = { title: 'New Title' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });
      await updateBookmark(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
    
    it('should return 403 if user is not authorized to update', async () => {
      mockReq.body = { title: 'New Title' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: {...currentBookmark, userId: 'otherUser'} });
      await updateBookmark(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  // --- deleteBookmark ---
  describe('deleteBookmark', () => {
    const bookmarkId = 'bmToDelete';
    const currentBookmark = { id: bookmarkId, userId: 'testUserId', url: 'https://delete.me' };
    beforeEach(() => { mockReq.params.id = bookmarkId; });

    it('should delete a bookmark successfully', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentBookmark });
      dynamoDB.delete().promise.mockResolvedValueOnce({});
      await deleteBookmark(mockReq, mockRes, mockNext);
      expect(dynamoDB.delete).toHaveBeenCalledWith({ TableName: expect.stringContaining('bookmarks'), Key: { id: bookmarkId } });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: null });
    });
  });

  // --- searchBookmarks ---
  describe('searchBookmarks', () => {
    it('should search bookmarks successfully', async () => {
      mockReq.query = { q: 'test', limit: '10' };
      const mockResults = [{ id: 'bmSearch1' }];
      dynamoDB.scan().promise.mockResolvedValueOnce({ Items: mockResults, LastEvaluatedKey: null });
      await searchBookmarks(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('bookmarks'),
        FilterExpression: expect.stringContaining('userId = :userId AND ('),
        ExpressionAttributeValues: expect.objectContaining({ ':userId': 'testUserId', ':q': 'test', ':q_tag': 'test' }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockResults, lastEvaluatedKey: null });
    });
    
    it('should return 400 if search query q is missing', async () => {
      mockReq.query = {};
      await searchBookmarks(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Search query (q) is required');
    });
  });

  // --- getBookmarksByTag ---
  describe('getBookmarksByTag', () => {
    it('should get bookmarks by tag successfully', async () => {
      mockReq.query = { tag: 'travel', limit: '5' };
      const mockResults = [{ id: 'bmTag1' }];
      dynamoDB.scan().promise.mockResolvedValueOnce({ Items: mockResults, LastEvaluatedKey: null });
      await getBookmarksByTag(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('bookmarks'),
        FilterExpression: 'userId = :userId AND contains(#tags, :tag)',
        ExpressionAttributeValues: { ':userId': 'testUserId', ':tag': 'travel' },
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockResults, lastEvaluatedKey: null });
    });
    
    it('should return 400 if tag is missing for getBookmarksByTag', async () => {
      mockReq.query = {};
      await getBookmarksByTag(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Tag query parameter is required');
    });
  });
});
