const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            autoIndex: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Listen for connection errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('MongoDB post-connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected! Attempting to reconnect...');
        });

    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Backend will continue running, but DB functions may fail.');
        // If connection fails initially, we'll try again in 5 seconds
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
