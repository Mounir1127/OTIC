require('dotenv').config();
const mongoose = require('mongoose');
const Governorate = require('./models/Governorate');

const debugDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const monastir = await Governorate.findOne({ governorate: 'Monastir' });
        console.log('Raw Monastir Data:', JSON.stringify(monastir, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugDB();
