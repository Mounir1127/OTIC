require('dotenv').config({ path: __dirname + '/.env' });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4300';

// Init Middleware
app.use(cors({
    origin: [
        "http://localhost:4200",
        "http://localhost:4300",
        "https://mon-app.netlify.app",
        FRONTEND_URL
    ],
    credentials: true
}));
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
app.get('/api', (req, res) => res.send('OTIC API is operational'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' }));

// --- Social Auth Routes (Direct) ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
    (req, res) => {
        // En cas de succès, générer le token JWT pour le frontend
        const payload = { user: { id: req.user.id || req.user._id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET || "secret",
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                // Redirection vers le frontend
                res.redirect(`${FRONTEND_URL}/login?token=${token}`);
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
app.use('/api/messages', require('./routes/messages'));
app.use('/api/chatbot', require('./routes/chatbot'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
    // server.close(() => process.exit(1));
});
