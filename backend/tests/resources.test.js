const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// ────────────────────────────────────────────────────
// MOCK SETUP
// ────────────────────────────────────────────────────

// Mock Models
jest.mock('../models/WaterBrand');
const WaterBrand = require('../models/WaterBrand');

jest.mock('../models/ThermalBath');
const ThermalBath = require('../models/ThermalBath');

jest.mock('../models/User');
const User = require('../models/User');

// Missing mocks for other models used in adminRoutes
jest.mock('../models/Conventionne');
jest.mock('../models/Reclamation');
jest.mock('../models/Notification');
jest.mock('../models/Governorate');
jest.mock('../utils/emailService');
jest.mock('../utils/pdfGenerator');

// Mock Auth Middleware
jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
    req.user = { id: 'admin123' };
    next();
}));

// Setup Express
const app = express();
app.use(express.json());
const adminRoutes = require('../routes/admin');
app.use('/api/admin', adminRoutes);

// ════════════════════════════════════════════════════
// TESTS — GESTION DES RESSOURCES (EAUX & THERMES)
// ════════════════════════════════════════════════════

describe('Sprint 4 — Gestion des Sources Thermales et Eaux Minérales', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockSuperAdmin = {
        _id: 'admin123',
        role: 'super_admin',
        email: 'admin@otic.tn'
    };

    // ────────────────────────────────────────────────
    // EAUX MINÉRALES
    // ────────────────────────────────────────────────
    describe('Module Eaux Minérales', () => {

        const mockBrand = {
            _id: 'wb1',
            marque: 'Sabi',
            tds: '350',
            ph: '7.2',
            nitrates: '2.5',
            notes: 'Excellent'
        };

        it('devrait ajouter une nouvelle marque d\'eau', async () => {
            User.findById.mockResolvedValue(mockSuperAdmin);
            WaterBrand.findOne.mockResolvedValue(null);
            WaterBrand.prototype.save = jest.fn().mockResolvedValue(mockBrand);

            const res = await request(app)
                .post('/api/admin/water-brands')
                .send({ marque: 'Sabi', tds: '350' });

            expect(res.statusCode).toBe(200);
            expect(WaterBrand.prototype.save).toHaveBeenCalled();
        });

        it('devrait empêcher l\'ajout d\'une marque existante', async () => {
            User.findById.mockResolvedValue(mockSuperAdmin);
            WaterBrand.findOne.mockResolvedValue(mockBrand);

            const res = await request(app)
                .post('/api/admin/water-brands')
                .send({ marque: 'Sabi' });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('existe déjà');
        });

        it('devrait supprimer une marque d\'eau', async () => {
            User.findById.mockResolvedValue(mockSuperAdmin);
            WaterBrand.findById.mockResolvedValue(mockBrand);
            WaterBrand.findByIdAndDelete.mockResolvedValue(true);

            const res = await request(app).delete('/api/admin/water-brand/wb1');

            expect(res.statusCode).toBe(200);
            expect(WaterBrand.findByIdAndDelete).toHaveBeenCalledWith('wb1');
        });
    });

    // ────────────────────────────────────────────────
    // SOURCES THERMALES
    // ────────────────────────────────────────────────
    describe('Module Sources Thermales', () => {

        const mockBath = {
            _id: 'tb1',
            name: 'Hammam Mellegue',
            location: 'Kef',
            type: 'Station Thermale',
            temperature: '65'
        };

        it('devrait ajouter une nouvelle station thermale', async () => {
            User.findById.mockResolvedValue(mockSuperAdmin);
            ThermalBath.findOne.mockResolvedValue(null);
            ThermalBath.prototype.save = jest.fn().mockResolvedValue(mockBath);

            const res = await request(app)
                .post('/api/admin/thermal-baths')
                .send({ name: 'Hammam Mellegue', location: 'Kef' });

            expect(res.statusCode).toBe(200);
            expect(ThermalBath.prototype.save).toHaveBeenCalled();
        });

        it('devrait mettre à jour une station thermale', async () => {
            User.findById.mockResolvedValue(mockSuperAdmin);
            ThermalBath.findById.mockResolvedValue({
                ...mockBath,
                save: jest.fn().mockResolvedValue(true)
            });

            const res = await request(app)
                .put('/api/admin/thermal-bath/tb1')
                .send({ temperature: '70' });

            expect(res.statusCode).toBe(200);
        });

        it('devrait refuser l\'accès aux non-super-admins', async () => {
            User.findById.mockResolvedValue({ ...mockSuperAdmin, role: 'consommateur_simple' });

            const res = await request(app).post('/api/admin/thermal-baths').send({});

            expect(res.statusCode).toBe(403);
        });
    });

});
