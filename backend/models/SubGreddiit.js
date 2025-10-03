// backend/models/SubGreddiit.js
const mongoose = require('mongoose');

const subGreddiitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    image: {
        type: String, // URL or base64 string for uploaded image
        default: null
    },
    bannedKeywords: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    joinRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            default: () => Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    memberHistory: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        leftAt: Date
    }],
    visitorHistory: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        visitedAt: {
            type: Date,
            default: Date.now
        }
    }],
    postsCount: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for follower count
subGreddiitSchema.virtual('followersCount').get(function() {
    return this.followers.length;
});

// Ensure virtuals are included in JSON output
subGreddiitSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SubGreddiit', subGreddiitSchema);