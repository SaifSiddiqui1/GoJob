import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Download, Eye, Search, FileText, Link as LinkIcon } from 'lucide-react'
import { studyAPI } from '../../services/api'

const CATS = ['', 'sde', 'it', 'marketing', 'government', 'interview_prep', 'aptitude', 'resume_tips', 'general']
const CAT_LABELS = { '': 'All', sde: 'SDE', it: 'IT', marketing: 'Marketing', government: 'Government', interview_prep: 'Interview Prep', aptitude: 'Aptitude', resume_tips: 'Resume Tips', general: 'General' }

export default function StudyPage() {
    const [filters, setFilters] = useState({ category: '', type: '', level: '' })
    const { data, isLoading } = useQuery({ queryKey: ['study', filters], queryFn: () => studyAPI.getAll(filters) })
    const materials = data?.data?.materials || []

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Study Materials</h1>
                <p className="text-gray-500 text-sm mt-1">Field-specific resources to help you prepare for interviews and jobs</p>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {CATS.map(cat => (
                    <button key={cat} onClick={() => setFilters(p => ({ ...p, category: cat }))}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filters.category === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {CAT_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Level filter */}
            <div className="flex gap-2">
                {['', 'beginner', 'intermediate', 'advanced'].map(l => (
                    <button key={l} onClick={() => setFilters(p => ({ ...p, level: l }))}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filters.level === l ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                        {l || 'All Levels'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
                </div>
            ) : materials.length === 0 ? (
                <div className="card text-center py-12">
                    <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No materials in this category yet</p>
                    <p className="text-gray-400 text-sm mt-1">Admin will add resources soon</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materials.map(m => (
                        <div key={m._id} className="card group hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                    {m.type === 'pdf' || m.type === 'doc' ? <FileText size={18} className="text-primary-600" /> : <LinkIcon size={18} className="text-primary-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{m.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{CAT_LABELS[m.category]} · {m.level}</p>
                                </div>
                            </div>
                            {m.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed line-clamp-2">{m.description}</p>}
                            <div className="flex gap-2">
                                {m.fileUrl && (
                                    <a href={m.fileUrl.replace('/upload/', `/upload/fl_attachment:${m.title ? m.title.replace(/[^a-zA-Z0-9]/g, '_') : 'Study_Material'}.pdf/`)} target="_blank" rel="noopener noreferrer" className="flex-1 btn-primary text-xs py-1.5 flex items-center justify-center gap-1">
                                        <Download size={12} /> Download
                                    </a>
                                )}
                                {m.externalLink && (
                                    <a href={m.externalLink} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                                        <Eye size={12} /> View
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                <span>{m.viewCount} views</span>
                                <span>{m.downloadCount} downloads</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
