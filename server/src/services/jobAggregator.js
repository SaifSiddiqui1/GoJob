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
    console.log('⏸️ Adzuna API is paused by admin request.');
    return [];
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

// ─── 9 New RapidAPI Scrapers ──────────────────────────────────────────────────

// 1. JobFinder API
const fetchFromJobFinder = async () => {
    if (skipIfNoKey('JobFinder')) return [];
    try {
        const res = await axios.get('https://jobfinder-api1.p.rapidapi.com/search', {
            headers: rapidHeaders('jobfinder-api1.p.rapidapi.com'),
            params: { query: 'software developer', location: 'remote', limit: 20 },
            timeout: 15000,
        });
        const raw = res.data?.jobs || res.data?.data || res.data;
        const list = Array.isArray(raw) ? raw : [];
        const mapped = list.map(j => ({
            title: j.title || j.job_title || 'Unknown Role',
            company: j.company || j.company_name || 'Unknown Company',
            companyLogo: j.company_logo || j.logo,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || j.snippet || 'No description provided.',
            applyLink: j.apply_link || j.url || j.applyLink || j.link,
            sourceJobId: `jobfinder-${j.id || j.job_id || Math.random()}`,
            source: 'jobfinder-api1',
            sourceUrl: j.url || j.link,
            category: mapTitleToCategory(j.title),
            jobType: mapJobType(j.job_type || j.employment_type),
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ JobFinder API: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('JobFinder API error:', err.response?.status || err.message);
        return [];
    }
};

// 2. Hacker News Who Is Hiring
const fetchFromHackerNews = async () => {
    if (skipIfNoKey('Hacker News Who Is Hiring')) return [];
    try {
        const monthsRes = await axios.get('https://hacker-news-who-is-hiring-api.p.rapidapi.com/months', {
            headers: rapidHeaders('hacker-news-who-is-hiring-api.p.rapidapi.com'),
            timeout: 10000,
        });
        const monthsRaw = monthsRes.data;
        const months = Array.isArray(monthsRaw) ? monthsRaw : [];
        if (months.length === 0) return [];
        
        // months can be array of strings (e.g. ["2025-04"]) or objects with .id
        const firstMonth = months[0];
        const latestMonth = (typeof firstMonth === 'object' && firstMonth !== null)
            ? (firstMonth.id || firstMonth.month || firstMonth.slug || String(firstMonth))
            : String(firstMonth);
        const jobsRes = await axios.get(`https://hacker-news-who-is-hiring-api.p.rapidapi.com/jobs`, {
            headers: rapidHeaders('hacker-news-who-is-hiring-api.p.rapidapi.com'),
            params: { month: latestMonth, limit: 30 },
            timeout: 15000,
        });
        const rawList = jobsRes.data?.jobs || jobsRes.data?.data || jobsRes.data;
        const list = Array.isArray(rawList) ? rawList : [];
        const mapped = list.map(j => ({
            title: j.title || j.role || 'Software Engineer',
            company: j.company || 'HN Poster',
            companyLogo: null,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.text || j.description || 'Hacker News Thread Job Posting',
            applyLink: j.url || j.applyLink || `https://news.ycombinator.com/item?id=${j.id}`,
            sourceJobId: `hn-hiring-${j.id || Math.random()}`,
            source: 'hacker-news-who-is-hiring',
            sourceUrl: j.url || `https://news.ycombinator.com/item?id=${j.id}`,
            category: 'sde',
            jobType: 'full-time',
            postedDate: j.date || j.time ? new Date(j.date || j.time * 1000) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ Hacker News: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('Hacker News API error:', err.response?.status || err.message);
        return [];
    }
};

// 3. Upwork Jobs
const fetchFromUpwork = async () => {
    if (skipIfNoKey('Upwork Jobs')) return [];
    try {
        const res = await axios.get('https://upwork-jobs-api3.p.rapidapi.com/upwork', {
            headers: rapidHeaders('upwork-jobs-api3.p.rapidapi.com'),
            params: {
                q: 'JavaScript|React|Node',
                limit: 20
            },
            timeout: 15000,
        });
        const list = res.data?.jobs || res.data?.data || res.data || [];
        const mapped = list.map(j => ({
            title: j.title || 'Freelance Developer',
            company: j.company || 'Upwork Client',
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || j.snippet || 'No description provided.',
            applyLink: j.url || j.link || j.applyLink,
            sourceJobId: `upwork-${j.id || j.job_id || Math.random()}`,
            source: 'upwork-jobs-api3',
            sourceUrl: j.url || j.link,
            category: 'sde',
            jobType: 'contract',
            postedDate: j.posted_at || j.published_at ? new Date(j.posted_at || j.published_at) : new Date(),
            skills: j.skills || [],
            salary: {
                min: j.hourly_min_usd || j.budget,
                max: j.hourly_max_usd || j.budget,
                currency: 'USD',
                isDisclosed: !!(j.hourly_min_usd || j.hourly_max_usd || j.budget)
            },
            status: 'pending',
        }));
        console.log(`✅ Upwork Jobs: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('Upwork Jobs API error:', err.response?.status || err.message);
        return [];
    }
};

// 4. LinkedIn Jobs 12
const fetchFromLinkedInJobs12 = async () => {
    if (skipIfNoKey('LinkedIn Jobs 12')) return [];
    try {
        const res = await axios.get('https://linkedin-jobs12.p.rapidapi.com/jobs/search', {
            headers: rapidHeaders('linkedin-jobs12.p.rapidapi.com'),
            params: { limit: 20, hybrid: false, remote: true, post_since: 7 },
            timeout: 15000,
        });
        const list = res.data?.jobs || res.data?.data || res.data || [];
        const mapped = list.map(j => ({
            title: j.title || j.job_title || 'Unknown LinkedIn Role',
            company: j.company || j.company_name || 'Unknown Company',
            companyLogo: j.company_logo || j.logo,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || j.snippet || 'No description provided.',
            applyLink: j.url || j.job_url || j.apply_link,
            sourceJobId: `li12-${j.id || j.job_id || Math.random()}`,
            source: 'linkedin-jobs12',
            sourceUrl: j.url || j.job_url,
            category: mapTitleToCategory(j.title),
            jobType: mapJobType(j.job_type || j.employment_type),
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ LinkedIn Jobs 12: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('LinkedIn Jobs 12 API error:', err.response?.status || err.message);
        return [];
    }
};

// 5. Google Jobs Scraper
const fetchFromGoogleJobs = async () => {
    if (skipIfNoKey('Google Jobs')) return [];
    try {
        const res = await axios.get('https://google-jobs-scraper4.p.rapidapi.com/api/google/jobs', {
            headers: rapidHeaders('google-jobs-scraper4.p.rapidapi.com'),
            params: { q: 'software engineer', hl: 'en', gl: 'us', google_domain: 'google.com' },
            timeout: 15000,
        });
        const list = res.data?.jobs || res.data?.data || res.data || [];
        const mapped = list.map(j => ({
            title: j.title || 'Google Job Listing',
            company: j.company || 'Unknown Employer',
            companyLogo: j.thumbnail || j.companyLogo,
            location: j.location || 'Remote',
            remote: (j.location || '').toLowerCase().includes('remote') ? 'remote' : 'on-site',
            description: j.description || 'Google Jobs Search Result',
            applyLink: j.apply_link || j.link || j.url,
            sourceJobId: `googlejobs-${j.id || j.job_id || Math.random()}`,
            source: 'google-jobs-scraper4',
            sourceUrl: j.apply_link || j.link,
            category: 'sde',
            jobType: 'full-time',
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ Google Jobs: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('Google Jobs Scraper error:', err.response?.status || err.message);
        return [];
    }
};

// 6. LinkedIn Job Search API 2 (POST)
const fetchFromLinkedInJobSearchApi2 = async () => {
    if (skipIfNoKey('LinkedIn Job Search API 2')) return [];
    try {
        const res = await axios.post('https://linkedin-job-search-api2.p.rapidapi.com/getjobs', {
            search_term: 'software',
            location: 'remote',
            results_wanted: 20,
            site_name: ['linkedin'],
            is_remote: true,
            linkedin_fetch_description: true,
            hours_old: 168
        }, {
            headers: rapidHeaders('linkedin-job-search-api2.p.rapidapi.com'),
            timeout: 25000,
        });
        const list = res.data?.jobs || res.data?.data || res.data || [];
        const mapped = list.map(j => ({
            title: j.title || 'LinkedIn Job',
            company: j.company || 'Unknown',
            companyLogo: j.company_logo || j.logo,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || j.snippet || 'LinkedIn Job Posting',
            applyLink: j.url || j.job_url || j.apply_link,
            sourceJobId: `liapi2-${j.id || j.job_id || Math.random()}`,
            source: 'linkedin-job-search-api2',
            sourceUrl: j.url || j.job_url,
            category: mapTitleToCategory(j.title),
            jobType: mapJobType(j.job_type),
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ LinkedIn Job Search 2: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('LinkedIn Job Search API 2 error:', err.response?.status || err.message);
        return [];
    }
};

// 7. LinkedIn Job Search Real-Time
const fetchFromLinkedInRealTime = async () => {
    if (skipIfNoKey('LinkedIn Real-Time Job Search')) return [];
    try {
        const res = await axios.get('https://linkedin-job-search-real-time.p.rapidapi.com/lastMonth', {
            headers: rapidHeaders('linkedin-job-search-real-time.p.rapidapi.com'),
            timeout: 15000,
        });
        const list = res.data?.jobs || res.data?.data || res.data || [];
        const mapped = list.map(j => ({
            title: j.title || 'LinkedIn Real-Time Job',
            company: j.company || 'Unknown',
            companyLogo: j.company_logo,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || 'LinkedIn Real-Time Search Result',
            applyLink: j.url || j.job_url,
            sourceJobId: `lirealtime-${j.id || j.job_id || Math.random()}`,
            source: 'linkedin-job-search-real-time',
            sourceUrl: j.url || j.job_url,
            category: mapTitleToCategory(j.title),
            jobType: 'full-time',
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ LinkedIn Real-Time: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('LinkedIn Real-Time Job Search error:', err.response?.status || err.message);
        return [];
    }
};

// 8. LinkedIn Jobs by DataNest
const fetchFromLinkedInJobsDataNest = async () => {
    if (skipIfNoKey('LinkedIn Jobs by DataNest')) return [];
    try {
        const res = await axios.get('https://linkedin-jobs-by-datanest.p.rapidapi.com/salary-insights', {
            headers: rapidHeaders('linkedin-jobs-by-datanest.p.rapidapi.com'),
            timeout: 15000,
        });
        const list = res.data?.jobs || res.data?.data || res.data || [];
        const mapped = list.map(j => ({
            title: j.title || 'DataNest Job',
            company: j.company || 'Unknown Company',
            companyLogo: j.company_logo,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || 'Salary insights linked job',
            applyLink: j.url || j.job_url || j.link,
            sourceJobId: `datanest-${j.id || j.job_id || Math.random()}`,
            source: 'linkedin-jobs-by-datanest',
            sourceUrl: j.url || j.job_url || j.link,
            category: mapTitleToCategory(j.title),
            jobType: 'full-time',
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: {
                min: j.min_salary,
                max: j.max_salary,
                currency: j.currency || 'USD',
                isDisclosed: !!(j.min_salary || j.max_salary)
            },
            status: 'pending',
        }));
        console.log(`✅ LinkedIn DataNest: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('LinkedIn Jobs by DataNest error:', err.response?.status || err.message);
        return [];
    }
};

// 9. ATS Jobs DB
const fetchFromAtsJobsDb = async () => {
    if (skipIfNoKey('ATS Jobs DB')) return [];
    try {
        const res = await axios.get('https://ats-jobs-db.p.rapidapi.com/api/jobs/expired', {
            headers: rapidHeaders('ats-jobs-db.p.rapidapi.com'),
            params: { batch_size: 20 },
            timeout: 15000,
        });
        const rawData = res.data?.jobs || res.data?.data || res.data;
        const list = Array.isArray(rawData) ? rawData : [];
        const mapped = list.map(j => ({
            title: j.title || 'ATS Job',
            company: j.company || 'ATS Employer',
            companyLogo: j.company_logo,
            location: j.location || 'Remote',
            remote: 'remote',
            description: j.description || 'ATS Jobs DB Listing',
            applyLink: j.url || j.link || j.apply_url,
            sourceJobId: `atsjobs-${j.id || j.job_id || Math.random()}`,
            source: 'ats-jobs-db',
            sourceUrl: j.url || j.link,
            category: mapTitleToCategory(j.title),
            jobType: 'full-time',
            postedDate: j.posted_at || j.date_posted ? new Date(j.posted_at || j.date_posted) : new Date(),
            skills: j.skills || [],
            salary: { isDisclosed: false },
            status: 'pending',
        }));
        console.log(`✅ ATS Jobs DB: ${mapped.length} jobs`);
        return mapped;
    } catch (err) {
        console.error('ATS Jobs DB error:', err.response?.status || err.message);
        return [];
    }
};

/**
 * Main aggregator: run all sources or selected source and save new jobs to DB
 */
const aggregateJobs = async (selectedSource) => {
    console.log(`🔍 Starting job aggregation. Selected source: ${selectedSource || 'all'}`);
    
    // Map of source name to fetcher function
    const scrapers = {
        'adzuna': fetchFromAdzuna,
        'remotive': fetchFromRemotive,
        'remoteok': fetchFromRemoteOK,
        'arbeitnow': fetchFromArbeitnow,
        'jsearch': fetchFromJSearch,
        'indeed46': fetchFromIndeed46,
        'linkedin-search': fetchFromLinkedInSearch,
        'active-jobs-db': fetchFromActiveJobsDB,
        'job-posting-feed': fetchFromJobPostingFeed,
        'internships-api': fetchFromInternshipsAPI,
        'indeed-scraper': fetchFromIndeedScraper,
        'linkedin-jobs2': fetchFromLinkedInJobs2,
        
        // New RapidAPI sources
        'jobfinder-api1': fetchFromJobFinder,
        'hacker-news-who-is-hiring': fetchFromHackerNews,
        'upwork-jobs-api3': fetchFromUpwork,
        'linkedin-jobs12': fetchFromLinkedInJobs12,
        'google-jobs-scraper4': fetchFromGoogleJobs,
        'linkedin-job-search-api2': fetchFromLinkedInJobSearchApi2,
        'linkedin-job-search-real-time': fetchFromLinkedInRealTime,
        'linkedin-jobs-by-datanest': fetchFromLinkedInJobsDataNest,
        'ats-jobs-db': fetchFromAtsJobsDb,
    };

    let functionsToRun = [];
    if (selectedSource && selectedSource !== 'all') {
        const scraper = scrapers[selectedSource];
        if (scraper) {
            functionsToRun.push({ name: selectedSource, fn: scraper });
        } else {
            console.warn(`⚠️ Unknown source selected: ${selectedSource}`);
        }
    } else {
        // Run all
        functionsToRun = Object.entries(scrapers).map(([name, fn]) => ({ name, fn }));
    }

    const results = await Promise.allSettled(
        functionsToRun.map(item => item.fn().catch(err => {
            console.error(`Error executing scraper ${item.name}:`, err);
            return [];
        }))
    );

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
