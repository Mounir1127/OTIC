const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");
const passport = require('passport');
const { sendWelcomeEmail, sendResetLinkEmail } = require("../utils/emailService");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer for profile photos
const profileUploadDir = path.join(__dirname, '../uploads/profile-pictures');
if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post("/register", async (req, res) => {
    const { nom, prenom, email, telephone, cin, password, adresse, isTRE, paysResidence } = req.body;

    try {
        // Log incoming registration data (without password)
        console.log('Registration attempt:', { nom, prenom, email, telephone, cin, adresse });

        // Validate required fields
        if (!nom || !prenom || !email || !telephone || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ msg: "Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Téléphone, Mot de passe)" });
        }

        // 📞 Tunisian Phone Validation
        const cleanPhone = telephone.replace(/\s/g, '');
        const phoneRegex = /^(?:\+216|00216)?([24579]\d{7})$/;
        const match = cleanPhone.match(phoneRegex);

        if (!match) {
            return res.status(400).json({ msg: "Format de téléphone tunisien invalide (8 chiffres commençant par 2, 4, 5, 7 ou 9 requis)" });
        }

        // Use normalized 8-digit phone
        const validatedPhone = match[1];

        // 🆔 CIN Validation
        if (cin) {
            const cinClean = cin.replace(/\s/g, '');
            if (!/^\d{8}$/.test(cinClean)) {
                return res.status(400).json({ msg: "Le numéro CIN doit comporter exactement 8 chiffres." });
            }
        }

        // 🔑 Password Validation
        if (password.length < 8) {
            return res.status(400).json({ msg: "Le mot de passe doit comporter au moins 8 caractères." });
        }

        // Validate adresse structure if NOT TRE
        if (!isTRE && (!adresse || (!adresse.ville && !adresse.region))) {
            console.log('Invalid address structure:', adresse);
            return res.status(400).json({ msg: "Veuillez fournir une adresse (ville et région)" });
        }

        // Validate paysResidence if TRE
        if (isTRE && !paysResidence) {
            return res.status(400).json({ msg: "Veuillez fournir votre pays de résidence" });
        }

        // Check email OR cin uniqueness - CASE INSENSITIVE for email
        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({
            $or: [
                { email: { $regex: new RegExp("^" + normalizedEmail + "$", "i") } },
                ...(cin ? [{ cin }] : [])
            ]
        });

        if (user) {
            if (user.email.toLowerCase() === normalizedEmail) return res.status(400).json({ msg: "Cet email est déjà utilisé." });
            if (cin && user.cin === cin) return res.status(400).json({ msg: "Ce numéro CIN est déjà utilisé." });
        }

        user = new User({
            nom,
            prenom,
            email: normalizedEmail,
            telephone: validatedPhone,
            cin: cin || undefined,
            password,
            isTRE: !!isTRE,
            paysResidence: isTRE ? paysResidence : undefined,
            adresse: !isTRE ? {
                ville: adresse.ville,
                region: adresse.region,
                codePostal: adresse.codePostal
            } : undefined,
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
    const { identifier, password } = req.body;
    const identifierTrimmed = identifier ? identifier.trim() : '';
    const passwordOriginal = password || '';

    console.log('--- LOGIN REQUEST ---');
    console.log('Identifier:', identifierTrimmed);

    if (!identifierTrimmed || !passwordOriginal) {
        return res.status(400).json({ msg: "Veuillez fournir un identifiant et un mot de passe" });
    }

    try {
        // Check if identifier matches email (case-insensitive), telephone, or CIN
        console.log('Login Attempt for identifier:', identifierTrimmed);

        const emailRegex = new RegExp("^" + identifierTrimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");

        let user = await User.findOne({
            $or: [
                { email: emailRegex },
                { telephone: identifierTrimmed },
                { cin: identifierTrimmed }
            ]
        });

        if (!user) {
            console.log('User not found for identifier:', identifierTrimmed);
            return res.status(400).json({ msg: "Identifiants invalides (Email, téléphone ou CIN non trouvé)" });
        }

        // Check if account is active
        if (user.isActive === false) {
            console.log('Login attempt for disabled account:', user.email);
            return res.status(403).json({ msg: "Votre compte a été désactivé par l'administrateur. Veuillez contacter le support." });
        }

        const isMatch = await bcrypt.compare(passwordOriginal, user.password);

        if (!isMatch) {
            console.log('Password mismatch for user:', user.email);
            return res.status(400).json({ msg: "Mot de passe incorrect" });
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
        const user = await User.findById(req.user.id).select("-password").lean();
        if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

        // Ensure address object exists for frontend
        if (!user.adresse) {
            user.adresse = { ville: '', region: '', codePostal: '' };
        }

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

// @route   POST api/auth/upload-photo
// @desc    Upload profile photo
// @access  Private
router.post("/upload-photo", [require("../middleware/auth"), uploadProfile.single('photo')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Veuillez sélectionner une image" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

        // Update photo field - we'll store the URL path
        // Important: Using dynamic URL that front-end can resolve (works for localhost, local network, and cloud deployment)
        const host = req.get('host');
        user.photoProfil = `${req.protocol}://${host}/uploads/profile-pictures/${req.file.filename}`;
        await user.save();

        console.log(`[UploadPhoto] User ${user.email} updated profile picture: ${user.photoProfil}`);

        res.json({
            msg: "Photo de profil mise à jour",
            photoProfil: user.photoProfil
        });
    } catch (err) {
        console.error("[UploadPhoto Error]:", err.message);
        res.status(500).json({ msg: "Erreur lors du téléchargement de l'image" });
    }
});

module.exports = router;

