import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Shield, Crown, Ban, Check } from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search, page],
        queryFn: () => adminAPI.getUsers({ search, page, limit: 20 }),
        keepPreviousData: true,
    })

    const users = data?.data?.users || []
    const pagination = data?.data?.pagination || {}

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
        onSuccess: () => { toast.success('User updated!'); qc.invalidateQueries(['admin-users']) },
        onError: () => toast.error('Update failed'),
    })

    return (
        <div className="space-y-5">
            <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-500 text-sm">View and manage all registered users</p>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search users by name or email..."
                    className="input pl-9" />
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="card h-16 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Role</th>
                                    <th className="px-4 py-3 text-left">Joined</th>
                                    <th className="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">
                                                    {user.photo ? <img src={user.photo} alt="" className="w-full h-full rounded-full object-cover" /> : user.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {user.isActive ? 'Active' : 'Deactivated'}
                                            </span>
                                            {user.isPremium && <span className="badge badge-warning ml-1">Premium</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button title={user.isActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } })}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                                    {user.isActive ? <Ban size={14} className="text-red-400" /> : <Check size={14} className="text-green-500" />}
                                                </button>
                                                <button title={user.isPremium ? 'Remove Premium' : 'Grant Premium'}
                                                    onClick={() => updateMutation.mutate({ id: user._id, data: { isPremium: !user.isPremium } })}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                                    <Crown size={14} className={user.isPremium ? 'text-amber-500' : 'text-gray-400'} />
                                                </button>
                                                {user.role !== 'admin' && (
                                                    <button title="Make Admin"
                                                        onClick={() => { if (confirm(`Make ${user.fullName} an admin?`)) updateMutation.mutate({ id: user._id, data: { role: 'admin' } }) }}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                                        <Shield size={14} className="text-gray-400 hover:text-red-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-secondary text-sm px-3 py-2">← Prev</button>
                    <span className="text-sm text-gray-500">{page} / {pagination.pages} ({pagination.total} users)</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages} className="btn-secondary text-sm px-3 py-2">Next →</button>
                </div>
            )}
        </div>
    )
}
