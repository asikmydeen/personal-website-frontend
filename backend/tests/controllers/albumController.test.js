const {
  createAlbum,
  getAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  getPhotosInAlbum,
} = require('../../src/controllers/albumController');
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
  },
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('Album Controller', () => {
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
    mockNext = jest.fn(); // For asyncHandler error handling

    // Reset all DynamoDB mocks
    dynamoDB.put().promise.mockReset();
    dynamoDB.query().promise.mockReset();
    dynamoDB.get().promise.mockReset();
    dynamoDB.update().promise.mockReset();
    dynamoDB.delete().promise.mockReset();
    
    // Reset uuid mock
    uuidv4.mockReset();
    // Reset getTableName mock calls
    getTableName.mockClear();
  });

  // --- createAlbum ---
  describe('createAlbum', () => {
    it('should create an album successfully and return 201', async () => {
      const mockAlbumId = 'mockAlbumId';
      uuidv4.mockReturnValue(mockAlbumId);
      mockReq.body = { name: 'Summer Vacation', description: 'Photos from summer 2023' };
      dynamoDB.put().promise.mockResolvedValueOnce({});

      await createAlbum(mockReq, mockRes, mockNext);

      expect(uuidv4).toHaveBeenCalled();
      expect(getTableName).toHaveBeenCalledWith('albums');
      expect(dynamoDB.put).toHaveBeenCalledWith({
        TableName: expect.stringContaining('albums'),
        Item: expect.objectContaining({
          id: mockAlbumId,
          userId: 'testUserId',
          name: 'Summer Vacation',
          description: 'Photos from summer 2023',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: mockAlbumId, name: 'Summer Vacation' }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if album name is missing', async () => {
      mockReq.body = { description: 'An album without a name' };
      await createAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Album name is required');
    });

    it('should handle DynamoDB put errors during album creation', async () => {
      uuidv4.mockReturnValue('some-uuid');
      mockReq.body = { name: 'Test Album' };
      const dbError = new Error('DynamoDB put error');
      dynamoDB.put().promise.mockRejectedValueOnce(dbError);
      await createAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  // --- getAlbums ---
  describe('getAlbums', () => {
    it('should get albums for a user successfully', async () => {
      const mockAlbums = [{ id: 'album1', name: 'Album 1' }];
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: mockAlbums, LastEvaluatedKey: null });
      mockReq.query = { limit: '10' };

      await getAlbums(mockReq, mockRes, mockNext);

      expect(getTableName).toHaveBeenCalledWith('albums');
      expect(dynamoDB.query).toHaveBeenCalledWith({
        TableName: expect.stringContaining('albums'),
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': 'testUserId' },
        ScanIndexForward: false,
        Limit: 10,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlbums,
        lastEvaluatedKey: null,
      });
    });

    it('should handle pagination for getAlbums', async () => {
      const startKey = { id: 'lastAlbumId', userId: 'testUserId' };
      const encodedStartKey = encodeURIComponent(JSON.stringify(startKey));
      mockReq.query = { limit: '5', exclusiveStartKey: encodedStartKey };
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });

      await getAlbums(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ ExclusiveStartKey: startKey }));
    });
    
    it('should return 400 for invalid exclusiveStartKey in getAlbums', async () => {
        mockReq.query = { exclusiveStartKey: 'invalidKey' };
        await getAlbums(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Invalid exclusiveStartKey format');
    });
  });

  // --- getAlbumById ---
  describe('getAlbumById', () => {
    it('should get an album by ID successfully', async () => {
      const mockAlbum = { id: 'album123', userId: 'testUserId', name: 'My Album' };
      mockReq.params.id = 'album123';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: mockAlbum });

      await getAlbumById(mockReq, mockRes, mockNext);

      expect(getTableName).toHaveBeenCalledWith('albums');
      expect(dynamoDB.get).toHaveBeenCalledWith({
        TableName: expect.stringContaining('albums'),
        Key: { id: 'album123' },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockAlbum });
    });

    it('should return 404 if album not found', async () => {
      mockReq.params.id = 'nonExistentId';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });
      await getAlbumById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Album not found');
    });

    it('should return 404 if album belongs to another user', async () => {
      const mockAlbum = { id: 'album123', userId: 'anotherUserId', name: 'Secret Album' };
      mockReq.params.id = 'album123';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: mockAlbum });
      await getAlbumById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Album not found or not authorized');
    });
  });

  // --- updateAlbum ---
  describe('updateAlbum', () => {
    const albumId = 'albumToUpdate';
    const currentAlbum = { id: albumId, userId: 'testUserId', name: 'Old Name', description: 'Old Desc' };

    beforeEach(() => {
        mockReq.params.id = albumId;
    });

    it('should update an album successfully', async () => {
      mockReq.body = { name: 'New Name', description: 'New Desc' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentAlbum });
      const updatedAttributes = { ...currentAlbum, ...mockReq.body, updatedAt: expect.any(String) };
      dynamoDB.update().promise.mockResolvedValueOnce({ Attributes: updatedAttributes });

      await updateAlbum(mockReq, mockRes, mockNext);
      
      expect(getTableName).toHaveBeenCalledWith('albums');
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('albums'), Key: { id: albumId } });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        Key: { id: albumId },
        UpdateExpression: 'SET #n = :name, #d = :description, #ua = :updatedAt',
        ExpressionAttributeNames: {'#n': 'name', '#d': 'description', '#ua': 'updatedAt'},
        ExpressionAttributeValues: expect.objectContaining({ ':name': 'New Name', ':description': 'New Desc' }),
        ReturnValues: 'ALL_NEW',
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedAttributes });
    });

    it('should return 404 if album to update is not found', async () => {
      mockReq.body = { name: 'New Name' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });
      await updateAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('should return 403 if user is not authorized to update album', async () => {
      mockReq.body = { name: 'New Name' };
      const otherUserAlbum = { ...currentAlbum, userId: 'anotherUserId' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: otherUserAlbum });
      await updateAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });
    
    it('should return 200 with current item if no fields to update are provided', async () => {
        mockReq.body = {}; // No update fields
        dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentAlbum });

        await updateAlbum(mockReq, mockRes, mockNext);

        expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('albums'), Key: { id: albumId } });
        expect(dynamoDB.update).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: currentAlbum,
            message: 'No fields to update',
        });
    });
  });

  // --- deleteAlbum ---
  describe('deleteAlbum', () => {
    const albumId = 'albumToDelete';
    const currentAlbum = { id: albumId, userId: 'testUserId', name: 'To Be Deleted' };
    beforeEach(() => {
        mockReq.params.id = albumId;
    });

    it('should delete an album successfully', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentAlbum });
      dynamoDB.delete().promise.mockResolvedValueOnce({});

      await deleteAlbum(mockReq, mockRes, mockNext);

      expect(getTableName).toHaveBeenCalledWith('albums');
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('albums'), Key: { id: albumId } });
      expect(dynamoDB.delete).toHaveBeenCalledWith({ TableName: expect.stringContaining('albums'), Key: { id: albumId } });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: null });
    });

    it('should return 404 if album to delete is not found', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });
      await deleteAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('should return 403 if user is not authorized to delete album', async () => {
      const otherUserAlbum = { ...currentAlbum, userId: 'anotherUserId' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: otherUserAlbum });
      await deleteAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  // --- getPhotosInAlbum ---
  describe('getPhotosInAlbum', () => {
    const albumId = 'album123';
    const existingAlbum = { id: albumId, userId: 'testUserId', name: 'My Photos Album' };

    beforeEach(() => {
        mockReq.params.id = albumId;
    });

    it('should get photos in an album successfully', async () => {
      const mockPhotos = [{ id: 'photo1', albumId: albumId, url: 'url1' }];
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: existingAlbum }); // Album check
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: mockPhotos, LastEvaluatedKey: null }); // Photos query
      mockReq.query = { limit: '10' };

      await getPhotosInAlbum(mockReq, mockRes, mockNext);
      
      expect(getTableName).toHaveBeenCalledWith('albums'); // For album check
      expect(getTableName).toHaveBeenCalledWith('photos'); // For photos query
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.stringContaining('albums'), Key: { id: albumId } });
      expect(dynamoDB.query).toHaveBeenCalledWith({
        TableName: expect.stringContaining('photos'),
        IndexName: 'albumId-index',
        KeyConditionExpression: 'albumId = :albumId',
        ExpressionAttributeValues: { ':albumId': albumId },
        Limit: 10,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockPhotos, lastEvaluatedKey: null });
    });

    it('should return empty array if album has no photos', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: existingAlbum });
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });
      await getPhotosInAlbum(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
    });
    
    it('should return 404 if album not found before querying photos', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null }); // Album not found
      await getPhotosInAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Album not found');
      expect(dynamoDB.query).not.toHaveBeenCalled(); // Should not query photos
    });

    it('should return 404 if album not authorized before querying photos', async () => {
      const otherUserAlbum = { ...existingAlbum, userId: 'anotherUserId' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: otherUserAlbum }); // Album owned by someone else
      await getPhotosInAlbum(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Album not found or not authorized');
      expect(dynamoDB.query).not.toHaveBeenCalled();
    });

    it('should handle pagination for getPhotosInAlbum', async () => {
      const startKey = { id: 'lastPhotoId', albumId: albumId }; // Example key
      const encodedStartKey = encodeURIComponent(JSON.stringify(startKey));
      mockReq.query = { limit: '5', exclusiveStartKey: encodedStartKey };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: existingAlbum });
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });

      await getPhotosInAlbum(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ ExclusiveStartKey: startKey }));
    });

    it('should return 400 for invalid exclusiveStartKey in getPhotosInAlbum', async () => {
        mockReq.query = { exclusiveStartKey: 'invalidKey' };
        dynamoDB.get().promise.mockResolvedValueOnce({ Item: existingAlbum });
        await getPhotosInAlbum(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Invalid exclusiveStartKey format for photos');
    });
  });
});
