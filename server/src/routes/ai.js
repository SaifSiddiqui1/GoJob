const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { premiumOrAdmin } = require('../middleware/auth');
const { uploadResume } = require('../middleware/upload');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const aiService = require('../services/aiService');
const Resume = require('../models/Resume');

const MAX_TEXT_LENGTH = 100000; // ~100k chars — safe for Groq Llama 3.3 (128k context window)

// Multer instance for ATS file uploads (PDF, DOCX, DOC, TXT — memory only)
const atsUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];
        const extOk = /\.(pdf|doc|docx|txt)$/i.test(file.originalname);
        if (allowed.includes(file.mimetype) || extOk) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Use PDF, DOCX, DOC, or TXT.'), false);
        }
    },
});

// ─── File → Plain Text Parser ─────────────────────────────────────────────────
// POST /api/ai/parse-file
// Accepts multipart/form-data with field "file". Returns { text: "..." }
router.post('/parse-file', protect, atsUpload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const { mimetype, originalname, buffer } = req.file;
        let text = '';

        // ── PDF ──────────────────────────────────────────────────────────────
        if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
            const data = await pdfParse(buffer);
            text = data.text || '';
        }

        // ── DOCX ─────────────────────────────────────────────────────────────
        else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            originalname.toLowerCase().endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value || '';
        }

        // ── DOC (legacy Word) ─────────────────────────────────────────────────
        else if (
            mimetype === 'application/msword' ||
            originalname.toLowerCase().endsWith('.doc')
        ) {
            // mammoth handles older .doc files too (best-effort)
            try {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value || '';
            } catch {
                // Fallback: strip non-printable bytes (old binary .doc)
                text = buffer.toString('latin1').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
            }
        }

        // ── TXT ───────────────────────────────────────────────────────────────
        else {
            text = buffer.toString('utf8');
        }

        // Clean up the text
        text = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')  // collapse excessive blank lines
            .trim();

        if (text.length < 50) {
            return res.status(422).json({
                success: false,
                message: 'Could not extract enough text from this file. Try copying and pasting the text manually.',
            });
        }

        if (text.length > MAX_TEXT_LENGTH) {
            text = text.substring(0, MAX_TEXT_LENGTH);
        }

        res.json({ success: true, data: { text, chars: text.length } });
    } catch (err) {
        next(err);
    }
});

// ATS Score Check (free for basic score, premium for detailed)
router.post('/ats-check', protect, async (req, res, next) => {
    try {
        const { resumeText, jobDescription } = req.body;
        if (!resumeText || !jobDescription) {
            return res.status(400).json({ success: false, message: 'Resume text and job description are required.' });
        }
        if (resumeText.length > MAX_TEXT_LENGTH || jobDescription.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ success: false, message: `Input text exceeds the maximum allowed length of ${MAX_TEXT_LENGTH.toLocaleString()} characters.` });
        }

        const result = await aiService.checkAtsScore(resumeText, jobDescription);

        // Free users get score + grade + summary only
        // Premium users get full breakdown
        const isPremium = req.user.isPremiumActive() || req.user.role === 'admin';
        const response = isPremium ? result : {
            score: result.score,
            grade: result.grade,
            summary: result.summary,
            improvements: result.improvements?.slice(0, 2),
            premiumRequired: true,
        };

        res.json({ success: true, data: response });
    } catch (err) { next(err); }
});

// Parse raw resume text → structured resume JSON (powers "Enhance Existing Resume" flow)
router.post('/parse-resume', protect, async (req, res, next) => {
    try {
        const { resumeText } = req.body;
        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ success: false, message: 'Resume text is too short to parse.' });
        }
        if (resumeText.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ success: false, message: `Resume text exceeds the maximum allowed length of ${MAX_TEXT_LENGTH.toLocaleString()} characters.` });
        }
        const parsed = await aiService.parseResumeText(resumeText);
        res.json({ success: true, data: { parsed } });
    } catch (err) { next(err); }
});

// Enhance resume with AI (premium)
router.post('/enhance-resume', protect, premiumOrAdmin, async (req, res, next) => {
    try {
        const { resumeId, targetRole } = req.body;
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

        const enhanced = await aiService.enhanceResume(resume.toObject(), targetRole);

        resume.aiEnhancedVersion = enhanced;
        await resume.save();

        res.json({ success: true, data: { enhanced, resumeId } });
    } catch (err) { next(err); }
});

// Generate professional summary
router.post('/generate-summary', protect, async (req, res, next) => {
    try {
        const { resumeData } = req.body;
        const summary = await aiService.generateSummary(resumeData);
        res.json({ success: true, data: { summary } });
    } catch (err) { next(err); }
});

// Generate cover letter (premium)
router.post('/cover-letter', protect, premiumOrAdmin, async (req, res, next) => {
    try {
        const { resumeId, jobDescription, companyName } = req.body;
        if (jobDescription && jobDescription.length > 20000) {
            return res.status(400).json({ success: false, message: 'Job description exceeds max length.' });
        }
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

        const coverLetter = await aiService.generateCoverLetter(resume.toObject(), jobDescription, companyName);
        res.json({ success: true, data: { coverLetter } });
    } catch (err) { next(err); }
});

// Skill gap analysis
router.post('/skill-gap', protect, async (req, res, next) => {
    try {
        const { resumeId, jobDescription } = req.body;
        if (jobDescription && jobDescription.length > 20000) {
            return res.status(400).json({ success: false, message: 'Job description exceeds max length.' });
        }
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

        const analysis = await aiService.analyzeSkillGap(resume.toObject(), jobDescription);
        res.json({ success: true, data: analysis });
    } catch (err) { next(err); }
});

// Generate professional bio
router.post('/generate-bio', protect, async (req, res, next) => {
    try {
        const { skills, currentStatus, location } = req.body;
        const bio = await aiService.generateBio({ fullName: req.user.fullName, currentStatus, skills, location });
        res.json({ success: true, data: { bio } });
    } catch (err) { next(err); }
});

// Generate interview questions
router.post('/interview-questions', protect, async (req, res, next) => {
    try {
        const { jobDescription, difficulty } = req.body;
        if (jobDescription && jobDescription.length > 20000) {
            return res.status(400).json({ success: false, message: 'Job description exceeds max length.' });
        }
        const questions = await aiService.generateInterviewQuestions(jobDescription, difficulty);
        res.json({ success: true, data: questions });
    } catch (err) { next(err); }
});
// LinkedIn Optimizer (Premium)
router.post('/linkedin-optimizer', protect, premiumOrAdmin, async (req, res, next) => {
    try {
        const { resumeId } = req.body;
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

        const optimization = await aiService.optimizeLinkedInProfile(resume.toObject());
        res.json({ success: true, data: optimization });
    } catch (err) { next(err); }
});

// Career Path Advisor (Premium)
router.post('/career-path', protect, premiumOrAdmin, async (req, res, next) => {
    try {
        const { resumeId } = req.body;
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

        const careerPath = await aiService.adviseCareerPath(resume.toObject());
        res.json({ success: true, data: careerPath });
    } catch (err) { next(err); }
});

// Job Description Summarizer (Premium)
router.post('/job-summarizer', protect, premiumOrAdmin, async (req, res, next) => {
    try {
        const { jobDescription } = req.body;
        if (!jobDescription) return res.status(400).json({ success: false, message: 'Job description is required.' });
        if (jobDescription.length > 20000) {
            return res.status(400).json({ success: false, message: 'Job description exceeds max length.' });
        }

        const summary = await aiService.summarizeJobDescription(jobDescription);
        res.json({ success: true, data: summary });
    } catch (err) { next(err); }
});

module.exports = router;
