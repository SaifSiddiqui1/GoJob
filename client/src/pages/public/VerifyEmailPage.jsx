import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)

    const handleVerify = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await authAPI.verifyEmail({ userId: state?.userId, otp })
            const { default: useAuthStore } = await import('../../store/authStore')
            useAuthStore.getState().setAuth(res.data.user, res.data.token)
            toast.success('Email verified!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-8 w-full max-w-sm text-center">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="font-heading text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-white/60 text-sm mb-6">Enter the OTP from your email</p>
                <form onSubmit={handleVerify} className="space-y-4">
                    <input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required
                        placeholder="000000"
                        className="input bg-white/10 border-white/20 text-white placeholder-white/40 text-center text-2xl tracking-[0.4em] font-bold" />
                    <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>
            </div>
        </div>
    )
}
