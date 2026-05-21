const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const passport = require('passport');
const validateGlobalPhone = require('../utils/validatePhone');

// Helper: generate 6-digit OTP using cryptographically secure randomInt
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const { fullName, username, email, password, contactNumber, dateOfBirth } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.' });
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ success: false, message: 'Username already taken.' });
        }

        // Phone Number Validation
        let validContactNumber = null;
        if (contactNumber) {
            validContactNumber = validateGlobalPhone(contactNumber);
            if (!validContactNumber) {
                return res.status(400).json({ success: false, message: 'Please provide a valid, non-repeating real contact number.' });
            }
        }

        // Generate email verification OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        const user = await User.create({
            fullName, username, email, password, contactNumber: validContactNumber, dateOfBirth,
            otp, otpExpires,
        });

        // Log OTP to console for local development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n📧 OTP for ${email}: ${otp}  (expires in 10 min)\n`);
        }

        const emailSent = await sendEmail({
            to: email,
            subject: 'Verify your JobVault account',
            html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;padding:0;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:40px 32px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#ffffff;margin-bottom:4px;">JobVault</div>
            <p style="color:#a5b4fc;font-size:14px;margin:0;">Email Verification</p>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi <strong>${fullName}</strong>, enter this code to verify your account:</p>
            <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1e1b4b;padding:20px;background:#f5f3ff;border-radius:12px;border:2px dashed #c4b5fd;margin:0 auto 24px;display:inline-block;">${otp}</div>
            <p style="color:#6b7280;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">If you didn't create an account, please ignore this email.</p>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">© ${new Date().getFullYear()} JobVault. All rights reserved.</p>
          </div>
        </div>
      `,
        });

        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Registration successful! Check your email for the verification code.'
                : 'Registration successful. Email delivery failed — please contact support or try again.',
            data: {
                userId: user._id,
                email: user.email,
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
        
        const isOtpValid = otp && user.otp && otp.length === user.otp.length && 
                          crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(user.otp));
        if (!isOtpValid) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        
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
            subject: 'JobVault — New verification code',
            html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;padding:0;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:32px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#ffffff;">JobVault</div>
            <p style="color:#a5b4fc;font-size:13px;margin:4px 0 0;">New Verification Code</p>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="color:#374151;font-size:14px;margin:0 0 20px;">Here's your new verification code:</p>
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#1e1b4b;padding:16px;background:#f5f3ff;border-radius:12px;border:2px dashed #c4b5fd;display:inline-block;">${otp}</div>
            <p style="color:#6b7280;font-size:13px;margin:20px 0 0;">Expires in <strong>10 minutes</strong>.</p>
          </div>
        </div>
      `,
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
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
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
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
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

        // Log OTP to console for local development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n🔑 Password Reset OTP for ${email}: ${otp}  (expires in 15 min)\n`);
        }

        const emailSent = await sendEmail({
            to: email,
            subject: 'JobVault — Password Reset OTP',
            html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;padding:0;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#991b1b 0%,#dc2626 100%);padding:32px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#ffffff;">JobVault</div>
            <p style="color:#fecaca;font-size:13px;margin:4px 0 0;">Password Reset</p>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="color:#374151;font-size:14px;margin:0 0 20px;">Your password reset code is:</p>
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#991b1b;padding:16px;background:#fef2f2;border-radius:12px;border:2px dashed #fca5a5;display:inline-block;">${otp}</div>
            <p style="color:#6b7280;font-size:13px;margin:20px 0 0;">Expires in <strong>15 minutes</strong>.</p>
            <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `,
        });

        res.json({
            success: true,
            message: emailSent
                ? 'If that email exists, a reset OTP was sent.'
                : 'Password reset failed — email delivery error.',
            userId: user._id,
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
        
        const isOtpValid = otp && user.otp && otp.length === user.otp.length && 
                          crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(user.otp));
        if (!isOtpValid) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        
        if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP expired.' });

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.' });
        }

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
