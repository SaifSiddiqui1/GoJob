const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    contactNumber: { type: String, unique: true, sparse: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    location: { type: String },
    currentStatus: { type: String, enum: ['student', 'graduate', 'employed', 'unemployed'], default: 'student' },
    photo: { type: String }, // Cloudinary URL
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // OAuth
    googleId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },

    // Auth
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },

    // Premium subscription
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date },
    resumeDownloadsUsed: { type: Number, default: 0 },

    // Preferences
    preferredLanguage: { type: String, default: 'en' },
    darkMode: { type: Boolean, default: false },
    locationBasedJobs: { type: Boolean, default: true },
    jobAlerts: { type: Boolean, default: false },

    // Saved jobs
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

    // Profile completion
    profileCompleteness: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if premium is active
userSchema.methods.isPremiumActive = function () {
    return this.isPremium && this.premiumExpiresAt > new Date();
};

// Calculate profile completeness
userSchema.methods.calcProfileCompleteness = function () {
    const fields = ['fullName', 'email', 'contactNumber', 'gender', 'location', 'currentStatus', 'photo', 'dateOfBirth'];
    const filled = fields.filter(f => this[f]).length;
    return Math.round((filled / fields.length) * 100);
};

module.exports = mongoose.model('User', userSchema);
