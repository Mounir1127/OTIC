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
        enum: ['Station Thermale', 'Centre de Thalassothérapie', 'Hammam Thermal', 'Source Naturelle'],
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
    },
    trustScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 85
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4.2
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ThermalBath', ThermalBathSchema);
