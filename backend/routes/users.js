const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Search users by username (Protected)
router.get('/search', auth, async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username || username.trim() === '') {
            return res.json([]);
        }

        // Search for users with username containing the query (case-insensitive)
        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: req.user._id } // Exclude current user
        })
        .select('firstName lastName username profilePicture')
        .limit(10); // Limit results to 10

        // Get current user's following list to check follow status
        const currentUser = await User.findById(req.user._id).select('following');
        
        // Add isFollowing flag to each user
        const usersWithFollowStatus = users.map(user => ({
            ...user.toObject(),
            isFollowing: currentUser.following.includes(user._id)
        }));

        res.json(usersWithFollowStatus);
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get all users (Protected)
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

// Get user followers (Protected)
router.get('/:id/followers', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'firstName lastName username profilePicture')
            .select('followers');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.followers);
    } catch (err) {
        console.error('Get followers error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get user following (Protected)
router.get('/:id/following', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'firstName lastName username profilePicture')
            .select('following');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.following);
    } catch (err) {
        console.error('Get following error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Follow a user (Protected)
router.post('/:id/follow', auth, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ msg: 'You cannot follow yourself' });
        }

        if (currentUser.following.includes(req.params.id)) {
            return res.status(400).json({ msg: 'You are already following this user' });
        }

        // Add to current user's following
        currentUser.following.push(req.params.id);
        await currentUser.save();

        // Add to target user's followers
        userToFollow.followers.push(req.user._id);
        await userToFollow.save();

        res.json({ msg: 'User followed successfully' });
    } catch (err) {
        console.error('Follow user error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Unfollow a user (Protected)
router.delete('/:id/unfollow', auth, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToUnfollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!currentUser.following.includes(req.params.id)) {
            return res.status(400).json({ msg: 'You are not following this user' });
        }

        // Remove from current user's following
        currentUser.following = currentUser.following.filter(
            id => id.toString() !== req.params.id
        );
        await currentUser.save();

        // Remove from target user's followers
        userToUnfollow.followers = userToUnfollow.followers.filter(
            id => id.toString() !== req.user._id.toString()
        );
        await userToUnfollow.save();

        res.json({ msg: 'User unfollowed successfully' });
    } catch (err) {
        console.error('Unfollow user error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Remove a follower (Protected)
router.delete('/followers/:id/remove', auth, async (req, res) => {
    try {
        const followerToRemove = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!followerToRemove) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!currentUser.followers.includes(req.params.id)) {
            return res.status(400).json({ msg: 'This user is not following you' });
        }

        // Remove from current user's followers
        currentUser.followers = currentUser.followers.filter(
            id => id.toString() !== req.params.id
        );
        await currentUser.save();

        // Remove from follower's following
        followerToRemove.following = followerToRemove.following.filter(
            id => id.toString() !== req.user._id.toString()
        );
        await followerToRemove.save();

        res.json({ msg: 'Follower removed successfully' });
    } catch (err) {
        console.error('Remove follower error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;