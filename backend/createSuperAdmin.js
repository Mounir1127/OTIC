require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const email = 'superadmin@otic.tn';
        const password = 'SuperAdminPassword2026!';

        let user = await User.findOne({ email });

        if (user) {
            console.log('Super Admin already exists.');
            process.exit();
        }

        user = new User({
            nom: 'Admin',
            prenom: 'Super',
            email,
            telephone: '00000000',
            password,
            role: 'super_admin',
            adresse: {
                ville: 'Tunis',
                region: 'Tunis',
                codePostal: '1000'
            }
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        console.log('Super Admin Created Successfully!');
        console.log('Email:', email);
        console.log('Password:', password);

        process.exit();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

createSuperAdmin();
