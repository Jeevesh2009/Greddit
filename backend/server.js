// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Passport config
require('./config/passport')(passport);

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessions middleware for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Report expiry days setting
const REPORT_EXPIRY_DAYS = parseInt(process.env.REPORT_EXPIRY_DAYS || '10', 10);
app.set('REPORT_EXPIRY_DAYS', REPORT_EXPIRY_DAYS);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); // Add this line
app.use('/api/subgreddiits', require('./routes/subgreddiits')); // Add this line

// Health check route (public)
app.get('/', (req, res) => {
    res.json({ msg: 'Greddit API is running!' });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));