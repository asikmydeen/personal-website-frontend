const {
  createPassword,
  getPasswords,
  getPasswordById,
  updatePassword,
  deletePassword,
  searchPasswords,
  getPasswordsByCategory,
} = require('../../src/controllers/passwordController');
const { AppError } = require('../../src/middleware/errorHandler');
const { dynamoDB, getTableName } = require('../../src/config/aws');
const { v4: uuidv4 } = require('uuid');
const encryptionService = require('../../src/services/encryptionService');

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
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('../../src/services/encryptionService', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  isKeyConfigured: jest.fn(),
}));

describe('Password Controller', () => {
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

    // Reset all mocks
    uuidv4.mockReset();
    getTableName.mockClear();
    encryptionService.encrypt.mockReset();
    encryptionService.decrypt.mockReset();
    encryptionService.isKeyConfigured.mockReset();

    // Setup default mock implementations for DynamoDB methods to return promises
    const mockPromise = jest.fn().mockResolvedValue({}); // Default to empty resolved promise
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReturnValue({ promise: mockPromise });
      }
    });
    // Default for isKeyConfigured to be true
    encryptionService.isKeyConfigured.mockReturnValue(true);
  });

  // --- createPassword ---
  describe('createPassword', () => {
    it('should create a password successfully', async () => {
      mockReq.body = { siteName: 'test.com', username: 'user', password: 'plainPassword' };
      const mockEncryptedPayload = { iv: 'mockIv', encryptedData: 'mockEncData', authTag: 'mockAuthTag' };
      encryptionService.encrypt.mockReturnValue(mockEncryptedPayload);
      uuidv4.mockReturnValue('new-uuid');
      dynamoDB.put.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({}) });

      await createPassword(mockReq, mockRes, mockNext);

      expect(encryptionService.isKeyConfigured).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalledWith('plainPassword');
      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('passwords'),
        Item: expect.objectContaining({
          id: 'new-uuid',
          userId: 'testUserId',
          siteName: 'test.com',
          username: 'user',
          iv: 'mockIv',
          encryptedPassword: 'mockEncData',
          authTag: 'mockAuthTag',
        }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 'new-uuid', siteName: 'test.com' }),
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { siteName: 'test.com' }; // Missing username and password
      await createPassword(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toBe('Site name, username, and password are required');
    });

    it('should return 500 if encryption key is not configured', async () => {
      encryptionService.isKeyConfigured.mockReturnValueOnce(false);
      mockReq.body = { siteName: 'test.com', username: 'user', password: 'pw' };
      await createPassword(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
      expect(mockNext.mock.calls[0][0].message).toBe('Encryption service is not properly configured.');
    });
  });

  // --- getPasswords ---
  describe('getPasswords', () => {
    const mockEncryptedItems = [
      { id: 'id1', userId: 'testUserId', siteName: 'site1', iv: 'iv1', encryptedPassword: 'enc1', authTag: 'tag1' },
      { id: 'id2', userId: 'testUserId', siteName: 'site2', iv: 'iv2', encryptedPassword: 'enc2', authTag: 'tag2' },
    ];
    beforeEach(() => {
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: mockEncryptedItems, LastEvaluatedKey: null }) });
      encryptionService.decrypt.mockImplementation(payload => `decrypted_${payload.encryptedData}`);
    });

    it('should get and decrypt passwords successfully', async () => {
      await getPasswords(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({ IndexName: 'userId-index' }));
      expect(encryptionService.decrypt).toHaveBeenCalledTimes(mockEncryptedItems.length);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [
          { id: 'id1', userId: 'testUserId', siteName: 'site1', password: 'decrypted_enc1' },
          { id: 'id2', userId: 'testUserId', siteName: 'site2', password: 'decrypted_enc2' },
        ],
      }));
    });
    
    it('should handle decryption error for an item', async () => {
      encryptionService.decrypt.mockImplementationOnce(() => { throw new Error("Decryption Error!")}).mockImplementationOnce(payload => `decrypted_${payload.encryptedData}`);
      await getPasswords(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [
          { id: 'id1', userId: 'testUserId', siteName: 'site1', password: null, decryptionError: true },
          { id: 'id2', userId: 'testUserId', siteName: 'site2', password: 'decrypted_enc2' },
        ]
      }));
    });
  });

  // --- getPasswordById ---
  describe('getPasswordById', () => {
    const mockEncryptedItem = { id: 'pw1', userId: 'testUserId', siteName: 'site1', iv: 'iv1', encryptedPassword: 'enc1', authTag: 'tag1' };
    beforeEach(() => {
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: mockEncryptedItem }) });
      encryptionService.decrypt.mockReturnValue('decrypted_password');
    });
    
    it('should get and decrypt a password by ID successfully', async () => {
      mockReq.params.id = 'pw1';
      await getPasswordById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: 'pw1' } }));
      expect(encryptionService.decrypt).toHaveBeenCalledWith({ iv: 'iv1', encryptedData: 'enc1', authTag: 'tag1' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { id: 'pw1', userId: 'testUserId', siteName: 'site1', password: 'decrypted_password' },
      }));
    });
     it('should return 404 if password entry not found', async () => {
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: null }) });
      mockReq.params.id = 'nonexistent';
      await getPasswordById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
    it('should handle decryption error for getPasswordById', async () => {
      mockReq.params.id = 'pw1';
      encryptionService.decrypt.mockImplementationOnce(() => { throw new Error("Decryption Error!")});
      await getPasswordById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
      expect(mockNext.mock.calls[0][0].message).toBe('Failed to decrypt password data.');
    });
  });

  // --- updatePassword ---
  describe('updatePassword', () => {
    const passwordId = 'pwToUpdate';
    const currentEncrypted = { id: passwordId, userId: 'testUserId', siteName: 'Old Site', iv: 'oldIv', encryptedPassword: 'oldEnc', authTag: 'oldAuthTag' };
    beforeEach(() => {
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: currentEncrypted }) });
    });

    it('should update password entry (including password) successfully', async () => {
      mockReq.params.id = passwordId;
      mockReq.body = { siteName: 'New Site', password: 'newPlainPassword' };
      const newEncryptedPayload = { iv: 'newIv', encryptedData: 'newEnc', authTag: 'newAuthTag' };
      encryptionService.encrypt.mockReturnValue(newEncryptedPayload);
      encryptionService.decrypt.mockReturnValue('newPlainPassword'); // For the response
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: { ...currentEncrypted, ...newEncryptedPayload, siteName: 'New Site' } }) });

      await updatePassword(mockReq, mockRes, mockNext);
      expect(encryptionService.encrypt).toHaveBeenCalledWith('newPlainPassword');
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        Key: { id: passwordId },
        UpdateExpression: expect.stringContaining('#siteName = :siteName, #iv = :iv, #encPass = :encPass, #authTag = :authTag'),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ siteName: 'New Site', password: 'newPlainPassword' }),
      }));
    });
    it('should update password entry (without password) successfully', async () => {
      mockReq.params.id = passwordId;
      mockReq.body = { siteName: 'New Site Name Only' };
      encryptionService.decrypt.mockReturnValue('decryptedOldPassword'); // For the response
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: { ...currentEncrypted, siteName: 'New Site Name Only' } }) });
      
      await updatePassword(mockReq, mockRes, mockNext);
      expect(encryptionService.encrypt).not.toHaveBeenCalled(); // Password not changed
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: expect.stringContaining('#siteName = :siteName'),
        UpdateExpression: expect.not.stringContaining('#encPass = :encPass'), // Password fields not in update
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ siteName: 'New Site Name Only', password: 'decryptedOldPassword' }),
      }));
    });
  });

  // --- deletePassword ---
  describe('deletePassword', () => {
    it('should delete a password entry successfully', async () => {
      mockReq.params.id = 'pwToDelete';
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: { id: 'pwToDelete', userId: 'testUserId' } }) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      await deletePassword(mockReq, mockRes, mockNext);
      expect(dynamoDB.delete).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: 'pwToDelete' } }));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  // --- searchPasswords ---
  describe('searchPasswords', () => {
    it('should search and decrypt passwords successfully', async () => {
      mockReq.query = { q: 'searchTerm' };
      const searchResults = [{ id: 's1', iv: 'ivS', encryptedPassword: 'encS', authTag: 'tagS', siteName: 'searchTerm Site' }];
      dynamoDB.scan.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: searchResults }) });
      encryptionService.decrypt.mockReturnValue('decrypted_search_result');
      
      await searchPasswords(mockReq, mockRes, mockNext);
      expect(dynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
        FilterExpression: expect.stringContaining('contains(#siteName, :q)'),
      }));
      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ password: 'decrypted_search_result' })],
      }));
    });
     it('should return 400 if search query q is missing', async () => {
      mockReq.query = {};
      await searchPasswords(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  // --- getPasswordsByCategory ---
  describe('getPasswordsByCategory', () => {
    it('should get and decrypt passwords by category successfully', async () => {
      mockReq.params.category = 'social';
      const categoryResults = [{ id: 'cat1', iv: 'ivC', encryptedPassword: 'encC', authTag: 'tagC', category: 'social' }];
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: categoryResults }) });
      encryptionService.decrypt.mockReturnValue('decrypted_category_result');
      
      await getPasswordsByCategory(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
        IndexName: 'userId-index',
        FilterExpression: 'category = :categoryVal',
        ExpressionAttributeValues: expect.objectContaining({ ':categoryVal': 'social' }),
      }));
      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ password: 'decrypted_category_result' })],
      }));
    });
     it('should return 400 if category is missing', async () => {
      mockReq.params.category = ''; // Empty category
      await getPasswordsByCategory(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });
});
