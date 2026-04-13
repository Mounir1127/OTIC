const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
        callbackURL: "http://localhost:5000/auth/google/callback",
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if user already linked this Google account
            let user = await User.findOne({ googleId: profile.id });
            if (user) return done(null, user);

            // 2. Check if user exists with the same email (regular registration)
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
                user = await User.findOne({ email });
                if (user) {
                    // Link Google account to existing user
                    user.googleId = profile.id;
                    if (!user.photoProfil && profile.photos && profile.photos[0]) {
                        user.photoProfil = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }
            }

            // 3. Create new user if not found
            user = new User({
                googleId: profile.id,
                nom: profile.name.familyName || profile.displayName || 'Consommateur',
                prenom: profile.name.givenName || '',
                email: email || `${profile.id}@google.com`,
                telephone: '00000000',
                role: 'consommateur_simple',
                photoProfil: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });
            await user.save();

            // Send welcome email in background
            sendWelcomeEmail(user.email, { nom: user.nom, prenom: user.prenom })
                .catch(e => console.error('Social(Google) Welcome Email Failed:', e));

            return done(null, user);
        } catch (err) {
            console.error('Google Auth Error:', err);
            return done(err, null);
        }
    }));

    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID || 'dummy',
        clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy',
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check by ID
            let user = await User.findOne({ facebookId: profile.id });
            if (user) return done(null, user);

            // 2. Check by Email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
                user = await User.findOne({ email });
                if (user) {
                    user.facebookId = profile.id;
                    if (!user.photoProfil && profile.photos && profile.photos[0]) {
                        user.photoProfil = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }
            }

            // 3. Create
            user = new User({
                facebookId: profile.id,
                nom: profile.name.familyName || profile.displayName || 'Consommateur',
                prenom: profile.name.givenName || '',
                email: email || `${profile.id}@facebook.com`,
                telephone: '00000000',
                role: 'consommateur_simple',
                photoProfil: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });
            await user.save();

            // Send welcome email in background
            sendWelcomeEmail(user.email, { nom: user.nom, prenom: user.prenom })
                .catch(e => console.error('Social(Facebook) Welcome Email Failed:', e));

            return done(null, user);
        } catch (err) {
            console.error('Facebook Auth Error:', err);
            return done(err, null);
        }
    }));
};
