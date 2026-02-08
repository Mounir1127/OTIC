const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reclamation = require('../models/Reclamation');

// @route   GET api/reclamations/me
// @desc    Get current user's reclamations
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const reclamations = await Reclamation.find({ user: req.user.id })
            .sort({ dateCreation: -1 });
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

        // Generate Tracking Code (REC-YYYY-XXXX)
        const year = new Date().getFullYear();
        const count = await Reclamation.countDocuments() + 1;
        const trackingCode = `REC-${year}-${count.toString().padStart(4, '0')}`;

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
        res.json(reclamation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
