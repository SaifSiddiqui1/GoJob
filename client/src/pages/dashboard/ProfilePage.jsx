import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Save, AlertCircle, Upload, FileText } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { userAPI, resumeAPI } from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
    { value: 'student', label: 'Student' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'employed', label: 'Employed' },
    { value: 'unemployed', label: 'Unemployed' },
]
const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer Not To Say' },
]

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore()
    const qc = useQueryClient()
    const [form, setForm] = useState({
        fullName: user?.fullName || '', gender: user?.gender || '',
        location: user?.location || '', currentStatus: user?.currentStatus || 'student',
        dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
        contactNumber: user?.contactNumber || '',
    })

    const updateMutation = useMutation({
        mutationFn: (data) => userAPI.updateProfile(data),
        onSuccess: (res) => {
            updateUser(res.data.user)
            qc.invalidateQueries(['auth'])
            toast.success('Profile updated!')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
    })

    const photoMutation = useMutation({
        mutationFn: (formData) => userAPI.uploadPhoto(formData),
        onSuccess: (res) => { updateUser({ photo: res.data.photo }); toast.success('Photo updated!') },
        onError: () => toast.error('Photo upload failed'),
    })

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const fd = new FormData(); fd.append('photo', file)
        photoMutation.mutate(fd)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        updateMutation.mutate(form)
    }

    const completeness = user?.profileCompleteness || 0

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your personal information</p>
            </div>

            {/* Profile completeness */}
            <div className="card">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Profile Completeness</p>
                    <span className="font-bold text-primary-600">{completeness}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700" style={{ width: `${completeness}%` }} />
                </div>
                {completeness < 100 && (
                    <p className="text-xs text-gray-400 mt-2">Complete your profile to get better job recommendations</p>
                )}
            </div>

            {/* Photo */}
            <div className="card flex items-center gap-5">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900 overflow-hidden">
                        {user?.photo ? (
                            <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-600">
                                {user?.fullName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center cursor-pointer hover:bg-primary-700 shadow-lg">
                        <Camera size={14} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoMutation.isPending} />
                    </label>
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.fullName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card space-y-4">
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Personal Information</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Full Name</label>
                        <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                            className="input" placeholder="Your full name" />
                    </div>
                    <div>
                        <label className="label">Gender</label>
                        <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="input">
                            <option value="">Select Gender</option>
                            {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Current Status</label>
                        <select value={form.currentStatus} onChange={e => setForm(p => ({ ...p, currentStatus: e.target.value }))} className="input">
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Date of Birth</label>
                        <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="input" />
                    </div>
                </div>

                <div>
                    <label className="label">Location</label>
                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                        className="input" placeholder="City, State" />
                </div>

                {/* Contact — note this requires admin approval per PDF */}
                <div>
                    <label className="label">Contact Number</label>
                    <input value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
                        className="input" placeholder="+91 XXXXXXXXXX" />
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Contact changes require admin approval (as per platform policy)
                    </p>
                </div>

                <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
                    <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            {/* Resume upload to profile */}
            <ProfileResumeUpload />
        </div>
    )
}

function ProfileResumeUpload() {
    const [file, setFile] = useState(null)
    const qc = useQueryClient()

    const uploadMutation = useMutation({
        mutationFn: () => {
            const fd = new FormData()
            fd.append('resume', file)
            fd.append('title', file.name.replace(/\.[^.]+$/, ''))
            return resumeAPI.upload(fd)
        },
        onSuccess: () => {
            toast.success('Resume uploaded to your profile!')
            qc.invalidateQueries(['resumes'])
            setFile(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
    })

    return (
        <div className="card space-y-3">
            <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Upload Resume to Profile</h2>
            </div>
            <p className="text-sm text-gray-500">Store your existing resume here — it will be available for ATS checking and AI enhancement.</p>
            <label className={`relative block border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer overflow-hidden ${file ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                }`}>
                {file ? (
                    <><FileText size={24} className="mx-auto mb-2 text-green-500" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB · click to change</p></>
                ) : (
                    <><Upload size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">Click to select PDF / DOC / DOCX</p>
                        <p className="text-xs text-gray-400 mt-1">Max 5MB</p></>
                )}
                <input type="file" accept=".pdf,.doc,.docx" className="sr-only"
                    onChange={e => setFile(e.target.files[0])} />
            </label>
            {file && (
                <button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    <Upload size={14} /> {uploadMutation.isPending ? 'Uploading...' : 'Upload Resume'}
                </button>
            )}
        </div>
    )
}
