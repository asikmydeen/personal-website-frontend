// backend/tests/controllers/fileController.test.js
const request = require('supertest');
const express = require('express');
const fileRoutes = require('../../src/routes/fileRoutes');
const { protect } = require('../../src/middleware/authMiddleware');
const { errorHandler } = require('../../src/middleware/errorHandler');

// Mock AWS SDK clients and other dependencies
jest.mock('uuid', () => ({ v4: jest.fn() }));

const mockDynamoDBPut = jest.fn();
const mockDynamoDBGet = jest.fn();
const mockDynamoDBUpdate = jest.fn();
const mockDynamoDBDelete = jest.fn();
const mockDynamoDBQuery = jest.fn();
const mockDynamoDBScan = jest.fn();


jest.mock('../../src/config/aws', () => ({
  dynamoDB: {
    put: (params) => ({ promise: () => mockDynamoDBPut(params) }),
    get: (params) => ({ promise: () => mockDynamoDBGet(params) }),
    update: (params) => ({ promise: () => mockDynamoDBUpdate(params) }),
    delete: (params) => ({ promise: () => mockDynamoDBDelete(params) }),
    query: (params) => ({ promise: () => mockDynamoDBQuery(params) }),
    scan: (params) => ({ promise: () => mockDynamoDBScan(params) }),
  },
  s3: {
    createPresignedPost: jest.fn((params, callback) => callback(null, { url: 'http://s3-presigned-post-url.com', fields: { key: params.Fields.key } })),
    headObject: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({}) })),
    getSignedUrlPromise: jest.fn().mockResolvedValue('http://s3-presigned-get-url.com'),
    deleteObject: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({}) })),
  },
  getTableName: jest.fn((name) => name),
  getBucketName: jest.fn(() => 'test-bucket'),
}));

// Mock authMiddleware
jest.mock('../../src/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'testUserId' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/files', fileRoutes);
app.use(errorHandler);

