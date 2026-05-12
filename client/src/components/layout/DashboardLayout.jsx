import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import {
    LayoutDashboard, User, FileText, Briefcase, BookOpen,
    Wrench, Settings, LogOut, Crown, Bell, Sparkles,
    ChevronDown, Shield, Zap, Search, ScanLine, Target,
    GraduationCap, BrainCircuit, PenLine, BarChart3,
    Star, Rocket, CheckCircle2, Menu, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import PremiumModal from '../ui/PremiumModal'

// ── Navigation Config ────────────────────────────────────────────────────────
// Each group: { label, to? (direct link), items? (dropdown), action? }
const NAV_GROUPS = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        end: true,
    },
    {
        label: 'Resume',
        icon: FileText,
        items: [
            {
                label: 'Resume Builder',
                desc: 'Create ATS-ready resumes with 17 templates',
                icon: FileText,
                to: '/dashboard/resume',
                badge: 'AI',
                badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
            },
            {
                label: 'ATS Checker',
                desc: 'Scan & optimize resume for job descriptions',
                icon: ScanLine,
                to: '/dashboard/resume/ats-check',
                badge: 'Smart',
                badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            },
        ],
    },
    {
        label: 'Jobs',
        icon: Briefcase,
        items: [
            {
                label: 'Browse Jobs',
                desc: 'Search thousands of curated job listings',
                icon: Briefcase,
                to: '/dashboard/jobs',
            },
            {
                label: 'Job Tracker',
                desc: 'Track applications & interview stages',
                icon: Target,
                to: '/dashboard/jobs',
                badge: 'Soon',
                badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            },
        ],
    },
    {
        label: 'AI Tools',
        icon: Sparkles,
        items: [
            {
                label: 'AI Suite',
                desc: 'Cover letter, summary & interview prep',
                icon: Sparkles,
                to: '/dashboard/ai-tools',
                badge: 'New',
                badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            },
            {
                label: 'Tools & Utilities',
                desc: 'Resume tools, keyword optimizer & more',
                icon: Wrench,
                to: '/dashboard/tools',
            },
        ],
    },
    {
        label: 'Study',
        icon: BookOpen,
        to: '/dashboard/study',
    },
    {
        label: 'Pricing',
        icon: Star,
        action: 'premium',
    },
]

// ── Shared: Portal Dropdown Shell ────────────────────────────────────────────
function usePortalDropdown() {
    const [open, setOpen]   = useState(false)
    const [pos,  setPos]    = useState({ top: 0, left: 0 })
    const triggerRef        = useRef(null)
    const panelRef          = useRef(null)
    const location          = useLocation()

    const updatePos = useCallback(() => {
        if (!triggerRef.current) return
        const r = triggerRef.current.getBoundingClientRect()
        setPos({ top: r.bottom, left: r.left })
    }, [])

    const toggle = () => { if (!open) updatePos(); setOpen(v => !v) }
    const close  = () => setOpen(false)

    useEffect(() => {
        if (!open) return
        const reposition = () => updatePos()
        window.addEventListener('scroll', reposition, true)
        window.addEventListener('resize', reposition)
        return () => {
            window.removeEventListener('scroll', reposition, true)
            window.removeEventListener('resize', reposition)
        }
    }, [open, updatePos])

    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                panelRef.current   && !panelRef.current.contains(e.target)
            ) close()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    useEffect(() => { close() }, [location.pathname])

    return { open, toggle, close, pos, triggerRef, panelRef }
}

// ── Top Nav Group (with optional dropdown) ────────────────────────────────────
function NavGroup({ group, setPremiumModal }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { open, toggle, close, pos, triggerRef, panelRef } = usePortalDropdown()

    // Determine if this group is active
    const isGroupActive = group.to
        ? (group.end ? location.pathname === group.to : location.pathname.startsWith(group.to))
        : group.items?.some(item => location.pathname.startsWith(item.to))

    const handleClick = () => {
        if (group.action === 'premium') { setPremiumModal(true); return }
        if (group.to) { navigate(group.to); return }
        toggle()
    }

    const panel = open && group.items ? ReactDOM.createPortal(
        <>
            {/* Backdrop */}
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={close} />

            {/* Dropdown panel */}
            <div
                ref={panelRef}
                style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, minWidth: 300, animation: 'fadeSlideDown 0.15s ease-out' }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/20 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                {/* Items */}
                <div className="p-2">
                    {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                        return (
                            <button
                                key={item.to}
                                onClick={() => { navigate(item.to); close() }}
                                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all group
                                    ${isActive
                                        ? 'bg-violet-50 dark:bg-violet-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                                    ${isActive ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}`}>
                                    <Icon size={18} className={isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-100'}`}>
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor || 'bg-gray-100 text-gray-600'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    {item.desc && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
                                    )}
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />}
                            </button>
                        )
                    })}
                </div>
            </div>
        </>,
        document.body
    ) : null

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleClick}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 select-none whitespace-nowrap
                    ${isGroupActive || (open && group.items)
                        ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20'
                        : group.action === 'premium'
                            ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
            >
                {/* Active underline indicator */}
                {isGroupActive && !open && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-violet-500 rounded-full" />
                )}
                {group.label}
                {group.items && (
                    <ChevronDown size={14}
                        className={`transition-transform duration-200 ${open ? 'rotate-180 text-violet-500' : 'text-gray-400'}`} />
                )}
            </button>
            {panel}
        </>
    )
}

