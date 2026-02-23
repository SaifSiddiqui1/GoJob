import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, Briefcase, Target, TrendingUp, Plus, ArrowRight, Clock, CheckCircle } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { jobsAPI, resumeAPI } from '../../services/api'

const quickActions = [
    { to: '/dashboard/resume/builder', label: 'Create Resume', icon: Plus, color: 'bg-primary-600 hover:bg-primary-700', text: 'text-white', desc: 'Build a new ATS-friendly resume' },
    { to: '/dashboard/resume/ats-check', label: 'ATS Score Check', icon: Target, color: 'bg-amber-500 hover:bg-amber-600', text: 'text-white', desc: 'Check how well your resume scores' },
    { to: '/dashboard/jobs', label: 'Browse Jobs', icon: Briefcase, color: 'bg-green-500 hover:bg-green-600', text: 'text-white', desc: 'Find your next opportunity' },
]

export default function DashboardPage() {
    const { user } = useAuthStore()

    const { data: jobsData } = useQuery({
        queryKey: ['jobs', 'dashboard'],
        queryFn: () => jobsAPI.getAll({ limit: 5, sort: '-postedDate' }),
    })

    const { data: resumesData } = useQuery({
        queryKey: ['resumes'],
        queryFn: () => resumeAPI.getAll(),
    })

    const resumes = resumesData?.data?.resumes || []
    const jobs = jobsData?.data?.jobs || []
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome banner */}
            <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-48 opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
                <p className="text-primary-200 text-sm font-medium">{greeting} 👋</p>
                <h1 className="font-heading text-2xl md:text-3xl font-bold mt-1">{user?.fullName}</h1>
                <p className="text-primary-200 mt-1 text-sm">
                    {resumes.length === 0 ? "Let's get started — create your first resume!" : `You have ${resumes.length} resume${resumes.length > 1 ? 's' : ''}. Keep applying!`}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link to="/dashboard/resume/builder" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors">
                        <Plus size={16} /> New Resume
                    </Link>
                    <Link to="/dashboard/jobs" className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
                        Browse Jobs <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Resumes', value: resumes.length, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                    { label: 'Downloads Left', value: Math.max(0, 2 - (user?.resumeDownloadsUsed || 0)), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Saved Jobs', value: user?.savedJobs?.length || 0, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Profile %', value: `${user?.profileCompleteness || 0}%`, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map((stat) => (
                    <div key={stat.label} className="card flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                            <stat.icon size={22} className={stat.color} />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-3">Quick Actions</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    {quickActions.map(({ to, label, icon: Icon, color, text, desc }) => (
                        <Link key={to} to={to} className={`${color} ${text} rounded-2xl p-5 flex flex-col gap-2 shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group`}>
                            <Icon size={24} />
                            <p className="font-heading font-bold text-lg">{label}</p>
                            <p className="text-sm opacity-80">{desc}</p>
                            <ArrowRight size={16} className="mt-auto group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Latest Jobs */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">Latest Jobs</h2>
                    <Link to="/dashboard/jobs" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
                </div>
                <div className="space-y-3">
                    {jobs.length === 0 ? (
                        <div className="card text-center py-8 text-gray-400">
                            <Clock size={32} className="mx-auto mb-2 opacity-40" />
                            <p>New jobs will appear here once approved</p>
                        </div>
                    ) : jobs.map(job => (
                        <Link key={job._id} to={`/dashboard/jobs/${job._id}`}
                            className="card flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 transition-all cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">
                                {job.company?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{job.company} · {job.location}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <span className={`badge ${job.remote === 'remote' ? 'badge-success' : 'badge-primary'}`}>
                                    {job.remote === 'remote' ? 'Remote' : job.jobType}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* My Resumes */}
            {resumes.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">My Resumes</h2>
                        <Link to="/dashboard/resume" className="text-sm text-primary-600 hover:underline flex items-center gap-1">Manage <ArrowRight size={14} /></Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resumes.slice(0, 3).map(r => (
                            <Link key={r._id} to={`/dashboard/resume/builder/${r._id}`}
                                className="card hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <FileText size={20} className="text-primary-600" />
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{r.title}</p>
                                </div>
                                {r.lastAtsScore && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${r.lastAtsScore}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-primary-600">ATS: {r.lastAtsScore}</span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2">Updated {new Date(r.updatedAt).toLocaleDateString()}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
