const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { uploadBuffer } = require('../config/cloudinary');
const sharp = require('sharp');

// Bio creator → delegated to AI service
router.post('/bio', protect, async (req, res, next) => {
    try {
        const aiService = require('../services/aiService');
        const bio = await aiService.generateBio({ ...req.body, fullName: req.user.fullName });
        res.json({ success: true, data: { bio } });
    } catch (err) { next(err); }
});

// Photo resizer
router.post('/resize-photo', protect, uploadImage.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image provided.' });
        const { width = 400, height = 400, format = 'jpeg' } = req.body;

        const result = await uploadBuffer(req.file.buffer, {
            folder: `gojob/tools/${req.user._id}`,
            transformation: [
                { width: Number(width), height: Number(height), crop: 'fill' },
                { quality: 'auto' },
            ],
            format,
        });

        res.json({ success: true, data: { url: result.secure_url, size: result.bytes } });
    } catch (err) { next(err); }
});

// File info (simple file type detector)
router.post('/file-info', protect, uploadImage.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file provided.' });
        res.json({
            success: true,
            data: {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                sizeKB: Math.round(req.file.size / 1024),
            },
        });
    } catch (err) { next(err); }
});

// Price calculator (simple formula-based)
router.post('/salary-calculator', protect, (req, res) => {
    const { annualSalary, taxBracket = 'medium', allowances = 0 } = req.body;
    const salary = Number(annualSalary) + Number(allowances);
    const taxRates = { low: 0.05, medium: 0.20, high: 0.30 };
    const taxRate = taxRates[taxBracket] || 0.20;
    const tax = salary * taxRate;
    const netAnnual = salary - tax;
    res.json({
        success: true,
        data: {
            grossAnnual: salary,
            grossMonthly: Math.round(salary / 12),
            taxDeducted: Math.round(tax),
            netAnnual: Math.round(netAnnual),
            netMonthly: Math.round(netAnnual / 12),
            effectiveTaxRate: `${(taxRate * 100).toFixed(0)}%`,
        },
    });
});

module.exports = router;
