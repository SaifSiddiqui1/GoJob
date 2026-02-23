import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData },
            })),

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false })
                window.location.href = '/login'
            },

            isAdmin: () => get().user?.role === 'admin',

            isPremium: () => {
                const user = get().user
                return user?.isPremium && user?.premiumExpiresAt > new Date().toISOString()
            },
        }),
        {
            name: 'gojob-auth',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
)

export default useAuthStore
