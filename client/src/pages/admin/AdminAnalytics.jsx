import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    FunnelChart, Funnel, LabelList,
} from 'recharts'
import {
    Users, Briefcase, FileText, TrendingUp, TrendingDown, Crown,
    DollarSign, Eye, MousePointerClick, Activity, Star, BarChart2,
    Calendar, Zap, Target, AlertCircle, CheckCircle, Clock,
    UserPlus, Mail, CreditCard, ArrowUp, ArrowDown, Minus,
    RefreshCw, MapPin, Code, Building2,
} from 'lucide-react'

// ─── Color Palette ────────────────────────────────────────────
const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa', '#fb923c', '#34d399']
const INDIGO = '#6366f1'
const CYAN = '#22d3ee'
const AMBER = '#f59e0b'
const EMERALD = '#10b981'
const ROSE = '#f43f5e'

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN')
const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`
const shortDate = (str) => {
    if (!str) return ''
    const [, mm, dd] = str.split('-')
    return `${dd}/${mm}`
}

function StatCard({ label, value, icon: Icon, color, bg, sub, trend, prefix = '', suffix = '' }) {
    const isPos = trend > 0, isNeg = trend < 0
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4 hover:shadow-lg transition-all">
            <div className={`rounded-xl p-3 ${bg} flex-shrink-0`}>
                <Icon size={22} className={color} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{prefix}{fmt(value)}{suffix}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${isPos ? 'text-emerald-500' : isNeg ? 'text-rose-500' : 'text-gray-400'}`}>
                        {isPos ? <ArrowUp size={12} /> : isNeg ? <ArrowDown size={12} /> : <Minus size={12} />}
                        {Math.abs(trend)}% vs last month
                    </div>
                )}
            </div>
        </div>
    )
}

function SectionHeader({ title, subtitle }) {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    )
}

