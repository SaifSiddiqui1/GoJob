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

    // ─── NAUKRI-STYLE ADVANCED PROFILE FIELDS ───

    profileSummary: { type: String, maxLength: 2000 },

    careerPreferences: {
        preferredJobType: { type: String, enum: ['Full Time', 'Part Time', 'Contract', 'Freelance', 'Internship'] },
        availabilityToWork: { type: String, enum: ['15 Days or less', '1 Month', '2 Months', '3 Months', 'Immediately'] },
        preferredLocations: [{ type: String }],
    },

    education: [{
        degree: { type: String }, // e.g., 'MCA', 'BCA', 'Class XII'
        institution: { type: String }, // e.g., 'Jamia Milia Islamia (JMI)'
        yearOfPassing: { type: Number }, // e.g., 2026
        isFullTime: { type: Boolean, default: true },
        board: { type: String }, // For Class X/XII (e.g., 'CBSE')
        medium: { type: String }, // e.g., 'English'
        scorePercentage: { type: Number }, // e.g., 91.2
    }],

    keySkills: [{ type: String }], // e.g., ['Java', 'Spring Boot', 'SQL']

    languages: [{
        language: { type: String }, // e.g., 'English'
        canRead: { type: Boolean, default: false },
        canWrite: { type: Boolean, default: false },
        canSpeak: { type: Boolean, default: false },
    }],

    internships: [{
        company: { type: String },
        role: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String },
    }],

    employment: [{
        company: { type: String },
        designation: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String },
    }],

    projects: [{
        title: { type: String }, // e.g., 'Atm Database Management System'
        startDate: { type: Date },
        endDate: { type: Date },
        isOngoing: { type: Boolean, default: false },
        description: { type: String },
        link: { type: String }, // Optional GitHub/Live link
    }],

    accomplishments: {
        certifications: [{ title: String, issuer: String, dateCompleted: Date }],
        awards: [{ title: String, issuer: String, dateReceived: Date }],
        competitiveExams: [{ examName: String, rankOrScore: String, year: Number }],
        clubAndCommittees: [{ position: String, clubName: String, duration: String }],
    },

    academicAchievements: [{ type: String }],

    // Profile completion score
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

// Calculate profile completeness (Updated for Naukri-like layout)
userSchema.methods.calcProfileCompleteness = function () {
    // We compute a weighted score based on essential and advanced sections being populated
    let score = 0;
    const maxScore = 100;

    // Basic Info (30% total)
    if (this.fullName) score += 5;
    if (this.email) score += 5;
    if (this.contactNumber) score += 5;
    if (this.gender) score += 5;
    if (this.location) score += 5;
    if (this.photo) score += 5;

    // Advanced Info (70% total)
    if (this.profileSummary && this.profileSummary.length > 30) score += 10;

    if (this.education && this.education.length > 0) score += 15;
    if (this.keySkills && this.keySkills.length > 0) score += 15;

    if (this.careerPreferences && this.careerPreferences.preferredLocations && this.careerPreferences.preferredLocations.length > 0) score += 10;

    if (this.languages && this.languages.length > 0) score += 5;

    if (
        (this.internships && this.internships.length > 0) ||
        (this.employment && this.employment.length > 0) ||
        (this.projects && this.projects.length > 0)
    ) {
        score += 15; // User has some form of experience/projects
    }

    return Math.min(score, maxScore);
};

module.exports = mongoose.model('User', userSchema);
