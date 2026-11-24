import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { PageHeader, BackLink, btn, inr, Avatar } from '../components/ui'
import SkillSelector from '../components/SkillSelector'
import toast from 'react-hot-toast'

const CATEGORIES = ['Web Development', 'Mobile', 'Design', 'Data Science', 'DevOps', 'Content', 'Other']
const DELIVERABLE_TYPES = ['Code File', 'Design File', 'Document', 'APK', 'Video', 'Other']

const emptyPhase = () => ({ title: '', guideline: '', guidelineHash: '', deliverableType: 'Other', budgetPercent: '', phaseDeadline: '', maxRevisions: 2 })

async function sha256(text) {
  if (!text) return ''
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const SectionHeader = ({ num, title, subtitle }) => (
  <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-4">
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-700 ring-1 ring-orange-200">{num}</span>
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  </div>
)

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-sm font-medium text-slate-700">
    {children}
  </label>
)

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PostJob() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [params] = useSearchParams()
  const inviteId = params.get('freelancer')
  const [invitee, setInvitee] = useState(null)
  useEffect(() => {
    if (!inviteId) return
    api.get(`/api/portfolio/${inviteId}`).then(({ data }) => setInvitee(data)).catch(() => {})
  }, [inviteId])

  const [form, setForm] = useState({
    title: '', description: '', budget: '', deadline: '',
    category: 'Other', experienceLevel: 'Mid',
    advancePercent: 10
  })
  const [skills, setSkills] = useState([])
  const [phases, setPhases] = useState([emptyPhase(), emptyPhase(), emptyPhase()])
  const [referenceFiles, setReferenceFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [completion, setCompletion] = useState(parseInt(localStorage.getItem('profileCompletion') || '0', 10))

  useEffect(() => {
    api.get('/api/auth/me').then(({ data }) => {
      const pct = data.portfolio?.completionPercent || 0
      setCompletion(pct)
      localStorage.setItem('profileCompletion', String(pct))
    }).catch(() => {})
  }, [])

  const otherPhasesPercent = phases.slice(0, -1).reduce((sum, p) => sum + Number(p.budgetPercent || 0), 0)
  const lastPhasePercent = Math.max(0, 100 - otherPhasesPercent)
  const totalPercent = otherPhasesPercent + lastPhasePercent
  const budget = Number(form.budget) || 0
  const advanceAmount = Math.round(budget * form.advancePercent / 100)
  const remaining = budget - advanceAmount

  const updatePhase = (i, field, value) => {
    const updated = [...phases]
    updated[i] = { ...updated[i], [field]: value }
    setPhases(updated)
    if (field === 'guideline') {
      sha256(value).then(hash => {
        setPhases(prev => {
          const next = [...prev]
          next[i] = { ...next[i], guidelineHash: hash }
          return next
        })
      })
    }
  }

  const addPhase = () => setPhases([...phases, emptyPhase()])
  const removePhase = (i) => { if (phases.length > 3) setPhases(phases.filter((_, idx) => idx !== i)) }

  const handleRefFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (referenceFiles.length >= 5) return toast.error('Maximum 5 reference files')
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB')
    setUploadingFile(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setReferenceFiles([...referenceFiles, { url: data.fileUrl, fileHash: data.fileHash, originalName: file.name }])
      toast.success('File uploaded and hashed')
    } catch {
      toast.error('File upload failed')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.description.trim() || form.description.length < 50) e.description = 'Minimum 50 characters'
    if (!form.budget || budget < 1000) e.budget = 'Minimum ₹1,000'
    if (!form.deadline) e.deadline = 'Required'
    phases.forEach((p, i) => {
      const isLast = i === phases.length - 1
      if (!p.title.trim()) e[`phase_${i}_title`] = 'Required'
      if (!p.guideline.trim() || p.guideline.length < 20) e[`phase_${i}_guideline`] = 'Min 20 chars'
      if (!isLast && (!p.budgetPercent || Number(p.budgetPercent) <= 0)) e[`phase_${i}_budget`] = 'Required'
      if (!isLast && !p.phaseDeadline) e[`phase_${i}_deadline`] = 'Required'
    })
    if (lastPhasePercent <= 0) e.phasesTotal = 'Other phases already total 100% — reduce them to leave budget for the last phase'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix the errors below'); return }
    setLoading(true)
    try {
      await api.post('/api/jobs', {
        ...form,
        budget,
        skills,
        phases: phases.map((p, i) => {
          const isLast = i === phases.length - 1
          return { ...p, budgetPercent: isLast ? lastPhasePercent : Number(p.budgetPercent), phaseDeadline: isLast ? form.deadline : p.phaseDeadline }
        }),
        referenceFiles
      })
      toast.success('Job posted successfully!')
      setTimeout(() => navigate('/dashboard/client'), 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally { setLoading(false) }
  }

  const detailsDone = !!form.title.trim() && form.description.length >= 50 && budget >= 1000 && !!form.deadline
  const milestonesDone = phases.every((p, i) => p.title.trim() && p.guideline.length >= 20 && (i === phases.length - 1 || (Number(p.budgetPercent) > 0 && p.phaseDeadline))) && lastPhasePercent > 0
  const steps = [
    ['Job details', detailsDone],
    ['Advance payment', true],
    ['Milestones', milestonesDone],
    ['Reference files', referenceFiles.length > 0, true],
  ]

  const inp = (field) => `dark-input w-full ${errors[field] ? 'border-red-500' : ''}`
  const isBlocked = completion < 100

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        <BackLink onClick={() => navigate(-1)} />
        <PageHeader eyebrow="New job" title="Post a job"
          subtitle="Describe the work and split it into milestones. Freelancers see the full scope before they apply." />

        {invitee && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-surface px-4 py-3">
            <Avatar name={invitee.user?.name} size="h-9 w-9" />
            <p className="text-sm text-slate-600">
              You're posting this job to hire <span className="font-semibold text-slate-900">{invitee.user?.name}</span>.
              Once it's live, share the job with them so they can apply — direct invites aren't available yet.
            </p>
          </div>
        )}

        {/* Profile gate */}
        {isBlocked && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-800">Finish your profile to post this job</p>
                <p className="mt-0.5 text-sm text-amber-700">Your profile is {completion}% complete. Freelancers need to know who they will work with, so posting unlocks at 100%.</p>
                <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-amber-200/60">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
              <Link to="/profile/setup" className={btn.primary}>Complete profile</Link>
            </div>
          </div>
        )}

        {/* Fee note */}
        <p className="mb-5 flex items-start gap-2 rounded-lg border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-600">
          <svg className="mt-0.5 h-4 w-4 flex-none text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>
            Posting is free. A <span className="font-semibold text-slate-900">2% platform fee</span> on the total budget is charged when you fund the final milestone
            {budget > 0 && <> — <span className="font-semibold text-slate-900">₹{Math.round(budget * 0.02).toLocaleString('en-IN')}</span> for this job</>}.
          </span>
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form id="post-job-form" onSubmit={handleSubmit} className={`min-w-0 ${isBlocked ? 'opacity-60 pointer-events-none select-none space-y-4' : 'space-y-4'}`}>

          {/* ── Section 1: Basic Info ── */}
          <div className="dark-card p-6">
            <SectionHeader num="1" title="Job details" subtitle="What you need done, and your budget" />
            <div className="space-y-4">

              <div>
                <FieldLabel>Job title</FieldLabel>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className={inp('title')} placeholder="e.g. Build React E-Commerce Website" />
                {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="dark-input w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Experience level</FieldLabel>
                  <select value={form.experienceLevel} onChange={e => setForm({ ...form, experienceLevel: e.target.value })} className="dark-input w-full">
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className={inp('description')} placeholder="Describe what needs to be built, tech stack, requirements..." />
                <div className="flex justify-between mt-1">
                  {errors.description ? <p className="text-red-600 text-xs">{errors.description}</p> : <span />}
                  <span className="text-xs" style={{ color: form.description.length >= 50 ? '#10b981' : 'rgb(var(--slate-500))' }}>
                    {form.description.length} / 50+ chars
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Total budget (₹)</FieldLabel>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                    className={inp('budget')} placeholder="50000" />
                  {errors.budget && <p className="text-red-600 text-xs mt-1">{errors.budget}</p>}
                </div>
                <div>
                  <FieldLabel>Deadline</FieldLabel>
                  <input type="date" value={form.deadline}
                    onChange={e => { const val = e.target.value; if (val && val < todayStr()) return; setForm({ ...form, deadline: val }) }}
                    min={todayStr()} className={inp('deadline')} />
                  {errors.deadline && <p className="text-red-600 text-xs mt-1">{errors.deadline}</p>}
                </div>
              </div>

              <div>
                <FieldLabel>Skills required</FieldLabel>
                <SkillSelector selected={skills} onChange={setSkills} />
              </div>

            </div>
          </div>

          {/* ── Section 2: Advance Payment ── */}
          <div className="dark-card p-6">
            <SectionHeader num="2" title="Advance payment" subtitle="Locked when you hire. Released to the freelancer with the final milestone, or if you end the contract early." />
            <div className="mb-4 grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Advance percentage">
              {[10, 15, 20, 25].map(pct => (
                <button key={pct} type="button" role="radio" aria-checked={form.advancePercent === pct} onClick={() => setForm({ ...form, advancePercent: pct })}
                  className={`rounded-md py-2 text-sm font-semibold transition-colors ${form.advancePercent === pct ? 'bg-surface text-orange-700 shadow-sm ring-1 ring-orange-200' : 'text-slate-500 hover:text-slate-800'}`}>
                  {pct}%
                </button>
              ))}
            </div>
            {budget > 0 && (
              <div className="px-4 py-3 rounded-xl" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgb(var(--slate-500))' }}>Advance locked at hire:</span>
                  <span className="font-bold" style={{ color: '#EA580C' }}>₹{advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: 'rgb(var(--slate-500))' }}>Distributed across phases:</span>
                  <span style={{ color: 'rgb(var(--slate-600))' }}>₹{remaining.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 3: Phase Planning ── */}
          <div className="dark-card p-6">
            <SectionHeader num="3" title="Milestones" subtitle="Break the work into at least 3 milestones, each with its own deliverable and deadline" />

            {errors.phasesTotal && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-sm text-red-600" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {errors.phasesTotal}
              </div>
            )}

            <div className="space-y-3">
              {phases.map((phase, i) => {
                const isLast = i === phases.length - 1
                const displayBudget = isLast ? String(lastPhasePercent) : phase.budgetPercent
                const displayDeadline = isLast ? (form.deadline || '') : phase.phaseDeadline
                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-orange-700 text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgb(var(--orange-100))' }}>{i + 1}</div>
                        <span className="text-sm font-semibold text-slate-900">Milestone {i + 1}</span>
                        {budget > 0 && <span className="text-xs text-slate-500">· {inr(Math.round(remaining * (isLast ? lastPhasePercent : Number(phase.budgetPercent || 0)) / 100))}</span>}
                        {isLast && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                            style={{ background: 'rgb(var(--surface))', color: 'rgb(var(--slate-500))', border: '1px solid rgb(var(--slate-200))' }}>
                            Final
                          </span>
                        )}
                      </div>
                      {phases.length > 3 && !isLast && (
                        <button type="button" onClick={() => removePhase(i)}
                          className="text-xs font-medium transition-colors" style={{ color: 'rgb(var(--slate-500))' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--slate-500))'}>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                          <input value={phase.title} onChange={e => updatePhase(i, 'title', e.target.value)}
                            className={`dark-input w-full ${errors[`phase_${i}_title`] ? 'border-red-500' : ''}`}
                            placeholder="e.g. UI Design" />
                          {errors[`phase_${i}_title`] && <p className="text-red-600 text-xs mt-0.5">{errors[`phase_${i}_title`]}</p>}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Deliverable type</label>
                          <select value={phase.deliverableType} onChange={e => updatePhase(i, 'deliverableType', e.target.value)} className="dark-input w-full">
                            {DELIVERABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Acceptance criteria</label>
                        <textarea rows={3} value={phase.guideline} onChange={e => updatePhase(i, 'guideline', e.target.value)}
                          className={`dark-input w-full ${errors[`phase_${i}_guideline`] ? 'border-red-500' : ''}`}
                          placeholder="What exactly must be delivered? What does done look like?" />
                        {phase.guidelineHash && (
                          <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-lg"
                            style={{ background: 'rgb(var(--slate-100))', border: '1px solid rgb(var(--slate-200))' }}>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-[10px] font-mono truncate" style={{ color: 'rgb(var(--slate-600))' }}>SHA-256: {phase.guidelineHash}</span>
                          </div>
                        )}
                        {errors[`phase_${i}_guideline`] && <p className="text-red-600 text-xs mt-0.5">{errors[`phase_${i}_guideline`]}</p>}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Share of budget</label>
                          <div className="relative">
                            <input type="number" value={displayBudget}
                              onChange={e => !isLast && updatePhase(i, 'budgetPercent', e.target.value)}
                              readOnly={isLast}
                              className={`dark-input w-full pr-7 ${isLast ? 'opacity-50 cursor-not-allowed' : errors[`phase_${i}_budget`] ? 'border-red-500' : ''}`}
                              placeholder="30" min="1" max="99" />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgb(var(--slate-500))' }}>%</span>
                          </div>
                          {isLast
                            ? <p className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--slate-500))' }}>Remaining {lastPhasePercent}%</p>
                            : errors[`phase_${i}_budget`] && <p className="text-red-600 text-xs mt-0.5">{errors[`phase_${i}_budget`]}</p>
                          }
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Due date</label>
                          <input type="date" value={displayDeadline}
                            onChange={e => { if (isLast) return; const val = e.target.value; if (val && val < todayStr()) return; updatePhase(i, 'phaseDeadline', val) }}
                            readOnly={isLast} min={todayStr()} max={form.deadline || undefined}
                            className={`dark-input w-full ${isLast ? 'opacity-50 cursor-not-allowed' : errors[`phase_${i}_deadline`] ? 'border-red-500' : ''}`} />
                          {isLast
                            ? <p className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--slate-500))' }}>Matches the job deadline</p>
                            : errors[`phase_${i}_deadline`] && <p className="text-red-600 text-xs mt-0.5">{errors[`phase_${i}_deadline`]}</p>
                          }
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Revisions</label>
                          <select value={phase.maxRevisions} onChange={e => updatePhase(i, 'maxRevisions', Number(e.target.value))} className="dark-input w-full">
                            <option value={1}>1 revision</option>
                            <option value={2}>2 revisions</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button type="button" onClick={addPhase}
              className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700">
              + Add milestone
            </button>
          </div>

          {/* ── Section 4: Reference Files ── */}
          <div className="dark-card p-6">
            <SectionHeader num="4" title="Reference files (optional)" subtitle="Mockups, wireframes or specs. Files are hashed and kept as evidence if there is ever a dispute." />

            {referenceFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                {referenceFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--slate-900))' }}>{f.originalName}</p>
                      <p className="text-xs font-mono mt-0.5 truncate" style={{ color: '#EA580C' }}>{f.fileHash}</p>
                    </div>
                    <button type="button" onClick={() => setReferenceFiles(referenceFiles.filter((_, idx) => idx !== i))}
                      className="ml-3 text-lg leading-none transition-colors" style={{ color: 'rgb(var(--slate-500))' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--slate-500))'}>×</button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" className="hidden" onChange={handleRefFileUpload} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || referenceFiles.length >= 5}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50">
              {uploadingFile
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#EA580C' }} />
                    Uploading...
                  </span>
                : `Upload a file (${referenceFiles.length}/5 · max 10 MB)`
              }
            </button>
          </div>

          {/* ── Section 5: Review & Post ── */}
          <div className="dark-card p-6">
            <SectionHeader num="5" title="Review & post" subtitle="Once posted, the scope and milestone guidelines are locked with a SHA-256 hash" />

            {/* Scope lock info */}
            <div className="px-4 py-3 rounded-xl mb-5 flex items-start gap-3"
              style={{ background: 'rgb(var(--slate-100))', border: '1px solid rgb(var(--slate-200))' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#EA580C' }}>Scope Lock</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgb(var(--slate-600))' }}>
                  After posting, a SHA-256 hash of your job title, description, and all phase guidelines will be generated and stored. This creates a tamper-proof record that protects both parties in any dispute.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading || isBlocked}
              className="btn-purple w-full font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} />
                    Posting...
                  </span>
                : 'Post job & lock scope'
              }
            </button>
          </div>

        </form>

        {/* Live summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-xl border border-slate-200 bg-surface p-5">
            <p className="text-sm font-semibold text-slate-900">Your job post</p>
            <ol className="mt-4 space-y-2.5 p-0">
              {steps.map(([label, done, optional]) => (
                <li key={label} className="flex list-none items-center gap-2.5 text-sm">
                  <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${done ? 'bg-emerald-600 text-white' : 'ring-1 ring-inset ring-slate-300'}`}>
                    {done && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </span>
                  <span className={done ? 'text-slate-900' : 'text-slate-600'}>{label}</span>
                  {optional && <span className="text-xs text-slate-400">optional</span>}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-slate-200 bg-surface p-5">
            <p className="text-sm font-semibold text-slate-900">Cost breakdown</p>
            {budget > 0 ? (
              <>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-600">Advance ({form.advancePercent}%)</dt><dd className="font-medium text-slate-900">{inr(advanceAmount)}</dd></div>
                  {phases.map((p, i) => {
                    const pct = i === phases.length - 1 ? lastPhasePercent : Number(p.budgetPercent || 0)
                    return (
                      <div key={i} className="flex justify-between gap-3">
                        <dt className="min-w-0 truncate text-slate-600">{p.title || `Milestone ${i + 1}`} <span className="text-slate-400">({pct}%)</span></dt>
                        <dd className="flex-none font-medium text-slate-900">{pct ? inr(Math.round(remaining * pct / 100)) : '—'}</dd>
                      </div>
                    )
                  })}
                  <div className="flex justify-between gap-3 border-t border-slate-200 pt-2"><dt className="text-slate-600">Job budget</dt><dd className="font-medium text-slate-900">{inr(budget)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-600">Platform fee (2%)</dt><dd className="font-medium text-slate-900">{inr(Math.round(budget * 0.02))}</dd></div>
                  <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base"><dt className="font-semibold text-slate-900">Total you'll pay</dt><dd className="font-bold text-slate-900">{inr(budget + Math.round(budget * 0.02))}</dd></div>
                </dl>
                {Math.abs(totalPercent - 100) > 0.5 && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Milestone shares add up to {totalPercent}% — they need to total 100%.</p>}
                <p className="mt-3 text-xs leading-5 text-slate-500">You fund one milestone at a time. Nothing is charged when you post.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Enter a budget to see how it splits across the advance and milestones.</p>
            )}
            <button type="submit" form="post-job-form" disabled={loading || isBlocked} className={`${btn.primary} mt-5 w-full py-2.5`}>
              {loading ? 'Posting…' : 'Post job'}
            </button>
          </section>
        </aside>
        </div>
    </div>
    </div>
  )
}
