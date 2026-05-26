const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    telephone: {
        type: String,
        required: false,
    },
    cin: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true,
    },
    role: {
        type: String,
        default: "consommateur_simple",
    },
    photoProfil: {
        type: String,
        default: null,
    },
    adresse: {
        ville: { type: String, required: false },
        region: { type: String, required: false },
        codePostal: { type: String, required: false },
    },
    resetPasswordCode: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isTRE: {
        type: Boolean,
        default: false,
    },
    paysResidence: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("user", UserSchema);
