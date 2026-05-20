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
    { id: 'lancaster', name: 'Lancaster', desc: 'Centered serif, teal accents', primary: '#4a9c8c', bg: '#fff', accent: '#4a9c8c', layout: 'single' },
    { id: 'linkedinstyle', name: 'LinkedIn', desc: 'Two-col skill tags + experience', primary: '#0a66c2', bg: '#fff', accent: '#0a66c2', layout: 'two-col' },
    { id: 'harris', name: 'Harris', desc: 'Bold dates, clean professional', primary: '#1a1a2e', bg: '#fff', accent: '#333', layout: 'single' },
    { id: 'sherlock', name: 'Sherlock', desc: 'Dark sidebar with photo slot', primary: '#2d2d2d', bg: '#fff', accent: '#fff', layout: 'sidebar-photo' },
    { id: 'odonnell', name: "O'Donnell", desc: 'Creative headline + two-col skills', primary: '#222', bg: '#fff', accent: '#1a1a1a', layout: 'two-col' },
    { id: 'rhoda', name: 'Rhoda Designer', desc: 'Sidebar designer resume', primary: '#1a1a1a', bg: '#fff', accent: '#111', layout: 'sidebar-left' }
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
        { category: 'Technical Skills', items: ['JavaScript', 'TypeScript', 'Python', 'Java'] },
        { category: 'Soft Skills', items: ['Leadership', 'Communication', 'Teamwork'] },
    ],
    certifications: [
        { name: 'AWS Certified Developer', issuer: 'Amazon', date: '2023-06', description: 'Learned cloud architecture and serverless deployment patterns.' },
    ],
}

