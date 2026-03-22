import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [userId, setUserId] = useState(null)
    const [form, setForm] = useState({ email: '', otp: '', newPassword: '' })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleForgot = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await authAPI.forgotPassword({ email: form.email })
            // userId is at top-level in response (not nested in .data)
            const uid = res.userId || res.data?.userId
            setUserId(uid)
            if (res.devOtp) {
                setForm(p => ({ ...p, otp: res.devOtp }))
                toast.success(`📧 OTP auto-filled: ${res.devOtp} (check server console — email not configured)`)
            } else {
                toast.success('OTP sent! Check your email (or server console if email not set up)')
            }
            setStep(2)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally { setLoading(false) }
    }

    const handleReset = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authAPI.resetPassword({ userId, otp: form.otp, newPassword: form.newPassword })
            toast.success('Password reset! Please log in.')
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-8 w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">{step === 1 ? '🔑' : '🔐'}</div>
                    <h2 className="font-heading text-2xl font-bold text-white">{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
                    <p className="text-white/60 text-sm mt-1">{step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}</p>
                </div>
                {step === 1 ? (
                    <form onSubmit={handleForgot} className="space-y-4">
                        <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" required
                            placeholder="your@email.com" className="input bg-white/10 border-white/20 text-white placeholder-white/40" />
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Sending...' : 'Send OTP'}</button>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                        <input value={form.otp} onChange={e => setForm(p => ({ ...p, otp: e.target.value }))} maxLength={6}
                            placeholder="Enter OTP" className="input bg-white/10 border-white/20 text-white placeholder-white/40 text-center text-xl tracking-widest" />
                        <div className="relative">
                            <input value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} type={showPassword ? "text" : "password"}
                                placeholder="New password" className="input bg-white/10 border-white/20 text-white placeholder-white/40 pr-10" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Resetting...' : 'Reset Password'}</button>
                    </form>
                )}
                <p className="text-center text-white/60 text-sm mt-4">
                    <Link to="/login" className="text-amber-400 hover:underline">Back to Login</Link>
                </p>
            </div>
        </div>
    )
}
