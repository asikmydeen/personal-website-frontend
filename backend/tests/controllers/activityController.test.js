const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} = require('../../src/controllers/activityController');
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

describe('Activity Controller', () => {
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
  });

  describe('createActivity', () => {
    it('should create an activity successfully and return 201', async () => {
      const mockActivityId = 'mockActivityId';
      uuidv4.mockReturnValue(mockActivityId);
      mockReq.body = {
        type: 'test_event',
        message: 'User performed an action.',
        resourceId: 'resource123',
        details: { info: 'some details' },
      };
      dynamoDB.put().promise.mockResolvedValueOnce({});

      await createActivity(mockReq, mockRes, mockNext);

      expect(uuidv4).toHaveBeenCalled();
      expect(dynamoDB.put).toHaveBeenCalledWith({
        TableName: expect.any(String),
        Item: expect.objectContaining({
          id: mockActivityId,
          userId: 'testUserId',
          type: 'test_event',
          message: 'User performed an action.',
          resourceId: 'resource123',
          details: { info: 'some details' },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });
      expect(getTableName).toHaveBeenCalledWith('activities');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: mockActivityId }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if type is missing', async () => {
      mockReq.body = { message: 'A message without a type' };

      await createActivity(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Type and message are required fields');
    });

    it('should return 400 if message is missing', async () => {
      mockReq.body = { type: 'event_type' };
      
      await createActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Type and message are required fields');
    });

    it('should handle DynamoDB put errors', async () => {
      uuidv4.mockReturnValue('some-uuid');
      mockReq.body = { type: 'error_event', message: 'This will fail' };
      const dbError = new Error('DynamoDB put error');
      dynamoDB.put().promise.mockRejectedValueOnce(dbError);

      await createActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('getActivities', () => {
    it('should get activities for a user successfully', async () => {
      const mockActivities = [{ id: 'act1', message: 'Activity 1' }];
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: mockActivities, LastEvaluatedKey: null });
      mockReq.query = { limit: '10' };

      await getActivities(mockReq, mockRes, mockNext);

      expect(dynamoDB.query).toHaveBeenCalledWith({
        TableName: expect.any(String),
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': 'testUserId' },
        ScanIndexForward: false,
        Limit: 10,
      });
      expect(getTableName).toHaveBeenCalledWith('activities');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockActivities,
        lastEvaluatedKey: null,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle pagination with exclusiveStartKey', async () => {
      const startKey = { id: 'lastActivityId', userId: 'testUserId' };
      const encodedStartKey = encodeURIComponent(JSON.stringify(startKey));
      mockReq.query = { limit: '5', exclusiveStartKey: encodedStartKey };
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: null });

      await getActivities(mockReq, mockRes, mockNext);

      expect(dynamoDB.query).toHaveBeenCalledWith(
        expect.objectContaining({
          Limit: 5,
          ExclusiveStartKey: startKey,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return 400 if exclusiveStartKey is invalid JSON', async () => {
        mockReq.query = { exclusiveStartKey: 'invalid-json-string' };

        await getActivities(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        const error = mockNext.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid exclusiveStartKey format');
    });


    it('should return empty array if no activities found', async () => {
      dynamoDB.query().promise.mockResolvedValueOnce({ Items: [] });

      await getActivities(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [] })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle DynamoDB query errors', async () => {
      const dbError = new Error('DynamoDB query error');
      dynamoDB.query().promise.mockRejectedValueOnce(dbError);

      await getActivities(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('getActivityById', () => {
    it('should get an activity by ID successfully', async () => {
      const mockActivity = { id: 'act123', userId: 'testUserId', message: 'Details' };
      mockReq.params.id = 'act123';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: mockActivity });

      await getActivityById(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({
        TableName: expect.any(String),
        Key: { id: 'act123' },
      });
      expect(getTableName).toHaveBeenCalledWith('activities');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockActivity,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if activity not found', async () => {
      mockReq.params.id = 'nonExistentId';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });

      await getActivityById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Activity not found');
    });

    it('should return 404 if activity belongs to another user', async () => {
      const mockActivity = { id: 'act123', userId: 'anotherUserId', message: 'Details' };
      mockReq.params.id = 'act123';
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: mockActivity });

      await getActivityById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Activity not found or not authorized');
    });

    it('should handle DynamoDB get errors', async () => {
      mockReq.params.id = 'act123';
      const dbError = new Error('DynamoDB get error');
      dynamoDB.get().promise.mockRejectedValueOnce(dbError);

      await getActivityById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('updateActivity', () => {
    const activityId = 'activityToUpdate';
    const currentActivity = { id: activityId, userId: 'testUserId', message: 'Old message', details: {} };

    beforeEach(() => {
        mockReq.params.id = activityId;
    });

    it('should update an activity successfully', async () => {
      mockReq.body = { message: 'New message', details: { newInfo: 'added' } };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentActivity });
      const updatedAttributes = { ...currentActivity, ...mockReq.body, updatedAt: expect.any(String) };
      dynamoDB.update().promise.mockResolvedValueOnce({ Attributes: updatedAttributes });

      await updateActivity(mockReq, mockRes, mockNext);
      
      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.any(String), Key: { id: activityId } });
      expect(dynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.any(String),
        Key: { id: activityId },
        UpdateExpression: 'SET #msg = :message, #det = :details, #ua = :updatedAt',
        ExpressionAttributeValues: expect.objectContaining({
          ':message': 'New message',
          ':details': { newInfo: 'added' },
          ':updatedAt': expect.any(String),
        }),
        ExpressionAttributeNames: {
            '#msg': 'message',
            '#det': 'details',
            '#ua': 'updatedAt',
        },
        ReturnValues: 'ALL_NEW',
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedAttributes,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if activity to update is not found', async () => {
      mockReq.body = { message: 'New message' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });

      await updateActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Activity not found');
    });

    it('should return 403 if user is not authorized to update activity', async () => {
      mockReq.body = { message: 'New message' };
      const activityOfAnotherUser = { ...currentActivity, userId: 'anotherUserId' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: activityOfAnotherUser });

      await updateActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Not authorized to update this activity');
    });
    
    it('should return 200 with current item if no fields to update are provided', async () => {
        mockReq.body = {}; // No update fields
        dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentActivity });

        await updateActivity(mockReq, mockRes, mockNext);

        expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.any(String), Key: { id: activityId } });
        expect(dynamoDB.update).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: currentActivity,
            message: 'No fields to update',
        });
        expect(mockNext).not.toHaveBeenCalled();
    });


    it('should handle DynamoDB update errors', async () => {
      mockReq.body = { message: 'New message' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentActivity });
      const dbError = new Error('DynamoDB update error');
      dynamoDB.update().promise.mockRejectedValueOnce(dbError);

      await updateActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('deleteActivity', () => {
    const activityId = 'activityToDelete';
    const currentActivity = { id: activityId, userId: 'testUserId', message: 'To be deleted' };
     beforeEach(() => {
        mockReq.params.id = activityId;
    });

    it('should delete an activity successfully', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentActivity });
      dynamoDB.delete().promise.mockResolvedValueOnce({});

      await deleteActivity(mockReq, mockRes, mockNext);

      expect(dynamoDB.get).toHaveBeenCalledWith({ TableName: expect.any(String), Key: { id: activityId } });
      expect(dynamoDB.delete).toHaveBeenCalledWith({
        TableName: expect.any(String),
        Key: { id: activityId },
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if activity to delete is not found', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: null });

      await deleteActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Activity not found');
    });

    it('should return 404 if user is not authorized to delete activity', async () => {
      const activityOfAnotherUser = { ...currentActivity, userId: 'anotherUserId' };
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: activityOfAnotherUser });

      await deleteActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Activity not found or not authorized');
    });

    it('should handle DynamoDB delete errors', async () => {
      dynamoDB.get().promise.mockResolvedValueOnce({ Item: currentActivity });
      const dbError = new Error('DynamoDB delete error');
      dynamoDB.delete().promise.mockRejectedValueOnce(dbError);

      await deleteActivity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
