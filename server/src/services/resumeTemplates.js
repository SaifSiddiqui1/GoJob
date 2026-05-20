// Server-side resume template generator (CommonJS)
// Mirrors client/src/utils/resumeTemplates.js for download/print

const PRINT_STYLE = `
.print-bar{position:fixed;top:0;left:0;right:0;background:#2563eb;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif;font-size:13px;z-index:999}
.pbtn{padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-weight:600;font-size:13px;margin-left:6px}
.print-btn{background:#fff;color:#2563eb}.close-btn{background:rgba(255,255,255,.2);color:#fff}
@media print{.print-bar{display:none!important}body{padding:0;margin:0}.entry{page-break-inside:avoid}}`;

function printBar(name) {
    return `<div class="print-bar">
        <span>📄 ${name} — Click <strong>Save as PDF</strong></span>
        <div><button onclick="window.print()" class="pbtn print-btn">🖨️ Save as PDF</button>
             <button onclick="window.close()" class="pbtn close-btn">✕ Close</button></div>
    </div><div style="margin-top:52px;">`;
}

function buildBlocks(resume) {
    const p = resume.personalInfo || {};
    const exp = resume.experience || [];
    const edu = resume.education || [];
    const skills = resume.skills || [];
    const contact = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).join('  •  ');
    const expHtml = exp.map(e => `<div class="entry"><div class="entry-header"><strong>${e.position || ''}</strong><span class="date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div><div class="sub">${e.company || ''}${e.location ? ', ' + e.location : ''}</div><p>${e.description || ''}</p></div>`).join('');
    const eduHtml = edu.map(e => `<div class="entry"><div class="entry-header"><strong>${e.degree || ''}${e.field ? ' – ' + e.field : ''}</strong><span class="date">${e.endDate || ''}</span></div><div class="sub">${e.institution || ''}${e.grade ? ' · ' + e.grade : ''}</div></div>`).join('');
    const skillsHtml = skills.map(s => `<div class="sg"><strong>${s.category}:</strong> ${(s.items || []).join(', ')}</div>`).join('');
    const tagHtml = skills.flatMap(s => s.items || []).map(sk => `<span class="tag">${sk}</span>`).join('');
    return { p, exp, edu, skills, contact, expHtml, eduHtml, skillsHtml, tagHtml };
}

