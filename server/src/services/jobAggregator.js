const axios = require('axios');
const Job = require('../models/Job');

// ─── JSearch (RapidAPI) ────────────────────────────────────────────────────────
/**
 * Fetch jobs from JSearch (RapidAPI) — great for India jobs.
 * Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 */
const fetchFromJSearch = async () => {
    if (!process.env.RAPIDAPI_KEY) {
        console.log('⚠️  JSearch: RAPIDAPI_KEY missing, skipping.');
        return [];
    }

    const queries = [
        { q: 'software engineer jobs in india', cat: 'sde' },
        { q: 'data analyst jobs in india',      cat: 'sde' },
        { q: 'product manager jobs in india',   cat: 'it'  },
        { q: 'marketing manager india',         cat: 'marketing' },
        { q: 'customer support india',          cat: 'customer_support' },
    ];

    const jobs = [];

    for (const { q, cat } of queries) {
        try {
            const res = await axios.get('https://jsearch.p.rapidapi.com/search', {
                headers: {
                    'x-rapidapi-host': 'jsearch.p.rapidapi.com',
                    'x-rapidapi-key':  process.env.RAPIDAPI_KEY,
                },
                params: {
                    query:       q,
                    num_pages:   '2',
                    date_posted: 'month',
                    country:     'in',
                },
                timeout: 15000,
            });

            const mapped = (res.data?.data || []).map(j => ({
                title:       j.job_title,
                company:     j.employer_name || 'Unknown',
                companyLogo: j.employer_logo,
                location:    j.job_city ? `${j.job_city}, ${j.job_country}` : (j.job_country || 'India'),
                remote:      j.job_is_remote ? 'remote' : 'on-site',
                description: j.job_description?.slice(0, 2000) || j.job_title,
                applyLink:   j.job_apply_link,
                sourceJobId: `jsearch-${j.job_id}`,
                source:      'jsearch',
                sourceUrl:   j.job_apply_link,
                category:    cat,
                jobType:     mapJSearchJobType(j.job_employment_type),
                postedDate:  j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
                skills:      j.job_required_skills || [],
                salary: {
                    min:         j.job_min_salary,
                    max:         j.job_max_salary,
                    currency:    j.job_salary_currency || 'INR',
                    isDisclosed: !!(j.job_min_salary || j.job_max_salary),
                },
                status: 'pending',
            }));

            jobs.push(...mapped);
            console.log(`✅ JSearch [${q}]: ${mapped.length} jobs`);
        } catch (err) {
            console.error(`JSearch error [${q}]: ${err.response?.status || err.message}`);
        }
    }

    return jobs;
};

/**
 * On-demand JSearch for admin dashboard (custom query/country)
 */
