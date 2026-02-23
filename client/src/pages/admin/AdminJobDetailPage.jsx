import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Clock, ExternalLink, ArrowLeft, Building2, Briefcase, Calendar, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Helper for relative time
const getRelativeTime = (dateInput) => {
    if (!dateInput) return '';
    const diffHours = Math.round((new Date(dateInput).getTime() - Date.now()) / (1000 * 60 * 60));
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diffHours === 0) return 'Just now';
    if (diffHours > -24) return rtf.format(diffHours, 'hour');
    return rtf.format(Math.round(diffHours / 24), 'day');
};

export default function AdminJobDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({ queryKey: ['admin-job', id], queryFn: () => adminAPI.getJob(id) })
    const job = data?.data?.job

    const approveMutation = useMutation({
        mutationFn: () => adminAPI.approveJob(id),
        onSuccess: () => { toast.success('Job approved and is now live!'); qc.invalidateQueries(['admin-job', id]); qc.invalidateQueries(['admin-jobs']) },
    })

    const rejectMutation = useMutation({
        mutationFn: () => adminAPI.rejectJob(id, 'Does not meet standards'),
        onSuccess: () => { toast.success('Job rejected'); qc.invalidateQueries(['admin-job', id]); qc.invalidateQueries(['admin-jobs']) },
    })

    const deleteMutation = useMutation({
        mutationFn: () => adminAPI.deleteJob(id),
        onSuccess: () => { toast.success('Job deleted permanently'); navigate('/admin/jobs') },
    })

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-4xl">⌛</div></div>
    if (!job) return <div className="text-center py-12 text-gray-400">Job not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <ArrowLeft size={16} /> Back to Job Queue
                </button>
                <div className="flex items-center gap-3">
                    {job.status === 'pending' && (
                        <>
                            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm py-2">
                                <CheckCircle size={16} /> Approve
                            </button>
                            <button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} className="btn-secondary text-red-600 hover:text-red-700 flex items-center gap-2 text-sm py-2">
                                <XCircle size={16} /> Reject
                            </button>
                        </>
                    )}
                    <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm py-2">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Admin Status Panel</h2>
                        <div className="flex items-center gap-3">
                            <span className={`badge ${job.status === 'approved' ? 'badge-success' : job.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>Current Status: {job.status}</span>
                            <span className="text-sm text-gray-500">Source: <span className="font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{job.source}</span></span>
                            {job.sourceJobId && <span className="text-sm text-gray-500">Source ID: <span className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{job.sourceJobId}</span></span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-400 flex-shrink-0 border border-gray-100 dark:border-gray-800">
                        {job.companyLogo ? <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain rounded-2xl" /> : job.company?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-1">{job.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">{job.company}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                            {job.location && <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{job.location}</span>}
                            {job.remote && <span className={`badge ${job.remote === 'remote' ? 'badge-success' : 'badge-primary'}`}>{job.remote}</span>}
                            {job.jobType && <span className="badge badge-warning">{job.jobType}</span>}
                            {job.category && <span className="badge badge-primary"><Briefcase size={12} className="mr-1" />{job.category}</span>}
                            {job.sector && <span className="badge badge-primary"><Building2 size={12} className="mr-1" />{job.sector}</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-500"><Clock size={14} /> System Added: {new Date(job.createdAt).toLocaleString()}</span>
                            {job.approvedAt && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md"><CheckCircle size={14} /> Approved: {new Date(job.approvedAt).toLocaleString()}</span>}
                            {job.deadline && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md"><Calendar size={14} /> Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                        </div>
                    </div>
                </div>

                {job.salary?.isDisclosed && (job.salary.min || job.salary.max) && (
                    <div className="mt-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                        <p className="text-sm text-green-700 dark:text-green-400 font-semibold items-center flex gap-2">
                            💰 Salary Configuration Detected: {job.salary.currency} {job.salary.min?.toLocaleString()} — {job.salary.max?.toLocaleString()} / {job.salary.period}
                        </p>
                    </div>
                )}

                {job.applyLink && (
                    <div className="mt-5">
                        <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 justify-center w-full max-w-sm">
                            Validate External Application Link <ExternalLink size={14} />
                        </a>
                    </div>
                )}
            </div>

            <div className="card">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 text-lg border-b border-gray-100 dark:border-gray-800 pb-2">Job Description (Raw Preview)</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl font-mono text-xs overflow-x-auto border border-gray-100 dark:border-gray-800">
                    {job.description}
                </div>
            </div>

            {job.skills?.length > 0 && (
                <div className="card">
                    <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-3 text-lg">Parsed Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => <span key={index} className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium border border-primary-100/50">{skill}</span>)}
                    </div>
                </div>
            )}
        </div>
    )
}
