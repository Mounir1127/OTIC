const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Backend will continue running, but DB functions may fail.');
        // Don't exit process, allow fallback data to be used
    }
};

module.exports = connectDB;
