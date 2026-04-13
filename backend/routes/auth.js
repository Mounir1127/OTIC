const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");
const passport = require('passport');
const { sendWelcomeEmail, sendResetLinkEmail } = require("../utils/emailService");

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

    const { nom, prenom, email, telephone, cin, password, adresse } = req.body;

    try {
        // Log incoming registration data (without password)
        console.log('Registration attempt:', { nom, prenom, email, telephone, cin, adresse });

        // Validate required fields
        if (!nom || !prenom || !email || !telephone || !cin || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ msg: "Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Téléphone, CIN, Mot de passe)" });
        }

        // Validate adresse structure
        if (!adresse || !adresse.ville || !adresse.region || !adresse.codePostal) {
            console.log('Invalid address structure:', adresse);
            return res.status(400).json({ msg: "Please provide complete address information (ville, region, codePostal)" });
        }

        // Check email OR cin uniqueness
        let user = await User.findOne({ $or: [{ email }, ...(cin ? [{ cin }] : [])] });
        if (user) {
            if (user.email === email) return res.status(400).json({ msg: "Cet email est déjà utilisé." });
            if (cin && user.cin === cin) return res.status(400).json({ msg: "Ce numéro CIN est déjà utilisé." });
        }

        user = new User({
            nom,
            prenom,
            email,
            telephone,
            cin: cin || undefined,
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

        // Send welcome email (non-blocking preferred, but we'll await for safety or just call it)
        try {
            sendWelcomeEmail(user.email, { nom: user.nom, prenom: user.prenom })
                .then(res => console.log('Welcome email result:', res))
                .catch(err => console.error('Welcome email failed:', err));
        } catch (emailErr) {
            console.error('Error initiating welcome email:', emailErr);
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
        // Check if identifier matches email, telephone, or CIN
        console.log('Login Attempt for identifier:', identifier);
        let user = await User.findOne({
            $or: [{ email: identifier }, { telephone: identifier }, { cin: identifier }]
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
        console.log('🔍 GET /api/auth/me - Returning user:', { id: user._id, email: user.email, name: user.nom });
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

// @route   PUT api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put("/update-profile", require("../middleware/auth"), async (req, res) => {
    const { nom, prenom, email, telephone, cin, adresse } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ msg: "Cet email est déjà utilisé." });
            user.email = email;
        }

        if (nom) user.nom = nom;
        if (prenom) user.prenom = prenom;
        if (telephone) user.telephone = telephone;
        if (cin) user.cin = cin;
        if (adresse) {
            if (adresse.ville) user.adresse.ville = adresse.ville;
            if (adresse.region) user.adresse.region = adresse.region;
            if (adresse.codePostal) user.adresse.codePostal = adresse.codePostal;
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

// @route   POST api/auth/forgot-password
// @desc    Request a reset code
// @access  Public
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: { $regex: new RegExp("^" + email.trim() + "$", "i") } });
        if (!user) {
            console.log(`[ForgotPass] No user found for: ${email}`);
            return res.status(404).json({ msg: "Aucun utilisateur trouvé avec cet email" });
        }
        
        console.log(`[ForgotPass] Generating code for: ${user.email}`);

        // Generate 6 digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordCode = code;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send reset link email
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4300'}/reset-password?email=${user.email}&token=${code}`;
        
        await sendResetLinkEmail(user.email, resetLink);

        res.json({ msg: "Lien de réinitialisation envoyé par email" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using the code
// @access  Public
router.post("/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await User.findOne({ 
            email: { $regex: new RegExp("^" + email.trim() + "$", "i") },
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Lien invalide ou expiré" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset fields
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.json({ msg: "Mot de passe réinitialisé avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = router;