// ── User Account Menu (right side) ────────────────────────────────────────────
function UserMenu({ user, logout, isAdmin, setPremiumModal }) {
    const { open, toggle, close, pos, triggerRef, panelRef } = usePortalDropdown()
    const navigate = useNavigate()

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?'

    const panel = open ? ReactDOM.createPortal(
        <>
            {/* Backdrop */}
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={close} />

            {/* Panel — right-aligned by computing left from trigger rect */}
            <div
                ref={panelRef}
                style={{
                    position: 'fixed',
                    top: pos.top,
                    left: Math.max(8, pos.left - 280 + (triggerRef.current?.offsetWidth || 40)),
                    zIndex: 9999,
                    width: 280,
                    animation: 'fadeSlideDown 0.15s ease-out',
                }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/20 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                {/* User card */}
                <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/20 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-md overflow-hidden">
                            {user?.photo
                                ? <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
                                : initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.fullName || 'User'}</p>
                                {user?.isPremium && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                        </div>
                        {user?.isPremium
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">PRO</span>
                            : <button onClick={() => { close(); setPremiumModal(true) }}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 hover:bg-violet-200 transition-colors">
                                Upgrade
                            </button>
                        }
                    </div>
                    <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                            <span>Profile completion</span>
                            <span className="font-semibold">{user?.profileCompleteness || 0}%</span>
                        </div>
                        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${user?.profileCompleteness || 0}%` }} />
                        </div>
                    </div>
                </div>

                {/* Nav shortcuts */}
                <div className="p-2">
                    {[
                        { label: 'My Profile',  icon: User,     to: '/dashboard/profile',  iconCls: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                        { label: 'Settings',     icon: Settings, to: '/dashboard/settings', iconCls: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
                    ].map(item => (
                        <button key={item.to} onClick={() => { navigate(item.to); close() }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconCls}`}>
                                <item.icon size={15} />
                            </div>
                            {item.label}
                        </button>
                    ))}
                    {isAdmin?.() && (
                        <button onClick={() => { navigate('/admin'); close() }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900/20 text-red-500">
                                <Shield size={15} />
                            </div>
                            Admin Panel
                        </button>
                    )}
                </div>

                {/* Upgrade banner */}
                {!user?.isPremium && (
                    <div className="mx-2 mb-2 p-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Zap size={12} className="text-yellow-300" />
                            <p className="text-xs font-bold">Go Premium</p>
                        </div>
                        <p className="text-[11px] text-violet-200 mb-2 leading-snug">AI cover letter, unlimited downloads & more</p>
                        <button onClick={() => { close(); setPremiumModal(true) }}
                            className="w-full text-xs bg-white text-violet-700 font-bold py-1.5 rounded-lg hover:bg-violet-50 transition-colors">
                            Upgrade — ₹99/mo
                        </button>
                    </div>
                )}

                {/* Logout */}
                <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => { close(); logout() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                            <LogOut size={15} className="text-red-500" />
                        </div>
                        Sign Out
                    </button>
                </div>
            </div>
        </>,
        document.body
    ) : null

    return (
        <>
            <button
                ref={triggerRef}
                onClick={toggle}
                className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl transition-all border select-none
                    ${open
                        ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:bg-violet-50/40 shadow-sm hover:shadow-md'
                    }`}
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden shadow-sm">
                    {user?.photo
                        ? <img src={user.photo} alt="" className="w-full h-full object-cover" />
                        : initials}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold text-gray-800 dark:text-white truncate max-w-[100px]">
                        {user?.fullName?.split(' ')[0] || 'Account'}
                    </span>
                    {user?.isPremium && (
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Crown size={9} /> PRO
                        </span>
                    )}
                </div>
                <ChevronDown size={14}
                    className={`transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180 text-violet-500' : 'text-gray-400'}`} />
            </button>
            {panel}
        </>
    )
}

// ── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ isOpen, onClose, user, logout, setPremiumModal }) {
    const navigate = useNavigate()
    const location = useLocation()

    const ALL_ITEMS = [
        { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard',                end: true },
        { label: 'Resume',      icon: FileText,         to: '/dashboard/resume' },
        { label: 'ATS Checker', icon: ScanLine,         to: '/dashboard/resume/ats-check' },
        { label: 'Jobs',        icon: Briefcase,        to: '/dashboard/jobs' },
        { label: 'AI Suite',    icon: Sparkles,         to: '/dashboard/ai-tools' },
        { label: 'Tools',       icon: Wrench,           to: '/dashboard/tools' },
        { label: 'Study',       icon: BookOpen,         to: '/dashboard/study' },
        { label: 'Profile',     icon: User,             to: '/dashboard/profile' },
        { label: 'Settings',    icon: Settings,         to: '/dashboard/settings' },
    ]

    useEffect(() => { onClose() }, [location.pathname])

    if (!isOpen) return null

    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9997]" onClick={onClose} />
            <div className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-[9998] shadow-2xl flex flex-col animate-slide-in-left overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-600 to-indigo-600">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Rocket size={18} className="text-white" />
                        </div>
                        <span className="text-lg font-extrabold text-white tracking-tight">JobVault</span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* User card */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : (user?.fullName?.charAt(0) || '?')}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.fullName}</p>
                            <p className="text-xs text-gray-500">@{user?.username}</p>
                        </div>
                    </div>
                </div>

                {/* Nav items */}
                <div className="flex-1 overflow-y-auto p-2">
                    {ALL_ITEMS.map(item => {
                        const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
                        return (
                            <button key={item.to} onClick={() => navigate(item.to)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5
                                    ${isActive ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <item.icon size={17} className={isActive ? 'text-violet-600' : 'text-gray-500'} />
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                {/* Bottom */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    {!user?.isPremium && (
                        <button onClick={() => { onClose(); setPremiumModal(true) }}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            <Zap size={15} className="text-yellow-300" /> Upgrade — ₹99/mo
                        </button>
                    )}
                    <button onClick={() => { onClose(); logout() }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}

// ── Dashboard Layout ──────────────────────────────────────────────────────────
export default function DashboardLayout() {
    const [premiumModal, setPremiumModal] = useState(false)
    const [mobileOpen,   setMobileOpen]   = useState(false)
    const { user, logout, isAdmin } = useAuthStore()

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

            {/* ━━━ TOP NAVBAR (Jobscan-style) ━━━ */}
            <header
                className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
                style={{ position: 'relative', zIndex: 100, isolation: 'isolate' }}
            >
                <div className="px-4 lg:px-6 h-[60px] flex items-center gap-2">

                    {/* Mobile hamburger */}
                    <button onClick={() => setMobileOpen(true)}
                        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
                        <Menu size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* ── LOGO ── */}
                    <NavLink to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/25 overflow-hidden">
                            <img src="/logo.png" alt="JobVault" className="h-5 w-auto object-contain" />
                        </div>
                        <span className="hidden sm:block text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            JobVault
                        </span>
                    </NavLink>

                    {/* ── CENTRE NAV GROUPS (desktop only) ── */}
                    <nav className="hidden lg:flex items-center gap-1 flex-1">
                        {NAV_GROUPS.map(group => (
                            <NavGroup key={group.label} group={group} setPremiumModal={setPremiumModal} />
                        ))}
                    </nav>

                    {/* ── SPACER (mobile) ── */}
                    <div className="flex-1 lg:hidden" />

                    {/* ── RIGHT SIDE ── */}
                    <div className="flex items-center gap-2 flex-shrink-0">

                        {/* Notification bell */}
                        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Bell size={18} className="text-gray-600 dark:text-gray-400" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                        </button>

                        {/* Upgrade CTA (desktop only, for free users) */}
                        {!user?.isPremium && (
                            <button onClick={() => setPremiumModal(true)}
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 transition-all">
                                <Crown size={13} /> Go Premium
                            </button>
                        )}

                        {/* User menu */}
                        <UserMenu
                            user={user}
                            logout={logout}
                            isAdmin={isAdmin}
                            setPremiumModal={setPremiumModal}
                        />
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            <MobileDrawer
                isOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                user={user}
                logout={logout}
                setPremiumModal={setPremiumModal}
            />

            {/* ━━━ PAGE CONTENT ━━━ */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="page-enter max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            <PremiumModal isOpen={premiumModal} onClose={() => setPremiumModal(false)} />
        </div>
    )
}
