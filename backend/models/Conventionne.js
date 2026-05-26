const mongoose = require('mongoose');

const ConventionneSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        // (email is not unique here if we allow different regions to have partners with same email, 
        // though usually email uniqueness is good practice. I'll make it unique per region or just unique.)
        unique: true
    },
    region: {
        type: String,
        required: false // For super_admin global partners
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    isTRE: {
        type: Boolean,
        default: false
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('conventionne', ConventionneSchema, 'conventionne');
