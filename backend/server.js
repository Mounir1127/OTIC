require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');

// Passport Config
require('./config/passport')(passport);

const app = express();

// Connect Database
connectDB();

const path = require('path');

// Init Middleware
app.use(cors());
app.use(express.json());

// Express Session
app.use(session({
    secret: process.env.JWT_SECRET || 'secret',
    resave: false,
    saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport Serialization (as per your snippet)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Serve static directory for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => res.send('API Running'));

// --- Social Auth Routes (Direct) ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:4300/login' }),
    (req, res) => {
        // En cas de succès, générer le token JWT pour le frontend
        const payload = { user: { id: req.user.id || req.user._id } };
        jwt.sign(
            payload, 
            process.env.JWT_SECRET || "secret", 
            { expiresIn: 360000 }, 
            (err, token) => {
                if (err) throw err;
                // Redirection vers le frontend sur le port 4300
                res.redirect(`http://localhost:4300/login?token=${token}`);
            }
        );
    }
);

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reclamations', require('./routes/reclamations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/public', require('./routes/public'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
