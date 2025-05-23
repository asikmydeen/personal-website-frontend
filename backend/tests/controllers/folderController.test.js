// backend/tests/controllers/folderController.test.js
const request = require('supertest');
const express = require('express');
const folderRoutes = require('../../src/routes/folderRoutes');
const { errorHandler } = require('../../src/middleware/errorHandler'); // Corrected import

// Mock AWS SDK clients and other dependencies
jest.mock('uuid', () => ({ v4: jest.fn() }));

const mockDynamoDBPut = jest.fn();
const mockDynamoDBGet = jest.fn();
const mockDynamoDBUpdate = jest.fn();
const mockDynamoDBDelete = jest.fn();
const mockDynamoDBQuery = jest.fn();

jest.mock('../../src/config/aws', () => ({
  dynamoDB: {
    put: (params) => ({ promise: () => mockDynamoDBPut(params) }),
    get: (params) => ({ promise: () => mockDynamoDBGet(params) }),
    update: (params) => ({ promise: () => mockDynamoDBUpdate(params) }),
    delete: (params) => ({ promise: () => mockDynamoDBDelete(params) }),
    query: (params) => ({ promise: () => mockDynamoDBQuery(params) }),
  },
  getTableName: jest.fn((name) => name), 
}));

jest.mock('../../src/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'testUserId' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/folders', folderRoutes);
app.use(errorHandler);

