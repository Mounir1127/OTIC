const mongoose = require('mongoose');

const ThermalBathSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: String,
        required: true
    },
    temperature: {
        type: String
    },
    indications: {
        type: String
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['Station Thermale', 'Centre de Thalassothérapie', 'Hammam Thermal'],
        default: 'Station Thermale'
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    imageUrl: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ThermalBath', ThermalBathSchema);
