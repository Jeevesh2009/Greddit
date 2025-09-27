const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
        callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                return done(null, user);
            }

            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.profilePicture = profile.photos[0].value;
                await user.save();
                return done(null, user);
            }

            // Create new user
            const newUser = new User({
                googleId: profile.id,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                username: profile.emails[0].value.split('@')[0] + '_' + Date.now(), // Generate unique username
                profilePicture: profile.photos[0].value,
                authProvider: 'google'
            });

            const savedUser = await newUser.save();
            return done(null, savedUser);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));

    // Facebook OAuth Strategy
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID || 'your-facebook-app-id',
        clientSecret: process.env.FACEBOOK_APP_SECRET || 'your-facebook-app-secret',
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'name', 'emails', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Facebook ID
            let user = await User.findOne({ facebookId: profile.id });
            
            if (user) {
                return done(null, user);
            }

            // Check if user exists with same email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
                user = await User.findOne({ email: email });
                
                if (user) {
                    // Link Facebook account to existing user
                    user.facebookId = profile.id;
                    user.profilePicture = profile.photos[0].value;
                    await user.save();
                    return done(null, user);
                }
            }

            // Create new user
            const newUser = new User({
                facebookId: profile.id,
                firstName: profile.name.givenName || profile.displayName.split(' ')[0],
                lastName: profile.name.familyName || profile.displayName.split(' ')[1] || '',
                email: email || `${profile.id}@facebook.temp`, // Temporary email if not provided
                username: (email ? email.split('@')[0] : profile.displayName.replace(/\s+/g, '').toLowerCase()) + '_' + Date.now(),
                profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                authProvider: 'facebook'
            });

            const savedUser = await newUser.save();
            return done(null, savedUser);
        } catch (error) {
            console.error('Facebook OAuth error:', error);
            return done(error, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};