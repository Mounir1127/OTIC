const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
        const user = await User.findById(req.user.id);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        console.error('AdminAuth Error:', err.message);
        res.status(500).send('Server error');
    }
};

const Reclamation = require('../models/Reclamation');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Super Admin)
router.get('/users', [auth, superAdminAuth], async (req, res) => {
    try {
        console.log('GET /api/admin/users: Fetching all users...');
        const users = await User.find().select('-password');
        console.log(`GET /api/admin/users: Found ${users.length} users`);
        res.json(users);
    } catch (err) {
        console.error('GET Users Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/consumers
// @desc    Get only consumers
// @access  Private (Admin/Super Admin)
router.get('/consumers', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find({ role: 'consommateur_simple' }).select('-password');
        res.json(users);
    } catch (err) {
        console.error('GET Consumers Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/conventionnes
// @desc    Get all conventionne partners
// @access  Private (Admin/Super Admin)
router.get('/conventionnes', [auth, adminAuth], async (req, res) => {
    try {
        const conventionnes = await User.find({ role: 'conventionne' }).select('-password');
        res.json(conventionnes);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/reclamations/pending
// @desc    Get reclamations pending assignment
// @access  Private (Admin/Super Admin)
router.get('/reclamations/pending', [auth, adminAuth], async (req, res) => {
    try {
        const reclamations = await Reclamation.find({ statut: 'en_attente' }).populate('user', 'nom prenom email');
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
        const reclamations = await Reclamation.find({ statut: 'demande_complement' }).populate('user', 'nom prenom email');
        res.json(reclamations);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/reclamation/:id/assign
// @desc    Assign reclamation to a conventionne
// @access  Private (Admin/Super Admin)
router.put('/reclamation/:id/assign', [auth, adminAuth], async (req, res) => {
    try {
        const { conventionneId } = req.body;
        let reclamation = await Reclamation.findById(req.params.id);

        if (!reclamation) return res.status(404).json({ msg: 'Reclamation not found' });

        reclamation.conventionne = conventionneId;
        reclamation.statut = 'en_cours';
        await reclamation.save();

        res.json(reclamation);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/create-admin
// @desc    Create an admin user
// @access  Private (Super Admin)
router.post('/create-admin', [auth, superAdminAuth], async (req, res) => {
    const { nom, prenom, email, telephone, password, adresse } = req.body;

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
            role: 'admin',
            adresse
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.json({ msg: 'Admin created successfully', user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
