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
    gouvernorat: {
        type: String
    },
    operateur: {
        type: String
    },
    statut: {
        type: String,
        enum: ['deposee', 'en_cours', 'affectee_conventionne', 'resolue', 'fermee', 'rejete', 'demande_complement'],
        default: 'deposee'
    },
    conventionne: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    history: [{
        date: { type: Date, default: Date.now },
        statut: { type: String },
        action: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    }],
    lu: {
        type: Boolean,
        default: false
    },
    complainantType: {
        type: String,
        enum: ['particulier', 'professionnel'],
        default: 'particulier'
    },
    raison_sociale: {
        type: String
    },
    matricule_fiscal: {
        type: String
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    dateResolution: {
        type: Date
    }
});

module.exports = mongoose.model('reclamations', ReclamationSchema);
