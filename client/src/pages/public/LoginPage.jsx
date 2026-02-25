import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github } from 'lucide-react'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await authAPI.login({ login, password })
            setAuth(res.data.user, res.data.token)
            toast.success(`Welcome back, ${res.data.user.fullName?.split(' ')[0]}! 👋`)
            navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard')
        } catch (err) {
            const data = err.response?.data
            if (data?.needsVerification) {
                navigate('/verify-email', { state: { userId: data.userId } })
            } else {
                toast.error(data?.message || 'Invalid credentials')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">G</span>
                        </div>
                        <span className="font-heading font-bold text-2xl text-white">JobVault</span>
                    </Link>
                    <h1 className="font-heading text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-primary-300 mt-2">Sign in to your account</p>
                </div>

                <div className="glass rounded-2xl p-8 space-y-5">
                    {/* Social auth */}
                    <div className="grid grid-cols-2 gap-3">
                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </a>
                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20">
                            <Github size={16} />
                            GitHub
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/20" />
                        <span className="text-white/50 text-xs">or continue with email</span>
                        <div className="flex-1 h-px bg-white/20" />
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="label text-white/80">Email / Username / Phone</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    value={login} onChange={e => setLogin(e.target.value)} required
                                    placeholder="your@email.com"
                                    className="input bg-white/10 border-white/20 text-white placeholder-white/40 pl-9" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="label text-white/80 mb-0">Password</label>
                                <Link to="/forgot-password" className="text-xs text-amber-400 hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    value={password} onChange={e => setPassword(e.target.value)} required
                                    type={showPassword ? 'text' : 'password'} placeholder="Your password"
                                    className="input bg-white/10 border-white/20 text-white placeholder-white/40 pl-9 pr-10" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                            {loading ? <span className="animate-spin">⌛</span> : <>Sign In <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <p className="text-center text-white/60 text-sm">
                        Don't have an account? <Link to="/signup" className="text-amber-400 font-semibold hover:underline">Create one free</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
