import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import SkillSelector from '../components/SkillSelector'
import toast, { Toaster } from 'react-hot-toast'

const INDUSTRIES = [
  'Technology', 'Finance & Fintech', 'Healthcare', 'E-commerce', 'Education',
  'Media & Entertainment', 'Real Estate', 'Manufacturing', 'Consulting', 'Other'
]

function isValidUrl(url) {
  if (!url) return true
  try { new URL(url); return true } catch { return false }
}

function calcCompletion(role, p) {
  if (!p) return 20
  if (role === 'freelancer') {
    let pct = 20
    if (p.bio) pct += 15
    if (p.skills && p.skills.length > 0) pct += 15
    if (p.hourlyRate) pct += 10
    if (p.githubUrl) pct += 10
    if (p.linkedinUrl) pct += 5
    if (p.portfolioUrl) pct += 5
    if (p.projectSamples && p.projectSamples.length > 0) pct += 10
    if (p.resumeUrl) pct += 10
    return Math.min(100, pct)
  } else {
    let pct = 20
    if (p.bio) pct += 20
    if (p.companyName) pct += 20
    if (p.industry) pct += 20
    if (p.linkedinUrl) pct += 20
    return Math.min(100, pct)
  }
}

function Field({ label, hint, required, bonus, error, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {bonus && <span className="ml-1.5 text-xs text-zinc-400 font-normal">+{bonus}%</span>}
        </label>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasErr) {
  return `w-full border rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors ${
    hasErr ? 'border-red-300 bg-red-50' : 'border-zinc-200 focus:border-zinc-400'
  }`
}

function ProfileCard({ portfolio, user, completion, onEdit }) {
  const isFreelancer = user?.role === 'freelancer'
  const completionColor = completion < 40 ? 'bg-red-500' : completion < 70 ? 'bg-amber-500' : completion < 100 ? 'bg-blue-500' : 'bg-emerald-500'
  const completionText = completion < 40 ? 'text-red-600' : completion < 70 ? 'text-amber-600' : completion < 100 ? 'text-blue-600' : 'text-emerald-600'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium capitalize">
                  {user?.role}
                </span>
                {isFreelancer && portfolio?.availability && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    portfolio.availability === 'full-time' ? 'bg-emerald-50 text-emerald-700' :
                    portfolio.availability === 'part-time' ? 'bg-amber-50 text-amber-700' :
                    'bg-zinc-100 text-zinc-500'
                  }`}>{portfolio.availability}</span>
                )}
                {isFreelancer && portfolio?.hourlyRate > 0 && (
                  <span className="text-sm font-medium text-zinc-700">₹{portfolio.hourlyRate}/hr</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onEdit}
            className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
            Edit
          </button>
        </div>
        {portfolio?.bio
          ? <p className="mt-4 text-zinc-600 text-sm leading-relaxed border-t border-zinc-100 pt-4">{portfolio.bio}</p>
          : <p className="mt-4 text-zinc-400 text-sm italic border-t border-zinc-100 pt-4">No bio added yet.</p>
        }
      </div>

      {/* Skills */}
      {isFreelancer && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Skills</h3>
          {portfolio?.skills?.length > 0
            ? <div className="flex flex-wrap gap-1.5">
                {portfolio.skills.map(skill => (
                  <span key={skill} className="bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-md">{skill}</span>
                ))}
              </div>
            : <p className="text-zinc-400 text-sm italic">No skills added yet.</p>
          }
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Details</h3>
        <div className="space-y-3">
          {!isFreelancer && portfolio?.companyName && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">🏢</span>
              <div>
                <p className="text-xs text-zinc-400">Company</p>
                <p className="text-sm text-zinc-700 font-medium">{portfolio.companyName}</p>
              </div>
            </div>
          )}
          {!isFreelancer && portfolio?.industry && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">🏭</span>
              <div>
                <p className="text-xs text-zinc-400">Industry</p>
                <p className="text-sm text-zinc-700 font-medium">{portfolio.industry}</p>
              </div>
            </div>
          )}
          {isFreelancer && portfolio?.githubUrl && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">💻</span>
              <div>
                <p className="text-xs text-zinc-400">GitHub</p>
                <a href={portfolio.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline underline-offset-2 font-medium break-all">
                  {portfolio.githubUrl}
                </a>
              </div>
            </div>
          )}
          {portfolio?.linkedinUrl && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">🔗</span>
              <div>
                <p className="text-xs text-zinc-400">LinkedIn</p>
                <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline underline-offset-2 font-medium break-all">
                  {portfolio.linkedinUrl}
                </a>
              </div>
            </div>
          )}
          {isFreelancer && portfolio?.portfolioUrl && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">🌐</span>
              <div>
                <p className="text-xs text-zinc-400">Portfolio</p>
                <a href={portfolio.portfolioUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline underline-offset-2 font-medium break-all">
                  {portfolio.portfolioUrl}
                </a>
              </div>
            </div>
          )}
          {isFreelancer && portfolio?.resumeUrl && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">📄</span>
              <div>
                <p className="text-xs text-zinc-400">Resume</p>
                <p className="text-sm text-emerald-600 font-medium">Uploaded</p>
              </div>
            </div>
          )}
          {isFreelancer && portfolio?.projectSamples?.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-base">📎</span>
              <div>
                <p className="text-xs text-zinc-400">Portfolio Samples</p>
                <p className="text-sm text-zinc-700 font-medium">{portfolio.projectSamples.length} sample{portfolio.projectSamples.length > 1 ? 's' : ''} uploaded</p>
              </div>
            </div>
          )}
          {!portfolio?.linkedinUrl && !portfolio?.githubUrl && !portfolio?.companyName && !portfolio?.industry && (
            <p className="text-zinc-400 text-sm italic">No details added yet.</p>
          )}
        </div>
      </div>

      {/* Completion */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-700">Profile Completion</h3>
          <span className={`text-lg font-bold ${completionText}`}>{completion}%</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${completionColor}`} style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <p className="text-xs text-zinc-400 mt-2">
            {completion < 40 ? 'Add more details to make your profile visible to others.' :
             completion < 70 ? 'A few more details will make your profile stand out.' :
             'Almost there — one last push to reach 100%!'}
          </p>
        )}
      </div>
    </div>
  )
}

