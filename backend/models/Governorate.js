const mongoose = require("mongoose");

const GovernorateSchema = new mongoose.Schema({
    governorate: {
        type: String,
        required: true,
        unique: true
    },
    delegations: [{
        name: { type: String, required: true },
        zip: { type: String, required: true }
    }]
});

module.exports = mongoose.model("governorate", GovernorateSchema);