const generators = {
    classic: (resume) => {
        const { p, exp, edu, skills, contact, expHtml, eduHtml, skillsHtml } = buildBlocks(resume);
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        body{font-family:'Times New Roman',serif;margin:auto;padding:40px;color:#1a1a1a;font-size:12px;line-height:1.5;max-width:800px}
        h1{font-size:26px;text-align:center;margin:0 0 4px;letter-spacing:1px}
        .cl{text-align:center;font-size:11px;color:#444;margin-bottom:20px}
        h2{font-size:12px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #1a1a1a;margin:16px 0 8px;padding-bottom:2px}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{font-style:italic;color:#555;font-size:11px;margin:2px 0}.date{font-size:11px;color:#666}
        p{margin:3px 0;font-size:11.5px}.sg{margin-bottom:4px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <h1>${p.fullName || 'Your Name'}</h1><div class="cl">${contact}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`;
    },
    modern: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, skillsHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        body{font-family:'Segoe UI',Arial,sans-serif;margin:auto;padding:40px;color:#111;font-size:12.5px;line-height:1.55;max-width:800px}
        h1{font-size:28px;margin:0 0 2px;color:#2563eb;font-weight:800}
        .cl{font-size:11px;color:#64748b;margin-bottom:22px;display:flex;flex-wrap:wrap;gap:10px}
        h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#2563eb;margin:16px 0 8px;border-left:3px solid #2563eb;padding-left:8px}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between;align-items:baseline}
        .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}
        p{margin:3px 0;font-size:12px;color:#374151}.sg{margin-bottom:4px;font-size:12px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <h1>${p.fullName || 'Your Name'}</h1><div class="cl">${ci}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`;
    },
    standout: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, tagHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<p>${x}</p>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#1a1a1a;font-size:12px;display:flex;min-height:100vh}
        .sidebar{width:260px;background:#1a2e4a;color:#fff;padding:30px 20px;flex-shrink:0}
        .sidebar h1{font-size:22px;color:#fff;margin:0 0 4px;line-height:1.2}
        .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:16px 0 6px;border-bottom:1px solid #334155;padding-bottom:4px}
        .sidebar p{font-size:11px;color:#cbd5e1;margin:3px 0}
        .tag{display:inline-block;background:#334155;color:#e2e8f0;border-radius:4px;padding:2px 7px;font-size:10px;margin:2px 2px 2px 0}
        .main{flex:1;padding:30px 28px}
        h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1a2e4a;border-bottom:2px solid #1a2e4a;margin:16px 0 8px;padding-bottom:3px}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}p{margin:3px 0}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <div class="sidebar"><h1>${p.fullName || 'Your Name'}</h1><h3>Contact</h3>${ci}
        ${skills.length ? `<h3>Skills</h3>${tagHtml}` : ''}</div>
        <div class="main">
        ${p.summary ? `<h2>About Me</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div></body></html>`;
    },
    professional: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, tagHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location].filter(Boolean).map(x => `<p>${x}</p>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#1a1a1a;font-size:12px;display:flex;min-height:100vh}
        .sidebar{width:240px;background:#4b5563;color:#fff;padding:28px 18px;flex-shrink:0}
        .sidebar h1{font-size:20px;color:#fff;margin:0 0 4px}
        .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#d1d5db;margin:14px 0 6px}
        .sidebar p{font-size:11px;color:#e5e7eb;margin:3px 0}
        .tag{display:inline-block;background:#6b7280;color:#f9fafb;border-radius:3px;padding:2px 6px;font-size:10px;margin:2px 2px 2px 0}
        .main{flex:1;padding:28px 24px}
        h2{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#4b5563;border-bottom:1.5px solid #d1d5db;margin:14px 0 8px;padding-bottom:3px}
        .entry{margin-bottom:9px}.entry-header{display:flex;justify-content:space-between}
        .sub{color:#6b7280;font-size:11px;margin:2px 0}.date{font-size:11px;color:#9ca3af}p{margin:3px 0}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <div class="sidebar"><h1>${p.fullName || 'Your Name'}</h1><h3>Contact</h3>${ci}
        ${skills.length ? `<h3>Skills</h3>${tagHtml}` : ''}</div>
        <div class="main">
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div></body></html>`;
    },
    executive: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, skillsHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location, p.linkedin].filter(Boolean).map(x => `<span>${x}</span>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        body{font-family:Georgia,serif;margin:auto;padding:36px 48px;color:#1e3a5f;font-size:12px;line-height:1.55;max-width:800px}
        .header{border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px}
        h1{font-size:26px;margin:0 0 4px;color:#1e3a5f}
        .cl{font-size:11px;color:#475569;display:flex;flex-wrap:wrap;gap:14px}
        h2{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#1e3a5f;margin:16px 0 8px;padding-left:12px;position:relative}
        h2::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:3px;background:#1e3a5f}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{font-style:italic;color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}p{margin:3px 0}.sg{margin-bottom:4px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <div class="header"><h1>${p.fullName || 'Your Name'}</h1><div class="cl">${ci}</div></div>
        ${p.summary ? `<h2>Executive Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Professional Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Core Competencies</h2>${skillsHtml}` : ''}
        </div></body></html>`;
    },
    creative: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, tagHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location].filter(Boolean).map(x => `<p>${x}</p>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
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
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <div class="sidebar"><h1>${p.fullName || 'Your Name'}</h1><h3>Contact</h3>${ci}
        ${skills.length ? `<h3>Skills</h3>${tagHtml}` : ''}</div>
        <div class="main">
        ${p.summary ? `<h2>About Me</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div></body></html>`;
    },
    eloquent: (resume) => {
        const { p, exp, edu, skills, contact, expHtml, eduHtml, skillsHtml } = buildBlocks(resume);
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        body{font-family:Georgia,'Times New Roman',serif;margin:auto;padding:40px 48px;color:#1a1a1a;font-size:12.5px;line-height:1.6;max-width:800px}
        h1{font-size:28px;text-align:center;color:#7c3aed;margin:0 0 4px;font-style:italic}
        .cl{text-align:center;font-size:11px;color:#6d28d9;margin-bottom:22px}
        h2{font-size:13px;color:#7c3aed;text-align:center;letter-spacing:3px;text-transform:uppercase;margin:18px 0 10px}
        h2::after{content:'';display:block;width:60px;height:1px;background:#c4b5fd;margin:4px auto 0}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{font-style:italic;color:#7c3aed;font-size:11px;margin:2px 0}.date{font-size:11px;color:#a78bfa}
        p{margin:3px 0;font-size:12px}.sg{margin-bottom:4px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <h1>${p.fullName || 'Your Name'}</h1><div class="cl">${contact}</div>
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`;
    },
    maverick: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, tagHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location, p.linkedin].filter(Boolean).map(x => `<span>${x}</span>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#111;font-size:12px;line-height:1.5}
        .hdr{background:#111827;color:#fff;padding:24px 36px}
        h1{font-size:26px;margin:0 0 4px;color:#fff;font-weight:900}
        .cl{font-size:11px;color:#9ca3af;display:flex;flex-wrap:wrap;gap:12px}
        .body{display:flex}
        .main{flex:1;padding:24px 36px}
        .aside{width:220px;background:#f9fafb;padding:24px 18px;border-left:1px solid #e5e7eb}
        h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#111;border-bottom:2px solid #111;margin:14px 0 8px;padding-bottom:2px}
        h3{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;margin:14px 0 6px}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{color:#6b7280;font-size:11px;margin:2px 0}.date{font-size:11px;color:#9ca3af}p{margin:3px 0}
        .tag{display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 7px;font-size:10px;margin:2px 2px 2px 0}
        </style></head><body>
        <div class="hdr"><h1>${p.fullName || 'Your Name'}</h1><div class="cl">${ci}</div></div>
        ${printBar(p.fullName || 'Resume')}
        <div class="body">
        <div class="main">
        ${p.summary ? `<h2>About</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div>
        <div class="aside">${skills.length ? `<h3>Skills</h3>${tagHtml}` : ''}</div>
        </div></body></html>`;
    },
    trailblazer: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, tagHtml } = buildBlocks(resume);
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#111;font-size:12px;display:flex;min-height:100vh}
        .main{flex:1;padding:30px 24px}
        .sidebar{width:200px;background:#991b1b;color:#fff;padding:28px 16px}
        h1{font-size:22px;color:#991b1b;margin:0 0 4px;font-weight:800}
        .cm{font-size:11px;color:#64748b;margin-bottom:18px}
        h2{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#991b1b;border-bottom:2px solid #fca5a5;margin:14px 0 8px;padding-bottom:3px}
        .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#fca5a5;margin:14px 0 5px}
        .sidebar p{font-size:11px;color:#fecaca;margin:3px 0}
        .tag{display:inline-block;background:rgba(255,255,255,.15);color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;margin:2px 2px 2px 0}
        .entry{margin-bottom:9px}.entry-header{display:flex;justify-content:space-between}
        .sub{color:#6b7280;font-size:11px;margin:2px 0}.date{font-size:11px;color:#9ca3af}p{margin:3px 0}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <div class="main">
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="cm">${[p.email, p.phone, p.location].filter(Boolean).join(' • ')}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div>
        <div class="sidebar">
        <h3>Links</h3>${[p.linkedin, p.github].filter(Boolean).map(x => `<p>${x}</p>`).join('')}
        ${skills.length ? `<h3>Skills</h3>${tagHtml}` : ''}
        </div></body></html>`;
    },
    artistic: (resume) => {
        const { p, exp, edu, skills, contact, expHtml, eduHtml, skillsHtml } = buildBlocks(resume);
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        body{font-family:'Segoe UI',Arial,sans-serif;margin:auto;padding:40px 44px;color:#292524;background:#fffbf7;font-size:12.5px;line-height:1.55;max-width:800px}
        h1{font-size:30px;font-family:Georgia,serif;font-style:italic;color:#c2410c;margin:0 0 4px}
        .cl{font-size:11px;color:#78716c;margin-bottom:20px;border-left:3px solid #c2410c;padding-left:10px}
        h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#c2410c;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
        h2::after{content:'';flex:1;height:1px;background:#e7d4c9}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{color:#78716c;font-style:italic;font-size:11.5px;margin:2px 0}.date{font-size:11px;color:#a8a29e}
        p{margin:3px 0}.sg{margin-bottom:4px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <h1>${p.fullName || 'Your Name'}</h1><div class="cl">${contact}</div>
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`;
    },
    dynamic: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, tagHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.linkedin, p.github].filter(Boolean).map(x => `<p>${x}</p>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#0f172a;font-size:12px;display:flex;min-height:100vh}
        .sidebar{width:280px;background:#1d4ed8;color:#fff;padding:32px 22px;flex-shrink:0}
        .sidebar h1{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px}
        .sidebar .loc{font-size:11px;color:#bfdbfe;margin-bottom:20px}
        .sidebar h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#93c5fd;margin:16px 0 6px;border-bottom:1px solid #2563eb;padding-bottom:4px}
        .sidebar p{font-size:11px;color:#dbeafe;margin:3px 0}
        .tag{display:inline-block;background:#2563eb;color:#eff6ff;border-radius:4px;padding:2px 8px;font-size:10px;margin:2px 2px 2px 0}
        .main{flex:1;padding:32px 26px}
        h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1d4ed8;border-bottom:2px solid #bfdbfe;margin:16px 0 8px;padding-bottom:3px}
        .entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between}
        .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#94a3b8}p{margin:3px 0}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <div class="sidebar">
        <h1>${p.fullName || 'Your Name'}</h1><div class="loc">${p.location || ''}</div>
        <h3>Contact</h3>${ci}
        ${skills.length ? `<h3>Skills</h3>${tagHtml}` : ''}
        </div>
        <div class="main">
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        </div></body></html>`;
    },
    minimal: (resume) => {
        const { p, exp, edu, skills, expHtml, eduHtml, skillsHtml } = buildBlocks(resume);
        const ci = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        body{font-family:'Segoe UI',Arial,sans-serif;margin:auto;padding:40px 48px;color:#1a1a1a;background:#f0fdf4;font-size:12px;line-height:1.6;max-width:800px}
        h1{font-size:26px;margin:0 0 4px;color:#064e3b;font-weight:700}
        .cl{font-size:11px;color:#6b7280;border-bottom:1px solid #a7f3d0;padding-bottom:14px;margin-bottom:18px;display:flex;flex-wrap:wrap;gap:12px}
        h2{font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:#059669;margin:16px 0 6px}
        .entry{margin-bottom:9px;border-left:2px solid #a7f3d0;padding-left:10px}
        .entry-header{display:flex;justify-content:space-between;align-items:baseline}
        .sub{color:#64748b;font-size:11px;margin:2px 0}.date{font-size:11px;color:#6ee7b7}
        p{margin:3px 0;font-size:11.5px;color:#374151}.sg{margin-bottom:3px;font-size:11.5px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <h1>${p.fullName || 'Your Name'}</h1><div class="cl">${ci}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        </div></body></html>`;
    },
    rezi: (resume) => {
        const { p, exp, edu, skills, contact } = buildBlocks(resume);
        const rawSkills = resume.skills || [];
        const skillsFormatted = (() => {
            if (!rawSkills.length) return [];
            const first = rawSkills[0];
            if (typeof first === 'string')
                return [{ category: 'Skills', items: rawSkills.filter(s => s && typeof s === 'string') }];
            if (first && typeof first === 'object' && ('technical' in first || 'soft' in first || 'other' in first)) {
                const cats = [];
                if (first.technical && first.technical.length) cats.push({ category: 'Technical Skills', items: first.technical });
                if (first.soft && first.soft.length)           cats.push({ category: 'Soft Skills',      items: first.soft });
                if (first.other && first.other.length)         cats.push({ category: 'Other Skills',     items: first.other });
                return cats;
            }
            return rawSkills.filter(s => s && typeof s === 'object' && s.category);
        })();

        const certs = resume.certifications || [];
        const certHtml = certs.length
            ? `<div class="certs-section">` + certs.map(c => `<div class="cert-entry">
                <div class="cert-name">${c.name || ''}${c.issuer ? ' &ndash; <em>' + c.issuer + '</em>' : ''}${c.date ? ' <span class="cert-date">(${c.date})</span>' : ''}</div>
                ${c.url ? '<div class="cert-link"><a href="' + c.url + '" style="color:inherit;text-decoration:underline;font-size:10px">' + c.url + '</a></div>' : ''}
                ${c.description ? '<div class="cert-desc">' + c.description + '</div>' : ''}
            </div>`).join('') + `</div>`
            : '';

        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_STYLE}
        @page{margin:18mm}
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111111;background:#ffffff;max-width:850px;margin:auto;padding:30px;font-size:11px;line-height:1.5}
        h1{font-size:26px;font-weight:700;text-align:center;margin:0 0 6px 0;color:#111111}
        .contact-line{font-size:10.5px;color:#444444;text-align:center;margin-bottom:20px}
        h2{font-size:12px;font-weight:700;text-transform:uppercase;color:#111111;border-bottom:1px solid #111111;padding-bottom:4px;margin:16px 0 10px 0;letter-spacing:1px}
        .entry{margin-bottom:12px}
        .entry-header{display:flex;justify-content:space-between;align-items:flex-start}
        .role{font-weight:700;font-size:11px;color:#111111}
        .company{font-size:10.5px;color:#444444;margin-top:1px}
        .date{font-size:10px;color:#666666;text-align:right}
        .desc{margin-top:4px;font-size:11px;color:#111111}
        .desc ul{margin:4px 0 0 16px;padding:0;list-style-type:disc}
        .desc li{margin-bottom:3px}
        .desc p{margin:3px 0}
        .skills-section{margin-top:6px}
        .skill-entry{margin-bottom:5px;font-size:11px;color:#111111}
        .skill-entry strong{font-weight:700}
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
        .cert-name{font-weight:700;color:#111111}.cert-date{color:#666666;font-size:10px;font-weight:400}
        .cert-desc{font-size:10.5px;color:#444444;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>${printBar(p.fullName || 'Resume')}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Professional Summary</h2><div class="desc">${p.summary}</div>` : ''}
        ${exp.length ? `<h2>Experience</h2>${exp.map((e, idx) => `
            <div class="entry">
                <div class="entry-header">
                    <div>
                        <div class="role">${e.position || ''}</div>
                        <div class="company">${e.company || ''}${e.location ? ' • ' + e.location : ''}</div>
                    </div>
                    <div class="date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</div>
                </div>
                <div class="desc">${e.description || ''}</div>
            </div>`).join('')}` : ''}
        ${edu.length ? `<h2>Education</h2>${edu.map(e => `
            <div class="entry">
                <div class="entry-header">
                    <div>
                        <div class="role">${e.degree || ''}${e.field ? ' in ' + e.field : ''}</div>
                        <div class="company">${e.institution || ''}${e.grade ? ' • ' + e.grade : ''}</div>
                    </div>
                    <div class="date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</div>
                </div>
            </div>`).join('')}` : ''}
        ${skillsFormatted.length ? `<h2>Skills</h2><div class="skills-section">${skillsFormatted.map(s => `
            <div class="skill-entry">
                <strong>${s.category}:</strong> ${(s.items || []).join(', ')}
            </div>`).join('')}</div>` : ''}
        ${certs.length ? `<h2>Certifications &amp; Awards</h2>${certHtml}` : ''}
        </body></html>`;
    },
};

function generateTemplateHTML(resume, templateId = 'classic') {
    const gen = generators[templateId] || generators.classic;
    return gen(resume);
}

module.exports = { generateTemplateHTML };
