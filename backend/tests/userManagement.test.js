const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock User Model
jest.mock('../models/User');
const User = require('../models/User');

// Mock email service
jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue({}),
    sendResetLinkEmail: jest.fn().mockResolvedValue({}),
    sendStatusUpdateEmail: jest.fn().mockResolvedValue({})
}));

// Create a test app
const app = express();
app.use(express.json());

// Mock Auth Middleware for testing
const authMock = (req, res, next) => {
    req.user = { id: 'admin123' };
    next();
};

// Mock Admin Middleware
const adminAuthMock = (req, res, next) => {
    req.user = { id: 'admin123' };
    next();
};

// Mocking the middleware used in routes
jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
    req.user = { id: 'admin123' };
    next();
}));

// Require routes
const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

describe('User Profile & Admin Management Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/auth/me', () => {
        it('should return current user profile', async () => {
            const mockUser = {
                _id: 'admin123',
                nom: 'Test',
                prenom: 'User',
                email: 'test@example.com',
                role: 'consommateur_simple'
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const res = await request(app)
                .get('/api/auth/me')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body.email).toBe('test@example.com');
        });
    });

    describe('PUT /api/auth/update-profile', () => {
        it('should update user profile details', async () => {
            const mockUser = {
                _id: 'admin123',
                nom: 'OldName',
                email: 'old@example.com',
                save: jest.fn().mockResolvedValue(true)
            };

            User.findById.mockResolvedValue(mockUser);
            User.findOne.mockResolvedValue(null); // For email check

            const res = await request(app)
                .put('/api/auth/update-profile')
                .send({ nom: 'NewName' });

            expect(res.statusCode).toBe(200);
            expect(mockUser.nom).toBe('NewName');
            expect(mockUser.save).toHaveBeenCalled();
        });
    });

    describe('Admin Management', () => {
        const mockAdmin = {
            _id: 'admin123',
            role: 'super_admin'
        };

        it('should allow admin to update any user', async () => {
            const mockTargetUser = {
                _id: 'user456',
                nom: 'Target',
                save: jest.fn().mockResolvedValue(true)
            };

            // In admin.js, it often does User.findById(req.user.id) to check permissions
            // and then User.findById(req.params.id) for the target.
            User.findById
                .mockResolvedValueOnce(mockAdmin) // requester
                .mockResolvedValueOnce(mockTargetUser); // target

            const res = await request(app)
                .put('/api/admin/user/user456')
                .send({ nom: 'UpdatedByAdmin' });

            expect(res.statusCode).toBe(200);
            expect(mockTargetUser.nom).toBe('UpdatedByAdmin');
            expect(mockTargetUser.save).toHaveBeenCalled();
        });

        it('should allow admin to toggle user status', async () => {
            const mockTargetUser = {
                _id: 'user456',
                email: 'target@example.com',
                isActive: true,
                role: 'consommateur_simple',
                save: jest.fn().mockResolvedValue(true)
            };

            const mockAdmin = {
                _id: 'admin123',
                email: 'admin@example.com',
                role: 'super_admin'
            };

            User.findById.mockImplementation((id) => {
                if (id === 'user456') return Promise.resolve(mockTargetUser);
                if (id === 'admin123') return Promise.resolve(mockAdmin);
                return Promise.resolve(null);
            });

            const res = await request(app)
                .put('/api/admin/user/user456/toggle-status');

            expect(res.statusCode).toBe(200);
            expect(mockTargetUser.isActive).toBe(false);
            expect(mockTargetUser.save).toHaveBeenCalled();
        });
    });
});
