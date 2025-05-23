// backend/tests/controllers/tagController.test.js
const request = require('supertest');
const express = require('express');
const tagRoutes = require('../../src/routes/tagRoutes');
const authMiddleware = require('../../src/middleware/authMiddleware');
const { errorHandler } = require('../../src/middleware/errorHandler');

// Mock the authMiddleware
jest.mock('../../src/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'testUserId', roles: ['user'] }; // Mock user
    next();
  },
}));

// Mock controller methods
const mockGetTags = jest.fn((req, res) => res.status(200).json({ success: true, message: 'Get all tags (mocked)', data: [] }));
const mockGetTagById = jest.fn((req, res) => res.status(200).json({ success: true, message: `Get tag ${req.params.id} (mocked)`, data: {} }));
const mockCreateTag = jest.fn((req, res) => res.status(201).json({ success: true, message: 'Create tag (mocked)', data: { id: 'newTagId', ...req.body } }));
const mockUpdateTag = jest.fn((req, res) => res.status(200).json({ success: true, message: `Update tag ${req.params.id} (mocked)`, data: { id: req.params.id, ...req.body } }));
const mockDeleteTag = jest.fn((req, res) => res.status(200).json({ success: true, message: `Delete tag ${req.params.id} (mocked)` }));

jest.mock('../../src/controllers/tagController', () => ({
  getTags: (req, res, next) => mockGetTags(req, res, next),
  getTagById: (req, res, next) => mockGetTagById(req, res, next),
  createTag: (req, res, next) => mockCreateTag(req, res, next),
  updateTag: (req, res, next) => mockUpdateTag(req, res, next),
  deleteTag: (req, res, next) => mockDeleteTag(req, res, next),
}));

const app = express();
app.use(express.json());
app.use('/api/tags', tagRoutes); // Mount on a base path
app.use(errorHandler);

describe('Tag Controller Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tags', () => {
    it('should call getTags and return 200', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.statusCode).toEqual(200);
      expect(mockGetTags).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Get all tags (mocked)');
    });
  });

  describe('GET /api/tags/:id', () => {
    it('should call getTagById and return 200', async () => {
      const tagId = 'testTagId';
      const res = await request(app).get(`/api/tags/${tagId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockGetTagById).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Get tag ${tagId} (mocked)`);
    });
  });

  describe('POST /api/tags', () => {
    it('should call createTag and return 201', async () => {
      const tagData = { name: 'Urgent', color: '#FF0000' };
      const res = await request(app)
        .post('/api/tags')
        .send(tagData);
      expect(res.statusCode).toEqual(201);
      expect(mockCreateTag).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Create tag (mocked)');
      expect(res.body.data.name).toBe(tagData.name);
    });
  });

  describe('PUT /api/tags/:id', () => {
    it('should call updateTag and return 200', async () => {
      const tagId = 'tagToUpdate123';
      const tagUpdateData = { name: 'Important', color: '#FFA500' };
      const res = await request(app)
        .put(`/api/tags/${tagId}`)
        .send(tagUpdateData);
      expect(res.statusCode).toEqual(200);
      expect(mockUpdateTag).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Update tag ${tagId} (mocked)`);
      expect(res.body.data.name).toBe(tagUpdateData.name);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should call deleteTag and return 200', async () => {
      const tagId = 'tagToDelete456';
      const res = await request(app).delete(`/api/tags/${tagId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockDeleteTag).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Delete tag ${tagId} (mocked)`);
    });
  });
});
