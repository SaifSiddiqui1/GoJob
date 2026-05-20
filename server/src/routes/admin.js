const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadFile } = require('../middleware/upload');
const { uploadBuffer } = require('../config/cloudinary');
const Job = require('../models/Job');
const User = require('../models/User');
const StudyMaterial = require('../models/StudyMaterial');
const Resume = require('../models/Resume');
const { aggregateJobs, fetchFromJSearchManual } = require('../services/jobAggregator');

// ─── N8N / External Webhook ─────────────────────────────────────────────────────
// Must be placed BEFORE protect/adminOnly middleware so it can use token auth
router.post('/webhook/n8n', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const secret = process.env.N8N_WEBHOOK_SECRET;
        if (!secret) {
            console.error('N8N_WEBHOOK_SECRET is not defined');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        const expectedAuth = `Bearer ${secret}`;
        const isAuthValid = authHeader && authHeader.length === expectedAuth.length && 
                            crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth));

        if (!isAuthValid) {
            return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
        }

        const jobsData = Array.isArray(req.body) ? req.body : [req.body];
        let saved = 0;
        console.log('N8N Webhook Received:', JSON.stringify(req.body, null, 2));

        const mapCategory = (cat = '', title = '') => {
            const str = (cat + ' ' + title).toLowerCase();
            if (str.includes('software') || str.includes('devops') || str.includes('engineer') || str.includes('developer')) return 'sde';
            if (str.includes('market') || str.includes('pr') || str.includes('social media')) return 'marketing';
            if (str.includes('sales') || str.includes('account manager') || str.includes('business dev')) return 'sales';
            if (str.includes('support') || str.includes('customer')) return 'customer_support';
            if (str.includes('finance') || str.includes('accountant') || str.includes('tax')) return 'finance';
            if (str.includes('health') || str.includes('medic') || str.includes('nurse')) return 'healthcare';
            if (str.includes('law') || str.includes('legal') || str.includes('attorney')) return 'law';
            if (str.includes('gov') || str.includes('public')) return 'government';
            return 'it';
        };

        for (const rawJob of jobsData) {
            // Support both mapped names and raw Remotive API names
            const title = rawJob.title || rawJob.position;
            const company = rawJob.company || rawJob.company_name;
            const location = rawJob.location || rawJob.candidate_required_location || 'Remote';
            const url = rawJob.applyLink || rawJob.url;

            if (!title || !company) {
                console.log('Skipping job due to missing title or company:', { title, company });
                continue;
            }

            const mappedJob = {
                title: title,
                company: company,
                location: location,
                remote: rawJob.remote || 'remote',
                description: rawJob.description || title,
                applyLink: url,
                sourceJobId: rawJob.sourceJobId || `n8n-${Date.now()}-${crypto.randomInt(1000, 9999)}`,
                source: rawJob.source || 'n8n',
                sourceUrl: url,
                category: mapCategory(rawJob.category, title),
                jobType: rawJob.jobType || rawJob.job_type || 'full-time',
                postedDate: rawJob.postedDate || rawJob.publication_date ? new Date(rawJob.postedDate || rawJob.publication_date) : new Date(),
                skills: rawJob.skills || rawJob.tags || [],
                status: 'pending', // Admins must still approve them
            };

            const exists = await Job.findOne({ sourceJobId: mappedJob.sourceJobId, source: mappedJob.source });
            if (!exists) {
                await Job.create(mappedJob);
                saved++;
            }
        }
        res.json({ success: true, message: `Webhook processed. Saved ${saved} new jobs.` });
    } catch (err) { next(err); }
});

