import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, ArrowRight } from 'lucide-react'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function SignupPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1=form, 2=verify OTP
    const [userId, setUserId] = useState(null)
    const [otp, setOtp] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', contactNumber: '', dateOfBirth: '' })

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

    const handleRegister = async (e) => {
        e.preventDefault()

        if (form.dateOfBirth) {
            const birthDate = new Date(form.dateOfBirth)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--
            }
            if (age < 15) {
                return toast.error('You need to be of valid age that is 15 years, wait few years and then comeback.')
            }
        }

        setLoading(true)
        try {
            const res = await authAPI.register(form)
            setUserId(res.data.userId)
            setStep(2)
            // In local dev without email: server returns the OTP so user doesn't need to check email
            if (res.data.devOtp) {
                setOtp(res.data.devOtp)
                toast.success(`📬 OTP auto-filled: ${res.data.devOtp} (email not configured — check server console)`)
            } else {
                toast.success('OTP sent to your email!')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await authAPI.verifyEmail({ userId, otp })
            useAuthStore.getState().setAuth(res.data.user, res.data.token)
            toast.success('Email verified! Welcome to GoJob 🎉')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        try {
            await authAPI.resendOTP({ userId })
            toast.success('New OTP sent!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP')
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
                        <span className="font-heading font-bold text-2xl text-white">GoJob</span>
                    </Link>
                    <h1 className="font-heading text-3xl font-bold text-white">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
                    <p className="text-primary-300 mt-2">{step === 1 ? 'Join thousands of job seekers' : `Enter the OTP sent to ${form.email}`}</p>
                </div>

                <div className="glass rounded-2xl p-8">
                    {step === 1 ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Social auth */}
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20">
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                    Google
                                </a>
                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20">
                                    <span className="text-base">⌥</span>
                                    GitHub
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-white/20" />
                                <span className="text-white/50 text-xs">or continue with email</span>
                                <div className="flex-1 h-px bg-white/20" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label text-white/80">Full Name *</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="John Doe"
                                            className="input bg-white/10 border-white/20 text-white placeholder-white/40 pl-9 focus:ring-white/30" />
                                    </div>
                                </div>
                                <div>
                                    <label className="label text-white/80">Username *</label>
                                    <input name="username" value={form.username} onChange={handleChange} required placeholder="johndoe"
                                        className="input bg-white/10 border-white/20 text-white placeholder-white/40" />
                                </div>
                            </div>
                            <div>
                                <label className="label text-white/80">Email *</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input name="email" value={form.email} onChange={handleChange} required type="email" placeholder="you@email.com"
                                        className="input bg-white/10 border-white/20 text-white placeholder-white/40 pl-9" />
                                </div>
                            </div>
                            <div>
                                <label className="label text-white/80">Password *</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input name="password" value={form.password} onChange={handleChange} required type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters"
                                        className="input bg-white/10 border-white/20 text-white placeholder-white/40 pl-9 pr-10" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label text-white/80">Contact</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="+91..."
                                            className="input bg-white/10 border-white/20 text-white placeholder-white/40 pl-9" />
                                    </div>
                                </div>
                                <div>
                                    <label className="label text-white/80">Date of Birth</label>
                                    <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date"
                                        max={new Date().toISOString().split('T')[0]}
                                        className="input bg-white/10 border-white/20 text-white" />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                                {loading ? <span className="animate-spin">⌛</span> : <>Create Account <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-5">
                            <div className="text-center py-4">
                                <div className="text-5xl mb-3">📧</div>
                                <p className="text-white/80 text-sm">We've sent a 6-digit code to your email</p>
                            </div>
                            <div>
                                <label className="label text-white/80 text-center block">Enter OTP</label>
                                <input value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}
                                    placeholder="000000"
                                    className="input bg-white/10 border-white/20 text-white placeholder-white/40 text-center text-3xl tracking-[0.5em] font-bold"
                                />
                            </div>
                            <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                            <button type="button" onClick={handleResend} className="text-white/60 hover:text-white text-sm w-full text-center">
                                Didn't get it? Resend OTP
                            </button>
                        </form>
                    )}
                    <p className="text-center text-white/60 text-sm mt-6">
                        Already have an account? <Link to="/login" className="text-amber-400 font-semibold hover:underline">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