function ProfileEditForm({ portfolio, user, onSave, onCancel }) {
  const isFreelancer = user?.role === 'freelancer'
  const [form, setForm] = useState({
    bio: portfolio?.bio || '',
    skills: portfolio?.skills || [],
    githubUrl: portfolio?.githubUrl || '',
    linkedinUrl: portfolio?.linkedinUrl || '',
    portfolioUrl: portfolio?.portfolioUrl || '',
    hourlyRate: portfolio?.hourlyRate || '',
    availability: portfolio?.availability || 'full-time',
    companyName: portfolio?.companyName || '',
    industry: portfolio?.industry || ''
  })
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [sampleTitle, setSampleTitle] = useState('')
  const [localPortfolio, setLocalPortfolio] = useState(portfolio)
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.bio.trim()) e.bio = 'Bio is required'
    else if (form.bio.trim().length < 20) e.bio = 'Bio must be at least 20 characters'
    else if (form.bio.trim().length > 1000) e.bio = 'Bio cannot exceed 1000 characters'
    if (isFreelancer) {
      if (form.skills.length === 0) e.skills = 'Add at least one skill'
      if (!form.hourlyRate || Number(form.hourlyRate) <= 0) e.hourlyRate = 'Hourly rate is required'
      if (form.githubUrl && !isValidUrl(form.githubUrl)) e.githubUrl = 'Enter a valid URL'
      if (form.portfolioUrl && !isValidUrl(form.portfolioUrl)) e.portfolioUrl = 'Enter a valid URL'
    } else {
      if (!form.industry) e.industry = 'Please select your industry'
    }
    if (form.linkedinUrl && !isValidUrl(form.linkedinUrl)) e.linkedinUrl = 'Enter a valid URL'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the errors before saving'); return }
    setSaving(true)
    try {
      const { data } = await api.post('/api/portfolio/update', { ...form, skills: form.skills })
      localStorage.setItem('profileCompletion', String(data.completionPercent || 20))
      window.dispatchEvent(new Event('profileUpdated'))
      onSave(data)
      toast.success('Profile saved!')
    } catch { toast.error('Failed to save profile') }
    finally { setSaving(false) }
  }

  const handleSampleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', sampleTitle || file.name)
    try {
      const { data } = await api.post('/api/portfolio/upload-sample', fd)
      setLocalPortfolio(prev => ({ ...prev, projectSamples: [...(prev?.projectSamples || []), data.sample] }))
      localStorage.setItem('profileCompletion', String(data.completionPercent || 20))
      window.dispatchEvent(new Event('profileUpdated'))
      setSampleTitle('')
      toast.success('Portfolio sample uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeUploading(true)
    const fd = new FormData()
    fd.append('resume', file)
    try {
      const { data } = await api.post('/api/portfolio/upload-resume', fd)
      setLocalPortfolio(prev => ({ ...prev, resumeUrl: data.resumeUrl }))
      localStorage.setItem('profileCompletion', String(data.completionPercent || 20))
      window.dispatchEvent(new Event('profileUpdated'))
      toast.success('Resume uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setResumeUploading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h3 className="text-base font-semibold text-zinc-900">
            {isFreelancer ? 'Freelancer Profile' : 'Client Profile'}
          </h3>
          <span className="text-xs text-zinc-400">Fields marked <span className="text-red-500">*</span> are required</span>
        </div>

        {!isFreelancer && (
          <>
            <Field label="Company Name" bonus={20} error={errors.companyName}>
              <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                className={inputClass(errors.companyName)} placeholder="e.g. TechStart Ltd" />
            </Field>
            <Field label="Industry" required bonus={20} error={errors.industry}>
              <select value={form.industry}
                onChange={e => { setForm({ ...form, industry: e.target.value }); setErrors({ ...errors, industry: '' }) }}
                className={inputClass(errors.industry)}>
                <option value="">Select your industry</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </Field>
          </>
        )}

        <Field label="Bio" required bonus={isFreelancer ? 15 : 20} hint={`${form.bio.length}/1000`} error={errors.bio}>
          <textarea value={form.bio}
            onChange={e => { setForm({ ...form, bio: e.target.value }); setErrors({ ...errors, bio: '' }) }}
            rows={4} maxLength={1000} className={inputClass(errors.bio)}
            placeholder={isFreelancer
              ? 'Describe your expertise, projects you work on, and what makes you stand out...'
              : 'Describe what kind of projects you hire for and what you look for in freelancers...'
            }
          />
        </Field>

        {isFreelancer && (
          <>
            <Field label="Skills" required bonus={15} error={errors.skills}>
              <SkillSelector selected={form.skills}
                onChange={skills => { setForm({ ...form, skills }); setErrors({ ...errors, skills: '' }) }}
                error={errors.skills} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hourly Rate (₹)" required bonus={10} error={errors.hourlyRate}>
                <input type="number" min="1" value={form.hourlyRate}
                  onChange={e => { setForm({ ...form, hourlyRate: e.target.value }); setErrors({ ...errors, hourlyRate: '' }) }}
                  className={inputClass(errors.hourlyRate)} placeholder="e.g. 500" />
              </Field>
              <Field label="Availability">
                <select value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}
                  className={inputClass(false)}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </Field>
            </div>
            <Field label="GitHub URL" bonus={10} error={errors.githubUrl} hint="https://...">
              <input value={form.githubUrl}
                onChange={e => { setForm({ ...form, githubUrl: e.target.value }); setErrors({ ...errors, githubUrl: '' }) }}
                className={inputClass(errors.githubUrl)} placeholder="https://github.com/username" />
            </Field>
          </>
        )}

        <Field label="LinkedIn URL" bonus={isFreelancer ? 5 : 20} error={errors.linkedinUrl} hint="https://...">
          <input value={form.linkedinUrl}
            onChange={e => { setForm({ ...form, linkedinUrl: e.target.value }); setErrors({ ...errors, linkedinUrl: '' }) }}
            className={inputClass(errors.linkedinUrl)} placeholder="https://linkedin.com/in/username" />
        </Field>

        {isFreelancer && (
          <Field label="Portfolio Website" bonus={5} error={errors.portfolioUrl} hint="https://...">
            <input value={form.portfolioUrl}
              onChange={e => { setForm({ ...form, portfolioUrl: e.target.value }); setErrors({ ...errors, portfolioUrl: '' }) }}
              className={inputClass(errors.portfolioUrl)} placeholder="https://yourportfolio.com" />
          </Field>
        )}

        <div className="flex gap-3 pt-2 border-t border-zinc-100">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button onClick={onCancel}
            className="flex-1 border border-zinc-200 text-zinc-600 font-medium py-2.5 rounded-lg text-sm hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>

      {/* Portfolio samples & resume */}
      {isFreelancer && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
          <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-4">
            Portfolio Samples & Resume
          </h3>

          {localPortfolio?.projectSamples?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-2">
                Uploaded samples ({localPortfolio.projectSamples.length})
              </p>
              <div className="space-y-2">
                {localPortfolio.projectSamples.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5">
                    <span className="text-base">📎</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-700 truncate">{s.title}</p>
                      <p className="text-xs text-zinc-400 font-mono truncate">{s.fileHash?.slice(0, 24)}…</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                      SHA-256 ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Add Portfolio Sample
                {!(localPortfolio?.projectSamples?.length > 0) && (
                  <span className="ml-1.5 text-xs text-zinc-400 font-normal">+10%</span>
                )}
              </label>
            </div>
            <p className="text-xs text-zinc-400 mb-2">Each file is SHA-256 hashed for proof of authenticity.</p>
            <input value={sampleTitle} onChange={e => setSampleTitle(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400 transition-colors mb-2"
              placeholder="Sample title (e.g. E-Commerce App)" />
            <label className="block cursor-pointer bg-zinc-50 hover:bg-zinc-100 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-5 text-center transition-colors">
              <p className="text-sm text-zinc-600 font-medium">
                {uploading ? 'Uploading & generating hash...' : 'Click to upload portfolio sample'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Images, PDFs, zip files · Max 10 MB</p>
              <input type="file" className="hidden" onChange={handleSampleUpload} disabled={uploading} />
            </label>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Resume (PDF)
                {!localPortfolio?.resumeUrl && <span className="ml-1.5 text-xs text-zinc-400 font-normal">+10%</span>}
              </label>
            </div>
            {localPortfolio?.resumeUrl ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <span className="text-lg">📄</span>
                <p className="text-sm text-emerald-700 font-medium flex-1">Resume uploaded</p>
                <label className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
                  Replace
                  <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer bg-zinc-50 hover:bg-zinc-100 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-5 text-center transition-colors">
                <p className="text-sm text-zinc-600 font-medium">
                  {resumeUploading ? 'Uploading...' : 'Click to upload resume PDF'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">PDF only · Max 10 MB</p>
                <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={resumeUploading} />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [portfolio, setPortfolio] = useState(null)
  const [completion, setCompletion] = useState(parseInt(localStorage.getItem('profileCompletion') || '20', 10))
  const [mode, setMode] = useState('loading')

  useEffect(() => {
    api.get('/api/auth/me').then(({ data }) => {
      const p = data.portfolio
      setPortfolio(p)
      const pct = calcCompletion(data.user?.role || user?.role, p)
      setCompletion(pct)
      localStorage.setItem('profileCompletion', String(pct))
      window.dispatchEvent(new Event('profileUpdated'))
      setMode(!p?.bio ? 'edit' : 'view')
    }).catch(() => setMode('edit'))
  }, [])

  const handleSaved = (updatedPortfolio) => {
    setPortfolio(updatedPortfolio)
    const pct = calcCompletion(user?.role, updatedPortfolio)
    setCompletion(pct)
    localStorage.setItem('profileCompletion', String(pct))
    window.dispatchEvent(new Event('profileUpdated'))
    setMode('view')
  }

  const handleCancel = () => {
    if (!portfolio?.bio) navigate(user?.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer')
    else setMode('view')
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <Toaster />
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">My Profile</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {mode === 'edit' ? 'Fill in your details and save' : 'How others see your profile'}
            </p>
          </div>
          {mode === 'view' && (
            <button onClick={() => navigate(user?.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer')}
              className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
              ← Dashboard
            </button>
          )}
        </div>

        {mode === 'loading' && (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Loading your profile…</p>
          </div>
        )}

        {mode === 'view' && portfolio && (
          <ProfileCard portfolio={portfolio} user={user} completion={completion} onEdit={() => setMode('edit')} />
        )}

        {mode === 'edit' && (
          <ProfileEditForm portfolio={portfolio} user={user} onSave={handleSaved} onCancel={handleCancel} />
        )}
      </div>
    </div>
  )
}
