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
    password: {
        type: String,
        required: true,
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
        ville: { type: String, required: true },
        region: { type: String, required: true },
        codePostal: { type: String, required: true },
    },
});

module.exports = mongoose.model("user", UserSchema);
