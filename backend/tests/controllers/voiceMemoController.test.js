const {
  initiateVoiceMemoUpload,
  finalizeVoiceMemoUpload,
  getVoiceMemos,
  getVoiceMemoById,
  updateVoiceMemo,
  deleteVoiceMemo,
  searchVoiceMemos,
  getVoiceMemosByTag,
} = require('../../src/controllers/voiceMemoController');
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
    basename: jest.fn(filename => originalPath.basename(filename)), // Keep original basename logic
  };
});


describe('VoiceMemo Controller', () => {
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
    path.basename.mockClear();


    // Reset and provide default mock implementations for DynamoDB and S3 methods
    const mockDynamoPromise = jest.fn().mockResolvedValue({});
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReturnValue({ promise: mockDynamoPromise });
      }
    });

    const mockS3Promise = jest.fn().mockResolvedValue({});
    s3.createPresignedPost.mockImplementation((params, callback) => callback(null, { url: 'presigned-post-url', fields: {} }));
    s3.getSignedUrlPromise.mockResolvedValue('presigned-get-url');
    s3.deleteObject.mockReturnValue({ promise: mockS3Promise });
    s3.headObject.mockReturnValue({ promise: mockS3Promise });
  });

  // --- initiateVoiceMemoUpload ---
  describe('initiateVoiceMemoUpload', () => {
    it('should initiate upload successfully', async () => {
      mockReq.body = { fileName: 'test.mp3', contentType: 'audio/mpeg', title: 'My Memo' };
      uuidv4.mockReturnValue('voice-memo-uuid');
      path.basename.mockImplementation(filename => filename); // Simple mock for basename

      await initiateVoiceMemoUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('voiceMemos'),
        Item: expect.objectContaining({ id: 'voice-memo-uuid', uploadStatus: 'pending', title: 'My Memo' }),
      }));
      expect(s3.createPresignedPost).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        voiceMemoId: 'voice-memo-uuid',
        presignedPostData: { url: 'presigned-post-url', fields: {} },
      }));
    });

    it('should return 400 if fileName or contentType is missing', async () => {
      mockReq.body = { fileName: 'test.mp3' }; // Missing contentType
      await initiateVoiceMemoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  // --- finalizeVoiceMemoUpload ---
  describe('finalizeVoiceMemoUpload', () => {
    const memoId = 'memo-to-finalize';
    const existingMemo = { id: memoId, userId: 'testUserId', s3Key: 'some/key.mp3', uploadStatus: 'pending' };

    beforeEach(() => {
      mockReq.params.id = memoId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingMemo }) });
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: { ...existingMemo, uploadStatus: 'completed' } }) });
    });

    it('should finalize upload successfully', async () => {
      mockReq.body = { fileSize: 1024, duration: "00:30" };
      s3.headObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }); // S3 file exists

      await finalizeVoiceMemoUpload(mockReq, mockRes, mockNext);

      expect(s3.headObject).toHaveBeenCalledWith({ Bucket: 'test-bucket-name', Key: 'some/key.mp3' });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        Key: { id: memoId },
        UpdateExpression: expect.stringContaining(':completedStatus'),
        ExpressionAttributeValues: expect.objectContaining({ ':fileSize': 1024, ':duration': "00:30" }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    
    it('should return 400 if neither fileSize nor duration provided', async () => {
        mockReq.body = {};
        await finalizeVoiceMemoUpload(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('At least fileSize or duration must be provided to finalize.');
    });

    it('should return 404 if S3 object not found during finalize', async () => {
      mockReq.body = { fileSize: 1024 };
      s3.headObject.mockReturnValue({ promise: jest.fn().mockRejectedValue(new Error('S3 Not Found')) });
      await finalizeVoiceMemoUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  // --- getVoiceMemos ---
  describe('getVoiceMemos', () => {
    it('should get voice memos with presigned URLs successfully', async () => {
      const memos = [{ id: 'memo1', s3Key: 'key1' }, { id: 'memo2', s3Key: 'key2' }];
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: memos }) });
      s3.getSignedUrlPromise.mockImplementation((action, params) => Promise.resolve(`signed-url-for-${params.Key}`));
      
      await getVoiceMemos(mockReq, mockRes, mockNext);
      
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ FilterExpression: 'uploadStatus = :completed' }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledTimes(memos.length);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'memo1', url: 'signed-url-for-key1' }),
        ]),
      }));
    });
  });

  // --- getVoiceMemoById ---
  describe('getVoiceMemoById', () => {
    it('should get a voice memo by ID with presigned URL successfully', async () => {
      const memo = { id: 'memo1', userId: 'testUserId', s3Key: 'key1', uploadStatus: 'completed' };
      mockReq.params.id = 'memo1';
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: memo }) });
      s3.getSignedUrlPromise.mockResolvedValue('signed-url-for-key1');

      await getVoiceMemoById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: 'memo1' } }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', expect.objectContaining({ Key: 'key1' }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: { ...memo, url: 'signed-url-for-key1' } }));
    });
    
    it('should return 404 if memo not found or not completed', async () => {
        mockReq.params.id = 'memo1';
        dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: null }) }); // Not found
        await getVoiceMemoById(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  // --- updateVoiceMemo ---
  describe('updateVoiceMemo', () => {
    const memoId = 'memoToUpdate';
    const existingMemo = { id: memoId, userId: 'testUserId', s3Key: 'key.mp3', title: 'Old Title' };
    beforeEach(() => {
      mockReq.params.id = memoId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingMemo }) });
      s3.getSignedUrlPromise.mockResolvedValue('updated-signed-url');
    });

    it('should update voice memo metadata successfully', async () => {
      mockReq.body = { title: 'New Title', tags: ['updated'] };
      const updatedAttrs = { ...existingMemo, ...mockReq.body };
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: updatedAttrs }) });
      
      await updateVoiceMemo(mockReq, mockRes, mockNext);
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: memoId } }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: { ...updatedAttrs, url: 'updated-signed-url' } }));
    });
  });

  // --- deleteVoiceMemo ---
  describe('deleteVoiceMemo', () => {
    const memoId = 'memoToDelete';
    const existingMemo = { id: memoId, userId: 'testUserId', s3Key: 'key-to-delete.mp3' };
    beforeEach(() => {
      mockReq.params.id = memoId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingMemo }) });
    });

    it('should delete S3 object and DynamoDB record successfully', async () => {
      s3.deleteObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      
      await deleteVoiceMemo(mockReq, mockRes, mockNext);
      expect(s3.deleteObject).toHaveBeenCalledWith({ Bucket: 'test-bucket-name', Key: 'key-to-delete.mp3' });
      expect(dynamoDB.delete).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: memoId } }));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
    
    it('should still delete DynamoDB record if S3 delete fails (and log S3 error)', async () => {
      s3.deleteObject.mockReturnValue({ promise: jest.fn().mockRejectedValue(new Error('S3 Delete Failed')) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await deleteVoiceMemo(mockReq, mockRes, mockNext);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete S3 object'), expect.any(Error));
      expect(dynamoDB.delete).toHaveBeenCalled(); // DynamoDB delete should still be called
      expect(mockRes.status).toHaveBeenCalledWith(204);
      consoleErrorSpy.mockRestore();
    });
  });

  // --- searchVoiceMemos ---
  describe('searchVoiceMemos', () => {
    it('should search voice memos and return with presigned URLs', async () => {
      mockReq.query = { q: 'meeting' };
      const results = [{ id: 'sMemo1', s3Key: 'sKey1', title: 'Team Meeting Recap' }];
      dynamoDB.scan.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: results }) });
      s3.getSignedUrlPromise.mockResolvedValue('search-result-url');
      
      await searchVoiceMemos(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalled();
      expect(s3.getSignedUrlPromise).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ id: 'sMemo1', url: 'search-result-url' })],
      }));
    });
  });

  // --- getVoiceMemosByTag ---
  describe('getVoiceMemosByTag', () => {
    it('should get voice memos by tag with presigned URLs', async () => {
      mockReq.query = { tag: 'project-x' };
      const results = [{ id: 'tMemo1', s3Key: 'tKey1', tags: ['project-x'] }];
      dynamoDB.scan.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: results }) });
      s3.getSignedUrlPromise.mockResolvedValue('tag-result-url');

      await getVoiceMemosByTag(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: expect.stringContaining('contains(#tags, :tagVal)'),
      }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ id: 'tMemo1', url: 'tag-result-url' })],
      }));
    });
  });
});
