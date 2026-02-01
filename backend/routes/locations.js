const express = require('express');
const router = express.Router();
const Governorate = require('../models/Governorate');

// @route   GET api/locations
// @desc    Get all governorates and delegations
// @access  Public
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/locations request received');
        const governorates = await Governorate.find().sort({ governorate: 1 }).lean();
        console.log(`Found ${governorates.length} governorates`);
        res.json(governorates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