// Diagnostic: test each source independently and report counts/errors
// GET /api/admin/jobs/test-sources (Public for testing)
router.get('/jobs/test-sources', async (req, res, next) => {
    try {
        const axios = require('axios');
        const key = process.env.RAPIDAPI_KEY;
        const report = {};

        const testSource = async (name, fn) => {
            try {
                const jobs = await fn();
                report[name] = { status: 'ok', count: jobs.length, sample: jobs[0]?.title || null };
            } catch (err) {
                report[name] = { status: 'error', error: err.response?.status ? `HTTP ${err.response.status}: ${err.response.data?.message || err.message}` : err.message };
            }
        };

        const rapidGet = async (url, host, params = {}) => {
            if (!key) throw new Error('RAPIDAPI_KEY not set in environment');
            const r = await axios.get(url, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': key },
                params,
                timeout: 15000,
            });
            return r.data;
        };

        await Promise.all([
            testSource('adzuna',          () => axios.get(`https://api.adzuna.com/v1/api/jobs/gb/search/1`, { params: { app_id: process.env.ADZUNA_APP_ID, app_key: process.env.ADZUNA_API_KEY, results_per_page: 3, what: 'developer' }, timeout: 12000 }).then(r => r.data?.results || [])),
            testSource('remotive',         () => axios.get('https://remotive.com/api/remote-jobs', { params: { limit: 3 }, timeout: 10000 }).then(r => r.data?.jobs || [])),
            testSource('remoteok',         () => axios.get('https://remoteok.com/api', { headers: { 'User-Agent': 'JobVault/1.0' }, timeout: 10000 }).then(r => (r.data || []).filter(j => j.id))),
            testSource('arbeitnow',        () => axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 10000 }).then(r => r.data?.data || [])),
            testSource('jsearch',          () => rapidGet('https://jsearch.p.rapidapi.com/search', 'jsearch.p.rapidapi.com', { query: 'developer india', num_pages: '1' }).then(d => d?.data || [])),
            testSource('indeed46',         () => rapidGet('https://indeed46.p.rapidapi.com/job', 'indeed46.p.rapidapi.com', { country: 'CA', sort: -1, page_size: 5 }).then(d => Array.isArray(d) ? d : (d?.jobs || d?.data || []))),
            testSource('linkedin-search',  () => rapidGet('https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h', 'linkedin-job-search-api.p.rapidapi.com', { offset: 0, title_filter: 'Software Engineer', location_filter: 'United States', description_type: 'text' }).then(d => Array.isArray(d) ? d : (d?.jobs || d?.data || []))),
            testSource('active-jobs-db',   () => rapidGet('https://active-jobs-db.p.rapidapi.com/active-ats-1h', 'active-jobs-db.p.rapidapi.com', { offset: 0, title_filter: '"Software Engineer"', description_type: 'text' }).then(d => Array.isArray(d) ? d : (d?.jobs || d?.data || []))),
            testSource('job-posting-feed', () => rapidGet('https://job-posting-feed-api.p.rapidapi.com/active-ats-6m', 'job-posting-feed-api.p.rapidapi.com', { description_type: 'text' }).then(d => Array.isArray(d) ? d : (d?.jobs || d?.data || []))),
            testSource('internships-api',  () => rapidGet('https://internships-api.p.rapidapi.com/active-jb-7d', 'internships-api.p.rapidapi.com').then(d => Array.isArray(d) ? d : (d?.jobs || d?.data || []))),
            testSource('indeed-scraper',   () => axios.post('https://indeed-scraper-api.p.rapidapi.com/api/job', { scraper: { maxRows: 3, query: 'Developer', location: 'New York', jobType: 'fulltime', radius: '50', sort: 'relevance', fromDays: '7', country: 'us' } }, { headers: { 'x-rapidapi-host': 'indeed-scraper-api.p.rapidapi.com', 'x-rapidapi-key': key, 'Content-Type': 'application/json' }, timeout: 20000 }).then(r => r.data?.results || r.data?.data || r.data?.jobs || [])),
            testSource('linkedin-jobs2',   () => rapidGet('https://linkedin-jobs-api2.p.rapidapi.com/active-jb-1h', 'linkedin-jobs-api2.p.rapidapi.com').then(d => Array.isArray(d) ? d : (d?.jobs || d?.data || []))),
        ]);

        const working = Object.entries(report).filter(([, v]) => v.status === 'ok').length;
        const total   = Object.keys(report).length;
        res.json({ success: true, summary: `${working}/${total} sources working`, rapidApiKeySet: !!key, data: report });
    } catch (err) { next(err); }
});

// All following admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
    try {
        const [totalUsers, totalJobs, pendingJobs, approvedJobs, totalResumes] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Job.countDocuments(),
            Job.countDocuments({ status: 'pending' }),
            Job.countDocuments({ status: 'approved' }),
            Resume.countDocuments(),
        ]);
        res.json({ success: true, data: { totalUsers, totalJobs, pendingJobs, approvedJobs, totalResumes } });
    } catch (err) { next(err); }
});

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
    try {
        const { search, role } = req.query;
        let page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        
        const query = {};
        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [{ fullName: { $regex: safeSearch, $options: 'i' } }, { email: { $regex: safeSearch, $options: 'i' } }];
        }
        if (role) query.role = role;

        const total = await User.countDocuments(query);
        const users = await User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
        res.json({ success: true, data: { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
    } catch (err) { next(err); }
});

