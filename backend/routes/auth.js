const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post("/register", async (req, res) => {
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        console.error('Database is not connected. Connection state:', mongoose.connection.readyState);
        return res.status(503).json({ msg: "Database connection is not ready. Please try again later or check server configuration." });
    }

    const { nom, prenom, email, telephone, password, adresse } = req.body;

    try {
        // Log incoming registration data (without password)
        console.log('Registration attempt:', { nom, prenom, email, telephone, adresse });

        // Validate required fields
        if (!nom || !prenom || !email || !telephone || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ msg: "Please provide all required fields" });
        }

        // Validate adresse structure
        if (!adresse || !adresse.ville || !adresse.region || !adresse.codePostal) {
            console.log('Invalid address structure:', adresse);
            return res.status(400).json({ msg: "Please provide complete address information (ville, region, codePostal)" });
        }

        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ msg: "User already exists" });
        }

        user = new User({
            nom,
            prenom,
            email,
            telephone,
            password,
            adresse: {
                ville: adresse.ville,
                region: adresse.region,
                codePostal: adresse.codePostal
            },
            role: "consommateur_simple",
            photoProfil: null
        });

        console.log('User object created, hashing password...');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        console.log('Saving user to database...');
        await user.save();
        console.log('User saved successfully:', user._id);

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || "secret",
            { expiresIn: 360000 },
            (err, token) => {
                if (err) {
                    console.error('JWT signing error:', err);
                    throw err;
                }
                console.log('Token generated successfully for user:', user.email);
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Registration error:', err.message);
        console.error('Full error:', err);

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: 'Validation error', errors });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Email already exists' });
        }

        res.status(500).json({ msg: "Server error", error: err.message });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        console.error('Database is not connected. Connection state:', mongoose.connection.readyState);
        return res.status(503).json({ msg: "Database connection is not ready. Please try again later or check server configuration." });
    }

    const { identifier, password } = req.body;
    console.log('--- LOGIN REQUEST ---');
    console.log('Identifier:', identifier);
    try {
        // Check if identifier matches email or telephone
        console.log('Login Attempt for identifier:', identifier);
        let user = await User.findOne({
            $or: [{ email: identifier }, { telephone: identifier }]
        });

        if (!user) {
            console.log('User not found for identifier:', identifier);
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Password mismatch for user:', user.email);
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || "secret",
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        role: user.role,
                        email: user.email
                    }
                });
            }
        );
    } catch (err) {
        console.error('--- LOGIN ERROR ---');
        console.error(err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});


// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", require("../middleware/auth"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/auth/change-password
// @desc    Change user password
// @access  Private
router.post("/change-password", require("../middleware/auth"), async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: "Mot de passe actuel incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ msg: "Mot de passe changé avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = router;

