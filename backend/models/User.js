const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    telephone: {
        type: String,
        required: true,
    },
    cin: {
        type: String,
        required: true,
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
});

module.exports = mongoose.model("user", UserSchema);
