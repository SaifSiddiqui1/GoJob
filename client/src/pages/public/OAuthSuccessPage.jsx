import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function OAuthSuccessPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    useEffect(() => {
        const token = params.get('token')
        if (!token) return navigate('/login')

        // Temporarily set token to fetch user
        useAuthStore.setState({ token })
        authAPI.getMe().then(res => {
            setAuth(res.data.user, token)
            toast.success(`Welcome, ${res.data.user.fullName.split(' ')[0]}! 🎉`)
            navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard')
        }).catch(() => {
            toast.error('OAuth login failed')
            navigate('/login')
        })
    }, [])

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
            <div className="text-center text-white">
                <div className="text-5xl mb-4 animate-bounce">🔐</div>
                <p className="text-xl font-semibold">Completing sign in...</p>
            </div>
        </div>
    )
}
