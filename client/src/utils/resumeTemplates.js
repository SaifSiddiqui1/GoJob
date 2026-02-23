// ─── Resume Template Definitions ─────────────────────────────────────────────
// Each template has: id, name, description, thumbnail colors, generateHTML(resume)

export const TEMPLATES = [
    { id: 'classic', name: 'Classic', desc: 'Clean black & white, ATS-safe', primary: '#1a1a1a', bg: '#fff', accent: '#1a1a1a', layout: 'single' },
    { id: 'modern', name: 'Modern', desc: 'Blue accents, sleek & minimal', primary: '#2563eb', bg: '#fff', accent: '#2563eb', layout: 'single' },
    { id: 'executive', name: 'Executive', desc: 'Navy blue, formal & corporate', primary: '#1e3a5f', bg: '#fff', accent: '#1e3a5f', layout: 'single' },
    { id: 'standout', name: 'StandOut', desc: 'Dark blue sidebar, high contrast', primary: '#1a2e4a', bg: '#f8fafc', accent: '#fff', layout: 'sidebar-left' },
    { id: 'professional', name: 'Professional', desc: 'Grey sidebar, structured layout', primary: '#4b5563', bg: '#f9fafb', accent: '#fff', layout: 'sidebar-left' },
    { id: 'creative', name: 'Creative', desc: 'Pink accent, asymmetric design', primary: '#ec4899', bg: '#fff', accent: '#ec4899', layout: 'sidebar-left' },
    { id: 'eloquent', name: 'Eloquent', desc: 'Deep purple, sophisticated serif', primary: '#7c3aed', bg: '#fff', accent: '#7c3aed', layout: 'single' },
    { id: 'trailblazer', name: 'Trailblazer', desc: 'Maroon sidebar, skill-focused', primary: '#991b1b', bg: '#fff', accent: '#fff', layout: 'sidebar-right' },
    { id: 'maverick', name: 'Maverick', desc: 'Bold black header, two-column', primary: '#111827', bg: '#fff', accent: '#fff', layout: 'bold-header' },
    { id: 'artistic', name: 'Artistic', desc: 'Warm orange, creative feel', primary: '#c2410c', bg: '#fffbf7', accent: '#c2410c', layout: 'single' },
    { id: 'dynamic', name: 'Dynamic', desc: 'Bold blue half-sidebar', primary: '#1d4ed8', bg: '#fff', accent: '#fff', layout: 'sidebar-left' },
    { id: 'minimal', name: 'Minimal', desc: 'Mint lines, airy & minimal', primary: '#059669', bg: '#f0fdf4', accent: '#059669', layout: 'single' },
]

// ─── Sample Data for Thumbnails ─────────────────────────────────────────────
const SAMPLE_RESUME = {
    personalInfo: {
        fullName: 'Alex Johnson', email: 'alex@email.com', phone: '+91 98765 43210',
        location: 'Mumbai, India', linkedin: 'linkedin.com/in/alexjohnson',
        github: 'github.com/alexjohnson',
        summary: 'Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code, performance, and team leadership.',
    },
    experience: [
        { position: 'Senior Software Engineer', company: 'Tech Corp', location: 'Mumbai', startDate: '2022-01', current: true, description: 'Led development of microservices architecture serving 2M+ users. Improved system performance by 40%.' },
        { position: 'Software Engineer', company: 'StartUp Inc', location: 'Pune', startDate: '2020-06', endDate: '2021-12', current: false, description: 'Built full-stack features using React and Node.js in an agile team of 8 engineers.' },
    ],
    education: [{ degree: 'B.Tech', field: 'Computer Science', institution: 'IIT Bombay', startDate: '2016-08', endDate: '2020-05', grade: '8.9 CGPA' }],
    skills: [
        { category: 'Programming', items: ['JavaScript', 'TypeScript', 'Python', 'Java'] },
        { category: 'Frameworks', items: ['React', 'Node.js', 'MongoDB', 'Express'] },
    ],
}

