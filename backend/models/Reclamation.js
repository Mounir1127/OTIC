const mongoose = require('mongoose');

const ReclamationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    trackingCode: {
        type: String,
        unique: true
    },
    type: {
        type: String, // 'Produit' or 'Service'
        required: true
    },
    secteur: {
        type: String,
        required: true
    },
    sous_secteur: {
        type: String,
        required: true
    },
    activite: {
        type: String
    },
    natures: [{
        type: String // Array of strings e.g., ['Qualité', 'Prix']
    }],
    autre_nature: {
        type: String
    },
    description: {
        type: String
    },
    preuves: [{
        type: String // URLs or filenames
    }],
    operateur: {
        type: String
    },
    statut: {
        type: String,
        enum: ['en_attente', 'en_cours', 'traitee', 'rejete', 'demande_complement'],
        default: 'en_attente'
    },
    conventionne: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('reclamations', ReclamationSchema);
