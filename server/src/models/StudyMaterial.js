const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: {
        type: String,
        enum: ['sde', 'it', 'marketing', 'sales', 'government', 'interview_prep', 'aptitude', 'resume_tips', 'general'],
        required: true,
    },
    type: { type: String, enum: ['pdf', 'doc', 'video_link', 'article_link', 'note'], default: 'pdf' },
    fileUrl: { type: String },   // Cloudinary URL for files
    externalLink: { type: String }, // For video links, article links
    thumbnail: { type: String },

    tags: [String],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    language: { type: String, default: 'en' },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
