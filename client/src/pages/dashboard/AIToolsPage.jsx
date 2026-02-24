import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiAPI, resumeAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Sparkles, FileText, Target, Users, TrendingUp, MessageSquare, Linkedin, Crown, ChevronLeft } from 'lucide-react';
import PremiumModal from '../../components/ui/PremiumModal';

const ALL_TOOLS = [
    { id: 'cover-letter', name: 'Cover Letter Gen', icon: FileText, desc: 'Generate a perfect cover letter tailored to any job.', premium: true, requires: ['resume', 'jd', 'company'] },
    { id: 'linkedin', name: 'LinkedIn Optimizer', icon: Linkedin, desc: 'Get actionable tips to boost your LinkedIn profile visibility.', premium: true, requires: ['resume'] },
    { id: 'interview', name: 'Interview Coach', icon: MessageSquare, desc: 'Generate behavioral and technical practice questions.', premium: false, requires: ['jd', 'difficulty'] },
    { id: 'career-path', name: 'Career Path Advisor', icon: TrendingUp, desc: 'Map out your 5-year career trajectory based on your skills.', premium: true, requires: ['resume'] },
    { id: 'skill-gap', name: 'Skill Gap Analyzer', icon: Target, desc: 'Find out exactly what skills you lack for a specific job.', premium: false, requires: ['resume', 'jd'] },
    { id: 'job-summary', name: 'JD Summarizer', icon: Users, desc: 'Distill long, complex job descriptions into core red flags and requirements.', premium: true, requires: ['jd'] }
];

