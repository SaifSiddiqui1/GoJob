import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react'
import useAdminAuthStore from '../../store/adminAuthStore'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
    const navigate = useNavigate()
    const { setAdminAuth, isAdminAuthenticated, isAdminRole } = useAdminAuthStore()

    // If already logged in as admin, redirect straight to admin panel
    if (isAdminAuthenticated && isAdminRole()) {
        navigate('/admin', { replace: true })
        return null
    }

    const [form, setForm] = useState({ email: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.email || !form.password) {
            setError('Both fields are required.')
            return
        }
        setLoading(true)
        try {
            const res = await authAPI.login({ login: form.email, password: form.password })
            const { user, token } = res.data
            if (user.role !== 'admin') {
                setError('Access denied. This portal is for administrators only.')
                setLoading(false)
                return
            }
            // Use admin auth store
            setAdminAuth(user, token)
            toast.success(`Welcome back, ${user.fullName}!`)
            navigate('/admin', { replace: true })
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid credentials.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            {/* Background grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                            <Shield size={28} className="text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white font-heading">Admin Portal</h1>
                        <p className="text-gray-500 text-sm mt-1">Restricted access — GoJob administrators only</p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-5 text-sm">
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    placeholder="admin@bltiwd.com"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-10 py-3 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition"
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    <Shield size={15} />
                                    Sign In to Admin Panel
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer links */}
                    <div className="mt-6 pt-5 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
                        <a href="/login" className="hover:text-gray-400 transition">← Regular user login</a>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            GoJob Admin v1.0
                        </span>
                    </div>
                </div>

                {/* Security notice */}
                <p className="text-center text-xs text-gray-700 mt-4">
                    🔒 All admin actions are logged and audited
                </p>
            </div>
        </div>
    )
}