const fetchFromJSearchManual = async (query = 'software engineer', country = 'in', numPages = 1) => {
    if (!process.env.RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY is not set.');

    const res = await axios.get('https://jsearch.p.rapidapi.com/search', {
        headers: {
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            'x-rapidapi-key':  process.env.RAPIDAPI_KEY,
        },
        params: {
            query,
            num_pages:   String(Math.min(numPages, 5)),
            date_posted: 'all',
            country,
        },
        timeout: 20000,
    });

    return (res.data?.data || []).map(j => ({
        title:       j.job_title,
        company:     j.employer_name || 'Unknown',
        companyLogo: j.employer_logo,
        location:    j.job_city ? `${j.job_city}, ${j.job_country}` : (j.job_country || country.toUpperCase()),
        remote:      j.job_is_remote ? 'remote' : 'on-site',
        description: j.job_description?.slice(0, 2000) || j.job_title,
        applyLink:   j.job_apply_link,
        sourceJobId: `jsearch-${j.job_id}`,
        source:      'jsearch',
        sourceUrl:   j.job_apply_link,
        category:    'it',
        jobType:     mapJSearchJobType(j.job_employment_type),
        postedDate:  j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
        skills:      j.job_required_skills || [],
        salary: {
            min:         j.job_min_salary,
            max:         j.job_max_salary,
            currency:    j.job_salary_currency || 'INR',
            isDisclosed: !!(j.job_min_salary || j.job_max_salary),
        },
        status: 'pending',
    }));
};

const mapJSearchJobType = (type = '') => {
    const t = type.toUpperCase();
    if (t.includes('PART')) return 'part-time';
    if (t.includes('CONTRACT')) return 'contract';
    if (t.includes('INTERN')) return 'internship';
    return 'full-time';
};

/**
 * Fetch jobs from Adzuna API (free, needs app_id + api_key)
 */
const fetchFromAdzuna = async () => {
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_API_KEY) {
        console.log('⚠️  Adzuna: ADZUNA_APP_ID or ADZUNA_API_KEY missing, skipping.');
        return [];
    }
    const categories = [
        { query: 'software developer', category: 'sde' },
        { query: 'data analyst', category: 'sde' },
        { query: 'marketing manager', category: 'marketing' },
        { query: 'sales executive', category: 'sales' },
        { query: 'customer support', category: 'customer_support' },
        { query: 'product manager', category: 'it' },
    ];
    // Try gb (most reliable), fallback to us
    const countries = ['gb', 'us'];
    const jobs = [];

    for (const country of countries) {
        try {
            for (const cat of categories) {
                const res = await axios.get(
                    `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
                    {
                        headers: { Accept: 'application/json' },
                        params: {
                            app_id: process.env.ADZUNA_APP_ID,
                            app_key: process.env.ADZUNA_API_KEY,
                            results_per_page: 15,
                            what: cat.query,
                        },
                        timeout: 12000,
                    }
                );
                const mapped = (res.data?.results || []).map(j => ({
                    title: j.title,
                    company: j.company?.display_name || 'Unknown',
                    location: j.location?.display_name || country.toUpperCase(),
                    description: j.description || j.title,
                    applyLink: j.redirect_url,
                    sourceJobId: `adzuna-${country}-${j.id}`,
                    source: 'adzuna',
                    sourceUrl: j.redirect_url,
                    category: cat.category,
                    jobType: 'full-time',
                    remote: 'on-site',
                    postedDate: j.created ? new Date(j.created) : new Date(),
                    salary: {
                        min: j.salary_min,
                        max: j.salary_max,
                        currency: country === 'gb' ? 'GBP' : 'USD',
                        isDisclosed: !!(j.salary_min || j.salary_max),
                    },
                    status: 'pending',
                }));
                jobs.push(...mapped);
            }
            console.log(`✅ Adzuna (${country}): ${jobs.length} jobs fetched`);
            break; // success — no need to try next country
        } catch (err) {
            console.error(`Adzuna (${country}) error: ${err.response?.status || err.message}`);
        }
    }
    return jobs;
};

/**
 * Fetch from Remotive (free, no auth needed)
 */
const fetchFromRemotive = async () => {
    try {
        const res = await axios.get('https://remotive.com/api/remote-jobs', {
            params: { limit: 50 },
            timeout: 10000,
        });
        return (res.data?.jobs || []).map(j => ({
            title: j.title,
            company: j.company_name,
            companyLogo: j.company_logo,
            location: j.candidate_required_location || 'Remote',
            remote: 'remote',
            description: j.description?.replace(/<[^>]*>/g, '') || j.title,
            applyLink: j.url,
            sourceJobId: String(j.id),
            source: 'remotive',
            sourceUrl: j.url,
            category: mapRemotiveCategory(j.category),
            jobType: mapJobType(j.job_type),
            postedDate: j.publication_date ? new Date(j.publication_date) : new Date(),
            skills: j.tags || [],
            status: 'pending',
        }));
    } catch (err) {
        console.error('Remotive fetch error:', err.message);
        return [];
    }
};

/**
 * Fetch from RemoteOK (free, no auth)
 */
const fetchFromRemoteOK = async () => {
    try {
        const res = await axios.get('https://remoteok.com/api', {
            headers: { 'User-Agent': 'JobVault/1.0 job-aggregator' },
            timeout: 10000,
        });
        const jobs = (res.data || []).filter(j => j.id && j.position);
        return jobs.slice(0, 50).map(j => ({
            title: j.position,
            company: j.company,
            companyLogo: j.company_logo,
            location: 'Remote',
            remote: 'remote',
            description: (j.description || j.position).replace(/<[^>]*>/g, ''),
            applyLink: j.url,
            sourceJobId: String(j.id),
            source: 'remoteok',
            sourceUrl: j.url,
            category: 'sde',
            skills: j.tags || [],
            postedDate: j.date ? new Date(j.date) : new Date(),
            status: 'pending',
        }));
    } catch (err) {
        console.error('RemoteOK fetch error:', err.message);
        return [];
    }
};

/**
 * Fetch from Arbeitnow (free, no auth, India-friendly)
 */
const fetchFromArbeitnow = async () => {
    try {
        const res = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 10000 });
        return (res.data?.data || []).slice(0, 50).map(j => ({
            title: j.title,
            company: j.company_name,
            location: j.location,
            remote: j.remote ? 'remote' : 'on-site',
            description: j.description?.replace(/<[^>]*>/g, '') || j.title,
            applyLink: j.url,
            sourceJobId: j.slug,
            source: 'arbeitnow',
            sourceUrl: j.url,
            category: 'sde',
            skills: j.tags || [],
            jobType: 'full-time',
            postedDate: j.created_at ? new Date(j.created_at * 1000) : new Date(),
            status: 'pending',
        }));
    } catch (err) {
        console.error('Arbeitnow fetch error:', err.message);
        return [];
    }
};

/**
 * Main aggregator: run all sources and save new jobs to DB
 */
const aggregateJobs = async () => {
    console.log('🔍 Starting job aggregation...');
    const [adzunaJobs, remotiveJobs, remoteOKJobs, arbeitnowJobs, jsearchJobs] = await Promise.allSettled([
        fetchFromAdzuna(),
        fetchFromRemotive(),
        fetchFromRemoteOK(),
        fetchFromArbeitnow(),
        fetchFromJSearch(),
    ]);

    const allJobs = [
        ...(adzunaJobs.value || []),
        ...(remotiveJobs.value || []),
        ...(remoteOKJobs.value || []),
        ...(arbeitnowJobs.value || []),
        ...(jsearchJobs.value  || []),
    ];

    let saved = 0;
    for (const job of allJobs) {
        try {
            const exists = await Job.findOne({ sourceJobId: job.sourceJobId, source: job.source });
            if (!exists) {
                await Job.create(job);
                saved++;
            }
        } catch (err) {
            // Skip duplicates
        }
    }

    console.log(`✅ Job aggregation complete. Saved ${saved} new jobs (${allJobs.length} fetched total).`);
    return { fetched: allJobs.length, saved };
};

// ─── Helper mappers ────────────────────────────────────────────────────────────
const mapRemotiveCategory = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('software') || c.includes('devops') || c.includes('engineer')) return 'sde';
    if (c.includes('market')) return 'marketing';
    if (c.includes('sales')) return 'sales';
    if (c.includes('support') || c.includes('customer')) return 'customer_support';
    if (c.includes('finance') || c.includes('account')) return 'finance';
    return 'it';
};

const mapJobType = (type = '') => {
    if (type.includes('part')) return 'part-time';
    if (type.includes('contract')) return 'contract';
    if (type.includes('intern')) return 'internship';
    return 'full-time';
};

module.exports = { aggregateJobs, fetchFromJSearchManual };
