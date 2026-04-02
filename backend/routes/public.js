const express = require('express');
const router = express.Router();
const Reclamation = require('../models/Reclamation');
const Governorate = require('../models/Governorate');
const WaterBrand = require('../models/WaterBrand');

// @route   GET api/public/stats
// @desc    Get public statistics for home page
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const totalReclamations = await Reclamation.countDocuments();
        const totalGovernorates = await Governorate.countDocuments() || 24;

        // Calculate resolution rate
        const terminalStatuses = ['resolue', 'fermee', 'rejete'];
        const resolvedCount = await Reclamation.countDocuments({ statut: { $in: terminalStatuses } });
        const resolutionRate = totalReclamations > 0 ? Math.round((resolvedCount / totalReclamations) * 100) : 92;

        // Mock average response time if no data
        const averageResponseTime = "48h";

        res.json({
            totalReclamations,
            resolutionRate,
            totalGovernorates,
            averageResponseTime
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/public/water-brands
// @desc    Get all water brands data
// @access  Public
router.get('/water-brands', async (req, res) => {
    try {
        const brands = await WaterBrand.find().sort({ tds: 1 });
        res.json(brands);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
