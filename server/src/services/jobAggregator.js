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
        { q: 'data analyst jobs in india', cat: 'sde' },
        { q: 'product manager jobs in india', cat: 'it' },
        { q: 'marketing manager india', cat: 'marketing' },
        { q: 'customer support india', cat: 'customer_support' },
    ];

    const jobs = [];

    for (const { q, cat } of queries) {
        try {
            const res = await axios.get('https://jsearch.p.rapidapi.com/search', {
                headers: {
                    'x-rapidapi-host': 'jsearch.p.rapidapi.com',
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                },
                params: {
                    query: q,
                    num_pages: '2',
                    date_posted: 'month',
                    country: 'in',
                },
                timeout: 15000,
            });

            const mapped = (res.data?.data || []).map(j => ({
                title: j.job_title,
                company: j.employer_name || 'Unknown',
                companyLogo: j.employer_logo,
                location: j.job_city ? `${j.job_city}, ${j.job_country}` : (j.job_country || 'India'),
                remote: j.job_is_remote ? 'remote' : 'on-site',
                description: j.job_description?.slice(0, 2000) || j.job_title,
                applyLink: j.job_apply_link,
                sourceJobId: `jsearch-${j.job_id}`,
                source: 'jsearch',
                sourceUrl: j.job_apply_link,
                category: cat,
                jobType: mapJSearchJobType(j.job_employment_type),
                postedDate: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
                skills: j.job_required_skills || [],
                salary: {
                    min: j.job_min_salary,
                    max: j.job_max_salary,
                    currency: j.job_salary_currency || 'INR',
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
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        },
        params: {
            query,
            num_pages: String(Math.min(numPages, 5)),
            date_posted: 'all',
            country,
        },
        timeout: 20000,
    });

    return (res.data?.data || []).map(j => ({
        title: j.job_title,
        company: j.employer_name || 'Unknown',
        companyLogo: j.employer_logo,
        location: j.job_city ? `${j.job_city}, ${j.job_country}` : (j.job_country || country.toUpperCase()),
        remote: j.job_is_remote ? 'remote' : 'on-site',
        description: j.job_description?.slice(0, 2000) || j.job_title,
        applyLink: j.job_apply_link,
        sourceJobId: `jsearch-${j.job_id}`,
        source: 'jsearch',
        sourceUrl: j.job_apply_link,
        category: 'it',
        jobType: mapJSearchJobType(j.job_employment_type),
        postedDate: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
        skills: j.job_required_skills || [],
        salary: {
            min: j.job_min_salary,
            max: j.job_max_salary,
            currency: j.job_salary_currency || 'INR',
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

// ─── Helper shared by all RapidAPI sources ────────────────────────────────────
const rapidHeaders = (host) => ({
    'x-rapidapi-host': host,
    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
    'Content-Type': 'application/json',
});

const skipIfNoKey = (name) => {
    if (!process.env.RAPIDAPI_KEY) {
        console.log(`⚠️  ${name}: RAPIDAPI_KEY missing, skipping.`);
        return true;
    }
    return false;
};

// ─── Indeed46 (Canada jobs) ───────────────────────────────────────────────────
const fetchFromIndeed46 = async () => {
    if (skipIfNoKey('Indeed46')) return [];
    try {
        const res = await axios.get('https://indeed46.p.rapidapi.com/job', {
            headers: rapidHeaders('indeed46.p.rapidapi.com'),
            params: { country: 'CA', sort: -1, page_size: 20 },
            timeout: 15000,
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.jobs || res.data?.data || []);
        const mapped = list.map(j => ({
            title:       j.title || j.job_title || 'Unknown',
            company:     j.company || j.employer || 'Unknown',
            companyLogo: j.company_logo || j.logo,
            location:    j.location || j.city || 'Canada',
            remote:      (j.remote || j.work_type || '').toLowerCase().includes('remote') ? 'remote' : 'on-site',
            description: (j.description || j.snippet || j.title || '').slice(0, 2000),
            applyLink:   j.link || j.apply_url || j.url || j.redirect_url,
            sourceJobId: `indeed46-${j.id || j.job_id || Math.random()}`,
            source:      'indeed46',
            sourceUrl:   j.link || j.url,
            category:    'it',
            jobType:     mapJobType(j.job_type || j.employment_type || ''),
            postedDate:  j.posted_at ? new Date(j.posted_at) : new Date(),
            skills:      j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ Indeed46 (CA): ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('Indeed46 error:', err.response?.status || err.message);
        return [];
    }
};

// ─── LinkedIn Job Search API (active-jb-1h) ───────────────────────────────────
const fetchFromLinkedInSearch = async () => {
    if (skipIfNoKey('LinkedIn Search')) return [];
    const searches = [
        { title: 'Software Engineer', loc: 'United States OR United Kingdom' },
        { title: 'Data Engineer',     loc: 'United States OR United Kingdom' },
        { title: 'Product Manager',   loc: 'United States OR India'          },
    ];
    const jobs = [];
    for (const s of searches) {
        try {
            const res = await axios.get('https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h', {
                headers: rapidHeaders('linkedin-job-search-api.p.rapidapi.com'),
                params: { offset: 0, title_filter: s.title, location_filter: s.loc, description_type: 'text' },
                timeout: 15000,
            });
            const list = Array.isArray(res.data) ? res.data : (res.data?.jobs || res.data?.data || []);
            jobs.push(...list.map(j => ({
                title:       j.title,
                company:     j.organization || j.company || 'Unknown',
                companyLogo: j.organization_logo,
                location:    j.locations_derived?.[0] || j.location || s.loc,
                remote:      j.remote_derived ? 'remote' : 'on-site',
                description: (j.description || j.title || '').slice(0, 2000),
                applyLink:   j.url || j.apply_url,
                sourceJobId: `li-search-${j.id || j.url}`,
                source:      'linkedin-search',
                sourceUrl:   j.url,
                category:    mapTitleToCategory(j.title),
                jobType:     mapJobType(j.employment_type || ''),
                postedDate:  j.date_posted ? new Date(j.date_posted) : new Date(),
                skills:      j.skills_derived || [],
                salary:      { isDisclosed: false },
                status:      'pending',
            })));
            console.log(`✅ LinkedIn Search [${s.title}]: ${list.length} jobs`);
        } catch (err) {
            console.error(`LinkedIn Search [${s.title}] error:`, err.response?.status || err.message);
        }
    }
    return jobs;
};

// ─── Active Jobs DB (ATS 1h) ──────────────────────────────────────────────────
const fetchFromActiveJobsDB = async () => {
    if (skipIfNoKey('ActiveJobsDB')) return [];
    const searches = [
        { title: '"Data Engineer"',      loc: '"United States" OR "United Kingdom"' },
        { title: '"Software Engineer"',  loc: '"India" OR "United States"'          },
    ];
    const jobs = [];
    for (const s of searches) {
        try {
            const res = await axios.get('https://active-jobs-db.p.rapidapi.com/active-ats-1h', {
                headers: rapidHeaders('active-jobs-db.p.rapidapi.com'),
                params: { offset: 0, title_filter: s.title, location_filter: s.loc, description_type: 'text' },
                timeout: 15000,
            });
            const list = Array.isArray(res.data) ? res.data : (res.data?.jobs || res.data?.data || []);
            jobs.push(...list.map(j => ({
                title:       j.title,
                company:     j.organization || j.company || 'Unknown',
                companyLogo: j.organization_logo,
                location:    j.locations_derived?.[0] || j.location || 'Remote',
                remote:      j.remote_derived ? 'remote' : 'on-site',
                description: (j.description || j.title || '').slice(0, 2000),
                applyLink:   j.url,
                sourceJobId: `activejobs-${j.id || j.url}`,
                source:      'active-jobs-db',
                sourceUrl:   j.url,
                category:    mapTitleToCategory(j.title),
                jobType:     mapJobType(j.employment_type || ''),
                postedDate:  j.date_posted ? new Date(j.date_posted) : new Date(),
                skills:      j.skills_derived || [],
                salary:      { isDisclosed: false },
                status:      'pending',
            })));
            console.log(`✅ ActiveJobsDB [${s.title}]: ${list.length} jobs`);
        } catch (err) {
            console.error(`ActiveJobsDB [${s.title}] error:`, err.response?.status || err.message);
        }
    }
    return jobs;
};

// ─── Job Posting Feed API (ATS 6m) ────────────────────────────────────────────
const fetchFromJobPostingFeed = async () => {
    if (skipIfNoKey('JobPostingFeed')) return [];
    try {
        const res = await axios.get('https://job-posting-feed-api.p.rapidapi.com/active-ats-6m', {
            headers: rapidHeaders('job-posting-feed-api.p.rapidapi.com'),
            params: { description_type: 'text' },
            timeout: 15000,
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.jobs || res.data?.data || []);
        const mapped = list.slice(0, 50).map(j => ({
            title:       j.title,
            company:     j.organization || j.company || 'Unknown',
            companyLogo: j.organization_logo,
            location:    j.locations_derived?.[0] || j.location || 'Remote',
            remote:      j.remote_derived ? 'remote' : 'on-site',
            description: (j.description || j.title || '').slice(0, 2000),
            applyLink:   j.url,
            sourceJobId: `feedapi-${j.id || j.url}`,
            source:      'job-posting-feed',
            sourceUrl:   j.url,
            category:    mapTitleToCategory(j.title),
            jobType:     mapJobType(j.employment_type || ''),
            postedDate:  j.date_posted ? new Date(j.date_posted) : new Date(),
            skills:      j.skills_derived || [],
            salary:      { isDisclosed: false },
            status:      'pending',
        }));
        console.log(`✅ JobPostingFeed: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('JobPostingFeed error:', err.response?.status || err.message);
        return [];
    }
};

// ─── Internships API (7d) ─────────────────────────────────────────────────────
const fetchFromInternshipsAPI = async () => {
    if (skipIfNoKey('InternshipsAPI')) return [];
    try {
        const res = await axios.get('https://internships-api.p.rapidapi.com/active-jb-7d', {
            headers: rapidHeaders('internships-api.p.rapidapi.com'),
            timeout: 15000,
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.jobs || res.data?.data || []);
        const mapped = list.slice(0, 50).map(j => ({
            title:       j.title,
            company:     j.organization || j.company || 'Unknown',
            companyLogo: j.organization_logo,
            location:    j.locations_derived?.[0] || j.location || 'Remote',
            remote:      j.remote_derived ? 'remote' : 'on-site',
            description: (j.description || j.title || '').slice(0, 2000),
            applyLink:   j.url,
            sourceJobId: `internship-${j.id || j.url}`,
            source:      'internships-api',
            sourceUrl:   j.url,
            category:    'internship',
            jobType:     'internship',
            postedDate:  j.date_posted ? new Date(j.date_posted) : new Date(),
            skills:      j.skills_derived || [],
            salary:      { isDisclosed: false },
            status:      'pending',
        }));
        console.log(`✅ InternshipsAPI: ${mapped.length} internships`);
        return mapped;
    } catch (err) {
        console.error('InternshipsAPI error:', err.response?.status || err.message);
        return [];
    }
};

// ─── Indeed Scraper API (POST) ────────────────────────────────────────────────
const fetchFromIndeedScraper = async () => {
    if (skipIfNoKey('IndeedScraper')) return [];
    const searches = [
        { query: 'Software Engineer', location: 'New York',   country: 'us' },
        { query: 'Data Analyst',      location: 'Bangalore',  country: 'in' },
        { query: 'Product Manager',   location: 'San Francisco', country: 'us' },
    ];
    const jobs = [];
    for (const s of searches) {
        try {
            const res = await axios.post(
                'https://indeed-scraper-api.p.rapidapi.com/api/job',
                { scraper: { maxRows: 15, query: s.query, location: s.location, jobType: 'fulltime', radius: '50', sort: 'relevance', fromDays: '7', country: s.country } },
                { headers: rapidHeaders('indeed-scraper-api.p.rapidapi.com'), timeout: 20000 }
            );
            const list = res.data?.results || res.data?.data || res.data?.jobs || [];
            jobs.push(...list.map(j => ({
                title:       j.title || j.jobTitle || s.query,
                company:     j.company || j.companyName || 'Unknown',
                companyLogo: j.companyLogo,
                location:    j.location || j.city || s.location,
                remote:      (j.remote || j.isRemote || '') ? 'remote' : 'on-site',
                description: (j.description || j.snippet || j.title || '').slice(0, 2000),
                applyLink:   j.externalApplyLink || j.link || j.url,
                sourceJobId: `indeed-scraper-${j.jobId || j.id || Math.random()}`,
                source:      'indeed-scraper',
                sourceUrl:   j.link || j.url,
                category:    mapTitleToCategory(j.title || s.query),
                jobType:     mapJobType(j.jobType || 'fulltime'),
                postedDate:  j.postedAt ? new Date(j.postedAt) : new Date(),
                skills:      [],
                salary:      { isDisclosed: false },
                status:      'pending',
            })));
            console.log(`✅ IndeedScraper [${s.query}/${s.location}]: ${list.length} jobs`);
        } catch (err) {
            console.error(`IndeedScraper [${s.query}] error:`, err.response?.status || err.message);
        }
    }
    return jobs;
};

// ─── LinkedIn Jobs API2 (active-jb-1h) ───────────────────────────────────────
const fetchFromLinkedInJobs2 = async () => {
    if (skipIfNoKey('LinkedInJobs2')) return [];
    try {
        const res = await axios.get('https://linkedin-jobs-api2.p.rapidapi.com/active-jb-1h', {
            headers: rapidHeaders('linkedin-jobs-api2.p.rapidapi.com'),
            timeout: 15000,
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.jobs || res.data?.data || []);
        const mapped = list.slice(0, 50).map(j => ({
            title:       j.title,
            company:     j.organization || j.company || 'Unknown',
            companyLogo: j.organization_logo,
            location:    j.locations_derived?.[0] || j.location || 'Remote',
            remote:      j.remote_derived ? 'remote' : 'on-site',
            description: (j.description || j.title || '').slice(0, 2000),
            applyLink:   j.url,
            sourceJobId: `li2-${j.id || j.url}`,
            source:      'linkedin-jobs2',
            sourceUrl:   j.url,
            category:    mapTitleToCategory(j.title),
            jobType:     mapJobType(j.employment_type || ''),
            postedDate:  j.date_posted ? new Date(j.date_posted) : new Date(),
            skills:      j.skills_derived || [],
            salary:      { isDisclosed: false },
            status:      'pending',
        }));
        console.log(`✅ LinkedInJobs2: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('LinkedInJobs2 error:', err.response?.status || err.message);
        return [];
    }
};

/**
 * Main aggregator: run all sources and save new jobs to DB
 */
const aggregateJobs = async () => {
    console.log('🔍 Starting job aggregation from all sources...');
    const results = await Promise.allSettled([
        fetchFromAdzuna(),
        fetchFromRemotive(),
        fetchFromRemoteOK(),
        fetchFromArbeitnow(),
        fetchFromJSearch(),
        fetchFromIndeed46(),
        fetchFromLinkedInSearch(),
        fetchFromActiveJobsDB(),
        fetchFromJobPostingFeed(),
        fetchFromInternshipsAPI(),
        fetchFromIndeedScraper(),
        fetchFromLinkedInJobs2(),
    ]);

    const allJobs = results.flatMap(r => r.value || []);

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
    const t = (type || '').toLowerCase();
    if (t.includes('part')) return 'part-time';
    if (t.includes('contract')) return 'contract';
    if (t.includes('intern')) return 'internship';
    return 'full-time';
};

const mapTitleToCategory = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('intern')) return 'internship';
    if (t.includes('software') || t.includes('engineer') || t.includes('developer') || t.includes('data') || t.includes('devops') || t.includes('cloud') || t.includes('backend') || t.includes('frontend')) return 'sde';
    if (t.includes('market') || t.includes('seo') || t.includes('content') || t.includes('brand')) return 'marketing';
    if (t.includes('sales') || t.includes('business development') || t.includes('account exec')) return 'sales';
    if (t.includes('support') || t.includes('customer') || t.includes('cx')) return 'customer_support';
    if (t.includes('finance') || t.includes('account') || t.includes('audit')) return 'finance';
    if (t.includes('product') || t.includes('pm ') || t.includes('project')) return 'it';
    return 'it';
};

module.exports = { aggregateJobs, fetchFromJSearchManual };
