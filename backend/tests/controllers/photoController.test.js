const {
  initiatePhotoUpload,
  finalizePhotoUpload,
  getPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  searchPhotos,
  getPhotosByTag,
  // Add other photo controller functions here if they exist
} = require('../../src/controllers/photoController');
const { AppError } = require('../../src/middleware/errorHandler');
const { dynamoDB, s3, getTableName, getBucketName } = require('../../src/config/aws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Mock external dependencies
jest.mock('../../src/config/aws', () => ({
  dynamoDB: {
    put: jest.fn(),
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    scan: jest.fn(),
  },
  s3: {
    createPresignedPost: jest.fn(),
    getSignedUrlPromise: jest.fn(),
    deleteObject: jest.fn(),
    headObject: jest.fn(),
  },
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
  getBucketName: jest.fn(() => 'test-bucket-name'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    basename: jest.fn(filename => originalPath.basename(filename)),
    // Mock other path functions if needed by photoController
  };
});


describe('Photo Controller', () => {
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
    getBucketName.mockClear();
    if (path.basename.mockClear) { // Ensure path.basename is a mock function before clearing
        path.basename.mockClear();
    }
    // Clear other path mocks if added

    // Reset and provide default mock implementations for DynamoDB and S3 methods
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      }
    });
    
    s3.createPresignedPost.mockImplementation((params, callback) => callback(null, { url: 'presigned-post-url', fields: {} }));
    s3.getSignedUrlPromise.mockResolvedValue('presigned-get-url');
    s3.deleteObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    s3.headObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
  });

  // Test suites for photoController functions will go here
  // e.g., describe('initiatePhotoUpload', () => { ... });

  // --- initiatePhotoUpload ---
  describe('initiatePhotoUpload', () => {
    const mockPhotoId = 'photo-uuid-123';
    const mockFileName = 'test-image.jpg';
    const mockContentType = 'image/jpeg';
    const mockUserId = 'testUserId';
    const mockPresignedPostData = { url: 's3-presigned-post-url', fields: { key: 'value' } };
    const MAX_PHOTO_SIZE_MB = 50; // From controller
    const PRESIGNED_POST_EXPIRES_IN = 300; // From controller

    beforeEach(() => {
      mockReq.body = {
        fileName: mockFileName,
        contentType: mockContentType,
      };
      uuidv4.mockReturnValue(mockPhotoId);
      path.basename.mockImplementation(filename => filename); // Simple mock, assuming sanitizeFilename works primarily off basename
      getTableName.mockImplementation(tableName => `dev-${tableName}`); // Consistent with controller and typical setup
      getBucketName.mockReturnValue('test-bucket-name'); // Consistent with existing mocks

      // Default success for S3 presigned post
      s3.createPresignedPost.mockImplementation((params, callback) => callback(null, mockPresignedPostData));
      // Default success for dynamoDB.put
      dynamoDB.put.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      // Default success for dynamoDB.get (for album checks) - can be overridden per test
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: { id: 'anyAlbum', userId: mockUserId } }) });
    });

    it('should successfully initiate photo upload (no albumId)', async () => {
      await initiatePhotoUpload(mockReq, mockRes, mockNext);

      const expectedS3Key = `photos/${mockUserId}/user-root-photos/${mockPhotoId}-${mockFileName}`;

      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        Item: expect.objectContaining({
          id: mockPhotoId,
          userId: mockUserId,
          originalFileName: mockFileName,
          contentType: mockContentType,
          s3Key: expectedS3Key,
          albumId: null,
          uploadStatus: 'pending',
          tags: [],
          caption: null,
          location: null,
          dateTaken: null,
        }),
      }));
      expect(s3.createPresignedPost).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket-name',
          Fields: {
            key: expectedS3Key,
            'Content-Type': mockContentType,
          },
          Conditions: [
            ['content-length-range', 0, MAX_PHOTO_SIZE_MB * 1024 * 1024],
            { 'Content-Type': mockContentType },
          ],
          Expires: PRESIGNED_POST_EXPIRES_IN,
        }),
        expect.any(Function)
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Upload initiated. Use the presignedPostData to upload the photo.',
        photoId: mockPhotoId,
        presignedPostData: mockPresignedPostData,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully initiate photo upload (with valid albumId)', async () => {
      const mockAlbumId = 'album-xyz-789';
      mockReq.body.albumId = mockAlbumId;
      dynamoDB.get.mockReturnValueOnce({ // For album validation
        promise: jest.fn().mockResolvedValue({ Item: { id: mockAlbumId, userId: mockUserId } }),
      });

      await initiatePhotoUpload(mockReq, mockRes, mockNext);

      const expectedS3Key = `photos/${mockUserId}/${mockAlbumId}/${mockPhotoId}-${mockFileName}`;

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-albums', Key: { id: mockAlbumId } });
      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        Item: expect.objectContaining({
          id: mockPhotoId,
          albumId: mockAlbumId,
          s3Key: expectedS3Key,
        }),
      }));
      expect(s3.createPresignedPost).toHaveBeenCalledWith(
        expect.objectContaining({ Fields: expect.objectContaining({ key: expectedS3Key }) }),
        expect.any(Function)
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ photoId: mockPhotoId }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if fileName is missing', async () => {
      mockReq.body = { contentType: mockContentType }; // fileName is missing
      await initiatePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('fileName and contentType are required.');
    });

    it('should return 400 if contentType is missing', async () => {
      mockReq.body = { fileName: mockFileName }; // contentType is missing
      await initiatePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('fileName and contentType are required.');
    });
    
    it('should return 400 for invalid contentType', async () => {
      mockReq.body.contentType = 'application/pdf'; // Invalid type
      await initiatePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toMatch(/Invalid contentType/);
    });

    it('should return 404 if albumId is provided but album not found', async () => {
      const nonExistentAlbumId = 'non-existent-album';
      mockReq.body.albumId = nonExistentAlbumId;
      dynamoDB.get.mockReturnValueOnce({ // For album validation
        promise: jest.fn().mockResolvedValue({ Item: null }),
      });

      await initiatePhotoUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-albums', Key: { id: nonExistentAlbumId } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Album not found or not authorized.');
    });

    it('should return 404 if albumId is provided but album belongs to another user', async () => {
      const otherUserAlbumId = 'other-user-album';
      mockReq.body.albumId = otherUserAlbumId;
      dynamoDB.get.mockReturnValueOnce({ // For album validation
        promise: jest.fn().mockResolvedValue({ Item: { id: otherUserAlbumId, userId: 'anotherUserId123' } }),
      });

      await initiatePhotoUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-albums', Key: { id: otherUserAlbumId } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Album not found or not authorized.');
    });

    it('should return 500 if S3 createPresignedPost fails', async () => {
      const s3Error = new Error('S3 Upload Error');
      s3.createPresignedPost.mockImplementationOnce((params, callback) => callback(s3Error, null));

      await initiatePhotoUpload(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
      expect(mockNext.mock.calls[0][0].message).toBe('Failed to initiate photo upload.');
    });
  });

  // --- finalizePhotoUpload ---
  describe('finalizePhotoUpload', () => {
    const mockPhotoId = 'photo-to-finalize-123';
    const mockUserId = 'testUserId';
    const mockS3Key = `photos/${mockUserId}/user-root-photos/${mockPhotoId}-test.jpg`;
    let existingPendingPhotoItem;

    beforeEach(() => {
      mockReq.params.id = mockPhotoId;
      mockReq.user.id = mockUserId;

      existingPendingPhotoItem = {
        id: mockPhotoId,
        userId: mockUserId,
        s3Key: mockS3Key,
        uploadStatus: 'pending',
        originalFileName: 'test.jpg',
        contentType: 'image/jpeg',
        albumId: null,
        tags: [],
        caption: null,
        location: null,
        dateTaken: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Default mocks - can be overridden per test
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingPendingPhotoItem }) });
      s3.headObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }); // S3 file exists
      dynamoDB.update.mockReturnValue({ 
        promise: jest.fn().mockResolvedValue({ 
          Attributes: { ...existingPendingPhotoItem, uploadStatus: 'completed', fileSize: 1024 } 
        }) 
      });
      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully finalize photo upload (fileSize only)', async () => {
      mockReq.body = { fileSize: 1024 };
      const updatedAttributes = { ...existingPendingPhotoItem, uploadStatus: 'completed', fileSize: 1024, updatedAt: expect.any(String) };
      dynamoDB.update.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Attributes: updatedAttributes }) });

      await finalizePhotoUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(s3.headObject).toHaveBeenCalledWith({ Bucket: 'test-bucket-name', Key: mockS3Key });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        Key: { id: mockPhotoId },
        UpdateExpression: expect.stringContaining('SET #uploadStatus = :completedStatus, #fileSize = :fileSize, #updatedAt = :updatedAt'),
        ExpressionAttributeNames: expect.objectContaining({
            '#uploadStatus': 'uploadStatus',
            '#fileSize': 'fileSize',
            '#updatedAt': 'updatedAt'
        }),
        ExpressionAttributeValues: expect.objectContaining({
            ':completedStatus': 'completed',
            ':fileSize': 1024,
            ':updatedAt': expect.any(String),
        }),
        ReturnValues: 'ALL_NEW',
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Photo upload finalized.',
        data: updatedAttributes,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully finalize photo upload with width and height', async () => {
      mockReq.body = { fileSize: 2048, width: 800, height: 600 };
      const updatedAttributes = { 
        ...existingPendingPhotoItem, 
        uploadStatus: 'completed', 
        fileSize: 2048, 
        width: 800, 
        height: 600,
        updatedAt: expect.any(String) 
      };
      dynamoDB.update.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Attributes: updatedAttributes }) });
      
      await finalizePhotoUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: expect.stringContaining('#width = :width, #height = :height'),
        ExpressionAttributeNames: expect.objectContaining({
            '#width': 'width',
            '#height': 'height'
        }),
        ExpressionAttributeValues: expect.objectContaining({
            ':width': 800,
            ':height': 600
        }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: updatedAttributes }));
    });

    it('should return 400 if fileSize is missing', async () => {
      mockReq.body = {}; // Missing fileSize
      await finalizePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('fileSize is required to finalize.');
    });

    it('should return 400 for invalid fileSize (not a number)', async () => {
      mockReq.body = { fileSize: 'invalid' };
      await finalizePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid fileSize.');
    });
    
    it('should return 400 for invalid fileSize (negative)', async () => {
        mockReq.body = { fileSize: -100 };
        await finalizePhotoUpload(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Invalid fileSize.');
    });

    it('should return 400 for invalid width (if provided)', async () => {
      mockReq.body = { fileSize: 1024, width: 'invalid' };
      await finalizePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid width or height. Must be numbers.');
    });

    it('should return 400 for invalid height (if provided)', async () => {
        mockReq.body = { fileSize: 1024, height: 'invalid' };
        await finalizePhotoUpload(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Invalid width or height. Must be numbers.');
    });

    it('should return 404 if photo not found in DynamoDB', async () => {
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: null }) });
      mockReq.body = { fileSize: 1024 };
      await finalizePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Photo not found.');
    });

    it('should return 403 if user not authorized (photo belongs to another user)', async () => {
      const otherUserPhoto = { ...existingPendingPhotoItem, userId: 'anotherUserId456' };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: otherUserPhoto }) });
      mockReq.body = { fileSize: 1024 };
      await finalizePhotoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
      expect(mockNext.mock.calls[0][0].message).toBe('Not authorized to finalize this photo.');
    });

    it('should return 404 if S3 headObject fails (file not found in S3)', async () => {
      s3.headObject.mockReturnValueOnce({ promise: jest.fn().mockRejectedValue(new Error('S3 Not Found')) });
      mockReq.body = { fileSize: 1024 };
      await finalizePhotoUpload(mockReq, mockRes, mockNext);
      expect(s3.headObject).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('File not found in storage. Upload may have failed or is still in progress.');
    });

    it('should return 200 if photo already finalized', async () => {
      const alreadyFinalizedPhoto = { ...existingPendingPhotoItem, uploadStatus: 'completed', fileSize: 512 };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: alreadyFinalizedPhoto }) });
      mockReq.body = { fileSize: 1024 }; // Body might be sent, but shouldn't be used to update

      await finalizePhotoUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(s3.headObject).not.toHaveBeenCalled();
      expect(dynamoDB.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Photo already finalized.',
        data: alreadyFinalizedPhoto,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- getPhotos ---
  describe('getPhotos', () => {
    const mockUserId = 'testUserId';
    const mockPhotoItems = [
      { id: 'photo1', userId: mockUserId, s3Key: 'key1.jpg', uploadStatus: 'completed', albumId: 'albumA' },
      { id: 'photo2', userId: mockUserId, s3Key: 'key2.png', uploadStatus: 'completed', albumId: null }, // Root photo
    ];
    const mockPresignedUrlBase = 'https://s3.amazonaws.com/test-bucket-name/';

    beforeEach(() => {
      mockReq.user.id = mockUserId;
      // Default mock for dynamoDB.query to return some items
      dynamoDB.query.mockReturnValue({ 
        promise: jest.fn().mockResolvedValue({ Items: mockPhotoItems, LastEvaluatedKey: null }) 
      });
      // Default mock for s3.getSignedUrlPromise
      s3.getSignedUrlPromise.mockImplementation((operation, params) => {
        if (operation === 'getObject') {
          return Promise.resolve(`${mockPresignedUrlBase}${params.Key}?sig=123`);
        }
        return Promise.reject(new Error('Mock S3 getSignedUrlPromise error'));
      });
      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully fetch photos (no albumId specified, all user photos)', async () => {
      await getPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: expect.objectContaining({
          ':userId': mockUserId,
          ':completed': 'completed',
        }),
        FilterExpression: 'uploadStatus = :completed', // Base filter
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(mockPhotoItems.length);
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', expect.objectContaining({ Key: 'key1.jpg', Bucket: 'test-bucket-name', Expires: 300 }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', expect.objectContaining({ Key: 'key2.png', Bucket: 'test-bucket-name', Expires: 300 }));
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'photo1', url: `${mockPresignedUrlBase}key1.jpg?sig=123` }),
          expect.objectContaining({ id: 'photo2', url: `${mockPresignedUrlBase}key2.png?sig=123` }),
        ]),
        lastEvaluatedKey: null,
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully fetch photos filtered by a valid albumId', async () => {
      const targetAlbumId = 'albumA';
      mockReq.query.albumId = targetAlbumId;
      const photosInAlbum = mockPhotoItems.filter(p => p.albumId === targetAlbumId);
      dynamoDB.query.mockReturnValueOnce({ 
        promise: jest.fn().mockResolvedValue({ Items: photosInAlbum, LastEvaluatedKey: null }) 
      });

      await getPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: 'uploadStatus = :completed AND albumId = :albumIdVal',
        ExpressionAttributeValues: expect.objectContaining({
          ':userId': mockUserId,
          ':completed': 'completed',
          ':albumIdVal': targetAlbumId,
        }),
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(photosInAlbum.length);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'photo1', albumId: targetAlbumId }),
        ]),
      }));
    });

    const rootAlbumIds = ['null', 'root', ''];
    rootAlbumIds.forEach(albumIdValue => {
      it(`should successfully fetch photos for 'root' album (albumId='${albumIdValue}')`, async () => {
        mockReq.query.albumId = albumIdValue;
        const rootPhotos = mockPhotoItems.filter(p => p.albumId === null);
         dynamoDB.query.mockReturnValueOnce({ 
            promise: jest.fn().mockResolvedValue({ Items: rootPhotos, LastEvaluatedKey: null }) 
        });

        await getPhotos(mockReq, mockRes, mockNext);

        expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
          FilterExpression: 'uploadStatus = :completed AND (attribute_not_exists(albumId) OR albumId = :nullAlbumId)',
          ExpressionAttributeValues: expect.objectContaining({
            ':userId': mockUserId,
            ':completed': 'completed',
            ':nullAlbumId': null,
          }),
        }));
        expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(rootPhotos.length);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.arrayContaining([
                expect.objectContaining({ id: 'photo2', albumId: null }),
            ]),
        }));
      });
    });

    it('should handle pagination with limit and exclusiveStartKey', async () => {
      const limit = 1;
      const exclusiveStartKeyObject = { id: 'photo1', userId: mockUserId, createdAt: new Date().toISOString() }; // Example key
      const encodedExclusiveStartKey = encodeURIComponent(JSON.stringify(exclusiveStartKeyObject));
      mockReq.query = { limit: String(limit), exclusiveStartKey: encodedExclusiveStartKey };
      
      const paginatedItems = [mockPhotoItems[1]]; // Assume photo1 was the last item of the previous page
      const lastEvaluatedKeyResponse = { id: 'photo2', userId: mockUserId, createdAt: new Date().toISOString() };
      const encodedLastEvaluatedKey = encodeURIComponent(JSON.stringify(lastEvaluatedKeyResponse));

      dynamoDB.query.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({ Items: paginatedItems, LastEvaluatedKey: lastEvaluatedKeyResponse }),
      });

      await getPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKeyObject, // Expect it to be parsed
        FilterExpression: 'uploadStatus = :completed', // Default filter when no albumId
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(paginatedItems.length);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ id: 'photo2' })]),
        lastEvaluatedKey: encodedLastEvaluatedKey,
      }));
    });

    it('should return 400 for invalid exclusiveStartKey format', async () => {
      mockReq.query.exclusiveStartKey = 'this Is Not!@#$ValidJSON';
      await getPhotos(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid exclusiveStartKey format');
    });

    it('should ensure only "completed" photos are queried from DynamoDB', async () => {
      // This is inherently tested by the default mock setup and other tests,
      // as dynamoDB.query is always expected to contain FilterExpression for 'uploadStatus = :completed'.
      // We can re-assert the base case:
      await getPhotos(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        ExpressionAttributeValues: expect.objectContaining({ ':completed': 'completed' }),
        FilterExpression: expect.stringContaining('uploadStatus = :completed'),
      }));
       expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return an empty array if no photos are found', async () => {
      dynamoDB.query.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
      await getPhotos(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        lastEvaluatedKey: null,
      }));
      expect(s3.getSignedUrlPromise).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- getPhotoById ---
  describe('getPhotoById', () => {
    const mockUserId = 'testUserId';
    const mockPhotoId = 'testPhotoId123';
    const mockS3Key = `photos/${mockUserId}/user-root-photos/${mockPhotoId}-image.jpg`;
    const mockPresignedUrl = 'https://s3.amazonaws.com/test-bucket-name/key1.jpg?sig=123';
    let mockCompletedPhotoItem;
    const PRESIGNED_URL_EXPIRES_IN = 300; // From controller

    beforeEach(() => {
      mockReq.user.id = mockUserId;
      mockReq.params.id = mockPhotoId;

      mockCompletedPhotoItem = {
        id: mockPhotoId,
        userId: mockUserId,
        s3Key: mockS3Key,
        uploadStatus: 'completed',
        originalFileName: 'image.jpg',
        contentType: 'image/jpeg',
        albumId: null,
        // other metadata...
      };

      // Default mocks - can be overridden per test
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: mockCompletedPhotoItem }) });
      s3.getSignedUrlPromise.mockResolvedValue(mockPresignedUrl);
      
      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully fetch a photo by ID with a presigned URL', async () => {
      await getPhotoById(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({
        TableName: 'dev-photos',
        Key: { id: mockPhotoId },
      });
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', {
        Bucket: 'test-bucket-name',
        Key: mockS3Key,
        Expires: PRESIGNED_URL_EXPIRES_IN,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockCompletedPhotoItem,
          url: mockPresignedUrl,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if photo not found in DynamoDB', async () => {
      mockReq.params.id = 'nonExistentPhotoId';
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: null }) });

      await getPhotoById(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: 'nonExistentPhotoId' } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Photo not found or not yet finalized.');
      expect(s3.getSignedUrlPromise).not.toHaveBeenCalled();
    });

    it('should return 404 if photo found but not finalized (uploadStatus !== "completed")', async () => {
      mockReq.params.id = 'pendingPhotoId';
      const pendingPhotoItem = { ...mockCompletedPhotoItem, id: 'pendingPhotoId', uploadStatus: 'pending' };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: pendingPhotoItem }) });

      await getPhotoById(mockReq, mockRes, mockNext);
      
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: 'pendingPhotoId' } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Photo not found or not yet finalized.');
      expect(s3.getSignedUrlPromise).not.toHaveBeenCalled();
    });

    it('should return 404 if user not authorized (photo belongs to another user)', async () => {
      mockReq.params.id = 'otherUserPhotoId';
      const otherUserPhotoItem = { 
        ...mockCompletedPhotoItem, 
        id: 'otherUserPhotoId', 
        userId: 'anotherUserId789', 
        uploadStatus: 'completed' 
      };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: otherUserPhotoItem }) });

      await getPhotoById(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: 'otherUserPhotoId' } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      // The controller checks userId *after* checking uploadStatus. If item exists & completed, then userId is checked.
      // The error message reflects this specific authorization failure.
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404); 
      expect(mockNext.mock.calls[0][0].message).toBe('Photo not found or not authorized.');
      expect(s3.getSignedUrlPromise).not.toHaveBeenCalled();
    });

    it('should return photo data with null URL if S3 getSignedUrlPromise fails (returns null)', async () => {
      // Simulate the helper generatePresignedGetUrlForPhoto returning null
      s3.getSignedUrlPromise.mockResolvedValueOnce(null); 

      await getPhotoById(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ Key: { id: mockPhotoId }, TableName: 'dev-photos' });
      expect(s3.getSignedUrlPromise).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockCompletedPhotoItem,
          url: null, // Expect URL to be null as per helper's error handling
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- updatePhoto ---
  describe('updatePhoto', () => {
    const mockUserId = 'testUserId';
    const mockPhotoId = 'testPhotoIdToUpdate';
    const mockS3Key = `photos/${mockUserId}/user-root-photos/${mockPhotoId}-original.jpg`;
    const mockPresignedUrl = 'https://s3.amazonaws.com/test-bucket-name/updated-photo.jpg?sig=456';
    let existingPhotoItem;
    const PRESIGNED_URL_EXPIRES_IN = 300; // From controller

    beforeEach(() => {
      mockReq.user.id = mockUserId;
      mockReq.params.id = mockPhotoId;

      existingPhotoItem = {
        id: mockPhotoId,
        userId: mockUserId,
        s3Key: mockS3Key,
        originalFileName: 'original.jpg',
        contentType: 'image/jpeg',
        albumId: null,
        tags: ['initial'],
        caption: 'Initial Caption',
        location: null,
        dateTaken: null,
        width: null,
        height: null,
        uploadStatus: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Default mocks - can be overridden per test
      // First dynamoDB.get is for fetching the photo to update
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingPhotoItem }) });
      // s3.getSignedUrlPromise for URL regeneration after update
      s3.getSignedUrlPromise.mockResolvedValue(mockPresignedUrl);
      // dynamoDB.update for the actual update operation
      dynamoDB.update.mockReturnValue({ 
        promise: jest.fn().mockResolvedValue({ Attributes: { ...existingPhotoItem } }) // Default to returning existing for simplicity
      });

      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully update multiple metadata fields', async () => {
      const newMetadata = {
        caption: 'Updated Caption',
        tags: ['updated', 'photo'],
        location: 'Updated Location',
        dateTaken: new Date().toISOString(),
        width: 1920,
        height: 1080,
      };
      mockReq.body = newMetadata;
      const expectedUpdatedAttrs = { 
        ...existingPhotoItem, 
        ...newMetadata, 
        updatedAt: expect.any(String), // Will be set by the controller
        url: mockPresignedUrl 
      };
      // Mock dynamoDB.update to return the accurately updated attributes
      dynamoDB.update.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Attributes: { ...existingPhotoItem, ...newMetadata, updatedAt: expectedUpdatedAttrs.updatedAt } }) });


      await updatePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        Key: { id: mockPhotoId },
        UpdateExpression: 'SET #caption = :caption, #tags = :tags, #location = :location, #dateTaken = :dateTaken, #width = :width, #height = :height, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#caption': 'caption',
          '#tags': 'tags',
          '#location': 'location',
          '#dateTaken': 'dateTaken',
          '#width': 'width',
          '#height': 'height',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':caption': newMetadata.caption,
          ':tags': newMetadata.tags,
          ':location': newMetadata.location,
          ':dateTaken': newMetadata.dateTaken,
          ':width': newMetadata.width,
          ':height': newMetadata.height,
          ':updatedAt': expect.any(String),
        },
        ReturnValues: 'ALL_NEW',
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', {
        Bucket: 'test-bucket-name',
        Key: mockS3Key,
        Expires: PRESIGNED_URL_EXPIRES_IN,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedUpdatedAttrs,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully move photo to a new valid albumId', async () => {
      const newAlbumId = 'album-new-valid';
      mockReq.body = { albumId: newAlbumId };

      // Mock for photo retrieval (already set up in beforeEach)
      // Mock for target album validation (dynamoDB.get called a second time)
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: existingPhotoItem }) }) // Photo
                     .mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: { id: newAlbumId, userId: mockUserId } }) }); // Album

      const updatedPhotoWithNewAlbum = { ...existingPhotoItem, albumId: newAlbumId, updatedAt: expect.any(String) };
      dynamoDB.update.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Attributes: updatedPhotoWithNewAlbum }) });
      
      await updatePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-albums', Key: { id: newAlbumId } });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: expect.stringContaining('#albumId = :albumId'),
        ExpressionAttributeValues: expect.objectContaining({ ':albumId': newAlbumId }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ albumId: newAlbumId, url: mockPresignedUrl }),
      }));
    });

    const rootAlbumValues = [null, ''];
    rootAlbumValues.forEach(albumValue => {
      it(`should successfully move photo to root (albumId: ${JSON.stringify(albumValue)})`, async () => {
        mockReq.body = { albumId: albumValue };
        
        const updatedPhotoAtRoot = { ...existingPhotoItem, albumId: null, updatedAt: expect.any(String) };
        dynamoDB.update.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Attributes: updatedPhotoAtRoot }) });

        await updatePhoto(mockReq, mockRes, mockNext);

        expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
        // No second call to dynamoDB.get for album validation when moving to root
        expect(dynamoDB.get).toHaveBeenCalledTimes(1); 
        expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
          UpdateExpression: expect.stringContaining('#albumId = :albumId'),
          ExpressionAttributeValues: expect.objectContaining({ ':albumId': null }),
        }));
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ albumId: null, url: mockPresignedUrl }),
        }));
      });
    });

    it('should return 404 if photo not found', async () => {
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: null }) }); // Photo not found
      mockReq.body = { caption: "New Caption" };
      await updatePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Photo not found.');
      expect(dynamoDB.update).not.toHaveBeenCalled();
    });

    it('should return 403 if user not authorized to update', async () => {
      const photoOfAnotherUser = { ...existingPhotoItem, userId: 'anotherUserId123' };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: photoOfAnotherUser }) });
      mockReq.body = { caption: "New Caption" };
      await updatePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
      expect(mockNext.mock.calls[0][0].message).toBe('Not authorized to update this photo.');
      expect(dynamoDB.update).not.toHaveBeenCalled();
    });

    it('should return 404 if target albumId for update is invalid/not found', async () => {
      const invalidAlbumId = 'album-does-not-exist';
      mockReq.body = { albumId: invalidAlbumId };
      // First get for photo is successful (from beforeEach)
      // Second get for album validation fails
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: existingPhotoItem }) }) // Photo
                     .mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: null }) }); // Album

      await updatePhoto(mockReq, mockRes, mockNext);
      
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-albums', Key: { id: invalidAlbumId } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Target album not found or not authorized.');
      expect(dynamoDB.update).not.toHaveBeenCalled();
    });

    it('should return 404 if target albumId belongs to another user', async () => {
      const otherUserAlbumId = 'album-of-other-user';
      mockReq.body = { albumId: otherUserAlbumId };
      // First get for photo is successful (from beforeEach)
      // Second get for album validation returns album of other user
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: existingPhotoItem }) }) // Photo
                     .mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: { id: otherUserAlbumId, userId: 'anotherUserId456' } }) }); // Album

      await updatePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-albums', Key: { id: otherUserAlbumId } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Target album not found or not authorized.');
      expect(dynamoDB.update).not.toHaveBeenCalled();
    });
    
    it('should return 200 with "No fields to update." if body is empty', async () => {
      mockReq.body = {}; // Empty body
      const expectedResponseData = { ...existingPhotoItem, url: mockPresignedUrl };
      
      await updatePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: mockPhotoId } });
      expect(dynamoDB.update).not.toHaveBeenCalled();
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', { Bucket: 'test-bucket-name', Key: mockS3Key, Expires: PRESIGNED_URL_EXPIRES_IN });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedResponseData,
        message: 'No fields to update.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- deletePhoto ---
  describe('deletePhoto', () => {
    const mockUserId = 'testUserId';
    let mockPhotoItemToDelete;

    beforeEach(() => {
      mockReq.user.id = mockUserId;
      
      mockPhotoItemToDelete = {
        id: 'testPhotoId',
        userId: mockUserId,
        s3Key: `photos/${mockUserId}/user-root-photos/testPhotoId-to-delete.jpg`,
        uploadStatus: 'completed',
      };

      // Default mocks - can be overridden per test
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: mockPhotoItemToDelete }) });
      s3.deleteObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });

      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully delete a photo (S3 and DynamoDB)', async () => {
      mockReq.params.id = 'testPhotoId';

      await deletePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: 'testPhotoId' } });
      expect(s3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket-name',
        Key: mockPhotoItemToDelete.s3Key,
      });
      expect(dynamoDB.delete).toHaveBeenCalledWith({
        TableName: 'dev-photos',
        Key: { id: 'testPhotoId' },
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if photo not found', async () => {
      mockReq.params.id = 'nonExistentPhotoId';
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: null }) });

      await deletePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: 'nonExistentPhotoId' } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
      expect(mockNext.mock.calls[0][0].message).toBe('Photo not found.');
      expect(s3.deleteObject).not.toHaveBeenCalled();
      expect(dynamoDB.delete).not.toHaveBeenCalled();
    });

    it('should return 403 if user not authorized to delete', async () => {
      mockReq.params.id = 'otherUserPhotoId';
      const photoOfAnotherUser = { 
        ...mockPhotoItemToDelete, 
        id: 'otherUserPhotoId', 
        userId: 'anotherUserId789' 
      };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: photoOfAnotherUser }) });

      await deletePhoto(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: 'dev-photos', Key: { id: 'otherUserPhotoId' } });
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
      expect(mockNext.mock.calls[0][0].message).toBe('Not authorized to delete this photo.');
      expect(s3.deleteObject).not.toHaveBeenCalled();
      expect(dynamoDB.delete).not.toHaveBeenCalled();
    });

    it('should still delete DynamoDB record and return 204 if S3 deleteObject fails', async () => {
      mockReq.params.id = 'testPhotoIdS3Fail';
      const photoS3Fail = { ...mockPhotoItemToDelete, id: 'testPhotoIdS3Fail' };
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: photoS3Fail }) });
      
      const s3Error = new Error('S3 Delete Error');
      s3.deleteObject.mockReturnValueOnce({ promise: jest.fn().mockRejectedValue(s3Error) });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await deletePhoto(mockReq, mockRes, mockNext);

      expect(s3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket-name',
        Key: photoS3Fail.s3Key,
      });
      expect(console.error).toHaveBeenCalledWith(
        `Failed to delete S3 object ${photoS3Fail.s3Key} for photo ${photoS3Fail.id}:`,
        s3Error
      );
      expect(dynamoDB.delete).toHaveBeenCalledWith({
        TableName: 'dev-photos',
        Key: { id: photoS3Fail.id },
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  // --- searchPhotos ---
  describe('searchPhotos', () => {
    const mockUserId = 'testUserId';
    const mockPresignedUrlBase = 'https://s3.amazonaws.com/test-bucket-name/';
    const PRESIGNED_URL_EXPIRES_IN = 300; // From controller

    beforeEach(() => {
      mockReq.user.id = mockUserId;
      
      // Default mock for dynamoDB.scan to return empty items
      dynamoDB.scan.mockReturnValue({ 
        promise: jest.fn().mockResolvedValue({ Items: [], LastEvaluatedKey: null }) 
      });
      // Default mock for s3.getSignedUrlPromise
      s3.getSignedUrlPromise.mockImplementation((operation, params) => {
        if (operation === 'getObject') {
          return Promise.resolve(`${mockPresignedUrlBase}${params.Key}?sig=search`);
        }
        return Promise.reject(new Error('Mock S3 getSignedUrlPromise error for search'));
      });
      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully search photos and return with presigned URLs', async () => {
      const searchQuery = 'beach';
      mockReq.query = { q: searchQuery };
      const searchResults = [
        { id: 'photo1', s3Key: 'key1-beach.jpg', caption: 'A day at the beach', uploadStatus: 'completed', userId: mockUserId, tags: ['summer', 'beach'] },
        { id: 'photo2', s3Key: 'key2-ocean.png', originalFileName: 'beach_sunset.png', uploadStatus: 'completed', userId: mockUserId, location: 'Beach City' }
      ];
      dynamoDB.scan.mockReturnValueOnce({ 
        promise: jest.fn().mockResolvedValue({ Items: searchResults, LastEvaluatedKey: null }) 
      });

      await searchPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith({
        TableName: 'dev-photos',
        FilterExpression: 'userId = :userId AND uploadStatus = :completed AND (' +
                          'contains(#caption, :q) OR ' +
                          'contains(#tags, :q_tag) OR ' + 
                          'contains(#location, :q) OR ' +
                          'contains(#originalFileName, :q)' +
                          ')',
        ExpressionAttributeNames: {
          '#caption': 'caption',
          '#tags': 'tags',
          '#location': 'location',
          '#originalFileName': 'originalFileName',
        },
        ExpressionAttributeValues: {
          ':userId': mockUserId,
          ':completed': 'completed',
          ':q': searchQuery, 
          ':q_tag': searchQuery, 
        },
      });
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(searchResults.length);
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', expect.objectContaining({ Key: 'key1-beach.jpg', Bucket: 'test-bucket-name', Expires: PRESIGNED_URL_EXPIRES_IN }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'photo1', url: `${mockPresignedUrlBase}key1-beach.jpg?sig=search` }),
          expect.objectContaining({ id: 'photo2', url: `${mockPresignedUrlBase}key2-ocean.png?sig=search` }),
        ]),
        lastEvaluatedKey: null,
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if search query q is missing', async () => {
      mockReq.query = {}; // No q parameter
      await searchPhotos(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Search query (q) is required');
      expect(dynamoDB.scan).not.toHaveBeenCalled();
    });

    it('should handle pagination for search results', async () => {
      const searchQuery = 'trip';
      const limit = 1;
      const exclusiveStartKeyObject = { id: 'photo1', userId: mockUserId, createdAt: '2023-01-01T00:00:00.000Z' };
      const encodedExclusiveStartKey = encodeURIComponent(JSON.stringify(exclusiveStartKeyObject));
      mockReq.query = { q: searchQuery, limit: String(limit), exclusiveStartKey: encodedExclusiveStartKey };

      const paginatedItem = { id: 'photo2', s3Key: 'key2-trip.jpg', caption: 'Mountain trip', uploadStatus: 'completed', userId: mockUserId };
      const lastEvaluatedKeyResponse = { id: 'photo2', userId: mockUserId, createdAt: '2023-01-02T00:00:00.000Z' };
      const encodedLastEvaluatedKey = encodeURIComponent(JSON.stringify(lastEvaluatedKeyResponse));

      dynamoDB.scan.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({ Items: [paginatedItem], LastEvaluatedKey: lastEvaluatedKeyResponse }),
      });

      await searchPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        FilterExpression: expect.any(String),
        ExpressionAttributeValues: expect.objectContaining({ ':q': searchQuery }),
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKeyObject,
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [expect.objectContaining({ id: 'photo2', url: `${mockPresignedUrlBase}key2-trip.jpg?sig=search` })],
        lastEvaluatedKey: encodedLastEvaluatedKey,
      }));
    });

    it('should return 400 for invalid exclusiveStartKey format for search', async () => {
      mockReq.query = { q: 'test', exclusiveStartKey: 'thisIsInvalidJSON' };
      await searchPhotos(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid exclusiveStartKey format');
      expect(dynamoDB.scan).not.toHaveBeenCalled(); // Scan should not be called if key parsing fails
    });

    it('should return an empty array if no photos match search query', async () => {
      mockReq.query = { q: 'nonExistentTerm' };
      // Default dynamoDB.scan mock already returns Items: []
      await searchPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        lastEvaluatedKey: null,
      }));
      expect(s3.getSignedUrlPromise).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should ensure only "completed" photos are searched', async () => {
      mockReq.query = { q: 'anyQuery' };
      await searchPhotos(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: expect.stringContaining('uploadStatus = :completed'),
        ExpressionAttributeValues: expect.objectContaining({
          ':completed': 'completed',
        }),
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- getPhotosByTag ---
  describe('getPhotosByTag', () => {
    const mockUserId = 'testUserId';
    const mockPresignedUrlBase = 'https://s3.amazonaws.com/test-bucket-name/';
    const PRESIGNED_URL_EXPIRES_IN = 300; // From controller

    beforeEach(() => {
      mockReq.user.id = mockUserId;
      
      dynamoDB.scan.mockReturnValue({ 
        promise: jest.fn().mockResolvedValue({ Items: [], LastEvaluatedKey: null }) 
      });
      s3.getSignedUrlPromise.mockImplementation((operation, params) => {
        if (operation === 'getObject') {
          return Promise.resolve(`${mockPresignedUrlBase}${params.Key}?sig=tag-search`);
        }
        return Promise.reject(new Error('Mock S3 getSignedUrlPromise error for tag search'));
      });
      getTableName.mockImplementation(tableName => `dev-${tableName}`);
      getBucketName.mockReturnValue('test-bucket-name');
    });

    it('should successfully fetch photos by tag and return with presigned URLs', async () => {
      const tagToSearch = 'vacation';
      mockReq.query = { tag: tagToSearch };
      const searchResults = [
        { id: 'photo1', s3Key: 'key1-vacation.jpg', tags: ['vacation', 'summer'], uploadStatus: 'completed', userId: mockUserId },
        { id: 'photo2', s3Key: 'key2-vacay.png', tags: ['vacation'], uploadStatus: 'completed', userId: mockUserId }
      ];
      dynamoDB.scan.mockReturnValueOnce({ 
        promise: jest.fn().mockResolvedValue({ Items: searchResults, LastEvaluatedKey: null }) 
      });

      await getPhotosByTag(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith({
        TableName: 'dev-photos',
        FilterExpression: 'userId = :userId AND uploadStatus = :completed AND contains(#tags, :tagVal)',
        ExpressionAttributeNames: {
          '#tags': 'tags',
        },
        ExpressionAttributeValues: {
          ':userId': mockUserId,
          ':completed': 'completed',
          ':tagVal': tagToSearch,
        },
      });
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(searchResults.length);
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', expect.objectContaining({ Key: 'key1-vacation.jpg', Bucket: 'test-bucket-name', Expires: PRESIGNED_URL_EXPIRES_IN }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'photo1', url: `${mockPresignedUrlBase}key1-vacation.jpg?sig=tag-search` }),
          expect.objectContaining({ id: 'photo2', url: `${mockPresignedUrlBase}key2-vacay.png?sig=tag-search` }),
        ]),
        lastEvaluatedKey: null,
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if tag query parameter is missing', async () => {
      mockReq.query = {}; // No tag parameter
      await getPhotosByTag(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Tag query parameter is required');
      expect(dynamoDB.scan).not.toHaveBeenCalled();
    });

    it('should handle pagination for results by tag', async () => {
      const tagToSearch = 'event';
      const limit = 1;
      const exclusiveStartKeyObject = { id: 'photo1', userId: mockUserId, createdAt: '2023-02-01T00:00:00.000Z' };
      const encodedExclusiveStartKey = encodeURIComponent(JSON.stringify(exclusiveStartKeyObject));
      mockReq.query = { tag: tagToSearch, limit: String(limit), exclusiveStartKey: encodedExclusiveStartKey };

      const paginatedItem = { id: 'photo2', s3Key: 'key2-event.jpg', tags: ['event'], uploadStatus: 'completed', userId: mockUserId };
      const lastEvaluatedKeyResponse = { id: 'photo2', userId: mockUserId, createdAt: '2023-02-02T00:00:00.000Z' };
      const encodedLastEvaluatedKey = encodeURIComponent(JSON.stringify(lastEvaluatedKeyResponse));

      dynamoDB.scan.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({ Items: [paginatedItem], LastEvaluatedKey: lastEvaluatedKeyResponse }),
      });

      await getPhotosByTag(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'dev-photos',
        FilterExpression: 'userId = :userId AND uploadStatus = :completed AND contains(#tags, :tagVal)',
        ExpressionAttributeValues: expect.objectContaining({ ':tagVal': tagToSearch }),
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKeyObject,
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [expect.objectContaining({ id: 'photo2', url: `${mockPresignedUrlBase}key2-event.jpg?sig=tag-search` })],
        lastEvaluatedKey: encodedLastEvaluatedKey,
      }));
    });

    it('should return 400 for invalid exclusiveStartKey format for getPhotosByTag', async () => {
      mockReq.query = { tag: 'test', exclusiveStartKey: 'thisIsAnInvalidKeyFormat' };
      await getPhotosByTag(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid exclusiveStartKey format');
      expect(dynamoDB.scan).not.toHaveBeenCalled();
    });

    it('should return an empty array if no photos match the tag', async () => {
      mockReq.query = { tag: 'nonExistentTag' };
      // Default dynamoDB.scan mock already returns Items: []
      await getPhotosByTag(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        ExpressionAttributeValues: expect.objectContaining({ ':tagVal': 'nonExistentTag' }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        lastEvaluatedKey: null,
      }));
      expect(s3.getSignedUrlPromise).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should ensure only "completed" photos are returned by tag', async () => {
      mockReq.query = { tag: 'anyTag' };
      await getPhotosByTag(mockReq, mockRes, mockNext);

      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: expect.stringContaining('uploadStatus = :completed'),
        ExpressionAttributeValues: expect.objectContaining({
          ':completed': 'completed',
        }),
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