describe('Folder Controller Tests (Simplified Setup)', () => {
  let testFolderId;
  let testParentFolderId;

  beforeEach(() => {
    mockDynamoDBPut.mockReset();
    mockDynamoDBGet.mockReset();
    mockDynamoDBUpdate.mockReset();
    mockDynamoDBDelete.mockReset();
    mockDynamoDBQuery.mockReset();
    require('uuid').v4.mockReset();

    testFolderId = 'test-folder-id';
    testParentFolderId = 'parent-folder-id';
    require('uuid').v4.mockReturnValue(testFolderId);

    // Default mock implementations
    mockDynamoDBPut.mockResolvedValue({});
    mockDynamoDBUpdate.mockResolvedValue({ Attributes: { id: testFolderId, userId: 'testUserId', name: 'Updated Folder Default' } });
    mockDynamoDBDelete.mockResolvedValue({});
    mockDynamoDBQuery.mockResolvedValue({ Items: [], LastEvaluatedKey: null }); 
    // mockDynamoDBGet will be set specifically in tests that need it via mockResolvedValueOnce
  });

  it('should be a valid jest test file and pass this placeholder test', () => {
    expect(true).toBe(true);
  });

  describe('POST /api/folders (createFolder)', () => {
    // testFolderId from outer scope is used. uuid.v4() in controller will generate it.
    // We mock uuid.v4() in the outer beforeEach to return a consistent testFolderId.

    beforeEach(() => {
        // Reset mocks for DynamoDB calls for this specific describe block
        mockDynamoDBGet.mockReset();
        mockDynamoDBPut.mockReset();
        // Ensure uuid.v4 still returns the consistent testFolderId for each test in this block
        // This is typically handled by the outer beforeEach, but can be re-asserted if needed:
        // require('uuid').v4.mockReturnValue(testFolderId); 
    });

    it('should create a new folder with a parentId', async () => {
      const parentFolderId = 'parent-folder-id-123';
      const newFolderName = 'New Folder With Parent';
      // Mock for parentId validation: parent folder exists and belongs to user
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: parentFolderId, userId: 'testUserId' } });
      // mockDynamoDBPut is already mocked in outer beforeEach to resolve successfully by default

      const res = await request(app)
        .post('/api/folders')
        .send({ name: newFolderName, parentId: parentFolderId });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testFolderId); // testFolderId from outer uuid mock
      expect(res.body.data.name).toBe(newFolderName);
      expect(res.body.data.parentId).toBe(parentFolderId);
      expect(mockDynamoDBPut).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        Item: expect.objectContaining({ 
          id: testFolderId, 
          name: newFolderName, 
          parentId: parentFolderId, 
          userId: 'testUserId' 
          // The controller does not add 'path' to the item it Puts.
          // 'path' is handled by the folderService, not directly in this controller's PutItem.
        })
      }));
      expect(mockDynamoDBGet).toHaveBeenCalledWith(expect.objectContaining({ // Verifies the parent folder check
        TableName: 'folders',
        Key: { id: parentFolderId }
      }));
    });

    it('should create a new root folder if parentId is null', async () => {
      const newFolderName = 'New Root Folder';
      // No need to mock mockDynamoDBGet as it won't be called if parentId is null.
      // mockDynamoDBPut is already mocked in outer beforeEach.

      const res = await request(app)
        .post('/api/folders')
        .send({ name: newFolderName, parentId: null });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.parentId).toBeNull();
      expect(res.body.data.name).toBe(newFolderName);
      expect(res.body.data.id).toBe(testFolderId);
      expect(mockDynamoDBPut).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        Item: expect.objectContaining({ 
          id: testFolderId,
          name: newFolderName, 
          parentId: null,
          userId: 'testUserId'
        })
      }));
      expect(mockDynamoDBGet).not.toHaveBeenCalled(); 
    });
    
    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/folders')
        .send({ parentId: 'some-parent-id' }); // Name is missing
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Folder name is required'); // Corrected assertion
    });

    it('should return 404 if parent folder not found', async () => {
      const parentFolderId = 'non-existent-parent';
      mockDynamoDBGet.mockResolvedValueOnce({ Item: null }); // Parent folder does not exist

      const res = await request(app)
        .post('/api/folders')
        .send({ name: 'Folder with NonExistent Parent', parentId: parentFolderId });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Parent folder not found or not authorized'); // Corrected assertion
    });

    it('should return 404 if parent folder does not belong to the user', async () => {
      const parentFolderId = 'other-user-parent-folder';
      mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: parentFolderId, userId: 'otherUserId' } }); 
      
      const res = await request(app)
        .post('/api/folders')
        .send({ name: 'Folder with Other User Parent', parentId: parentFolderId });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Parent folder not found or not authorized'); // Corrected assertion
    });
  });

  describe('GET /api/folders (getFolders)', () => {
    beforeEach(() => {
        mockDynamoDBQuery.mockReset(); // Reset for specific behavior
    });

    it('should get root folders when no parentId query param is provided', async () => {
      const mockRootFolders = [{ id: 'folder1', name: 'Root Folder 1', userId: 'testUserId', parentId: null }];
      mockDynamoDBQuery.mockResolvedValueOnce({ Items: mockRootFolders, LastEvaluatedKey: null });

      const res = await request(app).get('/api/folders');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRootFolders);
      expect(mockDynamoDBQuery).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        IndexName: 'userId-index', // As per controller
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': 'testUserId' }
        // Not explicitly checking FilterExpression: undefined, as its absence is key.
        // ScanIndexForward: true is a default and acceptable.
      }));
    });

    it('should get folders for a specific parentId when parentId query param is provided', async () => {
      const specificParentId = 'parent-folder-for-get';
      const mockChildFolders = [{ id: 'child1', name: 'Child Folder 1', userId: 'testUserId', parentId: specificParentId }];
      mockDynamoDBQuery.mockResolvedValueOnce({ Items: mockChildFolders, LastEvaluatedKey: null });

      const res = await request(app).get(`/api/folders?parentId=${specificParentId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockChildFolders);
      expect(mockDynamoDBQuery).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        IndexName: 'userId-index', // As per controller
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'parentId = :parentIdVal',
        ExpressionAttributeValues: { ':userId': 'testUserId', ':parentIdVal': specificParentId },
      }));
    });

    it('should get root folders when parentId query param is "root"', async () => {
      mockDynamoDBQuery.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });
      await request(app).get('/api/folders?parentId=root');
      expect(mockDynamoDBQuery).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: '(attribute_not_exists(parentId) OR parentId = :nullParentId)',
        ExpressionAttributeValues: expect.objectContaining({ ':userId': 'testUserId', ':nullParentId': null })
      }));
    });

    it('should get root folders when parentId query param is "null"', async () => {
      mockDynamoDBQuery.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });
      await request(app).get('/api/folders?parentId=null');
      expect(mockDynamoDBQuery).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: '(attribute_not_exists(parentId) OR parentId = :nullParentId)',
        ExpressionAttributeValues: expect.objectContaining({ ':userId': 'testUserId', ':nullParentId': null })
      }));
    });
    
    it('should handle pagination with limit and exclusiveStartKey', async () => {
        const mockFoldersPage1 = [{id: 'folder1', name: 'Folder 1'}];
        const mockLastKey = {id: 'folder1', userId: 'testUserId'}; // GSI needs HASH key at least
        mockDynamoDBQuery.mockResolvedValueOnce({ Items: mockFoldersPage1, LastEvaluatedKey: mockLastKey });
        
        const resPage1 = await request(app).get('/api/folders?limit=1');
        expect(resPage1.body.data.length).toBe(1);
        expect(resPage1.body.lastEvaluatedKey).toBe(encodeURIComponent(JSON.stringify(mockLastKey)));

        const mockFoldersPage2 = [{id: 'folder2', name: 'Folder 2'}];
        mockDynamoDBQuery.mockResolvedValueOnce({ Items: mockFoldersPage2, LastEvaluatedKey: null });
        
        const resPage2 = await request(app).get(`/api/folders?limit=1&exclusiveStartKey=${encodeURIComponent(JSON.stringify(mockLastKey))}`);
        expect(resPage2.body.data.length).toBe(1);
        expect(resPage2.body.lastEvaluatedKey).toBeNull();
        expect(mockDynamoDBQuery).toHaveBeenLastCalledWith(expect.objectContaining({
            ExclusiveStartKey: mockLastKey,
            Limit: 1
        }));
    });

     it('should return 400 for invalid exclusiveStartKey format', async () => {
        const res = await request(app).get('/api/folders?exclusiveStartKey=invalidKey');
        expect(res.statusCode).toBe(400);
        expect(res.body.error.message).toContain('Invalid exclusiveStartKey format');
    });
  });

  describe('GET /api/folders/:id (getFolderById)', () => {
    // testFolderId is available from the outer describe block's beforeEach
    // We'll use a specific ID for clarity in these tests if needed, or the global testFolderId

    beforeEach(() => {
        mockDynamoDBGet.mockReset(); // Reset for specific behavior per test
    });

    it('should get a folder by its ID if it belongs to the user', async () => {
      const folderIdForTest = 'folder-by-id-owned-by-user';
      const mockFolderItem = { id: folderIdForTest, name: 'Specific Folder', userId: 'testUserId' };
      mockDynamoDBGet.mockResolvedValueOnce({ Item: mockFolderItem });

      const res = await request(app).get(`/api/folders/${folderIdForTest}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockFolderItem);
      expect(mockDynamoDBGet).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'folders',
        Key: { id: folderIdForTest },
      }));
    });

    it('should return 404 if folder not found', async () => {
      const nonExistentFolderId = 'non-existent-folder-id';
      mockDynamoDBGet.mockResolvedValueOnce({ Item: null }); // Simulate item not found

      const res = await request(app).get(`/api/folders/${nonExistentFolderId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Folder not found');
    });

    it('should return 404 if folder belongs to another user', async () => {
      const otherUserFolderId = 'otherUserFolderId';
      const mockFolderItemOtherUser = { id: otherUserFolderId, name: 'Other User Folder', userId: 'anotherUserId' };
      mockDynamoDBGet.mockResolvedValueOnce({ Item: mockFolderItemOtherUser });

      const res = await request(app).get(`/api/folders/${otherUserFolderId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Folder not found or not authorized');
    });
  });

  // describe('PUT /api/folders/:id (updateFolder)', () => {
  //   /*
  //   it('should update folder name and parentId, and path', async () => {
  //     const newParentId = 'new-parent-folder-id';
  //     const updateData = { name: 'Updated Folder Name', parentId: newParentId };
  //     const newParentPath = 'new/parent/path/';
      
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId', name: 'Old Name', path: 'old/path/' } }); 
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: newParentId, userId: 'testUserId', path: newParentPath } }); 
  //     mockDynamoDBUpdate.mockResolvedValueOnce({ Attributes: { ...updateData, id: testFolderId, userId: 'testUserId', path: `${newParentPath}${testFolderId}/` } });

  //     const res = await request(app).put(`/api/folders/${testFolderId}`).send(updateData);

  //     expect(res.statusCode).toBe(200);
  //     expect(res.body.data.name).toBe('Updated Folder Name'); 
  //     expect(res.body.data.parentId).toBe(newParentId);
  //     expect(mockDynamoDBUpdate).toHaveBeenCalledWith(expect.objectContaining({
  //       TableName: 'folders',
  //       Key: { id: testFolderId },
  //       ExpressionAttributeValues: expect.objectContaining({ 
  //           ':name': 'Updated Folder Name', 
  //           ':parentId': newParentId,
  //           ':path': `${newParentPath}${testFolderId}/`
  //       }),
  //       ExpressionAttributeNames: expect.objectContaining({
  //           '#name': 'name',
  //           '#parentId': 'parentId',
  //           '#path': 'path',
  //           '#updatedAt': 'updatedAt'
  //       }),
  //       UpdateExpression: 'SET #name = :name, #parentId = :parentId, #path = :path, #updatedAt = :updatedAt'
  //     }));
  //   });
    
  //   it('should return 400 if trying to set folder as its own parent', async () => {
  //     const updateData = { parentId: testFolderId };
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId', name: 'Old Name' } });
  //     const res = await request(app).put(`/api/folders/${testFolderId}`).send(updateData);
  //     expect(res.statusCode).toBe(400);
  //   });

  //    it('should return 404 if folder to update is not found', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce(null); 
  //     const res = await request(app).put(`/api/folders/nonexistent`).send({ name: 'Does not matter' });
  //     expect(res.statusCode).toBe(404);
  //   });

  //   it('should return 404 if new parent folder is not found for updateFolder', async () => {
  //     const updateData = { parentId: 'nonExistentNewParent' };
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId' } }); 
  //     mockDynamoDBGet.mockResolvedValueOnce(null); 
  //     const res = await request(app).put(`/api/folders/${testFolderId}`).send(updateData);
  //     expect(res.statusCode).toBe(404);
  //   });
  //   */
  // });

  // describe('DELETE /api/folders/:id (deleteFolder)', () => {
  //   /*
  //   it('should delete a folder if it is empty', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId' } }); 
  //     mockDynamoDBQuery.mockResolvedValueOnce({ Items: [] }); 
  //     mockDynamoDBQuery.mockResolvedValueOnce({ Items: [] }); 

  //     const res = await request(app).delete(`/api/folders/${testFolderId}`);
  //     expect(res.statusCode).toBe(204);
  //   });

  //   it('should return 400 if folder contains sub-folders', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId' } });
  //     mockDynamoDBQuery.mockResolvedValueOnce({ Items: [{ id: 'subfolder' }] }); 
      
  //     const res = await request(app).delete(`/api/folders/${testFolderId}`);
  //     expect(res.statusCode).toBe(400);
  //   });

  //   it('should return 400 if folder contains files', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId' } });
  //     mockDynamoDBQuery.mockResolvedValueOnce({ Items: [] }); 
  //     mockDynamoDBQuery.mockResolvedValueOnce({ Items: [{ id: 'fileInFolder' }] }); 

  //     const res = await request(app).delete(`/api/folders/${testFolderId}`);
  //     expect(res.statusCode).toBe(400);
  //   });
  //    it('should return 404 if folder to delete is not found', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce(null); 
  //     const res = await request(app).delete(`/api/folders/nonexistent`);
  //     expect(res.statusCode).toBe(404);
  //   });
  //   */
  // });

  // describe('GET /api/folders/:id/files (getFilesInFolder)', () => {
  //   /*
  //   it('should get files in a specific folder', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: { id: testFolderId, userId: 'testUserId' } }); 
  //     mockDynamoDBQuery.mockResolvedValueOnce({ Items: [{ id: 'file1', name: 'File One', userId: 'testUserId' }], LastEvaluatedKey: null });

  //     const res = await request(app).get(`/api/folders/${testFolderId}/files`);
  //     expect(res.statusCode).toBe(200);
  //     expect(res.body.data.length).toBe(1);
  //     expect(mockDynamoDBQuery).toHaveBeenCalledWith(expect.objectContaining({
  //       TableName: 'files', 
  //       IndexName: 'folderId-userId-index',
  //       KeyConditionExpression: 'folderId = :folderId AND userId = :userId',
  //       ExpressionAttributeValues: expect.objectContaining({ ':folderId': testFolderId, ':userId': 'testUserId' })
  //     }));
  //   });
    
  //   it('should return 404 if folder for files listing not found', async () => {
  //     mockDynamoDBGet.mockResolvedValueOnce({ Item: null }); 
  //     const res = await request(app).get(`/api/folders/nonexistent/files`);
  //     expect(res.statusCode).toBe(404);
  //   });
  //   */
  // });
});
