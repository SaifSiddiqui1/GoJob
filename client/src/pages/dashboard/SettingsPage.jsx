import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Moon, Sun, Bell, Trash2, AlertTriangle, Info } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { userAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const { user, updateUser, logout } = useAuthStore()
    const qc = useQueryClient()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const updateMutation = useMutation({
        mutationFn: (data) => userAPI.updateProfile(data),
        onSuccess: (res) => { updateUser(res.data.user); toast.success('Settings saved!') },
    })

    const deleteMutation = useMutation({
        mutationFn: () => userAPI.deleteAccount(),
        onSuccess: () => { toast.success('Account deleted'); logout() },
    })

    const toggle = (field) => {
        const newValue = !user?.[field]
        updateMutation.mutate({ [field]: newValue })
        if (field === 'darkMode') {
            if (newValue) document.documentElement.classList.add('dark')
            else document.documentElement.classList.remove('dark')
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Customize your GoJob experience</p>
            </div>

            {/* Appearance */}
            <div className="card space-y-4">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Appearance</h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {user?.darkMode ? <Moon size={20} className="text-primary-500" /> : <Sun size={20} className="text-amber-500" />}
                        <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">Dark Mode</p>
                            <p className="text-xs text-gray-400">Switch between light and dark theme</p>
                        </div>
                    </div>
                    <button onClick={() => toggle('darkMode')}
                        className={`relative w-11 h-6 rounded-full transition-colors ${user?.darkMode ? 'bg-primary-600' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${user?.darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Notifications & Preferences */}
            <div className="card space-y-4">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Notifications & Preferences</h2>
                {[
                    { field: 'jobAlerts', label: 'Job Alert Emails', desc: 'Receive email when new jobs match your profile', icon: Bell },
                    { field: 'locationBasedJobs', label: 'Location-Based Jobs', desc: 'Prioritize jobs near your saved location', icon: Info },
                ].map(({ field, label, desc, icon: Icon }) => (
                    <div key={field} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icon size={18} className="text-gray-500" />
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
                                <p className="text-xs text-gray-400">{desc}</p>
                            </div>
                        </div>
                        <button onClick={() => toggle(field)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${user?.[field] ? 'bg-primary-600' : 'bg-gray-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${user?.[field] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                ))}
                {user?.jobAlerts && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-xs text-green-700 dark:text-green-300">
                        ✅ Job alert emails will be sent to <strong>{user.email}</strong>
                    </div>
                )}
            </div>

            {/* About */}
            <div className="card">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-2">About GoJob</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    GoJob is an AI-powered ATS resume builder and job finder platform. Built to level the playing field for every job seeker in India. 100% free to start.
                </p>
                <div className="mt-3 flex gap-4 text-sm">
                    <button onClick={() => toast('Privacy Policy — coming soon')} className="text-primary-600 hover:underline">Privacy Policy</button>
                    <button onClick={() => toast('Terms of Service — coming soon')} className="text-primary-600 hover:underline">Terms of Service</button>
                    <span className="text-gray-300 ml-auto">v1.0.0</span>
                </div>
            </div>

            {/* Danger zone */}
            <div className="card border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h2 className="font-heading font-semibold text-red-600">Danger Zone</h2>
                </div>
                {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-2 border border-red-200 dark:border-red-800 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={14} /> Delete My Account
                    </button>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-red-600 font-medium">Are you sure? This cannot be undone. All your resumes and data will be permanently deleted.</p>
                        <div className="flex gap-3">
                            <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Everything'}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
