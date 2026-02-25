import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAdminAuthStore = create(
    persist(
        (set, get) => ({
            adminUser: null,
            adminToken: null,
            isAdminAuthenticated: false,

            setAdminAuth: (adminUser, adminToken) => set({ adminUser, adminToken, isAdminAuthenticated: true }),

            updateAdminUser: (userData) => set((state) => ({
                adminUser: { ...state.adminUser, ...userData },
            })),

            adminLogout: () => {
                set({ adminUser: null, adminToken: null, isAdminAuthenticated: false })
                window.location.href = '/admin/login'
            },

            isAdminRole: () => get().adminUser?.role === 'admin',
        }),
        {
            name: 'jobvault-admin-auth',
            partialize: (state) => ({ adminToken: state.adminToken, adminUser: state.adminUser, isAdminAuthenticated: state.isAdminAuthenticated }),
        }
    )
)

export default useAdminAuthStore
