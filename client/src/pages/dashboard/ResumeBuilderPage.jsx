import { useState, useCallback, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Save, Sparkles, Plus, Trash2, ChevronDown, ChevronUp,
    Upload, FileText, ArrowLeft, Check, AlignLeft, Briefcase,
    GraduationCap, PanelLeftClose, PanelLeftOpen, Award, X,
    Code, Link as LinkIcon, Star
} from 'lucide-react'
import { resumeAPI, aiAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { generateTemplateHTML } from '../../utils/resumeTemplates'
import RichTextEditor from '../../components/ui/RichTextEditor'

// ── Month / Year Picker ───────────────────────────────────────────────────────
const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
]
const YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i)

function MonthYearPicker({ value, onChange, placeholder = 'Select date' }) {
    // value format: "YYYY-MM"
    const [month, setMonth] = useState(() => value ? value.split('-')[1] : '')
    const [year,  setYear]  = useState(() => value ? value.split('-')[0] : '')

    const commit = (m, y) => {
        if (m && y) onChange(`${y}-${m}`)
        else onChange('')
    }

    const handleMonth = (m) => { setMonth(m); commit(m, year) }
    const handleYear  = (y) => { setYear(y);  commit(month, y) }

    // Sync if parent value changes (e.g. when resume loaded from server)
    useEffect(() => {
        if (value) {
            setMonth(value.split('-')[1] || '')
            setYear(value.split('-')[0] || '')
        }
    }, [value])

    const sel = 'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-2.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all appearance-none cursor-pointer'

    return (
        <div className="flex gap-1.5 flex-1">
            <div className="relative flex-1">
                <select value={month} onChange={e => handleMonth(e.target.value)} className={sel}>
                    <option value="">Month</option>
                    {MONTHS.map((m, idx) => (
                        <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
                    ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative flex-1">
                <select value={year} onChange={e => handleYear(e.target.value)} className={sel}>
                    <option value="">Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    )
}

// ── Collapsible Section ───────────────────────────────────────────────────────
const SECTION = ({ title, icon: Icon, open, toggle, children, count }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden text-sm">
        <button onClick={toggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${open ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    <Icon size={16} />
                </div>
                <h3 className="font-heading font-bold text-gray-900 dark:text-white">{title}</h3>
                {count > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">{count}</span>
                )}
            </div>
            {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>
        <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 pt-0 space-y-4">
                {children}
            </div>
        </div>
    </div>
)

// ── Skill Tag Input ───────────────────────────────────────────────────────────
function SkillTagInput({ skills, onChange }) {
    const [input, setInput] = useState('')

    const addSkill = (val) => {
        const trimmed = val.trim()
        if (!trimmed || skills.includes(trimmed)) return
        onChange([...skills, trimmed])
        setInput('')
    }

    const removeSkill = (idx) => onChange(skills.filter((_, i) => i !== idx))

    const onKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addSkill(input)
        } else if (e.key === 'Backspace' && !input && skills.length > 0) {
            removeSkill(skills.length - 1)
        }
    }

    const COLORS = [
        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    ]

    return (
        <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 min-h-[44px] cursor-text"
            onClick={() => document.getElementById('skill-input')?.focus()}>
            {skills.map((s, idx) => (
                <span key={idx} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${COLORS[idx % COLORS.length]}`}>
                    {s}
                    <button type="button" onClick={() => removeSkill(idx)} className="hover:opacity-70 transition-opacity">
                        <X size={10} />
                    </button>
                </span>
            ))}
            <input
                id="skill-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => addSkill(input)}
                placeholder={skills.length === 0 ? 'Type skill & press Enter…' : '+ Add more'}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none py-0.5"
            />
        </div>
    )
}

// ── Upload Mode ───────────────────────────────────────────────────────────────
function UploadResumeMode({ navigate, qc }) {
    const [file, setFile] = useState(null)
    const [dragOver, setDragOver] = useState(false)

    const uploadMutation = useMutation({
        mutationFn: () => {
            const fd = new FormData()
            fd.append('resume', file)
            fd.append('title', file.name.replace(/\.[^.]+$/, ''))
            return resumeAPI.upload(fd)
        },
        onSuccess: (res) => {
            toast.success('Resume imported successfully!')
            qc.invalidateQueries(['resumes'])
            navigate(`/dashboard/resume/builder/${res.data.resume._id}`)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
    })

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in mt-10">
            <button onClick={() => navigate('/dashboard/resume')} className="btn-secondary text-sm flex items-center gap-2 w-max">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText size={28} className="text-violet-600" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Import Existing Resume</h1>
                    <p className="text-gray-500 text-sm mt-2">Upload your PDF or Word document.</p>
                </div>
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]) }}
                    onClick={() => document.getElementById('resume-upload').click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                        ${dragOver ? 'border-violet-500 bg-violet-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-violet-300 bg-gray-50/50'}`}
                >
                    {file ? (
                        <><Check size={40} className="mx-auto mb-3 text-green-500" /><p className="font-semibold text-green-700">{file.name}</p></>
                    ) : (
                        <><Upload size={36} className="mx-auto mb-4 text-gray-400" /><p className="font-semibold text-gray-700 text-sm">Drag & drop or click</p><p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p></>
                    )}
                    <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </div>
                <button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending}
                    className="w-full btn-primary py-3 mt-6 flex justify-center gap-2">
                    <Sparkles size={18} />
                    {uploadMutation.isPending ? 'Extracting via AI...' : 'Generate Smart Resume'}
                </button>
            </div>
        </div>
    )
}

// ── Main Builder ──────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
    const { id }            = useParams()
    const navigate          = useNavigate()
    const [searchParams]    = useSearchParams()
    const isUploadMode      = searchParams.get('mode') === 'upload'
    const qc                = useQueryClient()

    const [open, setOpen] = useState({
        personal: true, experience: false, education: false,
        skills: false, certifications: false
    })
    const toggle = (key) => setOpen(p => ({ ...p, [key]: !p[key] }))

    const [formCollapsed, setFormCollapsed] = useState(false)

    const [resume, setResume] = useState({
        title: 'Untitled Resume',
        templateId: searchParams.get('template') || 'modern',
        personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' },
        experience: [],
        education: [],
        skills: [],          // flat string array e.g. ['React', 'Node.js']
        certifications: [],  // { name, issuer, date, url }
        languages: [],
    })

    // Sync template from URL on first load
    useEffect(() => {
        const tpl = searchParams.get('template')
        if (tpl && !id) setResume(p => ({ ...p, templateId: tpl }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useQuery({
        queryKey: ['resume', id],
        queryFn: () => resumeAPI.getOne(id),
        enabled: !!id,
        onSuccess: (res) => setResume(res.data.resume),
    })

    const saveMutation = useMutation({
        mutationFn: (data) => id ? resumeAPI.update(id, data) : resumeAPI.create(data),
        onSuccess: (res) => {
            qc.invalidateQueries(['resumes'])
            toast.success('Resume saved!')
            if (!id) navigate(`/dashboard/resume/builder/${res.data.resume._id}`)
        },
        onError: () => toast.error('Failed to save'),
    })

    const aiSummaryMutation = useMutation({
        mutationFn: () => aiAPI.generateSummary({ resumeData: resume }),
        onSuccess: (res) => {
            setResume(p => ({ ...p, personalInfo: { ...p.personalInfo, summary: res.data.summary } }))
            toast.success('AI summary generated!')
        },
    })

    // ── Helpers ───────────────────────────────────────────────────────────────

    const updatePersonal = (field, val) =>
        setResume(p => ({ ...p, personalInfo: { ...p.personalInfo, [field]: val } }))

    // Experience
    const addExp    = () => setResume(p => ({ ...p, experience: [...p.experience, { company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' }] }))
    const upExp     = (i, field, val) => setResume(p => { const e = [...p.experience]; e[i] = { ...e[i], [field]: val }; return { ...p, experience: e } })
    const removeExp = (i) => setResume(p => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }))

    // Education
    const addEdu    = () => setResume(p => ({ ...p, education: [...p.education, { institution: '', degree: '', field: '', startDate: '', endDate: '', grade: '' }] }))
    const upEdu     = (i, field, val) => setResume(p => { const e = [...p.education]; e[i] = { ...e[i], [field]: val }; return { ...p, education: e } })
    const removeEdu = (i) => setResume(p => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }))

    // Skills (flat array)
    const setSkills = (skills) => setResume(p => ({ ...p, skills }))

    // Certifications
    const addCert    = () => setResume(p => ({ ...p, certifications: [...p.certifications, { name: '', issuer: '', date: '', url: '' }] }))
    const upCert     = (i, field, val) => setResume(p => { const c = [...p.certifications]; c[i] = { ...c[i], [field]: val }; return { ...p, certifications: c } })
    const removeCert = (i) => setResume(p => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }))

    // ── RAF Drag Divider ──────────────────────────────────────────────────────
    const containerRef = useRef(null)
    const iframeRef    = useRef(null)
    const leftPctRef   = useRef(42)
    const [leftPct, setLeftPct] = useState(42)
    const rafId        = useRef(null)
    const isDragging   = useRef(false)

    // ── Preview toolbar state (shown when user selects text inside the iframe) ──
    const [prevTb, setPrevTb] = useState(null) // { top, left, formats }
    const [pvColors, setPvColors] = useState(false)
    const [pvFonts,  setPvFonts]  = useState(false)
    const [pvSizes,  setPvSizes]  = useState(false)

    // Shared font/size data (mirrors RichTextEditor constants)
    const PV_FAMILIES = [
        { label: 'Default',         value: '' },
        { label: 'Arial',           value: 'Arial, sans-serif' },
        { label: 'Georgia',         value: 'Georgia, serif' },
        { label: 'Times New Roman', value: '"Times New Roman", serif' },
        { label: 'Verdana',         value: 'Verdana, sans-serif' },
        { label: 'Courier New',     value: '"Courier New", monospace' },
        { label: 'Open Sans',       value: '"Open Sans", sans-serif' },
    ]
    const PV_SIZES   = ['8','9','10','11','12','13','14','16','18','20','22','24','28','32','36']
    const PV_PALETTE = [
        '#000000','#1f2937','#374151','#4b5563','#6b7280','#9ca3af',
        '#ef4444','#f97316','#eab308','#84cc16','#22c55e','#14b8a6',
        '#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e',
        '#ffffff','#fef9c3','#dcfce7','#dbeafe','#ede9fe','#fce7f3',
    ]

    const sendIframe = useCallback((msg) => {
        iframeRef.current?.contentWindow?.postMessage(msg, '*')
    }, [])

    // Listen for messages from the resume preview iframe
    useEffect(() => {
        const handler = (ev) => {
            const d = ev.data
            if (!d?.type?.startsWith('RTE_')) return

            if (d.type === 'RTE_SELECTION') {
                const fr = iframeRef.current?.getBoundingClientRect()
                if (!fr) return
                const TW = 460
                let left = fr.left + d.rect.left + d.rect.width / 2 - TW / 2
                left = Math.max(8, Math.min(left, window.innerWidth - TW - 8))
                let top = fr.top + d.rect.top - 54
                if (top < 8) top = fr.top + d.rect.bottom + 8
                setPrevTb({ top, left, formats: d.formats || {} })
            }
            if (d.type === 'RTE_SEL_CLEAR') {
                setPrevTb(null)
                setPvColors(false); setPvFonts(false); setPvSizes(false)
            }
            if (d.type === 'RTE_UPDATE') {
                // Map field id back to resume state
                // e.g. "exp-0-description" → experience[0].description
                const parts = (d.field || '').split('-')
                if (parts[0] === 'exp' && parts.length >= 3) {
                    const idx = parseInt(parts[1])
                    const key = parts.slice(2).join('-') // 'description'
                    if (!isNaN(idx)) upExp(idx, key, d.html)
                } else if (d.field === 'summary') {
                    updatePersonal('summary', d.html)
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onDividerMouseDown = useCallback((e) => {
        e.preventDefault()
        isDragging.current = true
        document.body.style.cursor    = 'col-resize'
        document.body.style.userSelect = 'none'

        const onMove = (ev) => {
            if (!isDragging.current || !containerRef.current) return
            const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
            const { left, width } = containerRef.current.getBoundingClientRect()
            leftPctRef.current = Math.min(Math.max(((clientX - left) / width) * 100, 25), 75)
            if (rafId.current) cancelAnimationFrame(rafId.current)
            rafId.current = requestAnimationFrame(() => setLeftPct(leftPctRef.current))
        }

        const onUp = () => {
            isDragging.current = false
            document.body.style.cursor    = ''
            document.body.style.userSelect = ''
            if (rafId.current) cancelAnimationFrame(rafId.current)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup',   onUp)
            window.removeEventListener('touchmove', onMove)
            window.removeEventListener('touchend',  onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup',   onUp)
        window.addEventListener('touchmove', onMove, { passive: false })
        window.addEventListener('touchend',  onUp)
    }, [])

    if (isUploadMode) return <UploadResumeMode navigate={navigate} qc={qc} />

    const previewHTML = generateTemplateHTML(resume, resume.templateId || 'modern')

    // Normalise skills for backward compat (could be array-of-objects from old saves)
    const skillsList = Array.isArray(resume.skills)
        ? resume.skills.filter(s => typeof s === 'string')
        : []

    return (
        <div ref={containerRef} className="flex h-[calc(100vh-64px)] -m-4 md:-m-6 animate-fade-in overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a]">

            {/* ━━━ LEFT FORM PANEL ━━━ */}
            <div
                className="flex flex-col border-r border-gray-200 dark:border-gray-800/60 overflow-hidden shadow-2xl shadow-indigo-900/5 z-10"
                style={formCollapsed
                    ? { width: 0, minWidth: 0, flexShrink: 0, overflow: 'hidden' }
                    : { width: `${leftPct}%`, minWidth: 280, maxWidth: '75%', flexShrink: 0 }
                }
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 p-4 flex items-center justify-between flex-shrink-0 gap-2">
                    <div className="absolute inset-0 mesh-bg opacity-30" />
                    <div className="absolute -left-10 top-0 w-32 h-32 bg-violet-500/20 blur-[40px] pointer-events-none" />

                    <button onClick={() => setFormCollapsed(v => !v)} title="Collapse panel"
                        className="relative z-10 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all border border-white/10">
                        <PanelLeftClose size={15} />
                    </button>

                    <div className="relative z-10 flex-1 min-w-0 mx-2">
                        <div className="flex items-center gap-1.5 mb-1 opacity-80">
                            <Sparkles size={11} className="text-violet-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-300">JobVault AI Builder</span>
                        </div>
                        <input value={resume.title} onChange={e => setResume(p => ({ ...p, title: e.target.value }))}
                            className="font-heading font-extrabold text-lg text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full placeholder:text-gray-500 truncate"
                            placeholder="Resume Title…" />
                    </div>

                    <div className="relative z-10 flex gap-2 flex-shrink-0">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                            <ArrowLeft size={15} />
                        </button>
                        <button onClick={() => saveMutation.mutate(resume)} disabled={saveMutation.isPending}
                            className="px-3 py-2 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 shadow-lg flex items-center gap-1.5 transition-all">
                            <Save size={14} /> {saveMutation.isPending ? '…' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-[#0a0a0a]">

                    {/* ── CORE INFORMATION ── */}
                    <SECTION title="Core Information" icon={AlignLeft} open={open.personal} toggle={() => toggle('personal')}>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={resume.personalInfo.fullName}  onChange={e => updatePersonal('fullName',  e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200 col-span-2" placeholder="Full Name" />
                            <input value={resume.personalInfo.email}     onChange={e => updatePersonal('email',     e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200" placeholder="Email" type="email" />
                            <input value={resume.personalInfo.phone}     onChange={e => updatePersonal('phone',     e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200" placeholder="Phone" />
                            <input value={resume.personalInfo.location}  onChange={e => updatePersonal('location',  e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200 col-span-2" placeholder="City, Country" />
                            <input value={resume.personalInfo.linkedin}  onChange={e => updatePersonal('linkedin',  e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200" placeholder="LinkedIn URL" />
                            <input value={resume.personalInfo.github}    onChange={e => updatePersonal('github',    e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200" placeholder="GitHub URL" />
                            <input value={resume.personalInfo.portfolio} onChange={e => updatePersonal('portfolio', e.target.value)} className="input bg-gray-50 dark:bg-gray-800/50 border-gray-200 col-span-2" placeholder="Portfolio / Personal Website URL" />
                        </div>
                        <div className="relative mt-1">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Professional Summary</label>
                                <button
                                    onClick={() => { if (!resume.personalInfo.fullName) { toast.error('Add your name first'); return; } aiSummaryMutation.mutate() }}
                                    disabled={aiSummaryMutation.isPending}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg shadow hover:shadow-lg transition-all"
                                    title="Generate with AI">
                                    <Sparkles size={11} className={aiSummaryMutation.isPending ? 'animate-pulse' : ''} />
                                    {aiSummaryMutation.isPending ? 'Generating…' : 'AI Generate'}
                                </button>
                            </div>
                            <RichTextEditor
                                value={resume.personalInfo.summary}
                                onChange={v => updatePersonal('summary', v)}
                                placeholder="Describe your unique value proposition… Select any text to format it."
                                minHeight={90}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">✨ Select text to apply bold, italic, color & more</p>
                        </div>
                    </SECTION>

                    {/* ── PROFESSIONAL EXPERIENCE ── */}
                    <SECTION title="Professional Experience" icon={Briefcase} open={open.experience} toggle={() => toggle('experience')} count={resume.experience.length}>
                        {resume.experience.map((exp, i) => (
                            <div key={i} className="group relative border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                                {/* Delete */}
                                <button onClick={() => removeExp(i)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={13} />
                                </button>

                                <div className="grid grid-cols-2 gap-3 pr-7">
                                    <input value={exp.position} onChange={e => upExp(i, 'position', e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200" placeholder="Job Title" />
                                    <input value={exp.company}  onChange={e => upExp(i, 'company',  e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200" placeholder="Company Name" />
                                    <input value={exp.location} onChange={e => upExp(i, 'location', e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200 col-span-2" placeholder="Location (optional)" />
                                </div>

                                {/* Date pickers */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Start Date</label>
                                    <MonthYearPicker value={exp.startDate} onChange={v => upExp(i, 'startDate', v)} />
                                </div>

                                {!exp.current && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">End Date</label>
                                        <MonthYearPicker value={exp.endDate} onChange={v => upExp(i, 'endDate', v)} />
                                    </div>
                                )}

                                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                                    <input type="checkbox" checked={exp.current} onChange={e => upExp(i, 'current', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                                    <span className="font-medium">I currently work here</span>
                                </label>

                                {/* Description — rich text editor */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Key Responsibilities & Achievements</label>
                                    <RichTextEditor
                                        value={exp.description}
                                        onChange={v => upExp(i, 'description', v)}
                                        placeholder="• Led development of XYZ…&#10;• Increased velocity by 30%…"
                                        minHeight={120}
                                    />
                                    <p className="text-[10px] text-gray-400">✨ <strong>Select text</strong> to format — bold, italic, color, font & size. Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono text-[9px]">Enter</kbd> for new line.</p>
                                </div>
                            </div>
                        ))}
                        <button onClick={addExp} className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/10 font-medium text-xs flex items-center justify-center gap-2 transition-all">
                            <Plus size={14} /> Add Work Experience
                        </button>
                    </SECTION>

                    {/* ── EDUCATION ── */}
                    <SECTION title="Education History" icon={GraduationCap} open={open.education} toggle={() => toggle('education')} count={resume.education.length}>
                        {resume.education.map((edu, i) => (
                            <div key={i} className="group relative border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                                <button onClick={() => removeEdu(i)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={13} />
                                </button>

                                <div className="grid grid-cols-2 gap-3 pr-7">
                                    <input value={edu.institution} onChange={e => upEdu(i, 'institution', e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200 col-span-2" placeholder="University / School Name" />
                                    <input value={edu.degree}      onChange={e => upEdu(i, 'degree',      e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200" placeholder="Degree (e.g. B.Tech, MBA)" />
                                    <input value={edu.field}       onChange={e => upEdu(i, 'field',       e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200" placeholder="Major / Field" />
                                    <input value={edu.grade}       onChange={e => upEdu(i, 'grade',       e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200 col-span-2" placeholder="GPA / Percentage / Grade (optional)" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Start Date</label>
                                        <MonthYearPicker value={edu.startDate} onChange={v => upEdu(i, 'startDate', v)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">End Date</label>
                                        <MonthYearPicker value={edu.endDate} onChange={v => upEdu(i, 'endDate', v)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addEdu} className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/10 font-medium text-xs flex items-center justify-center gap-2 transition-all">
                            <Plus size={14} /> Add Education
                        </button>
                    </SECTION>

                    {/* ── SKILLS ── */}
                    <SECTION title="Skills" icon={Code} open={open.skills} toggle={() => toggle('skills')} count={skillsList.length}>
                        <div className="space-y-3">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                Type a skill and press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono">,</kbd> to add. Backspace to remove last.
                            </p>
                            <SkillTagInput skills={skillsList} onChange={setSkills} />

                            {/* Quick-add popular skills */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quick Add</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {['JavaScript','Python','React','Node.js','TypeScript','SQL','Git','Figma','Excel','Leadership','Communication','Problem Solving'].filter(s => !skillsList.includes(s)).map(s => (
                                        <button key={s} onClick={() => setSkills([...skillsList, s])}
                                            className="px-2 py-1 rounded-lg text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300 transition-colors font-medium">
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SECTION>

                    {/* ── CERTIFICATIONS ── */}
                    <SECTION title="Certifications & Awards" icon={Award} open={open.certifications} toggle={() => toggle('certifications')} count={resume.certifications.length}>
                        {resume.certifications.map((cert, i) => (
                            <div key={i} className="group relative border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                                <button onClick={() => removeCert(i)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={13} />
                                </button>

                                <div className="grid grid-cols-2 gap-3 pr-7">
                                    <input value={cert.name}   onChange={e => upCert(i, 'name',   e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200 col-span-2" placeholder="Certification / Award Name" />
                                    <input value={cert.issuer} onChange={e => upCert(i, 'issuer', e.target.value)} className="input bg-white dark:bg-gray-900 border-gray-200 col-span-2" placeholder="Issuing Organization (e.g. Google, AWS, Coursera)" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Issue Date</label>
                                    <MonthYearPicker value={cert.date} onChange={v => upCert(i, 'date', v)} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <LinkIcon size={11} /> Credential URL
                                    </label>
                                    <input
                                        value={cert.url}
                                        onChange={e => upCert(i, 'url', e.target.value)}
                                        className="input bg-white dark:bg-gray-900 border-gray-200"
                                        placeholder="https://credential.net/…"
                                        type="url"
                                    />
                                    {cert.url && (
                                        <a href={cert.url} target="_blank" rel="noreferrer" className="text-[11px] text-violet-600 hover:underline flex items-center gap-1">
                                            <LinkIcon size={10} /> Verify credential
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button onClick={addCert} className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/10 font-medium text-xs flex items-center justify-center gap-2 transition-all">
                            <Plus size={14} /> Add Certification / Award
                        </button>
                    </SECTION>

                    {/* Bottom padding */}
                    <div className="h-4" />
                </div>
            </div>

            {/* ━━━ DRAG DIVIDER ━━━ */}
            {!formCollapsed && (
                <div
                    onMouseDown={onDividerMouseDown}
                    onTouchStart={onDividerMouseDown}
                    className="hidden lg:flex flex-col items-center justify-center w-2.5 cursor-col-resize z-20 group flex-shrink-0 select-none relative"
                >
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gray-300 dark:bg-gray-700 group-hover:bg-violet-400 transition-colors duration-150" />
                    <div className="relative z-10 flex flex-col gap-[5px] opacity-40 group-hover:opacity-100 transition-opacity">
                        {[0,1,2,3,4,5].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-violet-500 transition-colors" />
                        ))}
                    </div>
                </div>
            )}

            {/* ━━━ RIGHT PREVIEW ━━━ */}
            <div className="hidden lg:flex flex-col flex-1 bg-gray-200 dark:bg-gray-800 overflow-hidden relative" style={{ minWidth: 0 }}>
                <div className="absolute top-4 inset-x-0 flex items-center justify-center gap-3 z-20">
                    {formCollapsed && (
                        <button onClick={() => setFormCollapsed(false)}
                            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-violet-200 shadow-xl px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
                            <PanelLeftOpen size={16} /> Show Editor
                        </button>
                    )}
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </div>
                            Sync Active
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                        <span>A4 Format</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex justify-center items-start pt-20 pb-20 px-8 custom-scrollbar">
                    <div className="bg-white shadow-2xl" style={{ width: 794, minHeight: 1123 }}>
                        <iframe
                            ref={iframeRef}
                            srcDoc={previewHTML}
                            style={{ width: 794, height: 1123, border: 'none', display: 'block', background: 'white' }}
                            scrolling="no"
                            title="Resume Preview"
                        />
                    </div>
                </div>

                {/* ── Preview selection toolbar (portal over iframe) ── */}
                {prevTb && ReactDOM.createPortal(
                    <div
                        style={{
                            position: 'fixed', top: prevTb.top, left: prevTb.left,
                            zIndex: 99999, width: 460,
                            animation: 'fadeSlideDown 0.12s ease-out',
                        }}
                        className="flex items-center gap-px bg-gray-900 text-white rounded-2xl shadow-2xl shadow-black/50 px-2 py-1.5 border border-gray-700/60"
                        onMouseDown={e => e.preventDefault()}
                    >
                        {/* B / I / U */}
                        {[
                            { cmd:'bold',      label:<b className="font-black text-[13px]">B</b>,      active: prevTb.formats.bold },
                            { cmd:'italic',    label:<i className="italic font-serif text-[13px]">I</i>, active: prevTb.formats.italic },
                            { cmd:'underline', label:<span className="underline text-[13px]">U</span>,    active: prevTb.formats.underline },
                        ].map(({ cmd, label, active }) => (
                            <button key={cmd}
                                onMouseDown={e => { e.preventDefault(); sendIframe({ type:'RTE_EXEC', cmd }) }}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                                    active ? 'bg-violet-500 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                            >{label}</button>
                        ))}

                        <div className="w-px h-5 bg-gray-600 mx-1 flex-shrink-0" />

                        {/* Font family */}
                        <div className="relative flex-shrink-0">
                            <button onMouseDown={e => { e.preventDefault(); setPvFonts(v => !v); setPvColors(false); setPvSizes(false) }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors">
                                Font <ChevronDown size={10} className={pvFonts ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            </button>
                            {pvFonts && <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-10 overflow-y-auto max-h-52" style={{ minWidth: 160 }}>
                                {PV_FAMILIES.map(f => (
                                    <button key={f.label}
                                        onMouseDown={e => { e.preventDefault(); sendIframe({ type:'RTE_FONT', val: f.value || 'Arial' }); setPvFonts(false) }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 transition-colors"
                                        style={{ fontFamily: f.value || 'inherit' }}>{f.label}</button>
                                ))}
                            </div>}
                        </div>

                        {/* Font size */}
                        <div className="relative flex-shrink-0">
                            <button onMouseDown={e => { e.preventDefault(); setPvSizes(v => !v); setPvColors(false); setPvFonts(false) }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors">
                                Size <ChevronDown size={10} className={pvSizes ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            </button>
                            {pvSizes && <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-10 overflow-y-auto max-h-52" style={{ minWidth: 110 }}>
                                <div className="grid grid-cols-2">
                                    {PV_SIZES.map(s => (
                                        <button key={s}
                                            onMouseDown={e => { e.preventDefault(); sendIframe({ type:'RTE_FONT_SIZE', val: s }); setPvSizes(false) }}
                                            className="text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 transition-colors">{s}px</button>
                                    ))}
                                </div>
                            </div>}
                        </div>

                        <div className="w-px h-5 bg-gray-600 mx-1 flex-shrink-0" />

                        {/* Color */}
                        <div className="relative flex-shrink-0">
                            <button onMouseDown={e => { e.preventDefault(); setPvColors(v => !v); setPvFonts(false); setPvSizes(false) }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors">
                                <span className="font-bold underline underline-offset-2 text-[13px]" style={{ textDecorationColor:'#60a5fa' }}>A</span>
                                <ChevronDown size={10} className={pvColors ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            </button>
                            {pvColors && <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-10 p-2" style={{ minWidth: 168 }}>
                                <div className="grid grid-cols-6 gap-1">
                                    {PV_PALETTE.map(c => (
                                        <button key={c}
                                            onMouseDown={e => { e.preventDefault(); sendIframe({ type:'RTE_COLOR', val: c }); setPvColors(false) }}
                                            className="w-6 h-6 rounded-md border border-gray-600 hover:scale-110 transition-transform"
                                            style={{ background: c }} title={c} />
                                    ))}
                                </div>
                            </div>}
                        </div>

                        <div className="w-px h-5 bg-gray-600 mx-1 flex-shrink-0" />

                        {/* Clear */}
                        <button
                            onMouseDown={e => { e.preventDefault(); sendIframe({ type:'RTE_REMOVE_FMT' }) }}
                            className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                        >Clear ✕</button>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}
