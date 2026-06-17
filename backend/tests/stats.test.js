const request = require('supertest');
const express = require('express');

// ────────────────────────────────────────────────────
// MOCK SETUP
// ────────────────────────────────────────────────────

// Mock Reclamation Model
jest.mock('../models/Reclamation');
const Reclamation = require('../models/Reclamation');

// Mock User Model
jest.mock('../models/User');
const User = require('../models/User');

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
// TESTS — STATISTIQUES DES RÉCLAMATIONS
// ════════════════════════════════════════════════════

describe('Module Statistiques — Tests Unitaires', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockAdmin = {
        _id: 'admin123',
        role: 'super_admin',
        email: 'admin@otic.tn',
        adresse: { ville: 'Tunis' }
    };

    const mockReclamations = [
        { _id: 'r1', secteur: 'Eau', statut: 'resolue', dateCreation: '2026-06-01', dateResolution: '2026-06-03' },
        { _id: 'r2', secteur: 'Eau', statut: 'en_cours', dateCreation: '2026-06-02' },
        { _id: 'r3', secteur: 'Energie', statut: 'deposee', dateCreation: '2026-06-04' },
        { _id: 'r4', secteur: 'Energie', statut: 'resolue', dateCreation: '2026-06-01', dateResolution: '2026-06-05' }
    ];

    describe('GET /api/admin/stats — Calculs globaux', () => {

        it('devrait retourner les statistiques globales pour un Super Admin', async () => {
            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockReclamations)
                })
            });

            const res = await request(app).get('/api/admin/stats');

            expect(res.statusCode).toBe(200);
            expect(res.body.totalCount).toBe(4);

            // Vérification Volume par Catégorie
            const eauStats = res.body.volumeByCategory.find(c => c.name === 'Eau');
            expect(eauStats.value).toBe(2);

            // Vérification Taux de Résolution (2 résolues sur 4 = 50%)
            expect(res.body.resolutionRate).toBe(50);
        });

        it('devrait filtrer par région pour un Admin Régional', async () => {
            const regionalAdmin = { ...mockAdmin, role: 'admin_regional', adresse: { ville: 'Sfax' } };
            User.findById.mockResolvedValue(regionalAdmin);

            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([mockReclamations[0]])
                })
            });

            const res = await request(app).get('/api/admin/stats');

            expect(res.statusCode).toBe(200);
            // Vérifier que la requête find a bien reçu le filtre de région
            expect(Reclamation.find).toHaveBeenCalledWith(expect.objectContaining({
                gouvernorat: expect.any(Object) // Regex pour Sfax
            }));
        });

        it('devrait calculer correctement le temps moyen de traitement', async () => {
            User.findById.mockResolvedValue(mockAdmin);

            // r1: 2 jours (1er au 3), r4: 4 jours (1er au 5) -> Moyenne = 3 jours
            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockReclamations)
                })
            });

            const res = await request(app).get('/api/admin/stats');

            expect(res.statusCode).toBe(200);
            expect(res.body.averageProcessingTime).toBe(3);
        });
    });

    describe('Filtrage temporel', () => {
        it('devrait appliquer les filtres de date dans la requête', async () => {
            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([])
                })
            });

            const startDate = '2026-01-01';
            const endDate = '2026-01-31';

            await request(app).get(`/api/admin/stats?startDate=${startDate}&endDate=${endDate}`);

            expect(Reclamation.find).toHaveBeenCalledWith(expect.objectContaining({
                dateCreation: {
                    $gte: expect.any(Date),
                    $lte: expect.any(Date)
                }
            }));
        });
    });

    describe('Gestion des erreurs', () => {
        it('devrait retourner 500 en cas d\'erreur de base de données', async () => {
            User.findById.mockRejectedValue(new Error('DB Fail'));

            const res = await request(app).get('/api/admin/stats');

            expect(res.statusCode).toBe(500);
        });
    });

});
