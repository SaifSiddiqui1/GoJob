import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, MapPin, ExternalLink, RefreshCw, Trash2, Webhook, X, Copy, Eye } from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all']

export default function AdminJobs() {
    const [status, setStatus] = useState('pending')
    const [page, setPage] = useState(1)
    const [showN8n, setShowN8n] = useState(false)
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin-jobs', status, page],
        queryFn: () => adminAPI.getJobs({ status, page, limit: 15 }),
        keepPreviousData: true,
    })

    const jobs = data?.data?.jobs || []
    const pagination = data?.data?.pagination || {}

    const approveMutation = useMutation({
        mutationFn: (id) => adminAPI.approveJob(id),
        onSuccess: () => { toast.success('✅ Job approved and live!'); qc.invalidateQueries(['admin-jobs']) },
    })

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => adminAPI.rejectJob(id, reason),
        onSuccess: () => { toast.success('Job rejected'); qc.invalidateQueries(['admin-jobs']) },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => adminAPI.deleteJob(id),
        onSuccess: () => { toast.success('Job deleted'); qc.invalidateQueries(['admin-jobs']) },
    })

    const fetchMutation = useMutation({
        mutationFn: () => adminAPI.fetchJobs(),
        onSuccess: (res) => { toast.success(`${res.data.saved} new jobs fetched!`); qc.invalidateQueries(['admin-jobs']) },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Job Approval Queue</h1>
                    <p className="text-gray-500 text-sm">Review jobs from APIs before they go live to users</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowN8n(true)} className="btn-secondary flex items-center gap-2 text-sm">
                        <Webhook size={14} className="text-primary-600" /> Connect Webhook (N8N)
                    </button>
                    <button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
                        <RefreshCw size={14} className={fetchMutation.isPending ? 'animate-spin' : ''} /> Fetch New Jobs
                    </button>
                </div>
            </div>

            {/* Status tabs */}
            <div className="flex gap-2">
                {STATUS_TABS.map(s => (
                    <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {s}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
            ) : jobs.length === 0 ? (
                <div className="card text-center py-12">
                    <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No {status} jobs</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map(job => (
                        <div key={job._id} className="card">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{job.title}</h3>
                                        <span className={`badge ${job.status === 'approved' ? 'badge-success' : job.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{job.status}</span>
                                        <span className="badge badge-primary text-[10px]">{job.source}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{job.company} · {job.location}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{job.category} · {job.remote} · {job.jobType}</p>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.description?.substring(0, 150)}...</p>
                                </div>
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    {job.applyLink && (
                                        <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="View Original">
                                            <ExternalLink size={14} className="text-gray-400" />
                                        </a>
                                    )}
                                    {job.status === 'pending' && (
                                        <>
                                            <button onClick={() => approveMutation.mutate(job._id)} disabled={approveMutation.isPending}
                                                className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Approve">
                                                <CheckCircle size={18} className="text-green-600" />
                                            </button>
                                            <button onClick={() => rejectMutation.mutate({ id: job._id, reason: 'Does not meet standards' })} disabled={rejectMutation.isPending}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Reject">
                                                <XCircle size={18} className="text-red-500" />
                                            </button>
                                        </>
                                    )}
                                    <Link to={`/admin/jobs/${job._id}`} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="View details">
                                        <Eye size={18} className="text-blue-500" />
                                    </Link>
                                    <button onClick={() => deleteMutation.mutate(job._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete permanently">
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                            {job.status === 'approved' && (
                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-green-600">
                                    ✅ Approved — visible to {pagination.total} users
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-secondary text-sm px-3 py-2">← Prev</button>
                    <span className="text-sm text-gray-500">{page} / {pagination.pages} ({pagination.total} total)</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages} className="btn-secondary text-sm px-3 py-2">Next →</button>
                </div>
            )}

            {/* N8N Webhook Modal */}
            {showN8n && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowN8n(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Webhook size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white font-heading">N8N / Webhook Integration</h2>
                                    <p className="text-sm text-gray-500">Push jobs from n8n, Make.com, or any external service</p>
                                </div>
                            </div>
                            <button onClick={() => setShowN8n(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">1. Webhook URL (POST)</h3>
                                <code className="block bg-gray-100 dark:bg-gray-950 p-2.5 rounded-lg text-sm text-primary-600 dark:text-primary-400 font-mono break-all border border-gray-200 dark:border-gray-800">
                                    {window.location.origin}/api/admin/webhook/n8n
                                </code>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">2. Authentication Header</h3>
                                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-950 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 cursor-copy" onClick={() => { navigator.clipboard.writeText('Authorization: Bearer jobvault_n8n_secret_123'); toast.success('Header copied') }}>
                                    <code className="text-sm font-mono text-gray-800 dark:text-gray-300">
                                        <span className="text-gray-500">Authorization:</span> Bearer jobvault_n8n_secret_123
                                    </code>
                                    <Copy size={14} className="text-gray-400" />
                                </div>
                                <p className="text-xs text-amber-500 mt-2">Note: To change this secret, set N8N_WEBHOOK_SECRET in your server .env file.</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">3. JSON Payload (Send 1 object or an array of jobs)</h3>
                                <pre className="bg-gray-950 p-4 rounded-lg text-xs text-green-400 font-mono overflow-auto border border-gray-800">
                                    {`[{
  "title": "Senior React Developer",
  "company": "TechFusion Inc",
  "location": "New York, NY",
  "remote": "remote", // "remote" or "on-site"
  "description": "Full job description text...",
  "applyLink": "https://company.com/career/123",
  "category": "sde", // sde, marketing, sales, it, customer_support
  "jobType": "full-time",
  "salary": { "isDisclosed": true, "min": 120000, "max": 150000, "currency": "USD" },
  "skills": ["React", "Node.js", "TypeScript"]
}]`}
                                </pre>
                                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    Jobs sent via webhook must still be approved in this queue before users see them.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
