const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reclamation = require('../models/Reclamation');

// @route   GET api/reclamations/me
// @desc    Get current user's reclamations
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        console.log('🔍 GET /api/reclamations/me - User:', req.user.id);
        const reclamations = await Reclamation.find({ user: req.user.id })
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
router.post('/', auth, async (req, res) => {
    try {
        const {
            type, secteur, sous_secteur, activite,
            natures, autre_nature, description,
            operateur, preuves
        } = req.body;

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
            preuves
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
