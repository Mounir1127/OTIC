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

// Mock Governorate Model
jest.mock('../models/Governorate');
const Governorate = require('../models/Governorate');

// Mock Conventionne Model
jest.mock('../models/Conventionne');
const Conventionne = require('../models/Conventionne');

// Mock Notification Model
jest.mock('../models/Notification');
const Notification = require('../models/Notification');

// Mock QRCode
jest.mock('qrcode', () => ({
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,MOCK_QR_CODE')
}));

// Mock multer to bypass file upload
jest.mock('multer', () => {
    const multerInstance = {
        array: () => (req, res, next) => {
            req.files = [];
            next();
        },
        single: () => (req, res, next) => next()
    };
    const mockMulter = () => multerInstance;
    mockMulter.diskStorage = () => ({});
    return mockMulter;
});

// Mock email service
jest.mock('../utils/emailService', () => ({
    sendAssignmentEmail: jest.fn().mockResolvedValue({}),
    sendWelcomeEmail: jest.fn().mockResolvedValue({}),
    sendStatusUpdateEmail: jest.fn().mockResolvedValue({}),
    sendResetLinkEmail: jest.fn().mockResolvedValue({})
}));

// Mock pdf generator
jest.mock('../utils/pdfGenerator', () => ({
    generateReclamationPDF: jest.fn().mockResolvedValue(Buffer.from('mock-pdf'))
}));

// Mock Auth Middleware
jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
    req.user = { id: 'user123' };
    next();
}));

// ────────────────────────────────────────────────────
// APP SETUP
// ────────────────────────────────────────────────────
const app = express();
app.use(express.json());

const reclamationRoutes = require('../routes/reclamations');
const adminRoutes = require('../routes/admin');

app.use('/api/reclamations', reclamationRoutes);
app.use('/api/admin', adminRoutes);

// ════════════════════════════════════════════════════
// TESTS — GESTION DES RÉCLAMATIONS
// ════════════════════════════════════════════════════

