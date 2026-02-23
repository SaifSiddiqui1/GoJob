const cron = require('node-cron');
const { aggregateJobs } = require('../services/jobAggregator');

/**
 * Start the cron job to fetch jobs every 6 hours
 * Schedule: "0 every-6-hours * * *" (at minute 0, every 6th hour)
 */
const startJobFetchCron = () => {
    // Run once at startup
    aggregateJobs().catch(console.error);

    // Then every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ [CRON] Running job aggregation...');
        try {
            const result = await aggregateJobs();
            console.log(`✅ [CRON] Aggregation done:`, result);
        } catch (err) {
            console.error('❌ [CRON] Aggregation failed:', err.message);
        }
    });

    console.log('📅 Job fetch cron scheduled (every 6 hours).');
};

module.exports = { startJobFetchCron };
