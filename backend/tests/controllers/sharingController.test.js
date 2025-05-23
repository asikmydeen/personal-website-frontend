// backend/tests/controllers/sharingController.test.js
const request = require('supertest');
const express = require('express');
const sharingRoutes = require('../../src/routes/sharingRoutes');
const authMiddleware = require('../../src/middleware/authMiddleware');
const { errorHandler } = require('../../src/middleware/errorHandler');

// Mock the authMiddleware for protected routes
jest.mock('../../src/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'testUserId', roles: ['user'] }; // Mock user
    next();
  },
}));

// Mock controller methods
const mockGetSharingLinks = jest.fn((req, res) => res.status(200).json({ success: true, message: 'Get all sharing links (mocked)', data: [] }));
const mockAccessSharedLink = jest.fn((req, res) => res.status(200).json({ success: true, message: `Access shared link with token ${req.params.token} (mocked)`, data: {} }));
const mockCreateSharingLink = jest.fn((req, res) => res.status(201).json({ success: true, message: 'Create sharing link (mocked)', data: { token: 'newLinkToken', ...req.body } }));
const mockDeleteSharingLink = jest.fn((req, res) => res.status(200).json({ success: true, message: `Delete sharing link ${req.params.id} (mocked)` }));
const mockGetUserPermissions = jest.fn((req, res) => res.status(200).json({ success: true, message: 'Get all user permissions (mocked)', data: [] }));
const mockGetUserPermissionById = jest.fn((req, res) => res.status(200).json({ success: true, message: `Get user permission ${req.params.id} (mocked)`, data: {} }));
const mockGrantUserPermission = jest.fn((req, res) => res.status(201).json({ success: true, message: 'Grant user permission (mocked)', data: { id: 'newPermissionId', ...req.body } }));
const mockRevokeUserPermission = jest.fn((req, res) => res.status(200).json({ success: true, message: `Revoke user permission ${req.params.id} (mocked)` }));

jest.mock('../../src/controllers/sharingController', () => ({
  getSharingLinks: (req, res, next) => mockGetSharingLinks(req, res, next),
  accessSharedLink: (req, res, next) => mockAccessSharedLink(req, res, next),
  createSharingLink: (req, res, next) => mockCreateSharingLink(req, res, next),
  deleteSharingLink: (req, res, next) => mockDeleteSharingLink(req, res, next),
  getUserPermissions: (req, res, next) => mockGetUserPermissions(req, res, next),
  getUserPermissionById: (req, res, next) => mockGetUserPermissionById(req, res, next),
  grantUserPermission: (req, res, next) => mockGrantUserPermission(req, res, next),
  revokeUserPermission: (req, res, next) => mockRevokeUserPermission(req, res, next),
}));

const app = express();
app.use(express.json());
app.use('/api/sharing', sharingRoutes); // Mount on a base path
app.use(errorHandler);

describe('Sharing Controller Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test for public route (accessSharedLink)
  describe('GET /api/sharing/links/:token', () => {
    it('should call accessSharedLink and return 200 (public)', async () => {
      const token = 'testToken123';
      const res = await request(app).get(`/api/sharing/links/${token}`);
      expect(res.statusCode).toEqual(200);
      expect(mockAccessSharedLink).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Access shared link with token ${token} (mocked)`);
    });
  });

  // Tests for protected routes
  describe('GET /api/sharing/links', () => {
    it('should call getSharingLinks and return 200', async () => {
      const res = await request(app).get('/api/sharing/links');
      expect(res.statusCode).toEqual(200);
      expect(mockGetSharingLinks).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Get all sharing links (mocked)');
    });
  });

  describe('POST /api/sharing/links', () => {
    it('should call createSharingLink and return 201', async () => {
      const linkData = { itemId: 'item123', type: 'document' };
      const res = await request(app)
        .post('/api/sharing/links')
        .send(linkData);
      expect(res.statusCode).toEqual(201);
      expect(mockCreateSharingLink).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Create sharing link (mocked)');
      expect(res.body.data.itemId).toBe(linkData.itemId);
    });
  });

  describe('DELETE /api/sharing/links/:id', () => {
    it('should call deleteSharingLink and return 200', async () => {
      const linkId = 'linkToDelete123';
      const res = await request(app).delete(`/api/sharing/links/${linkId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockDeleteSharingLink).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Delete sharing link ${linkId} (mocked)`);
    });
  });

  describe('GET /api/sharing/permissions', () => {
    it('should call getUserPermissions and return 200', async () => {
      const res = await request(app).get('/api/sharing/permissions');
      expect(res.statusCode).toEqual(200);
      expect(mockGetUserPermissions).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Get all user permissions (mocked)');
    });
  });

  describe('POST /api/sharing/permissions', () => {
    it('should call grantUserPermission and return 201', async () => {
      const permissionData = { userId: 'user456', itemId: 'item789', level: 'edit' };
      const res = await request(app)
        .post('/api/sharing/permissions')
        .send(permissionData);
      expect(res.statusCode).toEqual(201);
      expect(mockGrantUserPermission).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe('Grant user permission (mocked)');
      expect(res.body.data.userId).toBe(permissionData.userId);
    });
  });

  describe('GET /api/sharing/permissions/:id', () => {
    it('should call getUserPermissionById and return 200', async () => {
      const permissionId = 'perm123';
      const res = await request(app).get(`/api/sharing/permissions/${permissionId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockGetUserPermissionById).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Get user permission ${permissionId} (mocked)`);
    });
  });

  describe('DELETE /api/sharing/permissions/:id', () => {
    it('should call revokeUserPermission and return 200', async () => {
      const permissionId = 'permToDelete456';
      const res = await request(app).delete(`/api/sharing/permissions/${permissionId}`);
      expect(res.statusCode).toEqual(200);
      expect(mockRevokeUserPermission).toHaveBeenCalledTimes(1);
      expect(res.body.message).toBe(`Revoke user permission ${permissionId} (mocked)`);
    });
  });
});
