import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Camera, Save, MapPin, Mail, Phone, Calendar, User, Briefcase, GraduationCap, Award, Map, PenLine, Code, Terminal, FileText, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const qc = useQueryClient();

    // Track which section is currently being edited
    const [editingSection, setEditingSection] = useState(null);

    // Initial simple form state (we will expand this later to handle nested arrays)
    const [form, setForm] = useState({
        fullName: user?.fullName || '',
        location: user?.location || '',
        gender: user?.gender || '',
        contactNumber: user?.contactNumber || '',
        dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
        profileSummary: user?.profileSummary || '',
    });

    const updateMutation = useMutation({
        mutationFn: (data) => userAPI.updateProfile(data),
        onSuccess: (res) => {
            updateUser(res.data.user);
            qc.invalidateQueries(['auth']);
            setEditingSection(null);
            toast.success('Profile updated!');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
    });

    const handleSaveBasicInfo = (e) => {
        e.preventDefault();
        updateMutation.mutate(form);
    };

    const completeness = user?.profileCompleteness || 0;

    const sections = [
        { id: 'summary', icon: User, label: 'Profile Summary' },
        { id: 'education', icon: GraduationCap, label: 'Education' },
        { id: 'skills', icon: Code, label: 'Key Skills' },
        { id: 'experience', icon: Briefcase, label: 'Employment' },
        { id: 'projects', icon: Terminal, label: 'Projects' },
        { id: 'accomplishments', icon: Award, label: 'Accomplishments' },
        { id: 'resume', icon: FileText, label: 'Resume' },
    ];

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 animate-fade-in relative items-start">

            {/* ─── LEFT SIDEBAR (STICKY NAVIGATION) ─── */}
            <div className="w-full md:w-64 shrink-0 md:sticky top-24 space-y-4">

                {/* Completeness Card */}
                <div className="card p-5 border-l-4 border-l-primary-500">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-gray-900 dark:text-white">Profile Score</p>
                        <span className="font-bold text-primary-600">{completeness}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-700" style={{ width: `${completeness}%` }} />
                    </div>
                    {completeness < 100 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Add missing details to boost your visibility to recruiters.</p>
                    )}
                </div>

                {/* Quick Links Menu */}
                <div className="card p-3 hidden md:block">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Quick Links</h3>
                    <nav className="space-y-1">
                        {sections.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => scrollToSection(sec.id)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors text-left font-medium"
                            >
                                <sec.icon size={16} />
                                {sec.label}
                                <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100" />
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* ─── RIGHT MAIN CONTENT AREA ─── */}
            <div className="flex-1 space-y-6">

                {/* 1. Header Header / Basic Info */}
                <div className="card p-6 overflow-hidden relative">
                    {/* Background Banner */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-600 to-indigo-800 opacity-20 dark:opacity-40" />

                    <div className="relative flex flex-col md:flex-row gap-6 items-start pt-8">
                        {/* Profile Photo Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 bg-primary-100 dark:bg-primary-900 overflow-hidden shadow-lg flex items-center justify-center">
                                {user?.photo ? (
                                    <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-primary-600">{user?.fullName?.charAt(0)}</span>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                <Camera size={14} className="text-gray-600 dark:text-gray-300" />
                                <input type="file" accept="image/*" className="hidden" />
                            </label>
                        </div>

                        {/* User Details */}
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-2">
                                        {user?.fullName}
                                        {user?.isEmailVerified && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border border-green-200 uppercase">Verified</span>}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">@{user?.username}</p>
                                </div>
                                <button
                                    onClick={() => setEditingSection(editingSection === 'basicInfo' ? null : 'basicInfo')}
                                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors"
                                >
                                    <PenLine size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mt-4 block">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <MapPin size={16} className="text-gray-400" /> {user?.location || 'Location not specified'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Mail size={16} className="text-gray-400" /> {user?.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Phone size={16} className="text-gray-400" /> {user?.contactNumber || 'Add Phone Number'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Calendar size={16} className="text-gray-400" /> {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Add DOB'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inline Basic Info Edit Form */}
                    {editingSection === 'basicInfo' && (
                        <form onSubmit={handleSaveBasicInfo} className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">Edit Basic Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className="input" />
                                </div>
                                <div>
                                    <label className="label">Location</label>
                                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input" placeholder="e.g. Lucknow, India" />
                                </div>
                                <div>
                                    <label className="label">Contact Number</label>
                                    <input value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))} className="input" placeholder="+91 XXXXXXXXXX" />
                                </div>
                                <div>
                                    <label className="label">Date of Birth</label>
                                    <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="input" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditingSection(null)} className="btn-secondary py-2 text-sm">Cancel</button>
                                <button type="submit" disabled={updateMutation.isPending} className="btn-primary py-2 text-sm flex items-center gap-2">
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* 2. Profile Summary Section */}
                <div id="summary" className="card p-6 scroll-mt-24">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><User size={20} /></span>
                            <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Profile Summary</h2>
                        </div>
                        <button onClick={() => setEditingSection(editingSection === 'summary' ? null : 'summary')} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors"><PenLine size={18} /></button>
                    </div>

                    {editingSection === 'summary' ? (
                        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ profileSummary: form.profileSummary }); }} className="space-y-3 animate-in fade-in">
                            <p className="text-xs text-gray-500 mb-2">Your Profile Summary should mention the highlights of your career and education, what your professional interests are, and what kind of a career you are looking for.</p>
                            <textarea value={form.profileSummary} onChange={e => setForm(p => ({ ...p, profileSummary: e.target.value }))} className="input min-h-[120px]" placeholder="I am a Backend Developer highly skilled in Java, Spring Boot, and Microservices architecture..." />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setEditingSection(null)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                                <button type="submit" disabled={updateMutation.isPending} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-2">Save</button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-none">
                            {user?.profileSummary ? user.profileSummary : <span className="text-gray-400 italic">Add a meaningful summary to stand out to employers.</span>}
                        </div>
                    )}
                </div>

                {/* Additional specialized array sections will be built below (Education, Skills, etc.) in the next phases */}

                {/* 3. Education Section */}
                <div id="education" className="card p-6 scroll-mt-24">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg"><GraduationCap size={20} /></span>
                            <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Education</h2>
                        </div>
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:hover:text-primary-400">Add</button>
                    </div>

                    <div className="space-y-6">
                        {user?.education?.length > 0 ? (
                            user.education.map((edu, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                {edu.degree} {edu.institution && `from ${edu.institution}`}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                {edu.yearOfPassing ? `Graduated in ${edu.yearOfPassing}` : 'Ongoing'}
                                                {edu.isFullTime !== undefined && `, ${edu.isFullTime ? 'Full Time' : 'Part Time'}`}
                                            </p>
                                            {(edu.board || edu.medium || edu.scorePercentage) && (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                    {[edu.board, edu.medium, edu.scorePercentage ? `Scored ${edu.scorePercentage}%` : null].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                            <PenLine size={16} />
                                        </button>
                                    </div>
                                    {idx < user.education.length - 1 && <div className="h-px bg-gray-100 dark:bg-gray-800 mt-6" />}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No education details added yet.</p>
                        )}
                    </div>
                </div>

                {/* 4. Key Skills Section */}
                <div id="skills" className="card p-6 scroll-mt-24">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Code size={20} /></span>
                            <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Key Skills</h2>
                        </div>
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:hover:text-primary-400"><PenLine size={16} /></button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {user?.keySkills?.length > 0 ? (
                            user.keySkills.map((skill, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm">
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No skills added yet.</p>
                        )}
                    </div>
                </div>

                {/* 5. Employment Section */}
                <div id="experience" className="card p-6 scroll-mt-24">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg"><Briefcase size={20} /></span>
                            <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Employment</h2>
                        </div>
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:hover:text-primary-400">Add</button>
                    </div>

                    <div className="space-y-6">
                        {user?.employment?.length > 0 ? (
                            user.employment.map((emp, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                {emp.designation} at {emp.company}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                {emp.startDate ? new Date(emp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} -
                                                {emp.isCurrent ? ' Present' : (emp.endDate ? new Date(emp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '')}
                                            </p>
                                            {emp.description && (
                                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 leading-relaxed whitespace-pre-wrap">
                                                    {emp.description}
                                                </p>
                                            )}
                                        </div>
                                        <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                            <PenLine size={16} />
                                        </button>
                                    </div>
                                    {idx < user.employment.length - 1 && <div className="h-px bg-gray-100 dark:bg-gray-800 mt-6" />}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No employment details added yet.</p>
                        )}
                    </div>
                </div>

                {/* 6. Projects Section */}
                <div id="projects" className="card p-6 scroll-mt-24">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg"><Terminal size={20} /></span>
                            <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Projects</h2>
                        </div>
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:hover:text-primary-400">Add</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user?.projects?.length > 0 ? (
                            user.projects.map((proj, idx) => (
                                <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors group relative">
                                    <button className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                        <PenLine size={16} />
                                    </button>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base pr-8">{proj.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                        {proj.startDate ? new Date(proj.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} -
                                        {proj.isOngoing ? ' Present' : (proj.endDate ? new Date(proj.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '')}
                                    </p>
                                    {proj.description && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 line-clamp-3">
                                            {proj.description}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic col-span-2">No projects added yet.</p>
                        )}
                    </div>
                </div>

                {/* 7. Resume Section */}
                <div id="resume" className="card p-6 scroll-mt-24">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg"><FileText size={20} /></span>
                        <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Resume</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Your resume is the first impression you make on potential employers. Craft it carefully to secure your desired job.</p>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-4">Resume viewing and generation features will be available soon.</p>
                        <button className="btn-secondary text-sm">Upload New Resume</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
