// backend/tests/controllers/resumeController.test.js
const request = require('supertest');
const express = require('express');
const resumeRoutes = require('../../src/routes/resumeRoutes');
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
const mockGetResumes = jest.fn((req, res) => res.status(200).json({ success: true, message: 'Get all resumes (mocked)', data: [] }));
const mockGetResumeById = jest.fn((req, res) => res.status(200).json({ success: true, message: `Get resume ${req.params.id} (mocked)`, data: {} }));
const mockCreateResume = jest.fn((req, res) => res.status(201).json({ success: true, message: 'Create resume (mocked)', data: { id: 'newResumeId', ...req.body } }));
const mockUpdateResume = jest.fn((req, res) => res.status(200).json({ success: true, message: `Update resume ${req.params.id} (mocked)`, data: { id: req.params.id, ...req.body } }));
const mockDeleteResume = jest.fn((req, res) => res.status(200).json({ success: true, message: `Delete resume ${req.params.id} (mocked)` }));

jest.mock('../../src/controllers/resumeController', () => ({
  getResumes: (req, res, next) => mockGetResumes(req, res, next),
  getResumeById: (req, res, next) => mockGetResumeById(req, res, next),
  createResume: (req, res, next) => mockCreateResume(req, res, next),
  updateResume: (req, res, next) => mockUpdateResume(req, res, next),
  deleteResume: (req, res, next) => mockDeleteResume(req, res, next),
}));

const app = express();
app.use(express.json());
app.use('/api/resumes', resumeRoutes); // Mount on a base path
app.use(errorHandler);

describe('Resume Controller Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/resumes', () => {
    it('should call getResumes and return 200', async () => {
      const res = await request(app).get('/api/resumes');
      expect(res.statusCode).toEqual(200);
      expect(mockGetResumes).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Get all resumes (mocked)');
    });
  });

  describe('GET /api/resumes/:id', () => {
    it('should call getResumeById and return 200', async () => {
      const resumeId = 'testResumeId';
      const res = await request(app).get(`/api/resumes/${resumeId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockGetResumeById).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Get resume ${resumeId} (mocked)`);
    });
  });

  describe('POST /api/resumes', () => {
    it('should call createResume and return 201', async () => {
      const resumeData = { title: 'My Resume', content: 'Details...' };
      const res = await request(app)
        .post('/api/resumes')
        .send(resumeData);
      expect(res.statusCode).toEqual(201);
      expect(mockCreateResume).toHaveBeenCalledTimes(1);
      // Optionally check if mockCreateResume was called with appropriate req.body
      // For example, expect(mockCreateResume.mock.calls[0][0].body).toEqual(resumeData);
      expect(res.body.message).toBe('Create resume (mocked)');
      expect(res.body.data.title).toBe(resumeData.title);
    });
  });

  describe('PUT /api/resumes/:id', () => {
    it('should call updateResume and return 200', async () => {
      const resumeId = 'testResumeIdToUpdate';
      const resumeUpdateData = { title: 'Updated Resume Title' };
      const res = await request(app)
        .put(`/api/resumes/${resumeId}`)
        .send(resumeUpdateData);
      expect(res.statusCode).toEqual(200);
      expect(mockUpdateResume).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Update resume ${resumeId} (mocked)`);
      expect(res.body.data.title).toBe(resumeUpdateData.title);
    });
  });

  describe('DELETE /api/resumes/:id', () => {
    it('should call deleteResume and return 200', async () => {
      const resumeId = 'testResumeIdToDelete';
      const res = await request(app).delete(`/api/resumes/${resumeId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockDeleteResume).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Delete resume ${resumeId} (mocked)`);
    });
  });
});
