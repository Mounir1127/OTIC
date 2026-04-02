const mongoose = require('mongoose');

const WaterBrandSchema = new mongoose.Schema({
    marque: {
        type: String,
        required: true,
        unique: true
    },
    tds: {
        type: String,
        default: "~?"
    },
    ph: {
        type: String,
        default: "~?"
    },
    nitrates: {
        type: String,
        default: "~?"
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WaterBrand', WaterBrandSchema);
