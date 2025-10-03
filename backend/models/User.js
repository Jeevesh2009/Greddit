// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true,
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true,
        trim: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true 
    },
    age: { 
        type: Number, 
        required: false,
        min: 1,
        max: 120 
    },
    contactNumber: { 
        type: String, 
        required: false,
        trim: true 
    },
    password: { 
        type: String, 
        required: false,
        minlength: 6 
    },
    // OAuth fields
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    facebookId: {
        type: String,
        sparse: true,
        unique: true
    },
    profilePicture: {
        type: String
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    // New fields for followers/following
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);