describe('File Controller Tests', () => {
  let testFileId;
  let defaultS3KeyUserRoot; 

  beforeEach(() => {
    mockDynamoDBPut.mockReset();
    mockDynamoDBGet.mockReset();
    mockDynamoDBUpdate.mockReset();
    mockDynamoDBDelete.mockReset();
    mockDynamoDBQuery.mockReset();
    mockDynamoDBScan.mockReset();
    
    const { s3 } = require('../../src/config/aws');
    s3.createPresignedPost.mockReset(); // Crucial: Reset the mock itself
    s3.createPresignedPost.mockImplementation((params, callback) => callback(null, { url: 'http://s3-presigned-post-url.com', fields: { key: params.Fields.key } }));
    
    s3.getSignedUrlPromise.mockReset();
    s3.getSignedUrlPromise.mockResolvedValue('http://s3-presigned-get-url.com');
    
    s3.deleteObject.mockReset();
    s3.deleteObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    
    s3.headObject.mockReset();
    s3.headObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });

    testFileId = 'test-file-id';
    defaultS3KeyUserRoot = `files/testUserId/user-root/${testFileId}-test.txt`; // Default key for files in user-root
    require('uuid').v4.mockReturnValue(testFileId);

    // Default mock implementations for common successful outcomes
    mockDynamoDBPut.mockResolvedValue({});
    mockDynamoDBUpdate.mockResolvedValue({ Attributes: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'completed', originalFileName: 'updated.txt' } });
    mockDynamoDBDelete.mockResolvedValue({});
    mockDynamoDBQuery.mockResolvedValue({ Items: [], LastEvaluatedKey: null });
    mockDynamoDBScan.mockResolvedValue({ Items: [], LastEvaluatedKey: null });
  });

  describe('POST /api/files (initiateFileUpload)', () => {
    it('should initiate file upload in a specific folder (not user-root)', async () => {
      const fileData = { fileName: 'specific.txt', contentType: 'text/plain', folderId: 'folder123' };
      // Mock for folder validation: fileService.getFolderPath uses dynamoDB.get to fetch the folder.
      // If folder.path is NOT 'user-root/', controller uses folder.id in s3Key.
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: 'folder123', userId: 'testUserId', path: 'some/custom/path/' } }); 

      const res = await request(app).post('/api/files').send(fileData);

      expect(res.statusCode).toBe(201);
      const expectedS3Key = `files/testUserId/folder123/${testFileId}-${fileData.fileName}`;
      expect(mockDynamoDBPut).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({ folderId: 'folder123', s3Key: expectedS3Key })
      }));
      // Check the specific call to createPresignedPost for this test
      expect(require('../../src/config/aws').s3.createPresignedPost).toHaveBeenCalledWith(
        expect.objectContaining({ Fields: expect.objectContaining({ key: expectedS3Key }) }),
        expect.any(Function)
      );
    });
    
    it('should initiate file upload in user-root if folderId is "user-root"', async () => {
        const fileData = { fileName: 'root-by-id.txt', contentType: 'text/plain', folderId: 'user-root' };
        // Mock fileService.getFolderPath to identify 'user-root' folder
        mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: 'user-root', userId: 'testUserId', path: 'user-root/' } });

        const res = await request(app).post('/api/files').send(fileData);
        
        expect(res.statusCode).toBe(201);
        const expectedS3KeyAtRoot = `files/testUserId/user-root/${testFileId}-${fileData.fileName}`;
        expect(mockDynamoDBPut).toHaveBeenCalledWith(expect.objectContaining({
            Item: expect.objectContaining({ folderId: 'user-root', s3Key: expectedS3KeyAtRoot })
        }));
        expect(require('../../src/config/aws').s3.createPresignedPost).toHaveBeenCalledWith(
            expect.objectContaining({ Fields: expect.objectContaining({ key: expectedS3KeyAtRoot }) }),
            expect.any(Function)
        );
    });

    it('should initiate file upload in user-root if folderId is null', async () => {
      const fileData = { fileName: 'root-by-null.txt', contentType: 'text/plain', folderId: null };
      // No mockDynamoDBGet for folder, as getFolderPath is not called if folderId is null.
      const res = await request(app).post('/api/files').send(fileData);

      expect(res.statusCode).toBe(201);
      const expectedS3KeyAtRoot = `files/testUserId/user-root/${testFileId}-${fileData.fileName}`;
      expect(mockDynamoDBPut).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({ folderId: null, s3Key: expectedS3KeyAtRoot })
      }));
      expect(require('../../src/config/aws').s3.createPresignedPost).toHaveBeenCalledWith(
        expect.objectContaining({ Fields: expect.objectContaining({ key: expectedS3KeyAtRoot }) }),
        expect.any(Function)
      );
    });

     it('should return 400 if fileName or contentType is missing', async () => {
      const res = await request(app).post('/api/files').send({ contentType: 'text/plain' });
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 if specified folderId does not exist for initiateFileUpload', async () => {
        const fileData = { fileName: 'test.txt', contentType: 'text/plain', folderId: 'nonExistentFolder' };
        mockDynamoDBGet.mockResolvedValueOnce({ Item: null }); // Mock folder not found
        const res = await request(app).post('/api/files').send(fileData);
        expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/files/:id/finalize (finalizeFileUpload)', () => {
    it('should finalize file upload', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'pending' } });
      const res = await request(app).post(`/api/files/${testFileId}/finalize`).send({ fileSize: 1024 });
      expect(res.statusCode).toBe(200);
    });
     it('should return 400 if fileSize is missing', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'pending' } });
      const res = await request(app).post(`/api/files/${testFileId}/finalize`).send({});
      expect(res.statusCode).toBe(400);
    });
    it('should return 404 if file to finalize not found', async () => {
        mockDynamoDBGet.mockResolvedValueOnce({ Item: null });
        const res = await request(app).post(`/api/files/${testFileId}/finalize`).send({ fileSize: 1024 });
        expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/files (getFiles)', () => {
    it('should get all files for the user (completed and with presigned URLs)', async () => {
      mockDynamoDBQuery.mockResolvedValueOnce({ Items: [{ id: testFileId, s3Key: defaultS3KeyUserRoot, userId: 'testUserId', uploadStatus: 'completed' }], LastEvaluatedKey: null });
      const res = await request(app).get('/api/files');
      expect(res.statusCode).toBe(200);
      expect(res.body.data[0].url).toBeDefined();
    });
  });

  describe('GET /api/files/:id (getFileById)', () => {
    it('should get a file by ID with presigned URL', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'completed' } });
      const res = await request(app).get(`/api/files/${testFileId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.url).toBeDefined();
    });
     it('should return 404 if file not found for getFileById', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: null });
      const res = await request(app).get(`/api/files/nonexistent`);
      expect(res.statusCode).toBe(404);
    });
    it('should return 404 if file is not completed for getFileById', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'pending' } });
      const res = await request(app).get(`/api/files/${testFileId}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/files/:id (updateFile)', () => {
    it('should update file metadata', async () => {
      const updateData = { fileName: 'updated.txt', tags: ['newtag'] };
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'completed' } });
      const res = await request(app).put(`/api/files/${testFileId}`).send(updateData);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.originalFileName).toBe('updated.txt');
    });
    it('should return 404 if file to update is not found', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: null });
      const res = await request(app).put(`/api/files/${testFileId}`).send({ fileName: 't'});
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/files/:id (deleteFile)', () => {
    it('should delete a file', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFileId, userId: 'testUserId', s3Key: defaultS3KeyUserRoot, uploadStatus: 'completed' } });
      const res = await request(app).delete(`/api/files/${testFileId}`);
      expect(res.statusCode).toBe(204); 
    });
    it('should return 404 if file to delete is not found', async () => {
      mockDynamoDBGet.mockResolvedValueOnce({ Item: null });
      const res = await request(app).delete(`/api/files/${testFileId}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/files/search (searchFiles)', () => {
    it('should search files by query (completed files with presigned URLs)', async () => {
      mockDynamoDBScan.mockResolvedValueOnce({ Items: [{ id: testFileId, s3Key: defaultS3KeyUserRoot, userId: 'testUserId', originalFileName: 'test query me', uploadStatus: 'completed' }], LastEvaluatedKey: null });
      const res = await request(app).get('/api/files/search?q=query');
      expect(res.statusCode).toBe(200);
      expect(res.body.data[0].url).toBeDefined();
    });
    it('should return 400 if search query q is missing', async () => {
      const res = await request(app).get('/api/files/search');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/files/tags (getFilesByTag)', () => {
    it('should get files by tag (completed files with presigned URLs)', async () => {
       mockDynamoDBScan.mockResolvedValueOnce({ Items: [{ id: testFileId, s3Key: defaultS3KeyUserRoot, userId: 'testUserId', tags: ['testtag'], uploadStatus: 'completed' }], LastEvaluatedKey: null });
      const res = await request(app).get('/api/files/tags?tag=testtag');
      expect(res.statusCode).toBe(200);
      expect(res.body.data[0].url).toBeDefined();
    });
     it('should return 400 if tag query is missing', async () => {
      const res = await request(app).get('/api/files/tags');
      expect(res.statusCode).toBe(400);
    });
  });
});
