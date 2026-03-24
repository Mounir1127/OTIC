require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

const path = require('path');

// Init Middleware
app.use(cors());
app.use(express.json());

// Serve static directory for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reclamations', require('./routes/reclamations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/public', require('./routes/public'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