router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: { user } });
    } catch (err) { next(err); }
});

router.put('/users/:id', async (req, res, next) => {
    try {
        const allowed = ['role', 'isActive', 'isPremium', 'premiumExpiresAt', 'contactNumber'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json({ success: true, data: { user } });
    } catch (err) { next(err); }
});

// ─── Job Management (Admin Approval Workflow from PDF) ────────────────────────
router.get('/jobs', async (req, res, next) => {
    try {
        const { status = 'pending', source, category } = req.query;
        let page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

        const query = {};
        if (status !== 'all') query.status = status;
        if (source) query.source = source;
        if (category) query.category = category;

        const total = await Job.countDocuments(query);
        const jobs = await Job.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
        res.json({ success: true, data: { jobs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
    } catch (err) { next(err); }
});

// Get a single job (any status)
router.get('/jobs/:id', async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        res.json({ success: true, data: { job } });
    } catch (err) { next(err); }
});

// Approve a job
router.put('/jobs/:id/approve', async (req, res, next) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, {
            status: 'approved',
            approvedBy: req.user._id,
            approvedAt: new Date(),
        }, { new: true });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        res.json({ success: true, message: 'Job approved and is now live.', data: { job } });
    } catch (err) { next(err); }
});

// Reject a job
router.put('/jobs/:id/reject', async (req, res, next) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, {
            status: 'rejected',
            rejectionReason: req.body.reason || 'Does not meet quality standards.',
        }, { new: true });
        res.json({ success: true, message: 'Job rejected.', data: { job } });
    } catch (err) { next(err); }
});

// Manual job creation by admin
router.post('/jobs', async (req, res, next) => {
    try {
        const allowedFields = ['title', 'category', 'location', 'remote', 'jobType', 'description', 'requirements', 'responsibilities', 'skills', 'experienceLevel', 'experienceYears', 'salary', 'applyLink', 'applyEmail', 'deadline', 'company', 'companyLogo', 'sector', 'country'];
        const jobData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) jobData[f] = req.body[f]; });
        
        const job = await Job.create({ ...jobData, source: 'manual', addedBy: req.user._id, status: 'approved', approvedAt: new Date() });
        res.status(201).json({ success: true, data: { job } });
    } catch (err) { next(err); }
});

// Delete a job
router.delete('/jobs/:id', async (req, res, next) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Job deleted.' });
    } catch (err) { next(err); }
});

// Manually trigger job aggregation (supports all or specific source)
router.post('/jobs/fetch', async (req, res, next) => {
    try {
        const { source } = req.body;
        const result = await aggregateJobs(source);
        res.json({ success: true, message: 'Job fetching complete.', data: result });
    } catch (err) { next(err); }
});

