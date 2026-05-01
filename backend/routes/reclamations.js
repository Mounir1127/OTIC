const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reclamation = require('../models/Reclamation');
const User = require('../models/User');
const Governorate = require('../models/Governorate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// @route   GET api/reclamations/me
// @desc    Get current user's reclamations
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        console.log('🔍 GET /api/reclamations/me - User:', req.user.id);
        const reclamations = await Reclamation.find({ user: req.user.id })
            .populate('user', '-password')
            .sort({ dateCreation: -1 });
        console.log('📤 Sending reclamations count:', reclamations.length);
        res.json(reclamations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/reclamations
// @desc    Create a new reclamation
// @access  Private
router.post('/', [auth, upload.array('preuves', 10)], async (req, res) => {
    try {
        const {
            type, secteur, sous_secteur, activite,
            autre_nature, description, operateur,
            complainantType, raison_sociale, matricule_fiscal
        } = req.body;

        // Clean up natures since formData might send natures as a single string or an array
        let natures = [];
        if (req.body['natures[]']) {
            natures = Array.isArray(req.body['natures[]']) ? req.body['natures[]'] : [req.body['natures[]']];
        } else if (req.body.natures) {
            try {
                // In case it was JSON.stringified
                natures = JSON.parse(req.body.natures);
            } catch {
                natures = Array.isArray(req.body.natures) ? req.body.natures : [req.body.natures];
            }
        }

        const preuves = req.files ? req.files.map(f => f.filename) : [];

        // Log incoming data for debugging
        console.log('📝 Creating Reclamation for user:', req.user.id);
        console.log('📦 Payload:', {
            type, secteur, sous_secteur,
            natures_count: natures?.length,
            preuves_count: preuves?.length
        });

        // Validate required fields
        if (!type || !secteur || !sous_secteur) {
            console.log('❌ Missing required fields for reclamation');
            return res.status(400).json({ msg: 'Veuillez remplir tous les champs obligatoires (Type, Secteur, Sous-secteur).' });
        }

        // Generate Tracking Code (REC-YYYY-XXXX)
        const year = new Date().getFullYear();
        const count = await Reclamation.countDocuments() + 1;
        const trackingCode = `REC-${year}-${count.toString().padStart(4, '0')}`;

        console.log('🔢 Generated Tracking Code:', trackingCode);

        // Fetch user's profile to get their region/governorate if not provided
        let reclamationGouvernorat = req.body.gouvernorat;
        if (!reclamationGouvernorat) {
            const user = await User.findById(req.user.id);
            const city = user.adresse?.ville;

            // Lookup parent governorate for the city
            const govResult = await Governorate.findOne({ 'delegations.name': city });
            reclamationGouvernorat = govResult ? govResult.governorate : city;
        }

        const newReclamation = new Reclamation({
            user: req.user.id,
            trackingCode,
            type,
            secteur,
            sous_secteur,
            activite,
            natures,
            autre_nature,
            description,
            operateur,
            preuves,
            gouvernorat: reclamationGouvernorat,
            complainantType,
            raison_sociale,
            matricule_fiscal,
            isTRE: req.body.isTRE === 'true',
            treCategory: req.body.treCategory,
            statut: 'deposee',
            history: [{
                date: Date.now(),
                statut: 'deposee',
                action: 'Réclamation déposée par le consommateur',
                updatedBy: req.user.id
            }]
        });

        const reclamation = await newReclamation.save();

        console.log('✅ Reclamation saved successfully:', reclamation._id);
        console.log('📤 Sending response with Tracking Code:', reclamation.trackingCode);
        res.json(reclamation);

    } catch (err) {
        console.error('❌ Error creating reclamation:', err.message);
        console.error('Full Error:', err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }

        res.status(500).send('Server error');
    }
});

module.exports = router;
