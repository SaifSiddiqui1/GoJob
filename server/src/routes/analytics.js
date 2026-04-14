const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Resume = require('../models/Resume');

// All analytics routes require admin auth
router.use(protect, adminOnly);

// Helper: get date N days ago
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Helper: generate 7-day/30-day date range pipeline
const dailyGroupPipeline = (field, days) => [
    { $match: { [field]: { $gte: daysAgo(days) } } },
    {
        $group: {
            _id: {
                year: { $year: `$${field}` },
                month: { $month: `$${field}` },
                day: { $dayOfMonth: `$${field}` },
            },
            count: { $sum: 1 },
        },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
];

// ─── 1. Overview Stats ────────────────────────────────────────────────────────
router.get('/overview', async (req, res, next) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalUsers,
            newUsersThisMonth,
            newUsersLastMonth,
            premiumUsers,
            totalJobs,
            activeJobs,
            pendingJobs,
            rejectedJobs,
            totalResumes,
            resumesThisMonth,
            totalJobViews,
            totalApplied,
        ] = await Promise.all([
            User.countDocuments({ isActive: true }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            User.countDocuments({ isPremium: true, isActive: true }),
            Job.countDocuments(),
            Job.countDocuments({ status: 'approved', isActive: true }),
            Job.countDocuments({ status: 'pending' }),
            Job.countDocuments({ status: 'rejected' }),
            Resume.countDocuments(),
            Resume.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Job.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
            Job.aggregate([{ $group: { _id: null, total: { $sum: '$applyCount' } } }]),
        ]);

        const userGrowth = newUsersLastMonth > 0
            ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
            : 100;

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    premium: premiumUsers,
                    free: totalUsers - premiumUsers,
                    newThisMonth: newUsersThisMonth,
                    newLastMonth: newUsersLastMonth,
                    growthPercent: parseFloat(userGrowth),
                    premiumRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0,
                },
                jobs: {
                    total: totalJobs,
                    active: activeJobs,
                    pending: pendingJobs,
                    rejected: rejectedJobs,
                    totalViews: totalJobViews[0]?.total || 0,
                    totalApplied: totalApplied[0]?.total || 0,
                },
                resumes: {
                    total: totalResumes,
                    createdThisMonth: resumesThisMonth,
                },
            },
        });
    } catch (err) { next(err); }
});

// ─── 2. User Growth Chart (30 days) ─────────────────────────────────────────
router.get('/users/growth', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const pipeline = dailyGroupPipeline('createdAt', days);

        const raw = await User.aggregate(pipeline);

        // Fill in missing days with 0
        const filled = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const found = raw.find(r => {
                const rDate = `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`;
                return rDate === key;
            });
            filled.push({ date: key, count: found ? found.count : 0 });
        }

        res.json({ success: true, data: filled });
    } catch (err) { next(err); }
});

