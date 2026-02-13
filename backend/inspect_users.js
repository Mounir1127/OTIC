const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/otic';

const UserSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    email: String,
    telephone: String,
    adresse: {
        ville: String,
        region: String,
        codePostal: String
    }
});

const User = mongoose.model('user', UserSchema);

async function inspectUsers() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u._id}, Name: ${u.nom} ${u.prenom}, Email: ${u.email}, Tel: ${u.telephone}, Address:`, u.adresse);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

inspectUsers();
