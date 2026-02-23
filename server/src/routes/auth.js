const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Local auth
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Get current user
router.get('/me', protect, authController.getMe);

// Google OAuth — prompt=select_account forces the account picker every time
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' }));
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
    authController.oauthCallback
);

// GitHub OAuth — allow_signup lets user choose account when multiple exist
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false, allow_signup: 'true' }));
router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=github` }),
    authController.oauthCallback
);

module.exports = router;