// ─── HTML Generator ───────────────────────────────────────────────────────────
// preview=true → skip print bar so iframes render from top (used for thumbnails)
export function generateTemplateHTML(resume, templateId = 'classic', { preview = false } = {}) {
    const tmpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0]
    const p = resume?.personalInfo || {}
    const exp = resume?.experience || []
    const edu = resume?.education || []
    const skills = resume?.skills || []

    // Shared helpers
    const contact = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).join('  •  ')
    const expHtml = exp.map(e => `
        <div class="entry">
            <div class="entry-header"><strong>${e.position || ''}</strong><span class="date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div>
            <div class="sub">${e.company || ''}${e.location ? ', ' + e.location : ''}</div>
            <p>${e.description || ''}</p>
        </div>`).join('')
    const eduHtml = edu.map(e => `
        <div class="entry">
            <div class="entry-header"><strong>${e.degree || ''}${e.field ? ' – ' + e.field : ''}</strong><span class="date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</span></div>
            <div class="sub">${e.institution || ''}${e.grade ? ' · ' + e.grade : ''}</div>
        </div>`).join('')
    const skillsHtml = skills.map(s => `<div class="skill-group"><strong>${s.category}:</strong> ${(s.items || []).join(', ')}</div>`).join('')
    const skillTagsHtml = skills.flatMap(s => s.items || []).map(sk => `<span class="tag">${sk}</span>`).join('')

    const PRINT_BAR = preview ? '<div>' : `
    <div class="print-bar">
        <span>\uD83D\uDCC4 ${p.fullName || 'Resume'} \u2014 Click <strong>Save as PDF</strong></span>
        <div><button onclick="window.print()" class="pbtn print-btn">\uD83D\uDDA8\uFE0F Save as PDF</button>
             <button onclick="window.close()" class="pbtn close-btn">\u2715 Close</button></div>
    </div>
    <div style="margin-top:52px;">`

    const PRINT_STYLE = preview ? '' : `
    .print-bar{position:fixed;top:0;left:0;right:0;background:#2563eb;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif;font-size:13px;z-index:999}
    .pbtn{padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-weight:600;font-size:13px;margin-left:6px}
    .print-btn{background:#fff;color:#2563eb}.close-btn{background:rgba(255,255,255,.2);color:#fff}
    @media print{.print-bar{display:none!important}body{padding:0;margin:0}.entry{page-break-inside:avoid}}`

    const generators = {
        classic: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            body{font-family:'Times New Roman',serif;margin:0;padding:40px;color:#1a1a1a;font-size:12px;line-height:1.5;max-width:800px;margin:auto}
            h1{font-size:26px;text-align:center;margin:0 0 4px;letter-spacing:1px}
            .contact-line{text-align:center;font-size:11px;color:#444;margin-bottom:20px}
            h2{font-size:12px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #1a1a1a;margin:16px 0 8px;padding-bottom:2px}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{font-style:italic;color:#555;font-size:11px;margin:2px 0}.date{font-size:11px;color:#666}
            p{margin:3px 0;font-size:11.5px}.skill-group{margin-bottom:4px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`,

        modern: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:40px;color:#111;font-size:12.5px;line-height:1.55;max-width:800px;margin:auto}
            h1{font-size:28px;margin:0 0 2px;color:#2563eb;font-weight:800;letter-spacing:-0.5px}
            .title-sub{color:#64748b;font-size:12px;margin-bottom:6px}
            .contact-line{font-size:11px;color:#64748b;margin-bottom:22px;display:flex;flex-wrap:wrap;gap:10px}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#2563eb;margin:16px 0 8px;border-left:3px solid #2563eb;padding-left:8px}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between;align-items:baseline}
            .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}
            p{margin:3px 0;font-size:12px;color:#374151}.skill-group{margin-bottom:4px;font-size:12px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`,

        standout: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#1a1a1a;font-size:12px;display:flex;min-height:100vh}
            .sidebar{width:260px;background:#1a2e4a;color:#fff;padding:30px 20px;flex-shrink:0}
            .sidebar h1{font-size:22px;color:#fff;margin:0 0 4px;line-height:1.2}
            .sidebar .sub{font-size:11px;color:#cbd5e1;margin-bottom:20px}
            .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:16px 0 6px;border-bottom:1px solid #334155;padding-bottom:4px}
            .sidebar p,.sidebar .ci{font-size:11px;color:#cbd5e1;margin:3px 0}
            .tag{display:inline-block;background:#334155;color:#e2e8f0;border-radius:4px;padding:2px 7px;font-size:10px;margin:2px 2px 2px 0}
            .main{flex:1;padding:30px 28px}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1a2e4a;border-bottom:2px solid #1a2e4a;margin:16px 0 8px;padding-bottom:3px}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub-e{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}p{margin:3px 0;font-size:11.5px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="sidebar">
            <h1>${p.fullName || 'Your Name'}</h1>
            <h3>Contact</h3>
            ${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<p class="ci">${x}</p>`).join('')}
            ${skills.length ? `<h3>Skills</h3>${skillTagsHtml}` : ''}
        </div>
        <div class="main" style="margin-top:52px;">
            ${p.summary ? `<h2>About Me</h2><p>${p.summary}</p>` : ''}
            ${exp.length ? `<h2>Experience</h2>${expHtml.replace(/class="sub"/g, 'class="sub-e"')}` : ''}
            ${edu.length ? `<h2>Education</h2>${eduHtml.replace(/class="sub"/g, 'class="sub-e"')}` : ''}
        </div>
        </div></body></html>`,

        professional: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#1a1a1a;font-size:12px;display:flex;min-height:100vh}
            .sidebar{width:240px;background:#4b5563;color:#fff;padding:28px 18px;flex-shrink:0}
            .sidebar h1{font-size:20px;color:#fff;margin:0 0 4px}
            .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#d1d5db;margin:14px 0 6px}
            .sidebar p{font-size:11px;color:#e5e7eb;margin:3px 0}
            .tag{display:inline-block;background:#6b7280;color:#f9fafb;border-radius:3px;padding:2px 6px;font-size:10px;margin:2px 2px 2px 0}
            .main{flex:1;padding:28px 24px}
            h2{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#4b5563;border-bottom:1.5px solid #d1d5db;margin:14px 0 8px;padding-bottom:3px}
            .entry{margin-bottom:9px}.entry-header{display:flex;justify-content:space-between}
            .sub{color:#6b7280;font-size:11px;margin:2px 0}.date{font-size:11px;color:#9ca3af}p{margin:3px 0;font-size:11.5px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="sidebar">
            <h1>${p.fullName || 'Your Name'}</h1>
            <h3>Contact</h3>
            ${[p.email, p.phone, p.location].filter(Boolean).map(x => `<p>${x}</p>`).join('')}
            ${skills.length ? `<h3>Skills</h3>${skillTagsHtml}` : ''}
        </div>
        <div class="main" style="margin-top:52px;">
            ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
            ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
            ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div>
        </div></body></html>`,

        executive: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            body{font-family:Georgia,serif;margin:0;padding:36px 48px;color:#1e3a5f;font-size:12px;line-height:1.55;max-width:800px;margin:auto}
            .header{border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px}
            h1{font-size:26px;margin:0 0 4px;color:#1e3a5f;letter-spacing:0.5px}
            .contact-line{font-size:11px;color:#475569;display:flex;flex-wrap:wrap;gap:14px}
            h2{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#1e3a5f;margin:16px 0 8px;position:relative;padding-left:12px}
            h2::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:3px;background:#1e3a5f}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{font-style:italic;color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}p{margin:3px 0}
            .skill-group{margin-bottom:4px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="header">
            <h1>${p.fullName || 'Your Name'}</h1>
            <div class="contact-line">${[p.email, p.phone, p.location, p.linkedin].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        </div>
        ${p.summary ? `<h2>Executive Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Professional Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Core Competencies</h2>${skillsHtml}` : ''}
        </div></body></html>`,

        creative: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#1a1a1a;font-size:12px;display:flex;min-height:100vh}
            .sidebar{width:220px;background:#ec4899;color:#fff;padding:28px 16px;flex-shrink:0}
            .sidebar h1{font-size:20px;font-weight:800;color:#fff;margin:0 0 2px}
            .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#fce7f3;margin:14px 0 5px}
            .sidebar p{font-size:11px;color:#fce7f3;margin:3px 0}
            .tag{display:inline-block;background:rgba(255,255,255,.2);color:#fff;border-radius:12px;padding:2px 8px;font-size:10px;margin:2px 2px 2px 0}
            .main{flex:1;padding:28px 24px}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#ec4899;margin:16px 0 8px;border-bottom:1.5px solid #fce7f3;padding-bottom:3px}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{color:#9ca3af;font-size:11px;margin:2px 0}.date{font-size:11px;color:#d1d5db}p{margin:3px 0}
        </style></head><body>
        ${PRINT_BAR}
        <div class="sidebar">
            <h1>${p.fullName || 'Your Name'}</h1>
            <h3>Contact</h3>
            ${[p.email, p.phone, p.location].filter(Boolean).map(x => `<p>${x}</p>`).join('')}
            ${skills.length ? `<h3>Skills</h3>${skillTagsHtml}` : ''}
        </div>
        <div class="main" style="margin-top:52px;">
            ${p.summary ? `<h2>About Me</h2><p>${p.summary}</p>` : ''}
            ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
            ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div>
        </div></body></html>`,

        eloquent: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            body{font-family:Georgia,'Times New Roman',serif;margin:0;padding:40px 48px;color:#1a1a1a;font-size:12.5px;line-height:1.6;max-width:800px;margin:auto}
            h1{font-size:28px;text-align:center;color:#7c3aed;margin:0 0 4px;font-style:italic}
            .contact-line{text-align:center;font-size:11px;color:#6d28d9;margin-bottom:22px}
            h2{font-size:13px;color:#7c3aed;text-align:center;letter-spacing:3px;text-transform:uppercase;margin:18px 0 10px;position:relative}
            h2::after{content:'';display:block;width:60px;height:1px;background:#c4b5fd;margin:4px auto 0}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{font-style:italic;color:#7c3aed;font-size:11px;margin:2px 0}.date{font-size:11px;color:#a78bfa}
            p{margin:3px 0;font-size:12px}.skill-group{margin-bottom:4px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`,

        maverick: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#111;font-size:12px;line-height:1.5}
            .header{background:#111827;color:#fff;padding:24px 36px}
            h1{font-size:26px;margin:0 0 4px;color:#fff;font-weight:900;letter-spacing:-0.5px}
            .contact-line{font-size:11px;color:#9ca3af;display:flex;flex-wrap:wrap;gap:12px}
            .body{display:flex;gap:0}
            .main{flex:1;padding:24px 36px}
            .aside{width:220px;background:#f9fafb;padding:24px 18px;border-left:1px solid #e5e7eb}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#111;border-bottom:2px solid #111;margin:14px 0 8px;padding-bottom:2px}
            h3{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;margin:14px 0 6px}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{color:#6b7280;font-size:11px;margin:2px 0}.date{font-size:11px;color:#9ca3af}p{margin:3px 0}
            .tag{display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 7px;font-size:10px;margin:2px 2px 2px 0}
        </style></head><body>
        <div class="header" style="margin-top:52px;">
            <h1>${p.fullName || 'Your Name'}</h1>
            <div class="contact-line">${[p.email, p.phone, p.location, p.linkedin].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        </div>
        ${PRINT_BAR}
        <div class="body">
            <div class="main">
                ${p.summary ? `<h2>About</h2><p>${p.summary}</p>` : ''}
                ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
                ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
            </div>
            <div class="aside">
                ${skills.length ? `<h3>Skills</h3>${skillTagsHtml}` : ''}
            </div>
        </div>
        </body></html>`,

        trailblazer: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#111;font-size:12px;display:flex;min-height:100vh}
            .main{flex:1;padding:30px 24px}
            .sidebar{width:200px;background:#991b1b;color:#fff;padding:28px 16px}
            h1{font-size:22px;color:#991b1b;margin:0 0 4px;font-weight:800}
            .contact-main{font-size:11px;color:#64748b;margin-bottom:18px}
            h2{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#991b1b;border-bottom:2px solid #fca5a5;margin:14px 0 8px;padding-bottom:3px}
            .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#fca5a5;margin:14px 0 5px}
            .sidebar p{font-size:11px;color:#fecaca;margin:3px 0}
            .tag{display:inline-block;background:rgba(255,255,255,.15);color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;margin:2px 2px 2px 0}
            .entry{margin-bottom:9px}.entry-header{display:flex;justify-content:space-between}
            .sub{color:#6b7280;font-size:11px;margin:2px 0}.date{font-size:11px;color:#9ca3af}p{margin:3px 0}
        </style></head><body>
        ${PRINT_BAR}
        <div class="main" style="margin-top:52px;">
            <h1>${p.fullName || 'Your Name'}</h1>
            <div class="contact-main">${[p.email, p.phone, p.location].filter(Boolean).join(' • ')}</div>
            ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
            ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
            ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div>
        <div class="sidebar">
            <h3>Contact</h3>
            ${[p.linkedin, p.github].filter(Boolean).map(x => `<p>${x}</p>`).join('')}
            ${skills.length ? `<h3>Skills</h3>${skillTagsHtml}` : ''}
        </div>
        </body></html>`,

        artistic: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:40px 44px;color:#292524;background:#fffbf7;font-size:12.5px;line-height:1.55;max-width:800px;margin:auto}
            h1{font-size:30px;font-family:Georgia,serif;font-style:italic;color:#c2410c;margin:0 0 4px}
            .contact-line{font-size:11px;color:#78716c;margin-bottom:20px;border-left:3px solid #c2410c;padding-left:10px}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#c2410c;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
            h2::after{content:'';flex:1;height:1px;background:#e7d4c9}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{color:#78716c;font-style:italic;font-size:11.5px;margin:2px 0}.date{font-size:11px;color:#a8a29e}
            p{margin:3px 0}.skill-group{margin-bottom:4px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`,

        dynamic: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#0f172a;font-size:12px;display:flex;min-height:100vh}
            .sidebar{width:280px;background:#1d4ed8;color:#fff;padding:32px 22px;flex-shrink:0}
            .sidebar h1{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;line-height:1.2}
            .sidebar .role{font-size:11px;color:#bfdbfe;margin-bottom:20px}
            .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#93c5fd;margin:16px 0 6px;border-bottom:1px solid #2563eb;padding-bottom:4px}
            .sidebar p{font-size:11px;color:#dbeafe;margin:3px 0}
            .tag{display:inline-block;background:#2563eb;color:#eff6ff;border-radius:4px;padding:2px 8px;font-size:10px;margin:2px 2px 2px 0}
            .main{flex:1;padding:32px 26px}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1d4ed8;border-bottom:2px solid #bfdbfe;margin:16px 0 8px;padding-bottom:3px}
            .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
            .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}p{margin:3px 0}
        </style></head><body>
        ${PRINT_BAR}
        <div class="sidebar">
            <h1>${p.fullName || 'Your Name'}</h1>
            <div class="role">${p.location || ''}</div>
            <h3>Contact</h3>
            ${[p.email, p.phone, p.linkedin, p.github].filter(Boolean).map(x => `<p>${x}</p>`).join('')}
            ${skills.length ? `<h3>Skills</h3>${skillTagsHtml}` : ''}
        </div>
        <div class="main" style="margin-top:52px;">
            ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
            ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
            ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div>
        </body></html>`,

        minimal: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:40px 48px;color:#1a1a1a;background:#f0fdf4;font-size:12px;line-height:1.6;max-width:800px;margin:auto}
            h1{font-size:26px;margin:0 0 4px;color:#064e3b;font-weight:700;letter-spacing:-0.5px}
            .contact-line{font-size:11px;color:#6b7280;border-bottom:1px solid #a7f3d0;padding-bottom:14px;margin-bottom:18px;display:flex;flex-wrap:wrap;gap:12px}
            h2{font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:#059669;margin:16px 0 6px}
            .entry{margin-bottom:9px;border-left:2px solid #a7f3d0;padding-left:10px}
            .entry-header{display:flex;justify-content:space-between;align-items:baseline}
            .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#6ee7b7}
            p{margin:3px 0;font-size:11.5px;color:#374151}.skill-group{margin-bottom:3px;font-size:11.5px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`,
    }

    const gen = generators[templateId] || generators.classic
    return gen()
}

// ─── Pre-generated Thumbnails (sample data, no print bar) ────────────────────
export const TEMPLATE_PREVIEWS = Object.fromEntries(
    ['classic', 'modern', 'executive', 'standout', 'professional', 'creative', 'eloquent', 'trailblazer', 'maverick', 'artistic', 'dynamic', 'minimal']
        .map(id => [id, generateTemplateHTML(SAMPLE_RESUME, id, { preview: true })])
)
