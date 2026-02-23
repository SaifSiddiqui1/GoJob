import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Briefcase, Clock, CheckCircle, FileText, RefreshCw } from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
    const qc = useQueryClient()
    const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminAPI.getStats() })
    const stats = data?.data || {}

    const fetchMutation = useMutation({
        mutationFn: () => adminAPI.fetchJobs(),
        onSuccess: (res) => { toast.success(`Fetched! ${res.data.saved} new jobs added`); qc.invalidateQueries(['admin-stats']) },
        onError: () => toast.error('Job fetch failed'),
    })

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Pending Jobs', value: stats.pendingJobs || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Approved Jobs', value: stats.approvedJobs || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Total Resumes', value: stats.totalResumes || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm">Platform overview and controls</p>
                </div>
                <button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending}
                    className="btn-primary flex items-center gap-2 text-sm">
                    <RefreshCw size={15} className={fetchMutation.isPending ? 'animate-spin' : ''} />
                    {fetchMutation.isPending ? 'Fetching...' : 'Fetch New Jobs'}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={22} className={color} />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                    <a href="/admin/jobs" className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:shadow-sm transition-all">
                        <Clock size={20} className="text-amber-600 mb-2" />
                        <p className="font-semibold text-sm text-amber-900 dark:text-amber-300">Review Pending Jobs</p>
                        <p className="text-xs text-amber-600 mt-1">{stats.pendingJobs || 0} awaiting review</p>
                    </a>
                    <a href="/admin/users" className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-sm transition-all">
                        <Users size={20} className="text-blue-600 mb-2" />
                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-300">Manage Users</p>
                        <p className="text-xs text-blue-600 mt-1">{stats.totalUsers || 0} registered users</p>
                    </a>
                    <a href="/admin/study" className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-sm transition-all">
                        <FileText size={20} className="text-purple-600 mb-2" />
                        <p className="font-semibold text-sm text-purple-900 dark:text-purple-300">Add Study Material</p>
                        <p className="text-xs text-purple-600 mt-1">Upload resources for users</p>
                    </a>
                </div>
            </div>
        </div>
    )
}
