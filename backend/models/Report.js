const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    subGreddiit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubGreddiit',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['Pending', 'Ignored', 'Action Taken'],
        default: 'Pending'
    },
    action: {
        type: String,
        enum: ['None', 'Ignored', 'PostRemoved', 'UserBlocked'],
        default: 'None'
    },
    resolver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    postSnapshot: {
        title: String,
        content: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
