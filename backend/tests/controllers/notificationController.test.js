// backend/tests/controllers/notificationController.test.js
const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../../src/routes/notificationRoutes');
const authMiddleware = require('../../src/middleware/authMiddleware');
const { errorHandler } = require('../../src/middleware/errorHandler');

// Mock the authMiddleware to bypass actual authentication for tests
jest.mock('../../src/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'testUserId', roles: ['user'] }; // Mock user object
    next();
  },
}));

// Mock the controller methods that would interact with a database or service
const mockGetNotifications = jest.fn((req, res) => res.status(200).json({ success: true, message: 'Get all notifications (mocked)', data: [] }));
const mockGetNotificationById = jest.fn((req, res) => res.status(200).json({ success: true, message: `Get notification ${req.params.id} (mocked)`, data: {} }));
const mockMarkNotificationAsRead = jest.fn((req, res) => res.status(200).json({ success: true, message: `Mark notification ${req.params.id} as read (mocked)`, data: {} }));
const mockDeleteNotification = jest.fn((req, res) => res.status(200).json({ success: true, message: `Delete notification ${req.params.id} (mocked)` }));
const mockGetUnreadNotifications = jest.fn((req, res) => res.status(200).json({ success: true, message: 'Get unread notifications (mocked)', data: [] }));

jest.mock('../../src/controllers/notificationController', () => ({
  getNotifications: (req, res, next) => mockGetNotifications(req, res, next),
  getNotificationById: (req, res, next) => mockGetNotificationById(req, res, next),
  markNotificationAsRead: (req, res, next) => mockMarkNotificationAsRead(req, res, next),
  deleteNotification: (req, res, next) => mockDeleteNotification(req, res, next),
  getUnreadNotifications: (req, res, next) => mockGetUnreadNotifications(req, res, next),
}));


const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes); // Mount a base path similar to how it might be in server.js
app.use(errorHandler); // Add error handler middleware for robust testing

describe('Notification Controller Tests', () => {
  afterEach(() => {
    // Clear all mock call counts after each test
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should call getNotifications and return 200', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.statusCode).toEqual(200);
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Get all notifications (mocked)');
    });
  });

  describe('GET /api/notifications/unread', () => {
    it('should call getUnreadNotifications and return 200', async () => {
      const res = await request(app).get('/api/notifications/unread');
      expect(res.statusCode).toEqual(200);
      expect(mockGetUnreadNotifications).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Get unread notifications (mocked)');
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should call getNotificationById and return 200', async () => {
      const notificationId = '123';
      const res = await request(app).get(`/api/notifications/${notificationId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1);
      // Check if the mock was called with the correct parameters (simplified check here)
      // For more detailed checks, you'd inspect mockGetNotificationById.mock.calls[0][0].params.id
      expect(res.body.message).toBe(`Get notification ${notificationId} (mocked)`);
    });
  });

  describe('PUT /api/notifications/:id', () => {
    it('should call markNotificationAsRead and return 200', async () => {
      const notificationId = '123';
      const res = await request(app).put(`/api/notifications/${notificationId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockMarkNotificationAsRead).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Mark notification ${notificationId} as read (mocked)`);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should call deleteNotification and return 200', async () => {
      const notificationId = '123';
      const res = await request(app).delete(`/api/notifications/${notificationId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockDeleteNotification).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Delete notification ${notificationId} (mocked)`);
    });
  });
});
