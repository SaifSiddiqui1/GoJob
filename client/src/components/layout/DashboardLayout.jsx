import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
    LayoutDashboard, User, FileText, Briefcase, BookOpen,
    Wrench, Settings, LogOut, Menu, X, ChevronRight, Crown, Bell, Check
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
    { to: '/dashboard/resume', label: 'Resume', icon: FileText },
    { to: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/dashboard/study', label: 'Study Materials', icon: BookOpen },
    { to: '/dashboard/tools', label: 'Tools', icon: Wrench },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [premiumModal, setPremiumModal] = useState(false)
    const { user, logout, isAdmin } = useAuthStore()
    const navigate = useNavigate()

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">G</span>
                        </div>
                        <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">GoJob</span>
                    </div>
                    <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* User info */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 overflow-hidden flex-shrink-0">
                            {user?.photo ? (
                                <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-lg">
                                    {user?.fullName?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                        </div>
                        {user?.isPremium && (
                            <Crown size={16} className="text-amber-500 flex-shrink-0" />
                        )}
                    </div>
                    {/* Profile completeness */}
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Profile</span><span>{user?.profileCompleteness || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${user?.profileCompleteness || 0}%` }} />
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon size={18} />
                            <span>{label}</span>
                            {label === 'Resume' && (
                                <span className="ml-auto badge badge-primary text-[10px]">Builder</span>
                            )}
                        </NavLink>
                    ))}
                    {isAdmin() && (
                        <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Settings size={18} />
                            <span>Admin Panel</span>
                            <ChevronRight size={14} className="ml-auto" />
                        </NavLink>
                    )}
                </nav>

                {/* Upgrade banner (non-premium) */}
                {!user?.isPremium && (
                    <div className="m-3 p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                        <p className="text-xs font-semibold">🚀 Upgrade to Premium</p>
                        <p className="text-xs text-primary-200 mt-0.5">Unlimited downloads, AI enhancer & more</p>
                        <button onClick={() => setPremiumModal(true)}
                            className="mt-2 w-full text-xs bg-white text-primary-700 font-bold py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                            Upgrade — ₹99/mo
                        </button>
                    </div>
                )}

                {/* Logout */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top navbar */}
                <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
                    <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu size={22} className="text-gray-600" />
                    </button>
                    <div className="flex-1" />
                    <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="page-enter">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Premium Upgrade Modal */}
            {premiumModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Crown size={22} className="text-amber-500" />
                                <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">GoJob Premium</h2>
                            </div>
                            <button onClick={() => setPremiumModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="text-center mb-5">
                            <div className="text-4xl font-heading font-bold text-gray-900 dark:text-white">₹99<span className="text-sm text-gray-400 font-normal">/month</span></div>
                            <p className="text-xs text-gray-400 mt-1">Cancel anytime · No hidden charges</p>
                        </div>

                        <ul className="space-y-2 mb-5">
                            {[
                                'Unlimited resume downloads',
                                'AI resume enhancement (unlimited)',
                                'Priority ATS score checks',
                                'Cover letter generator (unlimited)',
                                'Advanced skill gap analysis',
                                'Premium job alerts by email',
                            ].map(f => (
                                <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Check size={14} className="text-green-500 flex-shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>

                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 mb-4">
                            💳 To upgrade, send ₹99 via UPI to <strong>gojob@upi</strong> and email your transaction ID to <strong>premium@gojob.app</strong>. Your account will be upgraded within 24 hours.
                        </div>

                        <button onClick={() => { setPremiumModal(false); window.open('mailto:premium@gojob.app?subject=Premium Upgrade&body=Hi, I have sent ₹99 via UPI. My transaction ID is: ', '_blank') }}
                            className="btn-primary w-full flex items-center justify-center gap-2">
                            <Crown size={15} /> Upgrade Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
