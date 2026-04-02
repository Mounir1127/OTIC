require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const WaterBrand = require('./models/WaterBrand');

async function testDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const count = await WaterBrand.countDocuments();
        console.log('Total WaterBrands in DB:', count);
        const brands = await WaterBrand.find().limit(5);
        console.log('Sample Brands:', brands);
        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

testDB();