export default function AIToolsPage() {
    const { user } = useAuthStore();
    const [activeTool, setActiveTool] = useState(null);
    const [premiumModal, setPremiumModal] = useState(false);

    // Inputs
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [difficulty, setDifficulty] = useState('medium');

    // Results
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);

    // Fetch Resumes for dropdowns
    const { data: resumesData } = useQuery({ queryKey: ['resumes'], queryFn: () => resumeAPI.getAll() });
    const resumes = resumesData?.data?.resumes || [];

    const handleSelectTool = (tool) => {
        if (tool.premium && !user?.isPremium && user?.role !== 'admin') {
            setPremiumModal(true);
            return;
        }
        setActiveTool(tool);
        setResultData(null);
    };

    const runAITool = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResultData(null);
        try {
            let res;
            if (activeTool.id === 'cover-letter') {
                res = await aiAPI.generateCoverLetter({ resumeId: selectedResumeId, jobDescription, companyName });
            } else if (activeTool.id === 'linkedin') {
                res = await aiAPI.optimizeLinkedInProfile({ resumeId: selectedResumeId });
            } else if (activeTool.id === 'interview') {
                res = await aiAPI.getInterviewQuestions({ jobDescription, difficulty });
            } else if (activeTool.id === 'career-path') {
                res = await aiAPI.adviseCareerPath({ resumeId: selectedResumeId });
            } else if (activeTool.id === 'skill-gap') {
                res = await aiAPI.analyzeSkillGap({ resumeId: selectedResumeId, jobDescription });
            } else if (activeTool.id === 'job-summary') {
                res = await aiAPI.summarizeJobDescription({ jobDescription });
            }

            if (res.data?.success) {
                setResultData(res.data.data);
                toast.success('AI Generation Complete!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI Generation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderResult = () => {
        if (!resultData) return null;

        if (activeTool.id === 'cover-letter') {
            return <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm whitespace-pre-wrap font-serif text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">{resultData.coverLetter}</div>;
        }

        if (activeTool.id === 'linkedin') {
            return (
                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-bold text-lg mb-2">About Section</h3>
                        <p className="text-gray-700 dark:text-gray-300">{resultData.aboutSection}</p>
                    </div>
                    <div className="card">
                        <h3 className="font-bold text-lg mb-2">Headline Ideas</h3>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                            {resultData.headlineSuggestions?.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>
                    <div className="card">
                        <h3 className="font-bold text-lg mb-2">Networking Tips</h3>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                            {resultData.networkingTips?.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                    </div>
                </div>
            );
        }

        if (activeTool.id === 'career-path') {
            return (
                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-xl text-white shadow-lg">
                        <h3 className="text-sm font-semibold opacity-90 uppercase tracking-wider">Next Logical Role</h3>
                        <p className="text-3xl font-bold font-heading mb-1">{resultData.nextLogicalRole}</p>
                        <p className="opacity-90">Estimated Salary Jump: {resultData.estimatedSalaryJump}</p>
                    </div>
                    <div className="card">
                        <h3 className="font-bold text-lg mb-4">Milestone Roadmap</h3>
                        <div className="space-y-4">
                            {resultData.roadmap?.map((r, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-1/4 font-semibold text-primary-600 dark:text-primary-400 text-sm pt-1">{r.step}</div>
                                    <div className="w-3/4 text-gray-700 dark:text-gray-300 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">{r.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTool.id === 'job-summary') {
            return (
                <div className="space-y-6">
                    <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
                        <h3 className="font-bold text-lg text-primary-900 dark:text-primary-100 mb-2">Core Focus</h3>
                        <p className="text-primary-800 dark:text-primary-200">{resultData.coreFocus}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="card">
                            <h3 className="font-bold mb-2">Mandatory Requirements</h3>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                                {resultData.mandatoryRequirements?.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                        <div className="card">
                            <h3 className="font-bold mb-2">Red Flags / Warnings</h3>
                            <ul className="list-disc pl-5 space-y-1 text-red-600 dark:text-red-400">
                                {resultData.redFlags?.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTool.id === 'interview') {
            return (
                <div className="space-y-6">
                    {['behavioral', 'technical', 'situational'].map(type => (
                        <div key={type} className="card">
                            <h3 className="font-bold text-lg mb-3 capitalize">{type} Questions</h3>
                            <div className="space-y-4">
                                {resultData[type]?.map((q, i) => (
                                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="font-semibold text-gray-900 dark:text-white mb-2">Q{i + 1}: {q.question}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium text-emerald-600 dark:text-emerald-400">Pro Tip: </span>{q.tipAnswer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTool.id === 'skill-gap') {
            return (
                <div className="card space-y-4">
                    <div>
                        <h3 className="font-bold text-green-600 mb-1">Matched Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {resultData.matchedSkills?.map(s => <span key={s} className="badge bg-green-100 text-green-800">{s}</span>)}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-red-600 mb-1">Missing Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {resultData.missingSkills?.map(s => <span key={s} className="badge bg-red-100 text-red-800">{s}</span>)}
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">Recommended Courses (Time to Learn: {resultData.timeToLearn})</h4>
                        <ul className="space-y-2">
                            {resultData.recommendedCourses?.map((c, i) => (
                                <li key={i} className="text-sm text-amber-900 dark:text-amber-100">
                                    <strong>{c.skill}</strong> — search '{c.searchTerm}' on {c.platform}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        }

        return <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">{JSON.stringify(resultData, null, 2)}</pre>;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PremiumModal isOpen={premiumModal} onClose={() => setPremiumModal(false)} />

            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                    <Sparkles size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Premium AI Suite</h1>
                    <p className="text-gray-500 text-sm mt-1">Supercharge your career search with Gemini 1.5 Flash.</p>
                </div>
            </div>

            {!activeTool ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ALL_TOOLS.map(tool => (
                        <button key={tool.id} onClick={() => handleSelectTool(tool)} className="card hover:border-primary-500 hover:shadow-md transition-all text-left relative overflow-hidden group">
                            {tool.premium && !user?.isPremium && (
                                <div className="absolute top-3 right-3 text-amber-500 bg-amber-50 dark:bg-amber-900/30 p-1 rounded-md">
                                    <Crown size={14} />
                                </div>
                            )}
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                                <tool.icon size={20} className="text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{tool.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{tool.desc}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="max-w-4xl animate-in slide-in-from-right-4 duration-300">
                    <button onClick={() => { setActiveTool(null); setResultData(null); }} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6">
                        <ChevronLeft size={16} /> Back to AI Suite
                    </button>

                    <div className="grid lg:grid-cols-[350px_1fr] gap-8">
                        {/* INPUT PANEL */}
                        <div className="card h-fit">
                            <div className="flex items-center gap-2 mb-6">
                                <activeTool.icon size={20} className="text-primary-600" />
                                <h2 className="font-bold text-lg text-gray-900 dark:text-white">{activeTool.name}</h2>
                            </div>

                            <form onSubmit={runAITool} className="space-y-4">
                                {activeTool.requires.includes('resume') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Select Resume Tracker</label>
                                        <select required value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)} className="input w-full">
                                            <option value="">-- Choose a Resume --</option>
                                            {resumes.map(r => (
                                                <option key={r._id} value={r._id}>{r.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {activeTool.requires.includes('company') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Target Company Name</label>
                                        <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input w-full" placeholder="e.g. Google, Microsoft..." />
                                    </div>
                                )}

                                {activeTool.requires.includes('difficulty') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Interview Difficulty</label>
                                        <select required value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input w-full">
                                            <option value="easy">Easy (Entry Level)</option>
                                            <option value="medium">Medium (Mid Level)</option>
                                            <option value="hard">Hard (Senior/Lead)</option>
                                        </select>
                                    </div>
                                )}

                                {activeTool.requires.includes('jd') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Paste Job Description</label>
                                        <textarea required value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="input w-full h-40 resize-y" placeholder="Paste the full job posting text here..." />
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                                    {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> : <Sparkles size={16} />}
                                    {loading ? 'Generating...' : `Generate Results`}
                                </button>
                            </form>
                        </div>

                        {/* RESULT PANEL */}
                        <div className="min-h-[400px]">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                    <p>AI is analyzing and computing...</p>
                                </div>
                            ) : resultData ? (
                                <div className="animate-in fade-in duration-500">
                                    {renderResult()}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
                                    <Sparkles size={32} className="mb-3 opacity-50" />
                                    <p>Fill out the configuration on the left to generate your custom AI insights.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
