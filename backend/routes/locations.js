const express = require('express');
const router = express.Router();
const Governorate = require('../models/Governorate');
const tunisiaData = require('../data/tunisiaData');

// @route   GET api/locations
// @desc    Get all governorates and delegations
// @access  Public
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/locations request received');
        // Check if database is connected
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not connected, returning fallback data immediately');
            return res.json(tunisiaData);
        }

        let governorates = await Governorate.find().sort({ governorate: 1 }).lean();

        if (!governorates || governorates.length === 0) {
            console.log('No governorates found in DB, using fallback data');
            governorates = tunisiaData;
        } else {
            console.log(`GET /api/locations: Found ${governorates.length} items`);
            // Log the first item to verify structure
            if (governorates.length > 0) {
                console.log('First governorate sample:', JSON.stringify(governorates[0], null, 2));
            }
        }
        res.json(governorates);
    } catch (err) {
        console.error('Database error in locations:', err.message);
        res.json(tunisiaData);
    }
});

// @route   GET api/locations/:governorate
// @desc    Get delegations for a specific governorate
// @access  Public
router.get('/:governorate', async (req, res) => {
    try {
        const gov = await Governorate.findOne({ governorate: req.params.governorate });
        if (!gov) {
            return res.status(404).json({ msg: 'Governorate not found' });
        }
        res.json(gov.delegations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
