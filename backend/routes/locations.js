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
            console.log(`Found ${governorates.length} governorates in DB`);
        }

        res.json(governorates);
    } catch (err) {
        console.error('Database error in locations:', err.message);
        res.json(tunisiaData);
    }
});

module.exports = router;