// ─── HTML Generator ───────────────────────────────────────────────────────────
// preview=true → skip print bar so iframes render from top (used for thumbnails)
// accentColor → user-selected accent color to override template default
export function generateTemplateHTML(resume, templateId = 'classic', { preview = false, accentColor } = {}) {
    const tmpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0]
    // Use user accent color if provided, otherwise fall back to template default
    const PRIMARY   = accentColor || tmpl.primary || '#1a1a1a'
    const p = resume?.personalInfo || {}
    const exp = resume?.experience || []
    const edu = resume?.education || []


    const rawSkills = resume?.skills || []
    const skills = (() => {
        if (!rawSkills.length) return []
        const first = rawSkills[0]
        if (typeof first === 'string')
            return [{ category: 'Skills', items: rawSkills.filter(s => s && typeof s === 'string') }]
        if (first && typeof first === 'object' && ('technical' in first || 'soft' in first || 'other' in first)) {
            const cats = []
            if (first.technical && first.technical.length) cats.push({ category: 'Technical Skills', items: first.technical })
            if (first.soft && first.soft.length)           cats.push({ category: 'Soft Skills',      items: first.soft })
            if (first.other && first.other.length)         cats.push({ category: 'Other Skills',     items: first.other })
            return cats
        }
        return rawSkills.filter(s => s && typeof s === 'object' && s.category)
    })()
    const allSkillTags = skills.flatMap(s => s.items || [])

    // ── Smart description renderer:
    //   - If value contains HTML tags (from RichTextEditor) → pass through as-is
    //   - Otherwise treat as plain text (escape + \n→<br>)
    const toHtml = (text) => (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    const formatDesc = (text) => {
        if (!text) return ''
        if (/<[a-z][\s\S]*?>/i.test(text)) return text  // already HTML
        return toHtml(text)
    }

    // ── Link helper
    const linkify = (url) => { if (!url) return ''; const h = url.startsWith('http') ? url : 'https://' + url; return `<a href="${h}" style="color:inherit;text-decoration:underline">${url}</a>` }
    const isLink  = (x) => /^https?:|linkedin\.com|github\.com|portfolio/.test(x)
    // Shared helpers
    const contact = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => isLink(x) ? linkify(x) : x).join('  •  ')
    // Add data-rte so parent page can listen to field edits from iframe
    const expHtml = exp.map((e, i) => `
        <div class="entry">
            <div class="entry-header"><strong>${e.position || ''}</strong><span class="date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div>
            <div class="sub">${e.company || ''}${e.location ? ', ' + e.location : ''}</div>
            <div class="desc" data-rte="exp-${i}-description">${formatDesc(e.description)}</div>
        </div>`).join('')
    // Helper: summary block with data-rte attribute
    const summaryBlock = (cls = '') => p.summary
        ? `<p class="${cls}" data-rte="summary">${formatDesc(p.summary)}</p>`
        : ''
    const eduHtml = edu.map(e => `
        <div class="entry">
            <div class="entry-header"><strong>${e.degree || ''}${e.field ? ' – ' + e.field : ''}</strong><span class="date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</span></div>
            <div class="sub">${e.institution || ''}${e.grade ? ' · ' + e.grade : ''}</div>
        </div>`).join('')
    const skillsHtml = skills.map(s => `<div class="skill-group"><strong>${s.category}:</strong> ${(s.items || []).join(', ')}</div>`).join('')
    const skillTagsHtml = allSkillTags.map(sk => `<span class="tag">${sk}</span>`).join('')
    const certs = resume?.certifications || []
    const certHtml = certs.length
        ? `<div class="certs-section">` + certs.map(c => `<div class="cert-entry">
            <div class="cert-name">${c.name || ''}${c.issuer ? ' &ndash; <em>' + c.issuer + '</em>' : ''}${c.date ? ' <span class="cert-date">(${c.date})</span>' : ''}</div>
            ${c.url ? '<div class="cert-link"><a href="' + c.url + '" style="color:inherit;text-decoration:underline;font-size:10px">' + c.url + '</a></div>' : ''}
            ${c.description ? '<div class="cert-desc">' + c.description + '</div>' : ''}
        </div>`).join('') + `</div>`
        : ''

    const PRINT_BAR = preview ? '<div>' : `
    <div class="print-bar">
        <span>\uD83D\uDCC4 ${p.fullName || 'Resume'} \u2014 Click <strong>Save as PDF</strong></span>
        <div><button onclick="window.print()" class="pbtn print-btn">\uD83D\uDDA8\uFE0F Save as PDF</button>
             <button onclick="window.close()" class="pbtn close-btn">\u2715 Close</button></div>
    </div>
    <div style="margin-top:52px;">`

    const PRINT_STYLE = preview ? '' : `
    @page{margin:12mm size:A4}@media print{html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    .print-bar{position:fixed;top:0;left:0;right:0;background:#2563eb;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif;font-size:13px;z-index:999}
    .pbtn{padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-weight:600;font-size:13px;margin-left:6px}
    .print-btn{background:#fff;color:#2563eb}.close-btn{background:rgba(255,255,255,.2);color:#fff}
    @media print{.print-bar{display:none!important}body{padding:0;margin:0}.entry{page-break-inside:avoid}}`

    // ── Selection-based formatting injected into every template iframe ──────
    // NOTE: must be a single-line string — no literal \r\n allowed inside '' strings
    const _SE = '</' + 'script>'
    const EDIT_JS = preview ? '' : `<scr` + `ipt>(function(){
var _saved=null;
function _save(){var s=window.getSelection();if(s&&s.rangeCount>0){try{_saved=s.getRangeAt(0).cloneRange();}catch(e){}}}
function _restore(){if(!_saved)return;try{var s=window.getSelection();s.removeAllRanges();s.addRange(_saved);}catch(e){}}
try{document.execCommand('styleWithCSS',false,true);}catch(e){}
document.querySelectorAll('[data-rte]').forEach(function(el){
  el.contentEditable='true';el.style.outline='none';el.style.cursor='text';el.style.minHeight='1em';
  el.addEventListener('input',function(){postUp(el);});
  el.addEventListener('mouseup',_save);el.addEventListener('keyup',_save);
});
function postUp(el){window.parent.postMessage({type:'RTE_UPDATE',field:el.dataset.rte,html:el.innerHTML},'*');}
document.addEventListener('selectionchange',function(){
  var s=window.getSelection();
  if(!s||s.isCollapsed||!s.rangeCount){window.parent.postMessage({type:'RTE_SEL_CLEAR'},'*');return;}
  _save();
  var r=s.getRangeAt(0).getBoundingClientRect();
  if(!r||!r.width){window.parent.postMessage({type:'RTE_SEL_CLEAR'},'*');return;}
  window.parent.postMessage({type:'RTE_SELECTION',rect:{top:r.top,left:r.left,width:r.width,height:r.height,bottom:r.bottom},formats:{bold:document.queryCommandState('bold'),italic:document.queryCommandState('italic'),underline:document.queryCommandState('underline')}},'*');
});
window.addEventListener('message',function(evt){
  var d=evt.data;if(!d||!d.type)return;
  _restore();
  if(d.type==='RTE_EXEC'){document.execCommand(d.cmd,false,d.val!==undefined?d.val:null);_notify();}
  else if(d.type==='RTE_FONT_SIZE'){_applySize(d.val);}
  else if(d.type==='RTE_REMOVE_FMT'){document.execCommand('removeFormat',false,null);_notify();}
  else if(d.type==='RTE_COLOR'){document.execCommand('foreColor',false,d.val);_notify();}
  else if(d.type==='RTE_BG_COLOR'){document.execCommand('hiliteColor',false,d.val);_notify();}
  else if(d.type==='RTE_FONT'){document.execCommand('fontName',false,d.val||'Arial');_notify();}
});
function _applySize(px){
  var s=window.getSelection();if(!s||!s.rangeCount)return;
  var rng=s.getRangeAt(0);var sp=document.createElement('span');sp.style.fontSize=px+'px';
  try{rng.surroundContents(sp);}catch(_){var fc=rng.extractContents();sp.appendChild(fc);rng.insertNode(sp);}
  var nr=document.createRange();nr.selectNodeContents(sp);s.removeAllRanges();s.addRange(nr);_notify(sp);
}
function _notify(node){
  var s=window.getSelection();var el=node||null;
  if(!el&&s&&s.rangeCount){try{var a=s.getRangeAt(0).commonAncestorContainer;el=a.nodeType===3?a.parentElement:a;}catch(e){}}
  if(!el)return;
  var f=el.closest?el.closest('[data-rte]'):null;
  if(f)window.parent.postMessage({type:'RTE_UPDATE',field:f.dataset.rte,html:f.innerHTML},'*');
}
})()` + _SE


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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${contact}</div>
        ${p.summary ? `<h2>Profile</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
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
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
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
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="contact-line">${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        ${p.summary ? `<h2>Summary</h2><p>${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Experience</h2>${expHtml}` : ''}
        ${edu.length ? `<h2>Education</h2>${eduHtml}` : ''}
        ${skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
        </div></body></html>`,

        lancaster: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@300;400;600&display=swap');
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;background:#fff;color:#222;font-size:11.5px;line-height:1.55;padding:36px 44px;max-width:820px;margin:auto}
            .header{text-align:center;margin-bottom:6px}
            h1{font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#1a1a1a;margin-bottom:4px}
            .role-title{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#4a9c8c;font-weight:600;margin-bottom:8px}
            .divider-top{border:none;border-top:1.5px solid #ccc;margin:8px 0}
            .contact-line{text-align:center;font-size:10.5px;color:#555;margin-bottom:4px;letter-spacing:0.3px}
            .divider-bot{border:none;border-top:1px solid #ddd;margin:8px 0 18px}
            h2{font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#333;margin:16px 0 4px;position:relative;padding-bottom:4px}
            h2::after{content:'';display:block;width:100%;border-bottom:1.5px solid #4a9c8c;margin-top:3px}
            .entry{margin:10px 0 6px}
            .entry-header{display:flex;justify-content:space-between;align-items:baseline}
            .entry-header strong{font-size:12px;color:#111;font-weight:600}
            .date{font-size:10.5px;color:#777;white-space:nowrap}
            .sub{font-size:10.5px;color:#555;font-style:italic;margin:2px 0 4px}
            .entry p{font-size:11px;color:#333;margin:2px 0;padding-left:2px}
            .skills-grid{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:6px}
            .skill-item{font-size:11px;color:#333;padding-left:10px;position:relative}
            .skill-item::before{content:'▸';position:absolute;left:0;color:#4a9c8c;font-size:9px;top:1px}
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="header">
            <h1>${p.fullName || 'Your Name'}</h1>
            ${p.location || p.linkedin ? `<div class="role-title">${[p.location, p.linkedin].filter(Boolean).join('  •  ')}</div>` : ''}
        </div>
        <hr class="divider-top">
        <div class="contact-line">${[p.email, p.phone, p.github, p.portfolio].filter(Boolean).join('  |  ')}</div>
        <hr class="divider-bot">
        ${p.summary ? `<h2>Skills</h2><div class="skills-grid">${p.summary.split('.').filter(s => s.trim()).map(s => `<span class="skill-item">${s.trim()}</span>`).join('')}</div>` : ''}
        ${exp.length ? `<h2>Work Experience</h2>${exp.map(e => `<div class="entry"><div class="entry-header"><strong>${e.position || ''}</strong><span class="date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div><div class="sub">${e.company || ''}${e.location ? ', ' + e.location : ''}</div><p style="white-space:pre-line">${toHtml(e.description)}</p></div>`).join('')}` : ''}
        ${edu.length ? `<h2>Education</h2>${edu.map(e => `<div class="entry"><div class="entry-header"><strong>${e.degree || ''}${e.field ? ' – ' + e.field : ''}</strong><span class="date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</span></div><div class="sub">${e.institution || ''}${e.grade ? ' · ' + e.grade : ''}</div></div>`).join('')}` : ''}
        ${skills.length ? `<h2>Technical Skills</h2><div class="skills-grid">${skills.flatMap(s => s.items || []).map(sk => `<span class="skill-item">${sk}</span>`).join('')}</div>` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
        </div></body></html>`,

        linkedinstyle: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:11.5px;line-height:1.5;padding:32px 36px;max-width:820px;margin:auto}
            h1{font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:2px}
            .headline{font-size:12px;color:#0a66c2;font-weight:500;margin-bottom:6px}
            .contact-bar{font-size:10.5px;color:#555;margin-bottom:18px;display:flex;flex-wrap:wrap;gap:10px}
            .twocol{display:flex;gap:24px}
            .col-left{width:220px;flex-shrink:0}
            .col-right{flex:1}
            h2{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#0a66c2;font-weight:700;margin:14px 0 8px;padding-bottom:4px;border-bottom:2px solid #e1ecf7}
            .tag-wrap{display:flex;flex-wrap:wrap;gap:5px}
            .tag{background:#e8f3ff;color:#0a66c2;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:600;border:1px solid #c0d9f0}
            .entry{margin-bottom:12px}
            .entry-title{font-weight:700;font-size:12px;color:#111}
            .entry-sub{font-size:10.5px;color:#555;margin:2px 0}
            .entry-date{font-size:10px;color:#888;margin-bottom:3px}
            .entry-desc{font-size:11px;color:#333;margin-top:3px;line-height:1.45}
            .skill-cat{font-size:10.5px;font-weight:700;color:#333;margin:8px 0 4px;text-transform:uppercase;letter-spacing:0.5px}
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <h1>${p.fullName || 'Your Name'}</h1>
        ${p.location ? `<div class="headline">${p.location}${p.linkedin ? ' · ' + p.linkedin : ''}</div>` : ''}
        <div class="contact-bar">${[p.email, p.phone, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
        <div class="twocol">
            <div class="col-left">
                <h2>Tag Skills</h2>
                <div class="tag-wrap">${skills.flatMap(s => s.items || []).map(sk => `<span class="tag">${sk}</span>`).join('')}</div>
                ${skills.length > 0 ? skills.map(s => `<div class="skill-cat">${s.category}</div><div class="tag-wrap">${(s.items || []).map(sk => `<span class="tag">${sk}</span>`).join('')}</div>`).join('') : ''}
            </div>
            <div class="col-right">
                ${p.summary ? `<h2>About</h2><p style="font-size:11px;color:#333;line-height:1.55">${p.summary}</p>` : ''}
                ${exp.length ? `<h2>Work Experience</h2>${exp.map(e => `<div class="entry"><div class="entry-title">${e.position || ''}</div><div class="entry-sub">${e.company || ''}${e.location ? ', ' + e.location : ''}</div><div class="entry-date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</div><div class="entry-desc" style="white-space:pre-line">${toHtml(e.description)}</div></div>`).join('')}` : ''}
                ${edu.length ? `<h2>Education</h2>${edu.map(e => `<div class="entry"><div class="entry-title">${e.degree || ''}${e.field ? ' – ' + e.field : ''}</div><div class="entry-sub">${e.institution || ''}</div><div class="entry-date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</div></div>`).join('')}` : ''}
            </div>
        </div>
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
        </body></html>`,

        harris: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&display=swap');
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Raleway','Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:11.5px;line-height:1.55;padding:0;max-width:820px;margin:auto}
            .top-header{padding:28px 40px 20px;border-bottom:3px solid #e5e7eb}
            h1{font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;margin-bottom:2px}
            .header-location{font-size:11px;color:#555;margin-bottom:6px}
            .header-contact{display:flex;flex-wrap:wrap;gap:14px;font-size:10.5px;color:#0a66c2}
            .body{padding:20px 40px}
            .summary-text{font-size:11.5px;color:#374151;line-height:1.6;margin-bottom:4px}
            h2{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#111;margin:20px 0 8px;padding-bottom:5px;border-bottom:2px solid #111}
            .exp-entry{margin-bottom:14px}
            .exp-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1px}
            .exp-company{font-weight:700;font-size:12px;color:#111}
            .exp-date{font-size:10.5px;color:#6b7280;white-space:nowrap;font-style:italic}
            .exp-title{font-size:11px;color:#374151;font-weight:600;margin-bottom:3px}
            .exp-loc{font-size:10.5px;color:#6b7280;margin-bottom:4px}
            .exp-desc{font-size:11px;color:#374151;line-height:1.5}
            .edu-entry{margin-bottom:10px}
            .edu-row{display:flex;justify-content:space-between;align-items:baseline}
            .edu-degree{font-weight:700;font-size:11.5px}
            .edu-date{font-size:10.5px;color:#6b7280;font-style:italic}
            .edu-inst{font-size:10.5px;color:#555;margin-top:2px}
            .skills-section{display:flex;flex-wrap:wrap;gap:14px 28px}
            .skill-line{font-size:11px;color:#374151}
            .skill-line strong{color:#111;font-weight:700}
            .cert-item{font-size:11px;color:#374151;padding-left:12px;position:relative;margin-bottom:3px}
            .cert-item::before{content:'•';position:absolute;left:0;color:#0a66c2}
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="top-header">
            <h1>${p.fullName || 'Your Name'}</h1>
            ${p.location ? `<div class="header-location">${p.location}</div>` : ''}
            <div class="header-contact">${[p.email, p.phone, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join(' &nbsp;·&nbsp; ')}</div>
        </div>
        <div class="body">
        ${p.summary ? `<p class="summary-text" style="margin-top:16px">${p.summary}</p>` : ''}
        ${exp.length ? `<h2>Work Experience</h2>${exp.map(e => `<div class="exp-entry"><div class="exp-row"><span class="exp-company">${e.company || ''}</span><span class="exp-date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div><div class="exp-title">${e.position || ''}</div>${e.location ? `<div class="exp-loc">${e.location}</div>` : ''}<div class="exp-desc" style="white-space:pre-line">${toHtml(e.description)}</div></div>`).join('')}` : ''}
        ${edu.length ? `<h2>Education</h2>${edu.map(e => `<div class="edu-entry"><div class="edu-row"><span class="edu-degree">${e.degree || ''}${e.field ? ' of ' + e.field : ''}</span><span class="edu-date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</span></div><div class="edu-inst">${e.institution || ''}${e.grade ? ' &nbsp;·&nbsp; ' + e.grade : ''}</div></div>`).join('')}` : ''}
        ${skills.length ? `<h2>Skills</h2><div class="skills-section">${skills.map(s => `<div class="skill-line"><strong>${s.category}:</strong> ${(s.items || []).join(', ')}</div>`).join('')}</div>` : ''}
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
        </div></body></html>`,

        sherlock: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Segoe UI',Arial,sans-serif;display:flex;min-height:100vh;background:#fff;color:#1a1a1a;font-size:11px}
            .sidebar{width:220px;background:#2d2d2d;color:#fff;padding:24px 16px;flex-shrink:0;display:flex;flex-direction:column;gap:0}
            .photo-box{width:90px;height:90px;border-radius:50%;background:#444;border:3px solid #555;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#888}
            .sidebar h1{font-size:16px;font-weight:700;color:#fff;text-align:center;margin-bottom:2px;line-height:1.2}
            .sidebar .role{font-size:9.5px;color:#aaa;text-align:center;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px}
            .sidebar h3{font-size:8.5px;text-transform:uppercase;letter-spacing:2px;color:#888;margin:14px 0 6px;padding-bottom:3px;border-bottom:1px solid #444}
            .sidebar p,.sidebar .ci{font-size:10px;color:#ccc;margin:3px 0;line-height:1.4}
            .sidebar .tag{display:inline-block;background:#3d3d3d;color:#ddd;border-radius:3px;padding:2px 6px;font-size:9.5px;margin:2px 2px 2px 0}
            .main{flex:1;display:flex;flex-direction:column}
            .main-header{background:#3d3d3d;color:#fff;padding:18px 24px}
            .main-header h2-top{font-size:22px;font-weight:800;display:block;letter-spacing:-0.3px}
            .main-header .subtitle{font-size:10px;color:#aaa;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
            .main-body{padding:18px 24px;flex:1}
            .section h2{font-size:9.5px;text-transform:uppercase;letter-spacing:2px;color:#2d2d2d;border-bottom:2px solid #2d2d2d;margin:14px 0 8px;padding-bottom:3px;font-weight:800}
            .entry{margin-bottom:9px}
            .entry-header{display:flex;justify-content:space-between;align-items:baseline}
            .entry-title{font-weight:700;font-size:11px;color:#111}
            .entry-sub{font-size:10px;color:#666;margin:2px 0}
            .entry-date{font-size:9.5px;color:#999;white-space:nowrap}
            .entry-desc{font-size:10.5px;color:#333;margin-top:3px;line-height:1.45}
            .twocols{display:flex;gap:20px}
            .half{flex:1}
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="sidebar">
            <div class="photo-box">👤</div>
            <h1 style="font-size:15px;font-weight:700;color:#fff;text-align:center;margin-bottom:2px">${p.fullName || 'Your Name'}</h1>
            <div class="role">${p.location || 'Professional'}</div>
            <h3>Contact</h3>
            ${[p.email, p.phone, p.linkedin, p.github].filter(Boolean).map(x => `<p class="ci">${x}</p>`).join('')}
            ${p.summary ? `<h3>About</h3><p style="font-size:10px;color:#bbb;line-height:1.5">${p.summary.substring(0, 200)}${p.summary.length > 200 ? '...' : ''}</p>` : ''}
            ${skills.length ? `<h3>Skills</h3>${skills.flatMap(s => s.items || []).map(sk => `<span class="tag">${sk}</span>`).join('')}` : ''}
            ${edu.length ? `<h3>Education</h3>${edu.map(e => `<p style="font-size:10px;color:#ccc;margin:4px 0"><strong style="color:#fff;display:block">${e.degree || ''}${e.field ? ' ' + e.field : ''}</strong>${e.institution || ''}<span style="color:#888;display:block;font-size:9px">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</span></p>`).join('')}` : ''}
        </div>
        <div class="main">
            <div class="main-header" style="margin-top:52px">
                <span class="main-header h2-top" style="font-size:22px;font-weight:800;display:block;letter-spacing:-0.3px;color:#fff">${p.fullName || 'Your Name'}</span>
                <span class="subtitle" style="font-size:10px;color:#aaa;letter-spacing:2px;text-transform:uppercase;margin-top:2px;display:block">${p.location || ''}</span>
            </div>
            <div class="main-body">
                ${exp.length ? `<div class="section"><h2>Experience</h2>${exp.map(e => `<div class="entry"><div class="entry-header"><span class="entry-title">${e.position || ''}</span><span class="entry-date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div><div class="entry-sub">${e.company || ''}${e.location ? ', ' + e.location : ''}</div><div class="entry-desc" style="white-space:pre-line">${toHtml(e.description)}</div></div>`).join('')}</div>` : ''}
                ${skills.length ? `<div class="section"><h2>Tools & Technologies</h2><div style="display:flex;flex-wrap:wrap;gap:5px">${skills.flatMap(s => s.items || []).map(sk => `<span style="background:#f3f4f6;border-radius:3px;padding:2px 8px;font-size:10px;color:#333">${sk}</span>`).join('')}</div></div>` : ''}
            </div>
        </div>
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
        </body></html>`,

        odonnell: () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            ${PRINT_STYLE}
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Open+Sans:wght@400;600;700&display=swap');
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Open Sans','Segoe UI',Arial,sans-serif;background:#fff;color:#222;font-size:11.5px;line-height:1.55;padding:32px 38px;max-width:820px;margin:auto}
            .top-section{margin-bottom:18px;border-bottom:2px solid #222;padding-bottom:14px}
            h1{font-family:'Merriweather',Georgia,serif;font-size:26px;font-weight:700;color:#111;margin-bottom:3px;letter-spacing:-0.3px}
            .contact-bar{font-size:10.5px;color:#555;display:flex;flex-wrap:wrap;gap:8px 16px;margin-bottom:10px}
            .intro-headline{font-size:11.5px;color:#333;line-height:1.65;font-style:italic;border-left:3px solid #222;padding-left:12px;margin-top:8px}
            .top-skills{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
            .top-skills .tag{background:#f0f0f0;color:#222;border:1px solid #ccc;border-radius:4px;padding:3px 10px;font-size:10px;font-weight:600}
            .twocol{display:flex;gap:28px;margin-top:16px}
            .col-left{width:210px;flex-shrink:0}
            .col-right{flex:1}
            h2{font-family:'Merriweather',Georgia,serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#111;margin:16px 0 8px;padding-bottom:4px;border-bottom:1.5px solid #222}
            .col-left h2{font-size:11px}
            .skill-block{margin-bottom:12px}
            .skill-name{font-weight:700;font-size:11px;color:#111;margin-bottom:2px}
            .skill-bar{height:4px;background:#e0e0e0;border-radius:2px;margin-bottom:6px}
            .skill-bar-fill{height:4px;background:#222;border-radius:2px}
            .skill-list{font-size:10.5px;color:#444;line-height:1.6}
            .exp-entry{margin-bottom:14px}
            .exp-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}
            .exp-title{font-weight:700;font-size:11.5px;color:#111}
            .exp-date{font-size:10px;color:#777;white-space:nowrap;font-style:italic}
            .exp-company{font-size:10.5px;color:#555;margin-bottom:4px}
            .exp-desc{font-size:11px;color:#333;line-height:1.5}
            .edu-entry{margin-bottom:10px}
            .edu-row{display:flex;justify-content:space-between;align-items:baseline}
            .edu-degree{font-weight:700;font-size:11px;color:#111}
            .edu-date{font-size:10px;color:#777;font-style:italic}
            .edu-inst{font-size:10.5px;color:#555;margin-top:2px}
        .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
        ${PRINT_BAR}
        <div class="top-section">
            <h1>${p.fullName || 'Your Name'}</h1>
            <div class="contact-bar">${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(x => `<span>${x}</span>`).join('')}</div>
            ${p.summary ? `<div class="intro-headline">${p.summary}</div>` : ''}
            ${skills.length ? `<div class="top-skills">${skills.flatMap(s => s.items || []).slice(0, 8).map(sk => `<span class="tag">${sk}</span>`).join('')}</div>` : ''}
        </div>
        <div class="twocol">
            <div class="col-left">
                ${skills.length ? `<h2>Skills</h2>${skills.map(s => `<div class="skill-block"><div class="skill-name">${s.category}</div><div class="skill-list">${(s.items || []).join(' · ')}</div></div>`).join('')}` : ''}
            </div>
            <div class="col-right">
                ${exp.length ? `<h2>Work Experience</h2>${exp.map(e => `<div class="exp-entry"><div class="exp-row"><span class="exp-title">${e.position || ''}</span><span class="exp-date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div><div class="exp-company">${e.company || ''}${e.location ? ', ' + e.location : ''}</div><div class="exp-desc" style="white-space:pre-line">${toHtml(e.description)}</div></div>`).join('')}` : ''}
                ${edu.length ? `<h2>Education</h2>${edu.map(e => `<div class="edu-entry"><div class="edu-row"><span class="edu-degree">${e.degree || ''}${e.field ? ' of ' + e.field : ''}</span><span class="edu-date">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</span></div><div class="edu-inst">${e.institution || ''}${e.grade ? ' · ' + e.grade : ''}</div></div>`).join('')}` : ''}
            </div>
        </div>
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
        </body></html>`,
        rhoda: () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11.5px;color:#222;display:flex;min-height:100vh;background:#fff;}
    .sidebar{width:210px;flex-shrink:0;background:#1a1a1a;color:#fff;padding:28px 20px;display:flex;flex-direction:column;gap:20px;}
    .sidebar h1{font-size:19px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;color:#fff;word-break:break-word;}
    .sidebar .title-label{font-size:9.5px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin-top:2px;}
    .sidebar .contact-item{font-size:10px;color:#ccc;word-break:break-all;line-height:1.5;}
    .sidebar .sec-title{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#888;border-top:1px solid #333;padding-top:12px;margin-bottom:8px;}
    .tag{display:inline-block;background:#333;color:#ddd;border-radius:4px;padding:2px 8px;font-size:9.5px;margin:2px 2px 2px 0;}
    .main{flex:1;padding:28px 28px 28px 24px;display:flex;flex-direction:column;gap:18px;overflow:hidden;}
    .main-sec-title{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#6d28d9;border-bottom:2px solid #6d28d9;padding-bottom:4px;margin-bottom:10px;font-weight:700;}
    .rh-entry{margin-bottom:12px;}
    .rh-row{display:flex;justify-content:space-between;align-items:baseline;}
    .rh-pos{font-weight:700;font-size:12px;color:#1a1a1a;}
    .rh-date{font-size:9.5px;color:#888;white-space:nowrap;}
    .rh-co{font-size:10.5px;color:#555;margin-bottom:3px;}
    .rh-desc{font-size:10.5px;color:#444;line-height:1.55;}
    .sum-box{background:#f5f3ff;border-left:3px solid #6d28d9;padding:10px 12px;border-radius:0 6px 6px 0;font-size:10.5px;color:#333;line-height:1.6;}
    ${PRINT_STYLE}
    @media print{${PRINT_STYLE}.sidebar{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    .certs-section{margin-top:4px}.cert-entry{margin-bottom:6px;font-size:11px;line-height:1.45}
.cert-name{font-weight:600;color:inherit}.cert-date{color:#888;font-size:10px;font-weight:400}
.cert-desc{font-size:10.5px;color:#555;font-style:italic;margin-top:1px}.cert-link{font-size:9.5px;margin-top:1px}
        </style></head><body>
    ${PRINT_BAR}
    <div class="sidebar">
        <div>
            <h1>${p.fullName || 'Your Name'}</h1>
            <div class="title-label">${p.portfolio || p.linkedin || 'Designer / Developer'}</div>
        </div>
        <div>
            <div class="sec-title">Contact</div>
            ${[p.email, p.phone, p.location].filter(Boolean).map(x => `<div class="contact-item">${x}</div>`).join('')}
            ${p.linkedin ? `<div class="contact-item">${p.linkedin}</div>` : ''}
            ${p.github ? `<div class="contact-item">${p.github}</div>` : ''}
        </div>
        ${skills.length ? `<div><div class="sec-title">Skills</div>${allSkillTags.map(sk => `<span class="tag">${sk}</span>`).join('')}</div>` : ''}
        ${edu.length ? `<div><div class="sec-title">Education</div>${edu.map(e => `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:10.5px;color:#fff">${e.degree || ''}${e.field ? ' – ' + e.field : ''}</div><div style="font-size:9.5px;color:#bbb">${e.institution || ''}</div><div style="font-size:9px;color:#888">${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''}</div></div>`).join('')}</div>` : ''}
    </div>
    <div class="main">
        ${p.summary ? `<div><div class="main-sec-title">Profile</div><div class="sum-box">${formatDesc(p.summary)}</div></div>` : ''}
        ${exp.length ? `<div><div class="main-sec-title">Experience</div>${exp.map(e => `<div class="rh-entry"><div class="rh-row"><span class="rh-pos">${e.position || ''}</span><span class="rh-date">${e.startDate || ''}${e.startDate ? ' – ' : ''}${e.current ? 'Present' : (e.endDate || '')}</span></div><div class="rh-co">${e.company || ''}${e.location ? ', ' + e.location : ''}</div><div class="rh-desc">${formatDesc(e.description)}</div></div>`).join('')}</div>` : ''}
    </div>
        ${certs.length ? `<h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;border-bottom:1px solid currentColor;padding-bottom:2px">Certifications &amp; Awards</h2>${certHtml}` : ''}
    </body></html>`,

        // ── fallback ──────────────────────────────────────────────────────────
    }

    const gen = generators[templateId] || generators.classic
    // Apply user accent color: swap template's default primary with chosen color
    let html = gen()
    if (accentColor && tmpl.primary && accentColor.toLowerCase() !== tmpl.primary.toLowerCase()) {
        html = html.split(tmpl.primary).join(accentColor)
    }
    // Inject selection-toolbar bridge script into every template before </body>
    return html.replace('</body>', EDIT_JS + '</body>')
}

// ─── Pre-generated Thumbnails (sample data, no print bar) ────────────────────
export const TEMPLATE_PREVIEWS = Object.fromEntries(
    ['classic', 'modern', 'executive', 'standout', 'professional', 'creative', 'eloquent', 'trailblazer', 'maverick', 'artistic', 'dynamic', 'minimal', 'lancaster', 'linkedinstyle', 'harris', 'sherlock', 'odonnell', 'rhoda']
        .map(id => [id, generateTemplateHTML(SAMPLE_RESUME, id, { preview: true })])
)
