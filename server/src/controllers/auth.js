const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const passport = require('passport');
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const { fullName, username, email, password, contactNumber, dateOfBirth } = req.body;

        if (await User.findOne({ email })) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ success: false, message: 'Username already taken.' });
        }

        // Phone Number Validation
        if (contactNumber) {
            try {
                // If it doesn't start with '+', assume India as default for local formats
                const numStr = contactNumber.startsWith('+') ? contactNumber : `+91${contactNumber}`;
                if (!isValidPhoneNumber(numStr)) {
                    return res.status(400).json({ success: false, message: 'Please provide a valid, real contact number.' });
                }
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid contact number format.' });
            }
        }

        // Generate email verification OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        const user = await User.create({
            fullName, username, email, password, contactNumber, dateOfBirth,
            otp, otpExpires,
        });

        // Always log OTP to console for local development
        console.log(`\n📧 OTP for ${email}: ${otp}  (expires in 10 min)\n`);

        // Send OTP email (fails gracefully if RESEND_API_KEY not set)
        const emailSent = await sendEmail({
            to: email,
            subject: 'Verify your GoJob account',
            html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border-radius:12px;background:#1e1b4b;color:white;">
          <h2 style="color:#818cf8;">Welcome to GoJob! 🚀</h2>
          <p>Your email verification code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#312e81;border-radius:8px;margin:20px 0;">${otp}</div>
          <p style="color:#a5b4fc;">This code expires in 10 minutes.</p>
        </div>
      `,
        });

        const isDev = process.env.NODE_ENV !== 'production';
        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Registration successful. Check your email for the OTP.'
                : 'Registration successful. Check the server console for your OTP (email not configured).',
            data: {
                userId: user._id,
                email: user.email,
                // In dev mode without email: return OTP so frontend can pre-fill it
                ...(isDev && !emailSent && { devOtp: otp }),
            },
        });
    } catch (err) {
        next(err);
    }
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId).select('+otp +otpExpires');

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });
        if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP expired.' });

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);
        res.json({ success: true, message: 'Email verified successfully!', data: { token, user: sanitizeUser(user) } });
    } catch (err) {
        next(err);
    }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
exports.resendOTP = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId).select('+otp +otpExpires');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'GoJob — New verification code',
            html: `<div style="font-family:sans-serif;padding:20px;"><h3>Your new OTP: <strong style="font-size:28px;letter-spacing:4px;">${otp}</strong></h3><p>Expires in 10 minutes.</p></div>`,
        });

        res.json({ success: true, message: 'New OTP sent to your email.' });
    } catch (err) {
        next(err);
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { login, password } = req.body; // login = username OR email OR contact

        const user = await User.findOne({
            $or: [{ email: login }, { username: login }, { contactNumber: login }],
        }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'No account found with those details. Please sign up.' });
        }

        // OAuth-only accounts have no password — direct them to use social login
        if (!user.password) {
            const provider = user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'social login';
            return res.status(401).json({
                success: false,
                message: `This account was created with ${provider}. Please use the ${provider} button to sign in.`,
            });
        }

        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first. Check your inbox for the OTP.',
                needsVerification: true,
                userId: user._id,
            });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account has been deactivated. Contact support.' });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);
        res.json({ success: true, data: { token, user: sanitizeUser(user) } });
    } catch (err) {
        next(err);
    }
};


// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            // Always return success to prevent email enumeration
            return res.json({ success: true, message: 'If that email exists, a reset OTP was sent.' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        // Always log OTP to console for local development
        console.log(`\n🔑 Password Reset OTP for ${email}: ${otp}  (expires in 15 min)\n`);

        const emailSent = await sendEmail({
            to: email,
            subject: 'GoJob — Password Reset OTP',
            html: `<div style="font-family:sans-serif;padding:20px;"><h3>Password Reset Code</h3><p>Your OTP: <strong style="font-size:28px;">${otp}</strong></p><p>Expires in 15 minutes.</p></div>`,
        });

        const isDev = process.env.NODE_ENV !== 'production';
        res.json({
            success: true,
            message: emailSent
                ? 'If that email exists, a reset OTP was sent.'
                : 'OTP generated. Check server console (email not configured).',
            userId: user._id,
            ...(isDev && !emailSent && { devOtp: otp }),
        });

    } catch (err) {
        next(err);
    }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
    try {
        const { userId, otp, newPassword } = req.body;
        const user = await User.findById(userId).select('+otp +otpExpires');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP expired.' });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. Please log in.' });
    } catch (err) {
        next(err);
    }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    res.json({ success: true, data: { user: sanitizeUser(req.user) } });
};

// ─── OAuth Callback Handler ───────────────────────────────────────────────────
exports.oauthCallback = (req, res) => {
    const token = generateToken(req.user._id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/oauth-success?token=${token}`);
};

// ─── Helper: strip sensitive fields ──────────────────────────────────────────
const sanitizeUser = (user) => {
    const u = user.toObject ? user.toObject() : { ...user };
    delete u.password; delete u.otp; delete u.otpExpires;
    delete u.emailVerificationToken; delete u.passwordResetToken;
    return u;
};
