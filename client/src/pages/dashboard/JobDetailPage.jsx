import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Clock, Bookmark, BookmarkCheck, ExternalLink, ArrowLeft, Building2, Briefcase, Calendar } from 'lucide-react'
import { jobsAPI, userAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

// Helper for exact date and time formatting
const formatDateTime = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return `on ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function JobDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({ queryKey: ['job', id], queryFn: () => jobsAPI.getOne(id) })
    const job = data?.data?.job

    const saveMutation = useMutation({
        mutationFn: () => userAPI.toggleSavedJob(id),
        onSuccess: (res) => { toast.success(res.saved ? 'Job saved!' : 'Removed from saved'); qc.invalidateQueries(['auth']) },
    })

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-4xl">⌛</div></div>
    if (!job) return <div className="text-center py-12 text-gray-400">Job not found</div>

    const isSaved = user?.savedJobs?.includes(id)

    return (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <ArrowLeft size={16} /> Back to Jobs
            </button>

            <div className="card">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-400 flex-shrink-0">
                        {job.companyLogo ? <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain rounded-2xl" /> : job.company?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-heading text-xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{job.company}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {job.location && <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} />{job.location}</span>}
                            {job.remote && <span className={`badge ${job.remote === 'remote' ? 'badge-success' : 'badge-primary'}`}>{job.remote}</span>}
                            {job.jobType && <span className="badge badge-warning">{job.jobType}</span>}
                            {job.sector && <span className="badge badge-primary"><Building2 size={10} className="mr-1" />{job.sector}</span>}
                            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500 font-medium bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md"><Clock size={13} /> Added {formatDateTime(job.approvedAt || job.createdAt)}</span>
                            {job.deadline && <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md"><Calendar size={13} /> Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                        </div>
                    </div>
                </div>

                {job.salary?.isDisclosed && (job.salary.min || job.salary.max) && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                            💰 {job.salary.currency} {job.salary.min?.toLocaleString()} — {job.salary.max?.toLocaleString()} / {job.salary.period}
                        </p>
                    </div>
                )}

                <div className="flex gap-3 mt-5">
                    {job.applyLink && (
                        <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2 flex-1 justify-center">
                            Apply Now <ExternalLink size={14} />
                        </a>
                    )}
                    <button onClick={() => saveMutation.mutate()} className="btn-secondary flex items-center gap-2">
                        {isSaved ? <><BookmarkCheck size={16} className="text-primary-600" /> Saved</> : <><Bookmark size={16} /> Save</>}
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="card">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">Job Description</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">
                    {job.description}
                </div>
            </div>

            {job.skills?.length > 0 && (
                <div className="card">
                    <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {job.skills.map(skill => <span key={skill} className="px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium">{skill}</span>)}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => navigate('/dashboard/resume/ats-check', {
                        state: {
                            jobDescription: job.description || '',
                            jobTitle: job.title,
                            company: job.company,
                        }
                    })}
                    className="flex-1 text-center btn-secondary text-sm"
                >
                    🎯 Check ATS Match for This Job
                </button>
            </div>
        </div>
    )
}