// ─── 3. User Demographics ────────────────────────────────────────────────────
router.get('/users/demographics', async (req, res, next) => {
    try {
        const [byStatus, byGender, byLocation, byRole, profileCompletion] = await Promise.all([
            User.aggregate([
                { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            User.aggregate([
                { $match: { gender: { $exists: true, $ne: null } } },
                { $group: { _id: '$gender', count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
                { $group: { _id: '$location', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
            User.aggregate([
                {
                    $group: {
                        _id: null,
                        avg: { $avg: '$profileCompleteness' },
                        under50: { $sum: { $cond: [{ $lt: ['$profileCompleteness', 50] }, 1, 0] } },
                        mid: { $sum: { $cond: [{ $and: [{ $gte: ['$profileCompleteness', 50] }, { $lt: ['$profileCompleteness', 80] }] }, 1, 0] } },
                        high: { $sum: { $cond: [{ $gte: ['$profileCompleteness', 80] }, 1, 0] } },
                    }
                }
            ]),
        ]);

        res.json({
            success: true,
            data: {
                byStatus,
                byGender,
                topLocations: byLocation,
                byRole,
                profileCompletion: profileCompletion[0] || { avg: 0, under50: 0, mid: 0, high: 0 },
            },
        });
    } catch (err) { next(err); }
});

// ─── 4. Job Analytics ─────────────────────────────────────────────────────────
router.get('/jobs/overview', async (req, res, next) => {
    try {
        const [
            byCategory,
            byJobType,
            byRemote,
            bySector,
            bySource,
            byExperienceLevel,
            topViewed,
            topApplied,
            recentlyPosted,
            approvalStats,
        ] = await Promise.all([
            Job.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 12 },
            ]),
            Job.aggregate([
                { $group: { _id: '$jobType', count: { $sum: 1 } } },
            ]),
            Job.aggregate([
                { $group: { _id: '$remote', count: { $sum: 1 } } },
            ]),
            Job.aggregate([
                { $group: { _id: '$sector', count: { $sum: 1 } } },
            ]),
            Job.aggregate([
                { $group: { _id: '$source', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Job.aggregate([
                { $match: { experienceLevel: { $exists: true, $ne: null } } },
                { $group: { _id: '$experienceLevel', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Top 5 most viewed
            Job.find({ status: 'approved' })
                .sort({ viewCount: -1 })
                .limit(5)
                .select('title company viewCount applyCount category'),
            // Top 5 most applied
            Job.find({ status: 'approved' })
                .sort({ applyCount: -1 })
                .limit(5)
                .select('title company viewCount applyCount category'),
            // Jobs posted in last 7 days
            Job.countDocuments({ createdAt: { $gte: daysAgo(7) } }),
            // approval pipeline
            Job.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalViews: { $sum: '$viewCount' },
                        totalApplied: { $sum: '$applyCount' },
                    }
                }
            ]),
        ]);

        res.json({
            success: true,
            data: {
                byCategory,
                byJobType,
                byRemote,
                bySector,
                bySource,
                byExperienceLevel,
                topViewed,
                topApplied,
                recentlyPosted,
                approvalStats,
            },
        });
    } catch (err) { next(err); }
});

// ─── 5. Job Growth Chart ─────────────────────────────────────────────────────
router.get('/jobs/growth', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const pipeline = dailyGroupPipeline('createdAt', days);
        const raw = await Job.aggregate(pipeline);

        const filled = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const found = raw.find(r => {
                const rDate = `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`;
                return rDate === key;
            });
            filled.push({ date: key, count: found ? found.count : 0 });
        }

        res.json({ success: true, data: filled });
    } catch (err) { next(err); }
});

// ─── 6. Resume Analytics ─────────────────────────────────────────────────────
router.get('/resumes/overview', async (req, res, next) => {
    try {
        const [
            byTemplate,
            downloadStats,
            atsScoreDistribution,
            resumesWithPdf,
            recentResumes,
        ] = await Promise.all([
            Resume.aggregate([
                { $group: { _id: '$templateId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Resume.aggregate([
                {
                    $group: {
                        _id: null,
                        totalDownloads: { $sum: '$downloadCount' },
                        avgDownloads: { $avg: '$downloadCount' },
                        maxDownloads: { $max: '$downloadCount' },
                    }
                }
            ]),
            Resume.aggregate([
                { $match: { lastAtsScore: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: null,
                        avg: { $avg: '$lastAtsScore' },
                        excellent: { $sum: { $cond: [{ $gte: ['$lastAtsScore', 80] }, 1, 0] } },
                        good: { $sum: { $cond: [{ $and: [{ $gte: ['$lastAtsScore', 60] }, { $lt: ['$lastAtsScore', 80] }] }, 1, 0] } },
                        fair: { $sum: { $cond: [{ $and: [{ $gte: ['$lastAtsScore', 40] }, { $lt: ['$lastAtsScore', 60] }] }, 1, 0] } },
                        poor: { $sum: { $cond: [{ $lt: ['$lastAtsScore', 40] }, 1, 0] } },
                    }
                }
            ]),
            Resume.countDocuments({ pdfUrl: { $exists: true, $ne: null } }),
            Resume.countDocuments({ createdAt: { $gte: daysAgo(7) } }),
        ]);

        res.json({
            success: true,
            data: {
                byTemplate,
                downloads: downloadStats[0] || { totalDownloads: 0, avgDownloads: 0, maxDownloads: 0 },
                atsScores: atsScoreDistribution[0] || { avg: 0, excellent: 0, good: 0, fair: 0, poor: 0 },
                withPdf: resumesWithPdf,
                recentWeek: recentResumes,
            },
        });
    } catch (err) { next(err); }
});

// ─── 7. Premium / Revenue Simulation ─────────────────────────────────────────
router.get('/revenue', async (req, res, next) => {
    try {
        const PLAN_PRICE = 299; // INR per month

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalPremium,
            premiumThisMonth,
            premiumLastMonth,
            premiumExpiringSoon,
            premiumByMonth,
        ] = await Promise.all([
            User.countDocuments({ isPremium: true }),
            User.countDocuments({ isPremium: true, updatedAt: { $gte: startOfMonth } }),
            User.countDocuments({ isPremium: true, updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            User.countDocuments({
                isPremium: true,
                premiumExpiresAt: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            }),
            // Monthly premium signups last 6 months
            User.aggregate([
                { $match: { isPremium: true, createdAt: { $gte: daysAgo(180) } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);

        const mrr = totalPremium * PLAN_PRICE;
        const mrrThisMonth = premiumThisMonth * PLAN_PRICE;
        const mrrLastMonth = premiumLastMonth * PLAN_PRICE;
        const mrrGrowth = mrrLastMonth > 0
            ? (((mrrThisMonth - mrrLastMonth) / mrrLastMonth) * 100).toFixed(1)
            : 100;

        const totalRevenue = totalPremium * PLAN_PRICE; // simplified

        res.json({
            success: true,
            data: {
                mrr,
                totalRevenue,
                mrrThisMonth,
                mrrLastMonth,
                mrrGrowth: parseFloat(mrrGrowth),
                totalPremium,
                premiumThisMonth,
                premiumLastMonth,
                premiumExpiringSoon,
                planPrice: PLAN_PRICE,
                premiumByMonth: premiumByMonth.map(m => ({
                    month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
                    count: m.count,
                    revenue: m.count * PLAN_PRICE,
                })),
            },
        });
    } catch (err) { next(err); }
});

// ─── 8. Platform Health / Activity ───────────────────────────────────────────
router.get('/platform/health', async (req, res, next) => {
    try {
        const [
            activeUsersToday,
            activeUsersWeek,
            activeUsersMonth,
            newUsersToday,
            newJobsToday,
            resumesCreatedToday,
            usersWithResumes,
            usersWithSavedJobs,
            googleAuthUsers,
            emailVerifiedUsers,
        ] = await Promise.all([
            User.countDocuments({ lastLogin: { $gte: daysAgo(1) } }),
            User.countDocuments({ lastLogin: { $gte: daysAgo(7) } }),
            User.countDocuments({ lastLogin: { $gte: daysAgo(30) } }),
            User.countDocuments({ createdAt: { $gte: daysAgo(1) } }),
            Job.countDocuments({ createdAt: { $gte: daysAgo(1) } }),
            Resume.countDocuments({ createdAt: { $gte: daysAgo(1) } }),
            Resume.aggregate([
                { $group: { _id: '$user' } },
                { $count: 'count' },
            ]),
            User.countDocuments({ savedJobs: { $exists: true, $not: { $size: 0 } } }),
            User.countDocuments({ googleId: { $exists: true } }),
            User.countDocuments({ isEmailVerified: true }),
        ]);

        res.json({
            success: true,
            data: {
                dau: activeUsersToday,
                wau: activeUsersWeek,
                mau: activeUsersMonth,
                newUsersToday,
                newJobsToday,
                resumesCreatedToday,
                usersWithResumes: usersWithResumes[0]?.count || 0,
                usersWithSavedJobs,
                googleAuthUsers,
                emailVerifiedUsers,
            },
        });
    } catch (err) { next(err); }
});

// ─── 9. Top Skills (from Users) ───────────────────────────────────────────────
router.get('/skills/trending', async (req, res, next) => {
    try {
        const topSkills = await User.aggregate([
            { $unwind: '$keySkills' },
            { $group: { _id: '$keySkills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]);

        const topJobSkills = await Job.aggregate([
            { $unwind: '$skills' },
            { $group: { _id: '$skills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]);

        res.json({ success: true, data: { userSkills: topSkills, jobSkills: topJobSkills } });
    } catch (err) { next(err); }
});

// ─── 10. Conversion Funnel ────────────────────────────────────────────────────
router.get('/funnel', async (req, res, next) => {
    try {
        const [
            totalUsers,
            verifiedEmails,
            profileCompleted,
            premiumConverted,
            resumeCreated,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isEmailVerified: true }),
            User.countDocuments({ profileCompleteness: { $gte: 50 } }),
            User.countDocuments({ isPremium: true }),
            Resume.aggregate([{ $group: { _id: '$user' } }, { $count: 'count' }]),
        ]);

        const stages = [
            { stage: 'Signed Up', count: totalUsers, icon: 'UserPlus' },
            { stage: 'Email Verified', count: verifiedEmails, icon: 'Mail' },
            { stage: 'Resume Created', count: resumeCreated[0]?.count || 0, icon: 'FileText' },
            { stage: 'Profile Completed (50%+)', count: profileCompleted, icon: 'User' },
            { stage: 'Converted to Premium', count: premiumConverted, icon: 'CreditCard' },
        ];

        res.json({ success: true, data: stages });
    } catch (err) { next(err); }
});

// ─── 11. Recent Activity Feed ─────────────────────────────────────────────────
router.get('/activity/recent', async (req, res, next) => {
    try {
        const [recentUsers, recentJobs, recentResumes] = await Promise.all([
            User.find().sort({ createdAt: -1 }).limit(5).select('fullName email createdAt isPremium'),
            Job.find().sort({ createdAt: -1 }).limit(5).select('title company status createdAt category'),
            Resume.find().sort({ createdAt: -1 }).limit(5).select('title templateId createdAt downloadCount').populate('user', 'fullName'),
        ]);

        res.json({
            success: true,
            data: {
                recentUsers,
                recentJobs,
                recentResumes,
            },
        });
    } catch (err) { next(err); }
});

module.exports = router;
