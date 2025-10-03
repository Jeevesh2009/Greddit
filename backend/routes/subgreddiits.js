// backend/routes/subgreddiits.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Assuming these models exist. Adjust paths/names as per your project.
const SubGreddiit = require('../models/SubGreddiit');
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');

// Middleware for auth and subgreddiit load (adjust to your auth)
const auth = require('../middleware/auth'); // Add this line near the top
const requireAuth = require('../middleware/auth'); // should set req.user
async function loadSub(req, res, next) {
  try {
    const sub = await SubGreddiit.findById(req.params.id);
    if (!sub) return res.status(404).json({ msg: 'Sub Greddiit not found' });
    req.sub = sub;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Invalid id' });
  }
}

// Create a new SubGreddiit (Protected)
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, bannedKeywords, tags, image, isPublic } = req.body;

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({ msg: 'Name and description are required' });
        }

        // Check if SubGreddiit name already exists
        const existingSubGreddiit = await SubGreddiit.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingSubGreddiit) {
            return res.status(400).json({ msg: 'SubGreddiit with this name already exists' });
        }

        // Process banned keywords - split by comma and clean
        const processedBannedKeywords = bannedKeywords 
            ? bannedKeywords.split(',').map(keyword => keyword.trim().toLowerCase()).filter(k => k)
            : [];

        // Process tags
        const processedTags = tags 
            ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(t => t)
            : [];

        // Create new SubGreddiit
        const subGreddiit = new SubGreddiit({
            name: name.trim(),
            description: description.trim(),
            bannedKeywords: processedBannedKeywords,
            tags: processedTags,
            image: image || null,
            creator: req.user._id,
            moderators: [req.user._id], // Creator is automatically a moderator
            followers: [req.user._id], // Creator automatically follows
            isPublic: isPublic !== false // Default to true
        });

        recordMemberJoin(subGreddiit, req.user._id);

        const savedSubGreddiit = await subGreddiit.save();
        
        // Populate creator info for response
        await savedSubGreddiit.populate('creator', 'firstName lastName username');

        res.status(201).json({
            msg: 'SubGreddiit created successfully',
            subGreddiit: savedSubGreddiit
        });

    } catch (err) {
        console.error('Create SubGreddiit error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'SubGreddiit name already exists' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Get all SubGreddiits created by current user (Protected)
router.get('/my', auth, async (req, res) => {
    try {
        const subGreddiits = await SubGreddiit.find({ creator: req.user._id })
            .populate('creator', 'firstName lastName username')
            .sort({ createdAt: -1 });

        res.json(subGreddiits);
    } catch (err) {
        console.error('Get my SubGreddiits error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get all public SubGreddiits (Protected)
router.get('/', auth, async (req, res) => {
    try {
        const { search, tags } = req.query;
        let query = { isPublic: true };

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
            query.tags = { $in: tagArray };
        }

        const subGreddiits = await SubGreddiit.find(query)
            .populate('creator', 'firstName lastName username')
            .sort({ followersCount: -1, createdAt: -1 })
            .limit(50);

        res.json(subGreddiits);
    } catch (err) {
        console.error('Get SubGreddiits error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Get specific SubGreddiit by ID (Protected)
router.get('/:id', auth, async (req, res) => {
    try {
        const subGreddiit = await SubGreddiit.findById(req.params.id)
            .populate('creator', 'firstName lastName username profilePicture')
            .populate('moderators', 'firstName lastName username')
            .populate('followers', 'firstName lastName username');

        if (!subGreddiit) {
            return res.status(404).json({ msg: 'SubGreddiit not found' });
        }

        // Check if user has access
        if (!subGreddiit.isPublic && !subGreddiit.followers.includes(req.user._id)) {
            return res.status(403).json({ msg: 'Access denied to private SubGreddiit' });
        }

        res.json(subGreddiit);
    } catch (err) {
        console.error('Get SubGreddiit error:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'SubGreddiit not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Moderation: Get users (members & blocked)
router.get('/:id/users', requireAuth, loadSub, async (req, res) => {
    try {
        const sub = req.sub;
        const members = await User.find({ _id: { $in: sub.members } }).select('_id username firstName lastName');
        const blocked = await User.find({ _id: { $in: sub.blockedUsers } }).select('_id username firstName lastName');
        const activeIds = new Set(members.map(m => String(m._id)));
        // Some blocked might still be in members; show them only in blocked section
        const active = members.filter(m => !sub.blockedUsers.some(b => String(b) === String(m._id)));
        res.json({
            active,
            blocked
        });
    } catch (e) {
        res.status(500).json({ msg: 'Failed to fetch users' });
    }
});

// JOIN REQUESTS
router.get('/:id/join-requests', requireAuth, loadSub, async (req, res) => {
  try {
    const sub = req.sub;
    await sub.populate({ path: 'joinRequests.user', select: '_id username firstName lastName' });
    const pending = sub.joinRequests.filter(r => r.status === 'pending');
    res.json(pending);
  } catch (e) {
    res.status(500).json({ msg: 'Failed to fetch requests' });
  }
});

router.post('/:id/join-requests/:reqId/accept', requireAuth, loadSub, async (req, res) => {
  try {
    const sub = req.sub;
    const r = sub.joinRequests.id(req.params.reqId);
    if (!r) return res.status(404).json({ msg: 'Request not found' });
    r.status = 'accepted';
    if (!sub.members.some(m => String(m) === String(r.user))) sub.members.push(r.user);
    await sub.save();
    res.json({ msg: 'Accepted' });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to accept request' });
  }
});

router.post('/:id/join-requests/:reqId/reject', requireAuth, loadSub, async (req, res) => {
  try {
    const sub = req.sub;
    const r = sub.joinRequests.id(req.params.reqId);
    if (!r) return res.status(404).json({ msg: 'Request not found' });
    r.status = 'rejected';
    await sub.save();
    res.json({ msg: 'Rejected' });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to reject request' });
  }
});

// STATS
router.get('/:id/stats', requireAuth, loadSub, async (req, res) => {
  try {
    const sub = req.sub;

    // Example aggregations; adjust to your schema indexes
    const membersOverTime = await sub.getMembersOverTime(); // expect [{date, value}]
    const dailyPosts = await Post.aggregate([
      { $match: { subId: sub._id } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $sum: 1 } } },
      { $project: { date: '$_id', value: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    const dailyVisitors = await sub.getDailyVisitors(); // expect [{date, value}]

    const reportedVsDeleted = await Report.aggregate([
      { $match: { subId: sub._id } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        reported: { $sum: 1 },
        deleted: { $sum: { $cond: [{ $eq: ['$action', 'deleted'] }, 1, 0] } }
      }},
      { $project: { date: '$_id', reported: 1, deleted: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    res.json({
      membersOverTime: membersOverTime || [],
      dailyPosts,
      dailyVisitors: dailyVisitors || [],
      reportedVsDeleted
    });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to fetch stats' });
  }
});

// REPORTS
router.get('/:id/reports', requireAuth, loadSub, async (req, res) => {
  try {
    const sub = req.sub;
    const expiryDays = req.app.get('REPORT_EXPIRY_DAYS') || 10;
    const cutoff = new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1000);

    // Delete expired before returning
    await Report.deleteMany({ subId: sub._id, createdAt: { $lt: cutoff }, status: { $ne: 'deleted' } });

    const reports = await Report.find({ subId: sub._id })
      .populate('reportedBy', '_id username')
      .populate('reportedUser', '_id username')
      .sort({ createdAt: -1 })
      .lean();

    const isModerator = String(sub.moderator) === String(req.user._id);

    // Mask reported user for non-moderator if blocked
    const masked = await Promise.all(reports.map(async r => {
      const isBlocked = sub.blockedUsers.some(u => String(u) === String(r.reportedUser?._id));
      return {
        ...r,
        reportedUserMasked: !isModerator && isBlocked
      };
    }));

    // Mark overdue in response (10 days+)
    const resp = masked.map(r => ({
      ...r,
      overdue: new Date(r.createdAt) < cutoff
    }));

    res.json(resp);
  } catch (e) {
    res.status(500).json({ msg: 'Failed to fetch reports' });
  }
});

router.post('/:id/reports/:reportId/ignore', requireAuth, loadSub, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.reportId, subId: req.params.id });
    if (!report) return res.status(404).json({ msg: 'Report not found' });
    report.status = 'ignored';
    report.action = 'ignored';
    await report.save();
    res.json({ msg: 'Ignored' });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to ignore report' });
  }
});

router.post('/:id/reports/:reportId/block-user', requireAuth, loadSub, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.reportId, subId: req.params.id }).populate('reportedUser');
    if (!report) return res.status(404).json({ msg: 'Report not found' });
    const sub = req.sub;
    const uid = report.reportedUser?._id;
    if (uid && !sub.blockedUsers.some(u => String(u) === String(uid))) {
      sub.blockedUsers.push(uid);
      await sub.save();
    }
    report.status = 'actionTaken';
    report.action = 'blocked';
    await report.save();
    res.json({ msg: 'User blocked' });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to block user' });
  }
});

router.post('/:id/reports/:reportId/delete-post', requireAuth, loadSub, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.reportId, subId: req.params.id });
    if (!report) return res.status(404).json({ msg: 'Report not found' });

    // Delete the post
    await Post.deleteOne({ _id: report.postId });

    // Remove the report itself (per spec)
    await Report.deleteOne({ _id: report._id });

    res.json({ msg: 'Post deleted and report removed' });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to delete post' });
  }
});

module.exports = router;