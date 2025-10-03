// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Helper function to generate JWT token
const generateToken = (user) => {
    const payload = {
        user: {
            id: user._id,
            email: user.email
        }
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

// Registration Route (Public)
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        
        const { firstName, lastName, username, email, age, contactNumber, password } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !username || !email || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists by email or username
        let existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ msg: 'User with this email already exists' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ msg: 'Username is already taken' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = new User({ 
            firstName, 
            lastName, 
            username, 
            email, 
            age: age ? parseInt(age) : undefined, 
            contactNumber, 
            password: hashedPassword,
            authProvider: 'local'
        });

        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser._id);
        
        res.status(201).json({ msg: 'User registered successfully' });

    } catch (err) {
        console.error('Registration error details:', err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ msg: `${field} already exists` });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Login Route (Public)
router.post('/login', async (req, res) => {
    try {
        // console.log('Login request received:', req.body);
        
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide email and password' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials: User not found' });
        }

        // Check if user registered with OAuth
        if (user.authProvider !== 'local') {
            return res.status(400).json({ msg: `Please login with ${user.authProvider}` });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials: Incorrect password' });
        }

        const token = generateToken(user);

        res.json({ 
            msg: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                authProvider: user.authProvider
            }
        });

    } catch (err) {
        console.error('Login error details:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000' }),
    async (req, res) => {
        try {
            const token = generateToken(req.user);
            
            // Redirect to frontend with token
            res.redirect(`http://localhost:3000/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                username: req.user.username,
                email: req.user.email,
                profilePicture: req.user.profilePicture,
                authProvider: req.user.authProvider
            }))}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect('http://localhost:3000?error=auth_failed');
        }
    }
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: 'http://localhost:3000' }),
    async (req, res) => {
        try {
            const token = generateToken(req.user);
            
            // Redirect to frontend with token
            res.redirect(`http://localhost:3000/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                username: req.user.username,
                email: req.user.email,
                profilePicture: req.user.profilePicture,
                authProvider: req.user.authProvider
            }))}`);
        } catch (error) {
            console.error('Facebook callback error:', error);
            res.redirect('http://localhost:3000?error=auth_failed');
        }
    }
);

// Get current user with fresh data (Protected)
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('followers', 'firstName lastName username profilePicture')
            .populate('following', 'firstName lastName username profilePicture');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                age: user.age,
                contactNumber: user.contactNumber,
                profilePicture: user.profilePicture,
                authProvider: user.authProvider,
                followersCount: user.followers.length,
                followingCount: user.following.length
            }
        });
    } catch (err) {
        console.error('Get current user error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Verify token route (Protected)
router.get('/verify', auth, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                username: req.user.username,
                email: req.user.email,
                profilePicture: req.user.profilePicture,
                authProvider: req.user.authProvider,
                followersCount: req.user.followers.length,
                followingCount: req.user.following.length
            }
        });
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Update user profile (Protected)
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('Profile update request received:', req.body);
        console.log('User ID from token:', req.user._id);
        
        const { firstName, lastName, age, contactNumber } = req.body;
        
        // Validate input
        if (!firstName || !lastName) {
            return res.status(400).json({ msg: 'First name and last name are required' });
        }

        if (firstName.trim() === '' || lastName.trim() === '') {
            return res.status(400).json({ msg: 'First name and last name cannot be empty' });
        }
        
        const updateData = {};
        updateData.firstName = firstName.trim();
        updateData.lastName = lastName.trim();
        if (age && parseInt(age) > 0) updateData.age = parseInt(age);
        if (contactNumber && contactNumber.trim()) updateData.contactNumber = contactNumber.trim();

        console.log('Update data:', updateData);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        console.log('Updated user:', user);

        res.json({
            msg: 'Profile updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                age: user.age,
                contactNumber: user.contactNumber,
                profilePicture: user.profilePicture,
                authProvider: user.authProvider,
                followersCount: user.followers ? user.followers.length : 0,
                followingCount: user.following ? user.following.length : 0
            }
        });
    } catch (err) {
        console.error('Profile update error:', err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: errors.join(', ') });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Change password (Protected) - Only for local auth users
router.put('/change-password', auth, async (req, res) => {
    try {
        if (req.user.authProvider !== 'local') {
            return res.status(400).json({ msg: 'Password change not available for OAuth users' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide both current and new passwords' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters long' });
        }

        // Get user with password
        const user = await User.findById(req.user._id);
        
        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(req.user._id, { password: hashedNewPassword });

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Logout (Protected)
router.post('/logout', auth, async (req, res) => {
    try {
        // In a more sophisticated app, you might want to blacklist the token
        res.json({ msg: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;