import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, ImageIcon, Calculator, Copy, CheckCheck } from 'lucide-react'
import { toolsAPI, aiAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function ToolsPage() {
    const { user } = useAuthStore()
    const [tab, setTab] = useState('bio')
    const [bioData, setBioData] = useState({ skills: '', currentStatus: user?.currentStatus || 'student', location: user?.location || '' })
    const [bioResult, setBioResult] = useState('')
    const [copied, setCopied] = useState(false)
    const [salary, setSalary] = useState({ annualSalary: '', taxRegime: 'new', allowances: '' })
    const [salaryResult, setSalaryResult] = useState(null)

    const bioMutation = useMutation({
        mutationFn: () => aiAPI.generateBio({ fullName: user?.fullName, ...bioData, skills: bioData.skills.split(',').map(s => s.trim()).filter(Boolean) }),
        onSuccess: (res) => { setBioResult(res.data.bio); toast.success('Bio generated!') },
        onError: (err) => toast.error(err.response?.data?.message || 'Bio generation failed'),
    })

    const calcSalary = () => {
        const gross = parseFloat(salary.annualSalary) || 0
        const allowances = parseFloat(salary.allowances) || 0
        const taxableIncome = Math.max(0, gross - allowances)

        let tax = 0
        if (salary.taxRegime === 'new') {
            // New Tax Regime FY 2024-25 (post Budget 2024)
            if (taxableIncome <= 300000) tax = 0
            else if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05
            else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10
            else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15
            else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 1200000) * 0.20
            else tax = 140000 + (taxableIncome - 1500000) * 0.30
            // Rebate u/s 87A (income ≤ 7L, tax = 0)
            if (taxableIncome <= 700000) tax = 0
        } else {
            // Old Tax Regime
            if (taxableIncome <= 250000) tax = 0
            else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05
            else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20
            else tax = 112500 + (taxableIncome - 1000000) * 0.30
            // Rebate u/s 87A (income ≤ 5L)
            if (taxableIncome <= 500000) tax = 0
        }

        // 4% cess on tax
        const cess = tax * 0.04
        const totalTax = tax + cess
        const netAnnual = gross - totalTax
        const grossMonthly = gross / 12
        const netMonthly = netAnnual / 12

        setSalaryResult({
            grossMonthly: Math.round(grossMonthly),
            netMonthly: Math.round(netMonthly),
            taxDeducted: Math.round(totalTax),
            cess: Math.round(cess),
            effectiveTaxRate: `${((totalTax / gross) * 100).toFixed(1)}%`,
        })
    }

    const handleCopyBio = () => {
        navigator.clipboard.writeText(bioResult)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Copied!')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Utility Tools</h1>
                <p className="text-gray-500 text-sm mt-1">Quick tools for your job search journey</p>
            </div>

            {/* Tool tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {[
                    { key: 'bio', label: 'Bio Creator', icon: Sparkles },
                    { key: 'photo', label: 'Photo Resize', icon: ImageIcon },
                    { key: 'salary', label: 'Salary Calc', icon: Calculator },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Bio Creator */}
            {tab === 'bio' && (
                <div className="card space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-primary-600" />
                        <h2 className="font-heading font-semibold text-gray-900 dark:text-white">AI Bio Creator</h2>
                    </div>
                    <p className="text-sm text-gray-500">Generate a professional bio for LinkedIn, portfolio, or any platform</p>
                    <div>
                        <label className="label">Your Skills</label>
                        <input value={bioData.skills} onChange={e => setBioData(p => ({ ...p, skills: e.target.value }))}
                            placeholder="React, Python, Machine Learning, AWS..." className="input" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Current Status</label>
                            <select value={bioData.currentStatus} onChange={e => setBioData(p => ({ ...p, currentStatus: e.target.value }))} className="input">
                                {['student', 'graduate', 'employed', 'unemployed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Location</label>
                            <input value={bioData.location} onChange={e => setBioData(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" className="input" />
                        </div>
                    </div>
                    <button onClick={() => bioMutation.mutate()} disabled={bioMutation.isPending || !bioData.skills} className="btn-primary flex items-center gap-2">
                        <Sparkles size={15} /> {bioMutation.isPending ? 'Generating...' : 'Generate Bio'}
                    </button>
                    {bioResult && (
                        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl relative">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{bioResult}</p>
                            <button onClick={handleCopyBio} className="absolute top-3 right-3 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Photo Resizer */}
            {tab === 'photo' && (
                <div className="card space-y-4">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={20} className="text-primary-600" />
                        <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Photo Resizer</h2>
                    </div>
                    <p className="text-sm text-gray-500">Resize and optimize your profile photo for resumes and job portals</p>
                    <PhotoResizer />
                </div>
            )}

            {/* Salary Calculator — Indian Tax Brackets FY 2024-25 */}
            {tab === 'salary' && (
                <div className="card space-y-4">
                    <div className="flex items-center gap-2">
                        <Calculator size={20} className="text-primary-600" />
                        <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Salary Calculator</h2>
                        <span className="text-xs text-gray-400 ml-auto">India · FY 2024-25</span>
                    </div>
                    <div>
                        <label className="label">Annual CTC / Gross Salary (₹)</label>
                        <input type="number" value={salary.annualSalary} onChange={e => setSalary(p => ({ ...p, annualSalary: e.target.value }))}
                            placeholder="e.g. 1200000" className="input" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Tax Regime</label>
                            <select value={salary.taxRegime} onChange={e => setSalary(p => ({ ...p, taxRegime: e.target.value }))} className="input">
                                <option value="new">New Regime (Default 2024)</option>
                                <option value="old">Old Regime</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Deductions / Allowances (₹)</label>
                            <input type="number" value={salary.allowances} onChange={e => setSalary(p => ({ ...p, allowances: e.target.value }))}
                                placeholder="80C, HRA, PF etc." className="input" />
                        </div>
                    </div>

                    {/* Tax slab info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">{salary.taxRegime === 'new' ? 'New Regime Slabs (FY 2024-25):' : 'Old Regime Slabs:'}</p>
                        {salary.taxRegime === 'new' ? (
                            <p>₹0-3L: 0% · ₹3-7L: 5% (0% if ≤7L via rebate) · ₹7-10L: 10% · ₹10-12L: 15% · ₹12-15L: 20% · &gt;₹15L: 30% + 4% Cess</p>
                        ) : (
                            <p>₹0-2.5L: 0% · ₹2.5-5L: 5% (0% via rebate) · ₹5-10L: 20% · &gt;₹10L: 30% + 4% Cess</p>
                        )}
                    </div>

                    <button onClick={calcSalary} disabled={!salary.annualSalary} className="btn-primary">Calculate Take-Home</button>
                    {salaryResult && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            {[
                                { label: 'Gross Monthly', value: `₹${salaryResult.grossMonthly?.toLocaleString('en-IN')}` },
                                { label: 'Net Take-Home', value: `₹${salaryResult.netMonthly?.toLocaleString('en-IN')}`, highlight: true },
                                { label: 'Tax + Cess (Annual)', value: `₹${salaryResult.taxDeducted?.toLocaleString('en-IN')}` },
                                { label: 'Effective Tax Rate', value: salaryResult.effectiveTaxRate },
                            ].map(({ label, value, highlight }) => (
                                <div key={label} className={`p-3 rounded-xl ${highlight ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                                    <p className={`font-heading font-bold text-lg ${highlight ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Photo resizer using Canvas API (client-side, no server needed)
function PhotoResizer() {
    const [result, setResult] = useState(null)
    const [opts, setOpts] = useState({ width: 400, height: 400, format: 'image/jpeg' })
    const [preview, setPreview] = useState(null)

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            setPreview(ev.target.result)
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = parseInt(opts.width)
                canvas.height = parseInt(opts.height)
                const ctx = canvas.getContext('2d')
                // Cover fit
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
                const x = (canvas.width - img.width * scale) / 2
                const y = (canvas.height - img.height * scale) / 2
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob)
                    const sizeKB = Math.round(blob.size / 1024)
                    setResult({ url, size: sizeKB, blob })
                    toast.success(`Photo resized to ${opts.width}×${opts.height}px (${sizeKB}KB)`)
                }, opts.format, 0.9)
            }
            img.src = ev.target.result
        }
        reader.readAsDataURL(file)
    }

    const handleDownload = () => {
        if (!result) return
        const ext = opts.format.split('/')[1]
        const link = document.createElement('a')
        link.href = result.url
        link.download = `photo_${opts.width}x${opts.height}.${ext}`
        link.click()
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Width (px)</label><input type="number" value={opts.width} onChange={e => setOpts(p => ({ ...p, width: e.target.value }))} className="input" /></div>
                <div><label className="label">Height (px)</label><input type="number" value={opts.height} onChange={e => setOpts(p => ({ ...p, height: e.target.value }))} className="input" /></div>
                <div><label className="label">Format</label>
                    <select value={opts.format} onChange={e => setOpts(p => ({ ...p, format: e.target.value }))} className="input">
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
            </div>

            {/* Preset sizes */}
            <div className="flex gap-2 flex-wrap">
                {[['Passport', 200, 200], ['LinkedIn', 400, 400], ['Resume', 300, 400], ['ID Card', 640, 480]].map(([label, w, h]) => (
                    <button key={label} onClick={() => setOpts(p => ({ ...p, width: w, height: h }))}
                        className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors">
                        {label} ({w}×{h})
                    </button>
                ))}
            </div>

            <label className="btn-primary cursor-pointer flex items-center justify-center gap-2">
                <ImageIcon size={15} /> Upload & Resize
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>

            {result && (
                <div className="text-center space-y-2">
                    <img src={result.url} alt="Resized" className="mx-auto max-h-48 rounded-xl shadow border border-gray-200 dark:border-gray-700" />
                    <p className="text-xs text-gray-400">{opts.width}×{opts.height}px · {result.size} KB</p>
                    <button onClick={handleDownload} className="btn-secondary text-sm">Download Photo</button>
                </div>
            )}
        </div>
    )
}
