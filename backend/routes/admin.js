const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Conventionne = require('../models/Conventionne');
const Reclamation = require('../models/Reclamation');
const Notification = require('../models/Notification');
const Governorate = require('../models/Governorate');
const bcrypt = require('bcryptjs');
const WaterBrand = require('../models/WaterBrand');
const ThermalBath = require('../models/ThermalBath');
const { sendAssignmentEmail, sendWelcomeEmail } = require('../utils/emailService');
const { generateReclamationPDF } = require('../utils/pdfGenerator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer for thermal bath photos
const bathUploadDir = path.join(__dirname, '../uploads/baths');
if (!fs.existsSync(bathUploadDir)) {
    fs.mkdirSync(bathUploadDir, { recursive: true });
}

const bathStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, bathUploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `bath-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadBath = multer({
    storage: bathStorage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports images!"));
    }
});

// Helper to log admin actions
const logAdminAction = (msg) => {
    console.log(`[ADMIN ACTION] ${new Date().toISOString()}: ${msg}`);
};

// Middleware to check if user is super_admin
const superAdminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'super_admin') {
            return res.status(403).json({ msg: 'Access denied. Super Admin only.' });
        }
        next();
    } catch (err) {
        console.error('SuperAdminAuth Error:', err.message);
        res.status(500).send('Server error');
    }
};

// Middleware to check if user is admin or super_admin
const adminAuth = async (req, res, next) => {
    try {
        console.log(`[AdminAuth] checking permissions for user ID: ${req.user ? req.user.id : 'undefined'}`);
        if (!req.user || !req.user.id) {
            console.warn('[AdminAuth] No user ID in request');
            return res.status(401).json({ msg: 'No user ID, authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            console.warn(`[AdminAuth] User not found in DB: ${req.user.id}`);
            return res.status(403).json({ msg: 'User not found' });
        }

        console.log(`[AdminAuth] User found: ${user.email}, Role: ${user.role}`);
        if (user.role !== 'super_admin' && user.role !== 'admin_regional' && user.role !== 'admin_tre') {
            console.warn(`[AdminAuth] Access denied for role: ${user.role}`);
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        next();
    } catch (err) {
        console.error('AdminAuth Error Details:', err);
        res.status(500).json({ msg: 'AdminAuth Server Error: ' + err.message });
    }
};

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Super Admin)
router.get('/users', [auth, superAdminAuth], async (req, res) => {
    try {
        logAdminAction('GET /api/admin/users: Fetching all users...');
        const users = await User.find().select('-password');
        logAdminAction(`GET /api/admin/users: Found ${users.length} users`);
        res.json(users);
    } catch (err) {
        logAdminAction(`GET Users Error: ${err.message}`);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/consumers
// @desc    Get only consumers
// @access  Private (Admin/Super Admin)
router.get('/consumers', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const query = { role: 'consommateur_simple' };

        if (user.role === 'admin_regional') {
            const adminGov = user.adresse?.ville; // The admin is assigned to a governorate name (e.g. Bizerte)
            if (adminGov) {
                query['adresse.region'] = { $regex: new RegExp(`^${adminGov.trim()}$`, 'i') };
            } else {
                return res.json([]); // Si l'admin n'a pas de région assignée
            }
        } else if (user.role === 'admin_tre') {
            query.isTRE = true;
        }

        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (err) {
        console.error('GET Consumers Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/conventionnes
// @desc    Get all conventionne partners (not a login user)
// @access  Private (Admin/Super Admin)
router.get('/conventionnes', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let query = {};

        if (user.role === 'admin_regional') {
            const adminRegion = user.adresse?.ville;
            if (adminRegion) {
                query.region = { $regex: new RegExp(`^${adminRegion.trim()}$`, 'i') };
            } else {
                return res.json([]);
            }
        } else if (user.role === 'admin_tre') {
            query.isTRE = true;
        }

        const conventionnes = await Conventionne.find(query).sort({ dateCreation: -1 });
        res.json(conventionnes);
    } catch (err) {
        logAdminAction(`GET Conventionnes Error: ${err.message}`);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// @route   GET api/admin/reclamations/pending
// @desc    Get reclamations pending assignment
// @access  Private (Admin/Super Admin)
router.get('/reclamations/pending', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const query = { statut: { $in: ['en_attente', 'deposee'] } };

        if (user.role === 'admin_regional') {
            const adminRegion = user.adresse?.ville;
            if (adminRegion) {
                query.gouvernorat = { $regex: new RegExp(`^${adminRegion.trim()}$`, 'i') };
            } else {
                return res.json([]);
            }
        } else if (user.role === 'admin_tre') {
            query.isTRE = true;
        }

        const reclamations = await Reclamation.find(query).populate('user', 'nom prenom email');
        res.json(reclamations);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/reclamations/complements
// @desc    Get reclamations with complement requests
// @access  Private (Admin/Super Admin)
router.get('/reclamations/complements', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const query = { statut: 'demande_complement' };

        if (user.role === 'admin_regional') {
            const adminRegion = user.adresse?.ville;
            if (adminRegion) {
                query.gouvernorat = { $regex: new RegExp(`^${adminRegion.trim()}$`, 'i') };
            } else {
                return res.json([]);
            }
        } else if (user.role === 'admin_tre') {
            query.isTRE = true;
        }

        const reclamations = await Reclamation.find(query).populate('user', 'nom prenom email');
        res.json(reclamations);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/reclamations/all
// @desc    Get ALL reclamations (filtered by region for admin_regional)
// @access  Private (Admin/Super Admin)
router.get('/reclamations/all', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const query = {};

        console.log(`[${new Date().toISOString()}] 🔍 GET /api/admin/reclamations/all`);
        console.log(`👤 User: ${user.email} | Role: ${user.role}`);

        if (user.role === 'admin_regional') {
            const adminRegion = user.adresse?.ville;
            if (adminRegion) {
                // Case-insensitive regex match for the governorate
                query.gouvernorat = { $regex: new RegExp(`^${adminRegion.trim()}$`, 'i') };
                console.log(`📍 Filtering by Region: ${adminRegion}`);
            } else {
                console.log('⚠️ Regional Admin has no region (ville) assigned!');
                return res.json([]);
            }
        } else if (user.role === 'admin_tre') {
            query.isTRE = true;
            console.log('📍 Filtering by TRE: true');
        }

        const reclamations = await Reclamation.find(query)
            .populate('user', '-password')
            .sort({ dateCreation: -1 });

        console.log(`📤 Found ${reclamations.length} reclamations`);
        res.json(reclamations);
    } catch (err) {
        console.error('❌ GET All Reclamations error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/reclamation/:id/mark-read
// @desc    Mark a reclamation as read
// @access  Private (Admin/Admin Regional/Super Admin)
router.put('/reclamation/:id/mark-read', [auth, adminAuth], async (req, res) => {
    try {
        const reclamation = await Reclamation.findById(req.params.id);
        if (!reclamation) return res.status(404).json({ msg: 'Reclamation not found' });

        const adminUser = await User.findById(req.user.id);
        if (adminUser.role === 'admin_regional') {
            const adminRegion = adminUser.adresse?.ville;
            if (!reclamation.gouvernorat || reclamation.gouvernorat.toLowerCase() !== adminRegion?.toLowerCase()) {
                return res.status(403).json({ msg: 'Accès refusé : Cette réclamation appartient à une autre région.' });
            }
        } else if (adminUser.role === 'admin_tre') {
            if (!reclamation.isTRE) {
                return res.status(403).json({ msg: 'Accès refusé : Cette réclamation ne concerne pas la diaspora.' });
            }
        }

        reclamation.lu = true;
        await reclamation.save();
        res.json(reclamation);
    } catch (err) {
        console.error('Mark Read Error:', err.message);

        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/reclamation/:id/assign
// @desc    Assign reclamation to a conventionne partner
// @access  Private (Admin/Super Admin)
router.put('/reclamation/:id/assign', [auth, adminAuth], async (req, res) => {
    try {
        const { conventionneId } = req.body;
        let reclamation = await Reclamation.findById(req.params.id);

        if (!reclamation) return res.status(404).json({ msg: 'Reclamation not found' });

        const adminUser = await User.findById(req.user.id);
        if (adminUser.role === 'admin_regional') {
            const adminRegion = adminUser.adresse?.ville;
            if (!reclamation.gouvernorat || reclamation.gouvernorat.toLowerCase() !== adminRegion?.toLowerCase()) {
                return res.status(403).json({ msg: 'Accès refusé : Cette réclamation appartient à une autre région.' });
            }
        } else if (adminUser.role === 'admin_tre') {
            if (!reclamation.isTRE) {
                return res.status(403).json({ msg: 'Accès refusé : Cette réclamation ne concerne pas la diaspora.' });
            }
        }

        const partner = await Conventionne.findById(conventionneId).select('nom email');
        if (!partner) return res.status(404).json({ msg: 'Partenaire conventionné introuvable' });

        reclamation.conventionne = conventionneId;
        reclamation.statut = 'affectee_conventionne';

        // Add to history
        reclamation.history.push({
            date: Date.now(),
            statut: 'affectee_conventionne',
            action: `Réclamation affectée au partenaire : ${partner.nom}`,
            updatedBy: req.user.id
        });

        await reclamation.save();

        // Send Email to the assigned partner with PDF attachment
        const emailTo = partner.email;
        if (emailTo) {
            try {
                // Generate PDF Buffer
                const pdfBuffer = await generateReclamationPDF(reclamation);

                // Send Email with attachment
                sendAssignmentEmail(emailTo, reclamation, partner, pdfBuffer).catch(emailErr => {
                    console.error('[AssignEmail] Background sending failed:', emailErr.message);
                });
            } catch (pdfErr) {
                console.error('[PDF Gen] Failed to generate PDF, sending email without attachment:', pdfErr);
                sendAssignmentEmail(emailTo, reclamation, partner).catch(emailErr => {
                    console.error('[AssignEmail] Background sending failed:', emailErr.message);
                });
            }
        } else {
            console.warn('[AssignEmail] No email found for partner:', partner.nom);
        }

        res.json(reclamation);
    } catch (err) {
        console.error('Assign Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/create-admin
// @desc    Create an admin user
// @access  Private (Super Admin)
router.post('/create-admin', [auth, superAdminAuth], async (req, res) => {
    const { nom, prenom, email, telephone, password, role, adresse } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            nom,
            prenom,
            email,
            telephone,
            password,
            role: role || 'admin_regional',
            adresse
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Send welcome email to the new admin
        try {
            sendWelcomeEmail(user.email, { nom: user.nom, prenom: user.prenom })
                .then(res => console.log('[AdminCreate] Welcome email sent to admin:', user.email))
                .catch(err => console.error('[AdminCreate] Welcome email failed:', err));
        } catch (emailErr) {
            console.error('[AdminCreate] Error initiating email:', emailErr);
        }

        res.json({ msg: 'Admin created successfully', user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/create-conventionne
// @desc    Create a conventionne partner (not a login user)
// @access  Private (Admin/Super Admin)
router.post('/create-conventionne', [auth, adminAuth], async (req, res) => {
    const { nom, email, region } = req.body;

    try {
        console.log(`[Partner Creation] Attempting for ${email} in region ${region}`);

        let existing = await Conventionne.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
            return res.status(400).json({ msg: 'Un partenaire existe déjà avec cet email' });
        }

        const creator = await User.findById(req.user.id);

        const newPartner = new Conventionne({
            nom,
            email: email.trim().toLowerCase(),
            region: region || (creator.role === 'admin_regional' ? creator.adresse?.ville : null),
            isTRE: creator.role === 'admin_tre',
            createdBy: req.user.id
        });

        await newPartner.save();

        console.log(`[Partner Creation] Success for ${email}`);
        res.json({ msg: 'Partenaire créé avec succès', partner: newPartner });
    } catch (err) {
        console.error('Partner Creation Error:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// @route   DELETE api/admin/conventionne/:id
// @desc    Delete a conventionne partner
// @access  Private (Admin/Super Admin)
router.delete('/conventionne/:id', [auth, adminAuth], async (req, res) => {
    try {
        await Conventionne.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Partenaire supprimé' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/admin/user/:id
// @desc    Delete user
// @access  Private (Super Admin)
router.delete('/user/:id', [auth, superAdminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error('DELETE User Error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/user/:id/toggle-status
// @desc    Activate or deactivate user account
// @access  Private (Admin/Super Admin)
router.put('/user/:id/toggle-status', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent deactivating yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot deactivate your own account' });
        }

        // Only Super Admin can deactivate other Admins
        const requester = await User.findById(req.user.id);
        const isAdminRole = (role) => ['super_admin', 'admin_regional', 'admin_tre'].includes(role);

        if (isAdminRole(user.role) && requester.role !== 'super_admin') {
            return res.status(403).json({ msg: 'Only Super Admin can deactivate other administrative accounts' });
        }

        user.isActive = !user.isActive;
        await user.save();

        logAdminAction(`${user.isActive ? 'ACTIVATED' : 'DEACTIVATED'} account for ${user.email} by ${requester.email}`);

        res.json({ msg: `Account ${user.isActive ? 'activated' : 'deactivated'} successfully`, isActive: user.isActive });
    } catch (err) {
        console.error('Toggle Status Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/user/:id
// @desc    Get user by ID
// @access  Private (Super Admin)
router.get('/user/:id', [auth, superAdminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('GET User Error:', err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/user/:id
// @desc    Update user details
// @access  Private (Super Admin)
router.put('/user/:id', [auth, superAdminAuth], async (req, res) => {
    const { nom, prenom, email, telephone, role, adresse } = req.body;

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Build update object
        if (nom) user.nom = nom;
        if (prenom) user.prenom = prenom;
        if (email) user.email = email;
        if (telephone) user.telephone = telephone;
        if (role) user.role = role; // Allow role update here too
        if (adresse) {
            if (adresse.ville) user.adresse.ville = adresse.ville;
            if (adresse.region) user.adresse.region = adresse.region;
            if (adresse.codePostal) user.adresse.codePostal = adresse.codePostal;
        }

        await user.save();
        res.json({ msg: 'User updated successfully', user });
    } catch (err) {
        console.error('UPDATE User Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/user/:id/role
// @desc    Update user role
// @access  Private (Super Admin)
router.put('/user/:id/role', [auth, superAdminAuth], async (req, res) => {
    try {
        const { role } = req.body;

        // Validate role
        const validRoles = ['super_admin', 'admin_regional', 'admin_tre', 'consommateur_simple', 'conventionne'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ msg: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent downgrading yourself if you are the only super admin (optional but good practice)
        // For now just allow it but maybe warn?

        user.role = role;
        await user.save();

        res.json({ msg: 'User role updated', user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('UPDATE Role Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/reclamation/:id/status
// @desc    Explicitly update a reclamation's status (admin action)
// @access  Private (Admin/Super Admin)
router.put('/reclamation/:id/status', [auth, adminAuth], async (req, res) => {
    try {
        const { statut, comment } = req.body;
        const validStatuts = ['deposee', 'en_cours', 'affectee_conventionne', 'resolue', 'fermee', 'rejete', 'demande_complement'];
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ msg: 'Statut invalide.' });
        }

        const reclamation = await Reclamation.findById(req.params.id);
        if (!reclamation) return res.status(404).json({ msg: 'Réclamation non trouvée.' });

        const adminUser = await User.findById(req.user.id);
        if (adminUser.role === 'admin_regional') {
            const adminRegion = adminUser.adresse?.ville;
            if (!reclamation.gouvernorat || reclamation.gouvernorat.toLowerCase() !== adminRegion?.toLowerCase()) {
                return res.status(403).json({ msg: 'Accès refusé : Cette réclamation appartient à une autre région.' });
            }
        } else if (adminUser.role === 'admin_tre') {
            if (!reclamation.isTRE) {
                return res.status(403).json({ msg: 'Accès refusé : Cette réclamation ne concerne pas la diaspora.' });
            }
        }

        const oldStatut = reclamation.statut;
        reclamation.statut = statut;

        // Set dateResolution if moving to a final status
        const terminalStatuses = ['resolue', 'rejete', 'fermee']; // 'traitee' replaced by 'resolue' or 'fermee'
        if (terminalStatuses.includes(statut) && !terminalStatuses.includes(oldStatut)) {
            reclamation.dateResolution = Date.now();
        } else if (!terminalStatuses.includes(statut) && terminalStatuses.includes(oldStatut)) {
            reclamation.dateResolution = undefined;
        }

        const statusLabels = {
            'deposee': 'Déposée',
            'en_cours': 'En cours de traitement',
            'affectee_conventionne': 'Affectée à un conventionné',
            'demande_complement': 'Complément de dossier requis',
            'resolue': 'Résolue',
            'fermee': 'Fermée',
            'rejete': 'Rejetée'
        };

        // Add to history
        reclamation.history.push({
            date: Date.now(),
            statut: statut,
            action: comment || `Mise à jour du statut par l'administration : ${statusLabels[statut]}`,
            updatedBy: req.user.id
        });

        await reclamation.save();

        // Notify the consumer only if status actually changed
        if (oldStatut !== statut) {
            const newNotification = new Notification({
                user: reclamation.user,
                message: `Le statut de votre réclamation ${reclamation.trackingCode} a été mis à jour : "${statusLabels[statut] || statut}".`,
                reclamationId: reclamation._id,
                type: 'status_update'
            });
            await newNotification.save();
        }

        res.json({ msg: 'Statut mis à jour avec succès.', statut: reclamation.statut });
    } catch (err) {
        console.error('UPDATE Status Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin/Super Admin)
router.get('/stats', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { startDate, endDate, region, consumerType } = req.query;

        let query = {};

        // 1. Role-based regional filtering
        if (user.role === 'admin_regional') {
            const adminRegion = user.adresse?.ville;
            if (adminRegion) {
                query.gouvernorat = { $regex: new RegExp(`^${adminRegion.trim()}$`, 'i') };
            } else {
                return res.json({
                    volumeByCategory: [],
                    statusDistribution: [],
                    averageProcessingTime: 0,
                    resolutionRate: 0,
                    totalCount: 0
                });
            }
        } else if (user.role === 'admin_tre') {
            query.isTRE = true;
        }

        // 2. Applied Filters
        if (region) {
            query.gouvernorat = region;
        }

        if (consumerType) {
            query.complainantType = consumerType;
        }

        if (startDate || endDate) {
            query.dateCreation = {};
            if (startDate) {
                query.dateCreation.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.dateCreation.$lte = end;
            }
        }

        // 3. Aggregate Data
        const allReclamations = await Reclamation.find(query)
            .populate('user', 'nom prenom email telephone role')
            .sort({ dateCreation: -1 });

        // A. Volume by Category (secteur)
        const categoryCounts = {};
        allReclamations.forEach(r => {
            const cat = r.secteur || 'Autre';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        const volumeByCategory = Object.keys(categoryCounts).map(name => ({ name, value: categoryCounts[name] }));

        // B. Status Distribution
        const statusCounts = {};
        allReclamations.forEach(r => {
            const status = r.statut || 'deposee';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        const statusDistribution = Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] }));

        // C. Average Processing Time (in days)
        const terminalStatuses = ['traitee', 'resolue', 'fermee', 'rejete'];
        const resolvedReclamations = allReclamations.filter(r => (r.dateResolution || terminalStatuses.includes(r.statut)) && r.dateCreation);

        let averageProcessingTime = 0;
        if (resolvedReclamations.length > 0) {
            const totalTime = resolvedReclamations.reduce((acc, r) => {
                // If dateResolution is missing but status is terminal, use current date or 3 days as fallback
                const end = r.dateResolution ? new Date(r.dateResolution) : new Date();
                const diff = end - new Date(r.dateCreation);
                return acc + (diff > 0 ? diff : 0);
            }, 0);
            averageProcessingTime = (totalTime / resolvedReclamations.length) / (1000 * 60 * 60 * 24);
        }

        // D. Resolution Rate
        const resolvedCount = allReclamations.filter(r => terminalStatuses.includes(r.statut)).length;
        const resolutionRate = allReclamations.length > 0 ? (resolvedCount / allReclamations.length) * 100 : 0;

        // E. Average Processing Time per Category
        const sectorProcessingTimes = {};
        allReclamations.forEach(r => {
            if (r.secteur && (r.dateResolution || terminalStatuses.includes(r.statut)) && r.dateCreation) {
                const end = r.dateResolution ? new Date(r.dateResolution) : new Date();
                const diff = (end - new Date(r.dateCreation)) / (1000 * 60 * 60 * 24);
                if (!sectorProcessingTimes[r.secteur]) {
                    sectorProcessingTimes[r.secteur] = { total: 0, count: 0 };
                }
                sectorProcessingTimes[r.secteur].total += diff;
                sectorProcessingTimes[r.secteur].count += 1;
            }
        });
        const avgProcessingPerCategory = Object.keys(sectorProcessingTimes).map(name => ({
            name,
            value: parseFloat((sectorProcessingTimes[name].total / sectorProcessingTimes[name].count).toFixed(2))
        }));

        res.json({
            volumeByCategory,
            statusDistribution,
            averageProcessingTime: parseFloat(averageProcessingTime.toFixed(2)),
            resolutionRate: parseFloat(resolutionRate.toFixed(2)),
            avgProcessingPerCategory,
            totalCount: allReclamations.length,
            reclamations: allReclamations
        });


    } catch (err) {
        console.error('Stats Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/water-brands
// @desc    Add a new water brand
// @access  Private (Super Admin)
router.post('/water-brands', [auth, superAdminAuth], async (req, res) => {
    const { marque, tds, ph, nitrates, notes } = req.body;
    try {
        let brand = await WaterBrand.findOne({ marque });
        if (brand) {
            return res.status(400).json({ msg: 'Cette marque existe déjà' });
        }

        brand = new WaterBrand({ marque, tds, ph, nitrates, notes });
        await brand.save();
        res.json(brand);
    } catch (err) {
        console.error('POST WaterBrand Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/water-brand/:id
// @desc    Update a water brand
// @access  Private (Super Admin)
router.put('/water-brand/:id', [auth, superAdminAuth], async (req, res) => {
    const { marque, tds, ph, nitrates, notes } = req.body;
    try {
        let brand = await WaterBrand.findById(req.params.id);
        if (!brand) return res.status(404).json({ msg: 'Marque non trouvée' });

        if (marque) brand.marque = marque;
        if (tds) brand.tds = tds;
        if (ph) brand.ph = ph;
        if (nitrates) brand.nitrates = nitrates;
        if (notes) brand.notes = notes;

        await brand.save();
        res.json(brand);
    } catch (err) {
        console.error('PUT WaterBrand Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/admin/water-brand/:id
// @desc    Delete a water brand
// @access  Private (Super Admin)
router.delete('/water-brand/:id', [auth, superAdminAuth], async (req, res) => {
    try {
        const brand = await WaterBrand.findById(req.params.id);
        if (!brand) return res.status(404).json({ msg: 'Marque non trouvée' });

        await WaterBrand.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Marque supprimée' });
    } catch (err) {
        console.error('DELETE WaterBrand Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/thermal-baths
// @desc    Add a new thermal bath
// @access  Private (Super Admin)
router.post('/thermal-baths', [auth, superAdminAuth], async (req, res) => {
    const { name, location, temperature, indications, description, type, trustScore, rating, imageUrl } = req.body;
    try {
        let bath = await ThermalBath.findOne({ name });
        if (bath) {
            return res.status(400).json({ msg: 'Cette station existe déjà' });
        }

        bath = new ThermalBath({ name, location, temperature, indications, description, type, trustScore, rating, imageUrl });
        await bath.save();
        res.json(bath);
    } catch (err) {
        console.error('POST ThermalBath Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/thermal-bath/:id
// @desc    Update a thermal bath
// @access  Private (Super Admin)
router.put('/thermal-bath/:id', [auth, superAdminAuth], async (req, res) => {
    const { name, location, temperature, indications, description, type, trustScore, rating, imageUrl } = req.body;
    try {
        let bath = await ThermalBath.findById(req.params.id);
        if (!bath) return res.status(404).json({ msg: 'Station non trouvée' });

        if (name) bath.name = name;
        if (location) bath.location = location;
        if (temperature) bath.temperature = temperature;
        if (indications) bath.indications = indications;
        if (description) bath.description = description;
        if (type) bath.type = type;
        if (trustScore !== undefined) bath.trustScore = trustScore;
        if (rating !== undefined) bath.rating = rating;
        if (imageUrl !== undefined) bath.imageUrl = imageUrl;

        await bath.save();
        res.json(bath);
    } catch (err) {
        console.error('PUT ThermalBath Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/admin/thermal-bath/:id
// @desc    Delete a thermal bath
// @access  Private (Super Admin)
router.delete('/thermal-bath/:id', [auth, superAdminAuth], async (req, res) => {
    try {
        const bath = await ThermalBath.findById(req.params.id);
        if (!bath) return res.status(404).json({ msg: 'Station non trouvée' });

        await ThermalBath.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Station supprimée' });
    } catch (err) {
        console.error('DELETE ThermalBath Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/thermal-baths/upload-image
// @desc    Upload thermal bath image
// @access  Private (Super Admin)
router.post('/thermal-baths/upload-image', [auth, superAdminAuth, uploadBath.single('image')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Veuillez sélectionner une image" });
        }
        // Generate the URL dynamically based on current protocol and host (works for localhost, local network IPs, and production deployment)
        const host = req.get('host');
        const imageUrl = `${req.protocol}://${host}/uploads/baths/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error('Image Upload Error:', err.message);
        res.status(500).json({ msg: "Erreur lors du téléchargement de l'image" });
    }
});

module.exports = router;
