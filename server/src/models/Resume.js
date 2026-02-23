const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, default: 'My Resume' },
    templateId: { type: String, default: 'classic' },

    // Personal Info
    personalInfo: {
        fullName: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        github: String,
        portfolio: String,
        summary: String,
        photo: String,
    },

    // Resume Content Sections
    experience: [{
        company: String,
        position: String,
        location: String,
        startDate: String,
        endDate: String,
        current: { type: Boolean, default: false },
        description: String,
        achievements: [String],
    }],

    education: [{
        institution: String,
        degree: String,
        field: String,
        startDate: String,
        endDate: String,
        grade: String,
        description: String,
    }],

    skills: [{
        category: String,
        items: [String],
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    }],

    projects: [{
        name: String,
        description: String,
        technologies: [String],
        link: String,
        github: String,
        startDate: String,
        endDate: String,
    }],

    certifications: [{
        name: String,
        issuer: String,
        date: String,
        link: String,
        credentialId: String,
    }],

    languages: [{
        language: String,
        proficiency: { type: String, enum: ['basic', 'conversational', 'professional', 'native'] },
    }],

    achievements: [String],
    hobbies: [String],

    // AI-enhanced content (store AI generated version separately)
    aiEnhancedVersion: { type: mongoose.Schema.Types.Mixed },

    // ATS score from last check
    lastAtsScore: { type: Number },
    lastAtsScoredAt: { type: Date },

    // Cloudinary PDF URL (after generation)
    pdfUrl: { type: String },
    downloadCount: { type: Number, default: 0 },

    isPublic: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
