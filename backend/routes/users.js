const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all users (Protected - Admin only in real app)
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get user by ID (Protected)
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Get user error:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Delete user (Protected - user can only delete their own account)
router.delete('/me', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        res.json({ msg: 'User account deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;