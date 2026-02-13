const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        console.log('Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        console.log('Token decoded:', decoded);

        // Verify if user exists in DB
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user) {
            console.log('User not found in DB for ID:', decoded.user.id);
            return res.status(401).json({ msg: 'User no longer exists' });
        }

        console.log('User authenticated:', user.email, 'Role:', user.role);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
