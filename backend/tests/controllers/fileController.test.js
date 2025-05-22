const {
  initiateFileUpload,
  finalizeFileUpload,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  searchFiles,
  getFilesByTag,
} = require('../../src/controllers/fileController');
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
  };
});


describe('File Controller', () => {
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
    const mockDynamoPromiseDefault = jest.fn().mockResolvedValue({});
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }); // Ensure fresh promise mock each time
      }
    });
    
    s3.createPresignedPost.mockImplementation((params, callback) => callback(null, { url: 'presigned-post-url', fields: {} }));
    s3.getSignedUrlPromise.mockResolvedValue('presigned-get-url');
    s3.deleteObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    s3.headObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
  });

  // --- initiateFileUpload ---
  describe('initiateFileUpload', () => {
    it('should initiate upload successfully (no folderId)', async () => {
      mockReq.body = { fileName: 'test.pdf', contentType: 'application/pdf' };
      uuidv4.mockReturnValue('file-uuid');
      path.basename.mockImplementation(filename => filename);

      await initiateFileUpload(mockReq, mockRes, mockNext);

      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({ id: 'file-uuid', uploadStatus: 'pending', folderId: null, originalFileName: 'test.pdf' }),
      }));
      expect(s3.createPresignedPost).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'file-uuid' }));
    });

    it('should initiate upload successfully (with valid folderId)', async () => {
      mockReq.body = { fileName: 'doc.txt', contentType: 'text/plain', folderId: 'folder123' };
      uuidv4.mockReturnValue('file-uuid-in-folder');
      path.basename.mockImplementation(filename => filename);
      dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: { id: 'folder123', userId: 'testUserId' } }) });


      await initiateFileUpload(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith({TableName: expect.stringContaining('folders'), Key: {id: 'folder123'}});
      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({ id: 'file-uuid-in-folder', folderId: 'folder123' }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
    
    it('should return 400 if fileName or contentType is missing', async () => {
      mockReq.body = { fileName: 'test.pdf' }; // Missing contentType
      await initiateFileUpload(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should return 404 if folderId is provided but folder not found', async () => {
        mockReq.body = { fileName: 'test.pdf', contentType: 'application/pdf', folderId: 'nonExistentFolder' };
        dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValueOnce({ Item: null }) });
        await initiateFileUpload(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
        expect(mockNext.mock.calls[0][0].message).toBe('Folder not found or not authorized.');
    });
  });

  // --- finalizeFileUpload ---
  describe('finalizeFileUpload', () => {
    const fileId = 'file-to-finalize';
    const existingFile = { id: fileId, userId: 'testUserId', s3Key: 'some/s3/key.pdf', uploadStatus: 'pending' };
    
    beforeEach(() => {
      mockReq.params.id = fileId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingFile }) });
    });

    it('should finalize upload successfully', async () => {
      mockReq.body = { fileSize: 2048 };
      s3.headObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: { ...existingFile, uploadStatus: 'completed', fileSize: 2048 } }) });
      
      await finalizeFileUpload(mockReq, mockRes, mockNext);
      expect(s3.headObject).toHaveBeenCalledWith({ Bucket: 'test-bucket-name', Key: existingFile.s3Key });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: fileId } }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ uploadStatus: 'completed' }) }));
    });
    
    it('should return 400 if fileSize is missing', async () => {
        mockReq.body = {};
        await finalizeFileUpload(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('fileSize is required to finalize.');
    });
  });

  // --- getFiles ---
  describe('getFiles', () => {
    it('should get files with presigned URLs successfully (no folderId)', async () => {
      const files = [{ id: 'file1', s3Key: 'key1.pdf', uploadStatus: 'completed', userId: 'testUserId' }];
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: files }) });
      s3.getSignedUrlPromise.mockResolvedValue('signed-url-for-key1.pdf');

      await getFiles(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ FilterExpression: 'uploadStatus = :completed' }));
      expect(s3.getSignedUrlPromise).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
    
    it('should get files filtered by folderId if provided', async () => {
        mockReq.query = { folderId: 'folderXYZ' };
        dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
        await getFiles(mockReq, mockRes, mockNext);
        expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
            FilterExpression: 'uploadStatus = :completed AND folderId = :folderIdVal'
        }));
    });
  });

  // --- getFileById ---
  describe('getFileById', () => {
    it('should get a file by ID with presigned URL successfully', async () => {
      const file = { id: 'fileX', userId: 'testUserId', s3Key: 'keyX.txt', uploadStatus: 'completed' };
      mockReq.params.id = 'fileX';
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: file }) });
      s3.getSignedUrlPromise.mockResolvedValue('signed-url-for-keyX.txt');

      await getFileById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: 'fileX' } }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: { ...file, url: 'signed-url-for-keyX.txt' } }));
    });
  });

  // --- updateFile ---
  describe('updateFile', () => {
    const fileId = 'fileToUpdateMeta';
    const existingFile = { id: fileId, userId: 'testUserId', s3Key: 'path/to/file.jpg', originalFileName: 'oldName.jpg' };
    beforeEach(() => {
      mockReq.params.id = fileId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingFile }) });
      s3.getSignedUrlPromise.mockResolvedValue('updated-signed-url-for-file.jpg');
    });

    it('should update file metadata successfully', async () => {
      mockReq.body = { fileName: 'newName.jpg', tags: ['updated'] };
      const updatedAttrs = { ...existingFile, originalFileName: 'newName.jpg', tags: ['updated'] };
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: updatedAttrs }) });
      
      await updateFile(mockReq, mockRes, mockNext);
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: fileId } }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: { ...updatedAttrs, url: 'updated-signed-url-for-file.jpg' } }));
    });
    
    it('should validate new folderId if provided during update', async () => {
        mockReq.body = { folderId: 'newFolderId' };
        // Mock for current file
        dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: existingFile }) });
        // Mock for new folder validation (folder not found)
        dynamoDB.get.mockReturnValueOnce({ promise: jest.fn().mockResolvedValue({ Item: null }) });

        await updateFile(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
        expect(mockNext.mock.calls[0][0].message).toBe('Target folder not found or not authorized.');
    });
  });

  // --- deleteFile ---
  describe('deleteFile', () => {
    const fileId = 'fileToDelete';
    const existingFile = { id: fileId, userId: 'testUserId', s3Key: 'path/to/delete.txt' };
    beforeEach(() => {
      mockReq.params.id = fileId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingFile }) });
    });

    it('should delete S3 object and DynamoDB record successfully', async () => {
      s3.deleteObject.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      
      await deleteFile(mockReq, mockRes, mockNext);
      expect(s3.deleteObject).toHaveBeenCalledWith({ Bucket: 'test-bucket-name', Key: existingFile.s3Key });
      expect(dynamoDB.delete).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: fileId } }));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  // --- searchFiles ---
  describe('searchFiles', () => {
    it('should search files and return with presigned URLs', async () => {
      mockReq.query = { q: 'report' };
      const results = [{ id: 'sFile1', s3Key: 'sKey1.docx', originalFileName: 'Annual Report.docx' }];
      dynamoDB.scan.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: results }) });
      s3.getSignedUrlPromise.mockResolvedValue('search-result-file-url');
      
      await searchFiles(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ id: 'sFile1', url: 'search-result-file-url' })],
      }));
    });
  });

  // --- getFilesByTag ---
  describe('getFilesByTag', () => {
    it('should get files by tag with presigned URLs', async () => {
      mockReq.query = { tag: 'invoice' };
      const results = [{ id: 'tFile1', s3Key: 'tKey1.pdf', tags: ['invoice'] }];
      dynamoDB.scan.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: results }) });
      s3.getSignedUrlPromise.mockResolvedValue('tag-result-file-url');

      await getFilesByTag(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: expect.stringContaining('contains(#tags, :tagVal)'),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ id: 'tFile1', url: 'tag-result-file-url' })],
      }));
    });
  });
});