// Bulk delete old jobs or delete all jobs in a single click
// POST /api/admin/jobs/delete-old
// Body: { date, relative, all }
router.post('/jobs/delete-old', async (req, res, next) => {
    try {
        const { date, relative, all } = req.body;
        
        if (all) {
            const result = await Job.deleteMany({});
            return res.json({
                success: true,
                message: `Successfully deleted all ${result.deletedCount} jobs from the database.`,
                data: { deletedCount: result.deletedCount }
            });
        }

        let beforeDate;
        if (relative) {
            const now = new Date();
            if (relative === '2days') {
                beforeDate = new Date(now.setDate(now.getDate() - 2));
            } else if (relative === '1week') {
                beforeDate = new Date(now.setDate(now.getDate() - 7));
            } else if (relative === '1month') {
                beforeDate = new Date(now.setMonth(now.getMonth() - 1));
            } else {
                return res.status(400).json({ success: false, message: 'Invalid relative date option.' });
            }
        } else if (date) {
            beforeDate = new Date(date);
        } else {
            return res.status(400).json({ success: false, message: 'Either date, relative date, or all option must be provided.' });
        }

        if (isNaN(beforeDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date provided.' });
        }

        const result = await Job.deleteMany({ postedDate: { $lt: beforeDate } });
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} jobs older than ${beforeDate.toDateString()}`,
            data: { deletedCount: result.deletedCount, date: beforeDate }
        });
    } catch (err) { next(err); }
});

// On-demand JSearch: search, save to DB, return results
// POST /api/admin/jobs/fetch-jsearch
// Body: { query, country, numPages, autoApprove }
router.post('/jobs/fetch-jsearch', async (req, res, next) => {
    try {
        const { query = 'software engineer jobs in india', country = 'in', numPages = 1, autoApprove = false } = req.body;
        const fetchedJobs = await fetchFromJSearchManual(query, country, Number(numPages));

        let saved = 0;
        for (const job of fetchedJobs) {
            try {
                const exists = await Job.findOne({ sourceJobId: job.sourceJobId, source: 'jsearch' });
                if (!exists) {
                    await Job.create({
                        ...job,
                        status: autoApprove ? 'approved' : 'pending',
                        ...(autoApprove ? { approvedBy: req.user._id, approvedAt: new Date() } : {}),
                    });
                    saved++;
                }
            } catch (_) { /* skip duplicates */ }
        }

        res.json({
            success: true,
            message: `JSearch complete. Fetched ${fetchedJobs.length} jobs, saved ${saved} new.`,
            data: { fetched: fetchedJobs.length, saved, jobs: fetchedJobs.slice(0, 20) },
        });
    } catch (err) { next(err); }
});

// Preview JSearch results WITHOUT saving to DB
// GET /api/admin/jobs/preview-jsearch?query=...&country=in&numPages=1
router.get('/jobs/preview-jsearch', async (req, res, next) => {
    try {
        const { query = 'software engineer india', country = 'in', numPages = 1 } = req.query;
        const jobs = await fetchFromJSearchManual(query, country, Number(numPages));
        res.json({ success: true, data: { count: jobs.length, jobs } });
    } catch (err) { next(err); }
});



// ─── Study Materials ──────────────────────────────────────────────────────────
router.post('/study', uploadFile.single('file'), async (req, res, next) => {
    try {
        let fileUrl;
        if (req.file) {
            const result = await uploadBuffer(req.file.buffer, {
                folder: 'jobvault/study',
                resource_type: 'raw',
            });
            fileUrl = result.secure_url;
        }
        
        const allowedFields = ['title', 'description', 'category', 'type', 'level'];
        const materialData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) materialData[f] = req.body[f]; });
        
        const material = await StudyMaterial.create({ ...materialData, fileUrl, uploadedBy: req.user._id });
        res.status(201).json({ success: true, data: { material } });
    } catch (err) { next(err); }
});

router.delete('/study/:id', async (req, res, next) => {
    try {
        await StudyMaterial.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Material deleted.' });
    } catch (err) { next(err); }
});

// ─── Employer Management ─────────────────────────────────────────────────────
const Employer = require('../models/Employer');
const { sendEmail } = require('../services/emailService');

router.get('/employers', protect, adminOnly, async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const filter = {};
        if (status) filter.verificationStatus = status;
        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.companyName = { $regex: safeSearch, $options: 'i' };
        }
        const employers = await Employer.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: employers });
    } catch (err) { next(err); }
});

router.put('/employers/:id/verify', protect, adminOnly, async (req, res, next) => {
    try {
        const employer = await Employer.findByIdAndUpdate(req.params.id,
            { verificationStatus: 'verified', verifiedAt: new Date(), verifiedBy: req.user._id },
            { new: true }
        );
        if (!employer) return res.status(404).json({ success: false, message: 'Employer not found.' });

        // Notify employer
        await sendEmail({
            to: employer.email,
            subject: '🎉 Your JobVault Employer Account is Verified!',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#4f46e5">You're verified! 🚀</h2>
                <p>Congratulations <strong>${employer.contactName}</strong>! Your company <strong>${employer.companyName}</strong> has been verified on JobVault.</p>
                <p>You can now <a href="${process.env.CLIENT_URL}/employer/post-job" style="color:#4f46e5;font-weight:bold">post jobs</a> and reach thousands of talented candidates.</p>
                <p>Happy hiring! 🎯</p></div>`,
        });

        res.json({ success: true, message: 'Employer verified.', data: employer });
    } catch (err) { next(err); }
});

router.put('/employers/:id/reject', protect, adminOnly, async (req, res, next) => {
    try {
        const { reason } = req.body;
        const employer = await Employer.findByIdAndUpdate(req.params.id,
            { verificationStatus: 'rejected', rejectionReason: reason },
            { new: true }
        );
        if (!employer) return res.status(404).json({ success: false, message: 'Employer not found.' });

        await sendEmail({
            to: employer.email,
            subject: 'JobVault Employer Account — Verification Update',
            html: `<p>Hi ${employer.contactName}, unfortunately your employer account for <strong>${employer.companyName}</strong> was not verified at this time.</p>
                   <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
                   <p>Please update your company profile and contact us if you have any questions.</p>`,
        });

        res.json({ success: true, message: 'Employer rejected.' });
    } catch (err) { next(err); }
});

module.exports = router;