describe('Gestion des Réclamations — Tests Unitaires', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────────────
    // 1. CRÉATION DE RÉCLAMATION
    // ──────────────────────────────────────────────────
    describe('POST /api/reclamations — Créer une réclamation', () => {

        it('devrait créer une réclamation avec tous les champs obligatoires', async () => {
            const mockUser = {
                _id: 'user123',
                adresse: { ville: 'Tunis' }
            };
            User.findById.mockResolvedValue(mockUser);
            Governorate.findOne.mockResolvedValue({ governorate: 'Tunis' });
            Reclamation.countDocuments.mockResolvedValue(5);

            const mockSaved = {
                _id: 'rec001',
                trackingCode: 'REC-2026-0006',
                type: 'Produit',
                secteur: 'Produits alimentaires et agroalimentaires',
                sous_secteur: 'Produits laitiers',
                statut: 'deposee',
                user: 'user123',
                qrCode: 'data:image/png;base64,MOCK_QR_CODE',
                save: jest.fn().mockResolvedValue(true)
            };

            // Mock the Reclamation constructor
            Reclamation.mockImplementation(() => mockSaved);

            const res = await request(app)
                .post('/api/reclamations')
                .set('x-auth-token', 'valid-token')
                .send({
                    type: 'Produit',
                    secteur: 'Produits alimentaires et agroalimentaires',
                    sous_secteur: 'Produits laitiers',
                    description: 'Produit périmé acheté au supermarché',
                    operateur: 'Magasin Général',
                    natures: '["Qualité", "Sécurité"]'
                });

            expect(res.statusCode).toBe(200);
            expect(mockSaved.save).toHaveBeenCalled();
        });

        it('devrait retourner 400 si les champs obligatoires sont manquants', async () => {
            const res = await request(app)
                .post('/api/reclamations')
                .set('x-auth-token', 'valid-token')
                .send({
                    type: 'Produit'
                    // secteur et sous_secteur manquants
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('champs obligatoires');
        });

        it('devrait générer un code de suivi unique au format REC-YYYY-XXXX', async () => {
            const mockUser = { _id: 'user123', adresse: { ville: 'Sfax' } };
            User.findById.mockResolvedValue(mockUser);
            Governorate.findOne.mockResolvedValue({ governorate: 'Sfax' });
            Reclamation.countDocuments.mockResolvedValue(42);

            let capturedInstance = null;
            Reclamation.mockImplementation(function (data) {
                capturedInstance = data;
                this._id = 'rec_new';
                Object.assign(this, data);
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });

            const res = await request(app)
                .post('/api/reclamations')
                .set('x-auth-token', 'valid-token')
                .send({
                    type: 'Service',
                    secteur: 'Services financiers',
                    sous_secteur: 'Banques',
                    description: 'Problème avec virement bancaire',
                    operateur: 'BIAT'
                });

            expect(res.statusCode).toBe(200);
            expect(capturedInstance.trackingCode).toMatch(/^REC-\d{4}-\d{4}$/);
        });

        it('devrait initialiser le statut à "deposee" par défaut', async () => {
            const mockUser = { _id: 'user123', adresse: { ville: 'Nabeul' } };
            User.findById.mockResolvedValue(mockUser);
            Governorate.findOne.mockResolvedValue({ governorate: 'Nabeul' });
            Reclamation.countDocuments.mockResolvedValue(0);

            let capturedInstance = null;
            Reclamation.mockImplementation(function (data) {
                capturedInstance = data;
                this._id = 'rec_new';
                Object.assign(this, data);
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });

            await request(app)
                .post('/api/reclamations')
                .set('x-auth-token', 'valid-token')
                .send({
                    type: 'Produit',
                    secteur: 'Produits industriels de consommation',
                    sous_secteur: 'Électroménager',
                    description: 'Lave-vaisselle en panne',
                    operateur: 'Samsung'
                });

            expect(capturedInstance.statut).toBe('deposee');
        });

        it('devrait créer un historique initial avec l\'action "Réclamation déposée"', async () => {
            const mockUser = { _id: 'user123', adresse: { ville: 'Bizerte' } };
            User.findById.mockResolvedValue(mockUser);
            Governorate.findOne.mockResolvedValue({ governorate: 'Bizerte' });
            Reclamation.countDocuments.mockResolvedValue(0);

            let capturedInstance = null;
            Reclamation.mockImplementation(function (data) {
                capturedInstance = data;
                this._id = 'rec_new';
                Object.assign(this, data);
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });

            await request(app)
                .post('/api/reclamations')
                .set('x-auth-token', 'valid-token')
                .send({
                    type: 'Service',
                    secteur: 'Services de transport',
                    sous_secteur: 'Transport public',
                    description: 'Bus en retard',
                    operateur: 'TCV'
                });

            expect(capturedInstance.history).toBeDefined();
            expect(capturedInstance.history.length).toBe(1);
            expect(capturedInstance.history[0].statut).toBe('deposee');
            expect(capturedInstance.history[0].action).toContain('Réclamation déposée');
        });
    });

    // ──────────────────────────────────────────────────
    // 2. CONSULTATION DES RÉCLAMATIONS
    // ──────────────────────────────────────────────────
    describe('GET /api/reclamations/me — Mes réclamations', () => {

        it('devrait retourner les réclamations de l\'utilisateur connecté', async () => {
            const mockReclamations = [
                { _id: 'rec1', trackingCode: 'REC-2026-0001', type: 'Produit', statut: 'deposee' },
                { _id: 'rec2', trackingCode: 'REC-2026-0002', type: 'Service', statut: 'en_cours' }
            ];

            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockReclamations)
                })
            });

            const res = await request(app)
                .get('/api/reclamations/me')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].trackingCode).toBe('REC-2026-0001');
        });

        it('devrait retourner un tableau vide si aucune réclamation', async () => {
            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([])
                })
            });

            const res = await request(app)
                .get('/api/reclamations/me')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe('GET /api/reclamations/:id — Détails d\'une réclamation', () => {

        it('devrait retourner une réclamation par son ID', async () => {
            const mockRec = {
                _id: 'rec123',
                trackingCode: 'REC-2026-0010',
                type: 'Produit',
                secteur: 'Produits alimentaires',
                statut: 'en_cours',
                user: { _id: 'user123', nom: 'Test', prenom: 'User' }
            };

            Reclamation.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockRec)
            });

            const res = await request(app)
                .get('/api/reclamations/rec123')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body.trackingCode).toBe('REC-2026-0010');
        });

        it('devrait retourner 404 si la réclamation n\'existe pas', async () => {
            Reclamation.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const res = await request(app)
                .get('/api/reclamations/nonexistent')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(404);
            expect(res.body.msg).toContain('non trouvée');
        });
    });

    // ──────────────────────────────────────────────────
    // 3. ADMINISTRATION — MISE À JOUR DU STATUT
    // ──────────────────────────────────────────────────
    describe('PUT /api/admin/reclamation/:id/status — Mise à jour statut', () => {

        const mockAdmin = {
            _id: 'user123',
            email: 'admin@otic.tn',
            role: 'super_admin',
            adresse: { ville: 'Tunis' }
        };

        beforeEach(() => {
            // Default: admin is super_admin
            User.findById.mockResolvedValue(mockAdmin);
        });

        it('devrait mettre à jour le statut de "deposee" à "en_cours"', async () => {
            const mockRec = {
                _id: 'rec100',
                statut: 'deposee',
                trackingCode: 'REC-2026-0100',
                user: 'consumer1',
                history: [],
                save: jest.fn().mockResolvedValue(true)
            };

            Reclamation.findById.mockResolvedValue(mockRec);

            // Mock Notification constructor
            Notification.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });

            // Mock consumer fetched for email
            User.findById.mockImplementation((id) => {
                if (id === 'user123') return Promise.resolve(mockAdmin);
                if (id === 'consumer1') return Promise.resolve({ _id: 'consumer1', email: 'consumer@mail.com' });
                return Promise.resolve(null);
            });

            const res = await request(app)
                .put('/api/admin/reclamation/rec100/status')
                .send({ statut: 'en_cours' });

            expect(res.statusCode).toBe(200);
            expect(mockRec.statut).toBe('en_cours');
            expect(mockRec.save).toHaveBeenCalled();
            expect(mockRec.history.length).toBe(1);
        });

        it('devrait mettre à jour le statut vers "resolue" et définir dateResolution', async () => {
            const mockRec = {
                _id: 'rec101',
                statut: 'en_cours',
                trackingCode: 'REC-2026-0101',
                user: 'consumer1',
                history: [],
                save: jest.fn().mockResolvedValue(true)
            };

            Reclamation.findById.mockResolvedValue(mockRec);
            Notification.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });
            User.findById.mockImplementation((id) => {
                if (id === 'user123') return Promise.resolve(mockAdmin);
                if (id === 'consumer1') return Promise.resolve({ _id: 'consumer1', email: 'c@mail.com' });
                return Promise.resolve(null);
            });

            const res = await request(app)
                .put('/api/admin/reclamation/rec101/status')
                .send({ statut: 'resolue' });

            expect(res.statusCode).toBe(200);
            expect(mockRec.statut).toBe('resolue');
            expect(mockRec.dateResolution).toBeDefined();
        });

        it('devrait refuser la modification d\'une réclamation déjà résolue', async () => {
            const mockRec = {
                _id: 'rec102',
                statut: 'resolue',
                trackingCode: 'REC-2026-0102',
                user: 'consumer1',
                history: [],
                save: jest.fn()
            };

            Reclamation.findById.mockResolvedValue(mockRec);

            const res = await request(app)
                .put('/api/admin/reclamation/rec102/status')
                .send({ statut: 'en_cours' });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('ne peut plus être modifiée');
            expect(mockRec.save).not.toHaveBeenCalled();
        });

        it('devrait refuser la modification d\'une réclamation rejetée', async () => {
            const mockRec = {
                _id: 'rec103',
                statut: 'rejete',
                trackingCode: 'REC-2026-0103',
                user: 'consumer1',
                history: [],
                save: jest.fn()
            };

            Reclamation.findById.mockResolvedValue(mockRec);

            const res = await request(app)
                .put('/api/admin/reclamation/rec103/status')
                .send({ statut: 'en_cours' });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('ne peut plus être modifiée');
        });

        it('devrait refuser le retour en arrière d\'un dossier affecté', async () => {
            const mockRec = {
                _id: 'rec104',
                statut: 'affectee_conventionne',
                trackingCode: 'REC-2026-0104',
                user: 'consumer1',
                history: [],
                save: jest.fn()
            };

            Reclamation.findById.mockResolvedValue(mockRec);

            const res = await request(app)
                .put('/api/admin/reclamation/rec104/status')
                .send({ statut: 'deposee' });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('ne peut plus repasser');
        });

        it('devrait refuser un statut invalide', async () => {
            const res = await request(app)
                .put('/api/admin/reclamation/rec105/status')
                .send({ statut: 'statut_inexistant' });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('invalide');
        });

        it('devrait retourner 404 si la réclamation n\'existe pas', async () => {
            Reclamation.findById.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/admin/reclamation/nonexistent/status')
                .send({ statut: 'en_cours' });

            expect(res.statusCode).toBe(404);
        });
    });

    // ──────────────────────────────────────────────────
    // 4. AFFECTATION AU PARTENAIRE CONVENTIONNÉ
    // ──────────────────────────────────────────────────
    describe('PUT /api/admin/reclamation/:id/assign — Affectation', () => {

        const mockAdmin = {
            _id: 'user123',
            email: 'admin@otic.tn',
            role: 'super_admin',
            adresse: { ville: 'Tunis' }
        };

        it('devrait affecter une réclamation à un partenaire conventionné', async () => {
            const mockRec = {
                _id: 'rec200',
                statut: 'deposee',
                trackingCode: 'REC-2026-0200',
                user: 'consumer1',
                gouvernorat: 'Tunis',
                history: [],
                save: jest.fn().mockResolvedValue(true)
            };

            const mockPartner = {
                _id: 'conv001',
                nom: 'Expert Qualité Tunis',
                email: 'expert@partner.tn'
            };

            User.findById.mockImplementation((id) => {
                if (id === 'user123') return Promise.resolve(mockAdmin);
                if (id === 'consumer1') return Promise.resolve({ _id: 'consumer1', email: 'c@mail.com' });
                return Promise.resolve(null);
            });
            Reclamation.findById.mockResolvedValue(mockRec);
            Conventionne.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockPartner)
            });
            Notification.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });

            const res = await request(app)
                .put('/api/admin/reclamation/rec200/assign')
                .send({ conventionneId: 'conv001' });

            expect(res.statusCode).toBe(200);
            expect(mockRec.statut).toBe('affectee_conventionne');
            expect(mockRec.conventionne).toBe('conv001');
            expect(mockRec.history.length).toBe(1);
            expect(mockRec.history[0].action).toContain('Expert Qualité Tunis');
            expect(mockRec.save).toHaveBeenCalled();
        });

        it('devrait retourner 404 si le partenaire n\'existe pas', async () => {
            const mockRec = {
                _id: 'rec201',
                statut: 'deposee',
                gouvernorat: 'Tunis',
                user: 'consumer1',
                history: [],
                save: jest.fn()
            };

            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.findById.mockResolvedValue(mockRec);
            Conventionne.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            const res = await request(app)
                .put('/api/admin/reclamation/rec201/assign')
                .send({ conventionneId: 'nonexistent' });

            expect(res.statusCode).toBe(404);
            expect(res.body.msg).toContain('introuvable');
        });

        it('devrait retourner 404 si la réclamation n\'existe pas', async () => {
            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.findById.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/admin/reclamation/nonexistent/assign')
                .send({ conventionneId: 'conv001' });

            expect(res.statusCode).toBe(404);
        });
    });

    // ──────────────────────────────────────────────────
    // 5. MARQUAGE LU/NON LU
    // ──────────────────────────────────────────────────
    describe('PUT /api/admin/reclamation/:id/mark-read — Marquer comme lu', () => {

        it('devrait marquer une réclamation comme lue', async () => {
            const mockAdmin = {
                _id: 'user123',
                role: 'super_admin',
                adresse: { ville: 'Tunis' }
            };

            const mockRec = {
                _id: 'rec300',
                lu: false,
                gouvernorat: 'Tunis',
                save: jest.fn().mockResolvedValue(true)
            };

            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.findById.mockResolvedValue(mockRec);

            const res = await request(app)
                .put('/api/admin/reclamation/rec300/mark-read');

            expect(res.statusCode).toBe(200);
            expect(mockRec.lu).toBe(true);
            expect(mockRec.save).toHaveBeenCalled();
        });

        it('devrait refuser l\'accès à un admin régional hors périmètre', async () => {
            const mockAdmin = {
                _id: 'user123',
                role: 'admin_regional',
                adresse: { ville: 'Sfax' }
            };

            const mockRec = {
                _id: 'rec301',
                lu: false,
                gouvernorat: 'Tunis',
                save: jest.fn()
            };

            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.findById.mockResolvedValue(mockRec);

            const res = await request(app)
                .put('/api/admin/reclamation/rec301/mark-read');

            expect(res.statusCode).toBe(403);
            expect(res.body.msg).toContain('autre région');
        });
    });

    // ──────────────────────────────────────────────────
    // 6. RÉCLAMATIONS ADMIN — LISTE COMPLÈTE & FILTRAGE
    // ──────────────────────────────────────────────────
    describe('GET /api/admin/reclamations/all — Liste admin', () => {

        it('devrait retourner toutes les réclamations pour super_admin', async () => {
            const mockAdmin = {
                _id: 'user123',
                email: 'admin@otic.tn',
                role: 'super_admin',
                adresse: { ville: 'Tunis' }
            };

            const mockReclamations = [
                { _id: 'r1', trackingCode: 'REC-2026-0001', statut: 'deposee' },
                { _id: 'r2', trackingCode: 'REC-2026-0002', statut: 'en_cours' },
                { _id: 'r3', trackingCode: 'REC-2026-0003', statut: 'resolue' }
            ];

            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockReclamations)
                })
            });

            const res = await request(app)
                .get('/api/admin/reclamations/all')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(3);
        });
    });

    describe('GET /api/admin/reclamations/pending — Réclamations en attente', () => {

        it('devrait retourner les réclamations en attente d\'affectation', async () => {
            const mockAdmin = {
                _id: 'user123',
                email: 'admin@otic.tn',
                role: 'super_admin',
                adresse: { ville: 'Tunis' }
            };

            const mockPending = [
                { _id: 'p1', trackingCode: 'REC-2026-0050', statut: 'deposee' },
                { _id: 'p2', trackingCode: 'REC-2026-0051', statut: 'deposee' }
            ];

            User.findById.mockResolvedValue(mockAdmin);
            Reclamation.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPending)
            });

            const res = await request(app)
                .get('/api/admin/reclamations/pending')
                .set('x-auth-token', 'valid-token');

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });
});