function ChartCard({ title, children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 ${className}`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
            {children}
        </div>
    )
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-gray-700">
            <p className="font-medium mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
            ))}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminAnalytics() {
    const [growthDays, setGrowthDays] = useState(30)
    const [activeTab, setActiveTab] = useState('overview')

    const { data: overviewRaw, isLoading: ovLoading } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: analyticsAPI.getOverview,
        refetchInterval: 60000,
    })
    const { data: userGrowthRaw, isLoading: ugLoading } = useQuery({
        queryKey: ['analytics-user-growth', growthDays],
        queryFn: () => analyticsAPI.getUserGrowth(growthDays),
    })
    const { data: jobGrowthRaw } = useQuery({
        queryKey: ['analytics-job-growth', growthDays],
        queryFn: () => analyticsAPI.getJobGrowth(growthDays),
    })
    const { data: demoRaw } = useQuery({
        queryKey: ['analytics-demographics'],
        queryFn: analyticsAPI.getUserDemographics,
    })
    const { data: jobsRaw } = useQuery({
        queryKey: ['analytics-jobs-overview'],
        queryFn: analyticsAPI.getJobsOverview,
    })
    const { data: resumeRaw } = useQuery({
        queryKey: ['analytics-resumes'],
        queryFn: analyticsAPI.getResumesOverview,
    })
    const { data: revenueRaw } = useQuery({
        queryKey: ['analytics-revenue'],
        queryFn: analyticsAPI.getRevenue,
    })
    const { data: healthRaw } = useQuery({
        queryKey: ['analytics-health'],
        queryFn: analyticsAPI.getPlatformHealth,
    })
    const { data: skillsRaw } = useQuery({
        queryKey: ['analytics-skills'],
        queryFn: analyticsAPI.getTrendingSkills,
    })
    const { data: funnelRaw } = useQuery({
        queryKey: ['analytics-funnel'],
        queryFn: analyticsAPI.getFunnel,
    })
    const { data: activityRaw } = useQuery({
        queryKey: ['analytics-activity'],
        queryFn: analyticsAPI.getRecentActivity,
    })

    const ov = overviewRaw?.data || {}
    const userGrowth = userGrowthRaw?.data || []
    const jobGrowth = jobGrowthRaw?.data || []
    const demo = demoRaw?.data || {}
    const jobs = jobsRaw?.data || {}
    const resume = resumeRaw?.data || {}
    const rev = revenueRaw?.data || {}
    const health = healthRaw?.data || {}
    const skills = skillsRaw?.data || {}
    const funnel = funnelRaw?.data || []
    const activity = activityRaw?.data || {}

    // Combine user+job growth into one chart
    const combinedGrowth = userGrowth.map((u, i) => ({
        date: shortDate(u.date),
        Users: u.count,
        Jobs: jobGrowth[i]?.count || 0,
    }))

    // Funnel data with percentages
    const funnelMax = funnel[0]?.count || 1
    const funnelData = funnel.map(f => ({
        name: f.stage,
        value: f.count,
        pct: ((f.count / funnelMax) * 100).toFixed(1),
    }))

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'activity', label: 'Activity', icon: Activity },
    ]

    if (ovLoading) {
        return (
            <div className="flex items-center justify-center h-96 gap-3">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
                <span className="text-gray-500 font-medium">Loading analytics…</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart2 size={26} className="text-indigo-500" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Full platform intelligence — users, jobs, revenue & engagement</p>
                </div>
                <div className="flex items-center gap-2">
                    {[7, 14, 30].map(d => (
                        <button key={d}
                            onClick={() => setGrowthDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${growthDays === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ══════ OVERVIEW TAB ══════ */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Users" value={ov.users?.total} icon={Users} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" sub={`${fmt(ov.users?.premium)} premium`} trend={ov.users?.growthPercent} />
                        <StatCard label="Active Jobs" value={ov.jobs?.active} icon={Briefcase} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" sub={`${fmt(ov.jobs?.pending)} pending`} />
                        <StatCard label="Total Resumes" value={ov.resumes?.total} icon={FileText} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" sub={`${fmt(ov.resumes?.createdThisMonth)} this month`} />
                        <StatCard label="MRR" value={rev.mrr} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" prefix="₹" sub={`${fmt(rev.totalPremium)} premium users`} trend={rev.mrrGrowth} />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Job Views" value={ov.jobs?.totalViews} icon={Eye} color="text-violet-500" bg="bg-violet-50 dark:bg-violet-900/20" />
                        <StatCard label="Total Applications" value={ov.jobs?.totalApplied} icon={MousePointerClick} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/20" />
                        <StatCard label="DAU" value={health.dau} icon={Activity} color="text-sky-500" bg="bg-sky-50 dark:bg-sky-900/20" sub={`${fmt(health.mau)} MAU`} />
                        <StatCard label="Premium Rate" value={ov.users?.premiumRate} icon={Crown} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" suffix="%" />
                    </div>

                    {/* Growth Chart */}
                    <ChartCard title={`User & Job Growth — Last ${growthDays} days`}>
                        {ugLoading ? <div className="h-56 flex items-center justify-center text-gray-400">Loading…</div> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={combinedGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={INDIGO} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={INDIGO} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gJobs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CYAN} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area type="monotone" dataKey="Users" stroke={INDIGO} fill="url(#gUsers)" strokeWidth={2} dot={false} />
                                    <Area type="monotone" dataKey="Jobs" stroke={CYAN} fill="url(#gJobs)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* Conversion Funnel + Job breakdown */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <ChartCard title="Conversion Funnel">
                            <div className="space-y-3 mt-2">
                                {funnelData.map((f, i) => (
                                    <div key={f.name}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium">{f.name}</span>
                                            <span className="font-bold text-gray-800 dark:text-white">{fmt(f.value)} <span className="text-gray-400 font-normal">({f.pct}%)</span></span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${f.pct}%`, backgroundColor: COLORS[i] }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>

                        <ChartCard title="Job Status Distribution">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={jobs.approvalStats || []} cx="50%" cy="50%" outerRadius={75} dataKey="count" nameKey="_id" label={({ _id, count }) => `${_id}: ${count}`} labelLine={false}>
                                        {(jobs.approvalStats || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Platform Health */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { label: 'DAU', value: health.dau, icon: Activity, color: 'text-indigo-500' },
                            { label: 'WAU', value: health.wau, icon: Calendar, color: 'text-cyan-500' },
                            { label: 'MAU', value: health.mau, icon: Users, color: 'text-violet-500' },
                            { label: 'New Today', value: health.newUsersToday, icon: UserPlus, color: 'text-emerald-500' },
                            { label: 'Jobs Today', value: health.newJobsToday, icon: Briefcase, color: 'text-amber-500' },
                            { label: 'Resumes Today', value: health.resumesCreatedToday, icon: FileText, color: 'text-rose-500' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                                <Icon size={18} className={`${color} mx-auto mb-1`} />
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(value)}</p>
                                <p className="text-xs text-gray-400">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════ USERS TAB ══════ */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Users" value={ov.users?.total} icon={Users} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" />
                        <StatCard label="Premium Users" value={ov.users?.premium} icon={Crown} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" sub={`${fmtPct(ov.users?.premiumRate)} of total`} />
                        <StatCard label="New This Month" value={ov.users?.newThisMonth} icon={UserPlus} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" trend={ov.users?.growthPercent} />
                        <StatCard label="Email Verified" value={health.emailVerifiedUsers} icon={Mail} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* By Status */}
                        <ChartCard title="Users by Employment Status">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={demo.byStatus || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="_id">
                                        {(demo.byStatus || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* By Gender */}
                        <ChartCard title="Users by Gender">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={demo.byGender || []} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={80} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Users" radius={[0, 6, 6, 0]}>
                                        {(demo.byGender || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Profile Completion */}
                        <ChartCard title="Profile Completion">
                            <div className="space-y-4 mt-4">
                                {[
                                    { label: 'High (80%+)', value: demo.profileCompletion?.high, color: EMERALD },
                                    { label: 'Medium (50-80%)', value: demo.profileCompletion?.mid, color: AMBER },
                                    { label: 'Low (<50%)', value: demo.profileCompletion?.under50, color: ROSE },
                                ].map(({ label, color, value }) => {
                                    const total = (demo.profileCompletion?.high || 0) + (demo.profileCompletion?.mid || 0) + (demo.profileCompletion?.under50 || 0)
                                    const pct = total ? ((value / total) * 100).toFixed(1) : 0
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                                                <span className="font-bold text-gray-800 dark:text-white">{fmt(value)} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                            </div>
                                        </div>
                                    )
                                })}
                                <p className="text-xs text-gray-400 mt-2">Avg completeness: <span className="font-semibold text-indigo-500">{Number(demo.profileCompletion?.avg || 0).toFixed(0)}%</span></p>
                            </div>
                        </ChartCard>
                    </div>

                    {/* Top Locations */}
                    <ChartCard title="Top User Locations">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={demo.topLocations || []} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]} fill={INDIGO} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Trending Skills */}
                    <ChartCard title="Top User Skills">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {(skills.userSkills || []).map(({ _id, count }, i) => (
                                <span key={_id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                                    <Code size={10} />
                                    {_id} <span className="opacity-70">({count})</span>
                                </span>
                            ))}
                            {!skills.userSkills?.length && <p className="text-xs text-gray-400">No skill data yet</p>}
                        </div>
                    </ChartCard>
                </div>
            )}

            {/* ══════ JOBS TAB ══════ */}
            {activeTab === 'jobs' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Jobs" value={ov.jobs?.total} icon={Briefcase} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" />
                        <StatCard label="Active Jobs" value={ov.jobs?.active} icon={CheckCircle} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" />
                        <StatCard label="Pending Approval" value={ov.jobs?.pending} icon={Clock} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" />
                        <StatCard label="Posted This Week" value={jobs.recentlyPosted} icon={Calendar} color="text-violet-500" bg="bg-violet-50 dark:bg-violet-900/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Views" value={ov.jobs?.totalViews} icon={Eye} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" />
                        <StatCard label="Total Applications" value={ov.jobs?.totalApplied} icon={MousePointerClick} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/20" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* By Category */}
                        <ChartCard title="Jobs by Domain / Category">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={jobs.byCategory || []} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="_id" tick={{ fontSize: 10 }} width={90} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Jobs" radius={[0, 6, 6, 0]} fill={CYAN} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* By Source */}
                        <ChartCard title="Jobs by Source / Platform">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={jobs.bySource || []} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="_id" label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {(jobs.bySource || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <ChartCard title="Jobs by Work Mode">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={jobs.byRemote || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" nameKey="_id">
                                        {(jobs.byRemote || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Jobs by Experience Level">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={jobs.byExperienceLevel || []} margin={{ left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Jobs" radius={[6, 6, 0, 0]} fill={AMBER} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Jobs by Sector">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={jobs.bySector || []} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="_id">
                                        {(jobs.bySector || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Top Jobs */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <ChartCard title="🔥 Top Viewed Jobs">
                            <div className="space-y-3">
                                {(jobs.topViewed || []).map((j, i) => (
                                    <div key={j._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{j.title}</p>
                                            <p className="text-xs text-gray-500">{j.company}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                            <Eye size={12} /> {fmt(j.viewCount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>

                        <ChartCard title="📩 Top Applied Jobs">
                            <div className="space-y-3">
                                {(jobs.topApplied || []).map((j, i) => (
                                    <div key={j._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{j.title}</p>
                                            <p className="text-xs text-gray-500">{j.company}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                                            <MousePointerClick size={12} /> {fmt(j.applyCount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    {/* Top Job Skills */}
                    <ChartCard title="In-Demand Job Skills">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {(skills.jobSkills || []).map(({ _id, count }, i) => (
                                <span key={_id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                                    <Star size={10} />
                                    {_id} ({count})
                                </span>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            )}

            {/* ══════ REVENUE TAB ══════ */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="MRR" value={rev.mrr} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" prefix="₹" trend={rev.mrrGrowth} />
                        <StatCard label="Total Revenue" value={rev.totalRevenue} icon={TrendingUp} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" prefix="₹" />
                        <StatCard label="Premium Users" value={rev.totalPremium} icon={Crown} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" />
                        <StatCard label="Expiring Soon (7d)" value={rev.premiumExpiringSoon} icon={AlertCircle} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/20" />
                    </div>

                    {/* Revenue breakdown cards */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Plan Price', value: fmtCurrency(rev.planPrice), sub: 'per month' },
                            { label: 'This Month Revenue', value: fmtCurrency(rev.mrrThisMonth), sub: `${fmt(rev.premiumThisMonth)} new subscribers` },
                            { label: 'Last Month Revenue', value: fmtCurrency(rev.mrrLastMonth), sub: `${fmt(rev.premiumLastMonth)} subscribers` },
                        ].map(({ label, value, sub }) => (
                            <div key={label} className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
                                <p className="text-xs opacity-70 font-medium mb-1">{label}</p>
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-xs opacity-60 mt-1">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Monthly revenue chart */}
                    <ChartCard title="Monthly Premium Signups & Revenue (Last 6 months)">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={rev.premiumByMonth || []} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="count" name="Subscribers" fill={INDIGO} radius={[6, 6, 0, 0]} />
                                <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill={EMERALD} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* User breakdown */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <ChartCard title="Free vs Premium Users">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={[
                                        { name: 'Free', value: ov.users?.free || 0 },
                                        { name: 'Premium', value: ov.users?.premium || 0 },
                                    ]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        <Cell fill="#e5e7eb" />
                                        <Cell fill={AMBER} />
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Auth Methods">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={[
                                        { name: 'Email/Password', value: (ov.users?.total || 0) - (health.googleAuthUsers || 0) },
                                        { name: 'Google OAuth', value: health.googleAuthUsers || 0 },
                                    ]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name.split('/')[0]} ${(percent * 100).toFixed(0)}%`}>
                                        <Cell fill={INDIGO} />
                                        <Cell fill={ROSE} />
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ══════ ACTIVITY TAB ══════ */}
            {activeTab === 'activity' && (
                <div className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Recent Users */}
                        <ChartCard title="🆕 Recent Signups" className="col-span-1">
                            <div className="space-y-3 mt-1">
                                {(activity.recentUsers || []).map(u => (
                                    <div key={u._id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-indigo-600">{u.fullName?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.fullName}</p>
                                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                        </div>
                                        {u.isPremium && <Crown size={14} className="text-amber-500 flex-shrink-0" />}
                                    </div>
                                ))}
                                {!activity.recentUsers?.length && <p className="text-xs text-gray-400">No recent users</p>}
                            </div>
                        </ChartCard>

                        {/* Recent Jobs */}
                        <ChartCard title="📋 Recent Jobs" className="col-span-1">
                            <div className="space-y-3 mt-1">
                                {(activity.recentJobs || []).map(j => (
                                    <div key={j._id} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                                            <Briefcase size={14} className="text-cyan-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{j.title}</p>
                                            <p className="text-xs text-gray-400">{j.company}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${j.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : j.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {j.status}
                                        </span>
                                    </div>
                                ))}
                                {!activity.recentJobs?.length && <p className="text-xs text-gray-400">No recent jobs</p>}
                            </div>
                        </ChartCard>

                        {/* Recent Resumes */}
                        <ChartCard title="📄 Recent Resumes" className="col-span-1">
                            <div className="space-y-3 mt-1">
                                {(activity.recentResumes || []).map(r => (
                                    <div key={r._id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                                            <FileText size={14} className="text-violet-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{r.title}</p>
                                            <p className="text-xs text-gray-400">{r.user?.fullName || 'Unknown'} · {r.templateId}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                            <TrendingDown size={12} /> {r.downloadCount}
                                        </div>
                                    </div>
                                ))}
                                {!activity.recentResumes?.length && <p className="text-xs text-gray-400">No recent resumes</p>}
                            </div>
                        </ChartCard>
                    </div>

                    {/* Resume Analytics */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <ChartCard title="Templates Used">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={resume.byTemplate || []} cx="50%" cy="50%" outerRadius={75} dataKey="count" nameKey="_id">
                                        {(resume.byTemplate || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="ATS Score Distribution">
                            <div className="space-y-3 mt-4">
                                {[
                                    { label: 'Excellent (80+)', value: resume.atsScores?.excellent, color: EMERALD },
                                    { label: 'Good (60-80)', value: resume.atsScores?.good, color: INDIGO },
                                    { label: 'Fair (40-60)', value: resume.atsScores?.fair, color: AMBER },
                                    { label: 'Poor (<40)', value: resume.atsScores?.poor, color: ROSE },
                                ].map(({ label, value, color }) => {
                                    const total = Object.values(resume.atsScores || {}).reduce((s, v) => typeof v === 'number' ? s + v : s, 0) - (resume.atsScores?.avg || 0)
                                    const pct = total ? ((value / total) * 100).toFixed(0) : 0
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs mb-0.5">
                                                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                                                <span className="font-bold text-gray-800 dark:text-white">{fmt(value)}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                            </div>
                                        </div>
                                    )
                                })}
                                <p className="text-xs text-gray-400 pt-1">Avg ATS Score: <span className="font-semibold text-indigo-500">{Number(resume.atsScores?.avg || 0).toFixed(1)}</span></p>
                            </div>
                        </ChartCard>

                        <ChartCard title="Resume Stats">
                            <div className="space-y-3 mt-2">
                                {[
                                    { label: 'Total Downloads', value: fmt(resume.downloads?.totalDownloads), icon: TrendingDown, color: 'text-indigo-500' },
                                    { label: 'Avg Downloads', value: Number(resume.downloads?.avgDownloads || 0).toFixed(1), icon: BarChart2, color: 'text-cyan-500' },
                                    { label: 'Resumes with PDF', value: fmt(resume.withPdf), icon: FileText, color: 'text-emerald-500' },
                                    { label: 'Created This Week', value: fmt(resume.recentWeek), icon: Calendar, color: 'text-amber-500' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Icon size={14} className={color} />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white text-sm">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>
                </div>
            )}
        </div>
    )
}
