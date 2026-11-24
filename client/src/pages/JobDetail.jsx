import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { StatusPill, Chip, Avatar, BackLink, btn, inr, timeAgo, fmtDate } from '../components/ui'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'

// profileCompletion is kept for the initial render guard; overridden by fresh API value on mount
const profileCompletionLocal = () => parseInt(localStorage.getItem('profileCompletion') || '0', 10)

const STATUS_LABELS = {
  applied:            { label: 'Applied',      style: { background: 'rgb(var(--surface))', color: 'rgb(var(--slate-600))', border: '1px solid rgb(var(--slate-200))' } },
  shortlisted:        { label: 'Shortlisted',  style: { background: 'rgb(var(--orange-50))', color: '#EA580C', border: '1px solid rgb(var(--orange-200))' } },
  interview_scheduled:{ label: 'Interview',    style: { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' } },
  interviewed:        { label: 'Interviewed',  style: { background: 'rgb(var(--slate-100))', color: 'rgb(var(--slate-600))', border: '1px solid rgb(var(--slate-200))' } },
  negotiating:        { label: 'Negotiating',  style: { background: 'rgba(59,130,246,0.08)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.2)' } },
  hired:              { label: 'Hired',        style: { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' } },
  rejected:           { label: 'Rejected',     style: { background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.15)' } },
}

const TABS = ['All', 'Applied', 'Shortlisted']
const TAB_STATUS = {
  All: null,
  Applied: ['applied'],
  Shortlisted: ['shortlisted'],
}

const SectionLabel = ({ text }) => (
  <h2 className="mb-4 text-lg font-semibold text-slate-900">{text}</h2>
)

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [job, setJob] = useState(null)
  const [proposal, setProposal] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [actionLoading, setActionLoading] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [freshCompletion, setFreshCompletion] = useState(profileCompletionLocal())
  const [profileChecking, setProfileChecking] = useState(user.role === 'freelancer')

  const reload = () =>
    api.get(`/api/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => toast.error('Job not found'))

  const refreshFreelancerProfile = useCallback(() => {
    if (user.role !== 'freelancer') return Promise.resolve()
    return api.get('/api/auth/me').then(({ data }) => {
      setVerificationStatus(data.user?.verificationStatus || 'pending')
      if (data.portfolio) {
        const pct = calcCompletion(data.user?.role || 'freelancer', data.portfolio)
        setFreshCompletion(pct)
        localStorage.setItem('profileCompletion', String(pct))
      } else {
        setFreshCompletion(0)
      }
    }).catch(() => {})
  }, [user.role])

  useEffect(() => {
    reload().finally(() => setLoading(false))
    if (user.role === 'freelancer') {
      setProfileChecking(true)
      refreshFreelancerProfile().finally(() => setProfileChecking(false))
    }
  }, [id])

  useEffect(() => {
    window.addEventListener('profileUpdated', refreshFreelancerProfile)
    return () => window.removeEventListener('profileUpdated', refreshFreelancerProfile)
  }, [refreshFreelancerProfile])

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/api/jobs/${id}/apply`, { proposal, discountPercent })
      toast.success('Application submitted!')
      await reload()
    } catch (err) {
      // If backend says profile is incomplete, sync the real completion % so the
      // banner shows and the form hides — no ghost "apply" state possible
      if (err.response?.status === 403 && err.response?.data?.completionPercent !== undefined) {
        const serverPct = err.response.data.completionPercent
        setFreshCompletion(serverPct)
        localStorage.setItem('profileCompletion', String(serverPct))
      }
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally { setSubmitting(false) }
  }

  const handleAdvancePayment = async (advanceMilestone, contractId) => {
    try {
      const { data } = await api.post(`/api/milestones/${advanceMilestone._id}/fund`)
      const isTestMode = !data.razorpayKeyId || data.razorpayKeyId.includes('placeholder') || data.razorpayOrderId?.startsWith('order_test_')
      if (isTestMode) {
        toast.success('Advance payment secured! Project is now active.')
        navigate(`/contracts/${contractId}`)
        return
      }
      const options = {
        key: data.razorpayKeyId,
        amount: Math.round(advanceMilestone.amount * 100),
        currency: 'INR',
        name: 'SafeLancer Escrow',
        description: advanceMilestone.title,
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post(`/api/milestones/${advanceMilestone._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Advance payment secured! Project is now active.')
            navigate(`/contracts/${contractId}`)
          } catch { toast.error('Payment verification failed.') }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#EA580C' },
        modal: { ondismiss: () => toast('Payment cancelled. The contract is on hold until advance is paid.') }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => toast.error(`Payment failed: ${response.error.description}`))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate advance payment')
    }
  }

  const action = async (bidId, endpoint, body = {}) => {
    setActionLoading(bidId + endpoint)
    try {
      const { data } = await api.patch(`/api/jobs/${id}/applications/${bidId}/${endpoint}`, body)
      if (endpoint === 'hire') {
        setJob(data.job || data)
        toast('Freelancer hired! Complete the advance payment to activate the project.')
        await handleAdvancePayment(data.advanceMilestone, data.contract._id)
        return data
      }
      setJob(data.job || data)
      toast.success('Done')
      return data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  const myBid = job?.bids?.find(b => b.freelancer?._id === user.id || b.freelancer === user.id)
  const filteredBids = () => {
    if (!job?.bids) return []
    const statuses = TAB_STATUS[activeTab]
    if (!statuses) return job.bids
    return job.bids.filter(b => statuses.includes(b.status))
  }
  const tabCount = (tab) => {
    if (!job?.bids) return 0
    const statuses = TAB_STATUS[tab]
    if (!statuses) return job.bids.length
    return job.bids.filter(b => statuses.includes(b.status)).length
  }

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center py-12">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'rgb(var(--slate-200))' }} />
          <div className="absolute inset-0 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#EA580C' }} />
        </div>
      </div>
    </div>
  )

  if (!job) return (
    <div className="min-h-screen">
      <Navbar />
      <p className="text-center py-12 text-sm" style={{ color: 'rgb(var(--slate-500))' }}>Job not found</p>
    </div>
  )

  const advanceAmt = Math.round((job.budget || 0) * (job.advancePercent || 10) / 100)
  const phaseAmt = (phase) => Math.round(((job.budget || 0) - advanceAmt) * phase.budgetPercent / 100)
  const isOwner = user.role === 'client' && (job.client?._id === user.id || job.client === user.id)
  const scrollToApply = () => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <BackLink onClick={() => navigate(-1)} />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">

        {/* Job header */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <StatusPill status={job.status} />
            <span>Posted {timeAgo(job.createdAt)}</span>
            {job.category && job.category !== 'Other' && <span>· {job.category}</span>}
            {job.experienceLevel && <span>· {job.experienceLevel} level</span>}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">{job.description}</p>
          {job.skills?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-900">Skills required</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">{job.skills.map(s => <Chip key={s}>{s}</Chip>)}</div>
            </div>
          )}
        </section>

        {/* Milestones */}
        {job.phases?.length > 0 && (
          <section className="mb-5 rounded-xl border border-slate-200 bg-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Milestones</h2>
              {job.scopeHash && <p className="text-xs text-slate-500">Scope locked · <span className="font-mono">{job.scopeHash}</span></p>}
            </div>
            <ol className="mt-5 p-0">
              {job.phases.map((phase, i) => (
                <li key={i} className="relative flex list-none gap-4 pb-6 last:pb-0">
                  {i < job.phases.length - 1 && <span className="absolute left-[15px] top-9 bottom-0 w-px bg-slate-200" />}
                  <span className="z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-700 ring-1 ring-orange-200">{i + 1}</span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{phase.title}</p>
                      <p className="font-semibold text-slate-900">{inr(phaseAmt(phase))}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{phase.guideline}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Due {fmtDate(phase.phaseDeadline)}</span>
                      <span>{phase.deliverableType}</span>
                      <span>Up to {phase.maxRevisions} revision{phase.maxRevisions === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">Advance ({job.advancePercent || 10}%) · released with the final milestone or on early exit</span>
              <span className="font-semibold text-slate-900">{inr(advanceAmt)}</span>
            </div>
          </section>
        )}

        {/* Reference Files */}
        {job.referenceFiles?.length > 0 && (
          <div className="dark-card p-6 mb-5">
            <SectionLabel text="Reference Files" />
            <p className="text-xs mb-3 -mt-2" style={{ color: 'rgb(var(--slate-500))' }}>SHA-256 hashed — tamper-proof evidence baseline</p>
            <div className="space-y-2">
              {job.referenceFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--slate-500))' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--slate-900))' }}>{f.originalName}</p>
                    <p className="text-xs font-mono truncate" style={{ color: 'rgb(var(--slate-500))' }}>{f.fileHash}</p>
                  </div>
                  <a href={f.url?.startsWith('http') ? f.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${f.url}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ color: 'rgb(var(--slate-600))', border: '1px solid rgb(var(--slate-200))', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgb(var(--slate-900))'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgb(var(--slate-600))'; e.currentTarget.style.borderColor = 'rgb(var(--orange-50))' }}>
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Freelancer: apply */}
        {user.role === 'freelancer' && job.status === 'open' && !myBid && (
          <div id="apply" className="dark-card scroll-mt-24 p-6 mb-5 sm:p-8">
            <SectionLabel text="Submit a proposal" />
            <p className="text-sm mb-4 -mt-2" style={{ color: 'rgb(var(--slate-500))' }}>Fixed budget: <span style={{ color: '#EA580C', fontWeight: 600 }}>₹{job.budget?.toLocaleString()}</span> — set by client</p>

            {/* Verified-only block */}
            {job.verifiedOnly && verificationStatus !== 'approved' && (
              <div className="rounded-xl p-4 mb-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Verified Freelancers Only</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgb(var(--slate-600))' }}>
                    This client requires a SafeLancer-verified freelancer. Your account is currently <strong style={{ color: '#f59e0b' }}>pending verification</strong>. Once an admin approves your account, you will be able to apply.
                  </p>
                </div>
              </div>
            )}

            <p className="mb-5 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <svg className="mt-0.5 h-4 w-4 flex-none text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>A 2% platform fee is deducted from your payouts. On this job you would receive <span className="font-semibold text-slate-900">₹{Math.round(job.budget * 0.98).toLocaleString('en-IN')}</span> of {inr(job.budget)}.</span>
            </p>
            {profileChecking ? (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'rgba(255,104,3,0.3)', borderTopColor: '#EA580C', animation: 'spin 0.8s linear infinite' }} />
                <span className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Checking profile…</span>
              </div>
            ) : freshCompletion < 100 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-800">Finish your profile to apply</p>
                    <p className="mt-0.5 text-sm text-amber-700">Your profile is {freshCompletion}% complete. Clients only see proposals from complete profiles.</p>
                    <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-amber-200/60">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${freshCompletion}%` }} />
                    </div>
                  </div>
                  <Link to="/profile/setup" className={btn.primary}>Complete profile</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Cover letter</label>
                  <textarea required rows={5} value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    className="dark-input w-full"
                    placeholder="Describe your approach, experience, and why you're the right fit..." />
                </div>

                {/* Discount offer */}
                <div className="rounded-xl p-4" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'rgb(var(--slate-900))' }}>Offer a discount <span className="text-xs font-normal ml-1" style={{ color: 'rgb(var(--slate-500))' }}>(optional)</span></p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--slate-500))' }}>Attract the client by offering a discount on the total budget</p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: discountPercent > 0 ? '#EA580C' : 'rgb(var(--slate-500))' }}>
                      {discountPercent}%
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="50" step="1"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 rounded-full"
                    style={{ accentColor: '#EA580C' }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'rgb(var(--slate-500))' }}>
                    <span>0% (no discount)</span>
                    <span>50% max</span>
                  </div>
                  {discountPercent > 0 && (() => {
                    const discounted = Math.round(job.budget * (1 - discountPercent / 100))
                    const fee = Math.round(discounted * 0.02)
                    const youGet = discounted - fee
                    return (
                      <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px solid rgb(var(--slate-200))' }}>
                        <div>
                          <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Client pays</p>
                          <p className="text-sm font-bold" style={{ color: '#10b981' }}>₹{discounted.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>was ₹{job.budget?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Platform fee (2%)</p>
                          <p className="text-sm font-bold" style={{ color: 'rgb(var(--slate-900))' }}>−₹{fee.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>on discounted amt</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>You receive</p>
                          <p className="text-sm font-bold" style={{ color: '#EA580C' }}>₹{youGet.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>after fee</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <button type="submit" disabled={submitting}
                  className="btn-purple w-full font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit proposal'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* My bid status */}
        {myBid && (
          <div className="dark-card p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Your proposal</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={STATUS_LABELS[myBid.status]?.style}>
                {STATUS_LABELS[myBid.status]?.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--slate-600))' }}>{myBid.proposal}</p>
            {myBid.discountPercent > 0 && (() => {
              const discounted = Math.round(job.budget * (1 - myBid.discountPercent / 100))
              const fee = Math.round(discounted * 0.02)
              const youGet = discounted - fee
              return (
                <div className="mt-3 pt-3 rounded-xl p-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--slate-100))' }}>
                  <div>
                    <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Discount offered</p>
                    <p className="text-sm font-bold" style={{ color: '#EA580C' }}>{myBid.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Client pays</p>
                    <p className="text-sm font-bold" style={{ color: '#10b981' }}>₹{discounted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>You receive</p>
                    <p className="text-sm font-bold" style={{ color: '#EA580C' }}>₹{youGet.toLocaleString()}</p>
                  </div>
                </div>
              )
            })()}
            {myBid.status === 'rejected' && myBid.rejectionReason && (
              <p className="mt-2 text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Reason: {myBid.rejectionReason}</p>
            )}
            {myBid.status === 'interview_scheduled' && myBid.meetingRoomId && (
              <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid rgb(var(--slate-200))' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm" style={{ color: 'rgb(var(--slate-600))' }}>Interview scheduled</span>
                <Link to={`/interview/${myBid.meetingRoomId}`}
                  className="btn-purple text-xs font-semibold px-3 py-1.5 rounded-lg ml-auto">
                  Join Interview
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Client: proposals */}
        {user.role === 'client' && (
          <section className="rounded-xl border border-slate-200 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
              <h2 className="text-lg font-semibold text-slate-900">Proposals <span className="font-normal text-slate-500">({job.bids?.length || 0})</span></h2>
              <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
                {TABS.map(tab => (
                  <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-surface text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {tab} <span className="text-slate-400">{tabCount(tab)}</span>
                  </button>
                ))}
              </div>
            </div>

            {filteredBids().length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-900">No proposals here yet</p>
                <p className="mt-1 text-sm text-slate-500">{activeTab === 'All' ? 'Freelancers who apply will show up here.' : `No one is ${activeTab.toLowerCase()} right now.`}</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-200 p-0">
                {filteredBids().map(b => {
                  const isLoading = (suf) => actionLoading === b._id + suf
                  const f = b.freelancer || {}
                  return (
                    <li key={b._id} className="list-none px-6 py-5">
                      <div className="flex items-start gap-4">
                        <Avatar name={f.name} size="h-11 w-11" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Link to={`/freelancers/${f._id}`} className="font-semibold text-slate-900 no-underline hover:underline">{f.name}</Link>
                            <StatusPill status={b.status} />
                            {b.discountPercent > 0 && <StatusPill tone="green">{b.discountPercent}% discount offered</StatusPill>}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {f.rating > 0 && <>★ {Number(f.rating).toFixed(1)} · </>}
                            {f.totalJobsCompleted > 0 ? `${f.totalJobsCompleted} jobs completed` : 'New to SafeLancer'}
                            {f.onTimeDeliveryRate > 0 && ` · ${Math.round(f.onTimeDeliveryRate)}% on time`}
                            {b.appliedAt && ` · applied ${timeAgo(b.appliedAt)}`}
                          </p>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{b.proposal}</p>
                          {b.status === 'rejected' && b.rejectionReason && (
                            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Rejection reason: {b.rejectionReason}</p>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {b.status === 'applied' && (
                              <button onClick={() => action(b._id, 'shortlist')} disabled={isLoading('shortlist')} className={btn.primary}>
                                {isLoading('shortlist') ? 'Shortlisting…' : 'Shortlist'}
                              </button>
                            )}
                            {b.status === 'shortlisted' && (
                              <button onClick={() => action(b._id, 'hire')} disabled={isLoading('hire')} className={btn.primary}>
                                {isLoading('hire') ? 'Hiring…' : 'Hire & fund advance'}
                              </button>
                            )}
                            <Link to={`/freelancers/${f._id}`} className={btn.secondary}>View profile</Link>
                            {['applied', 'shortlisted'].includes(b.status) && (
                              <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                                {isLoading('reject') ? '…' : 'Decline'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
        </div>

        {/* Summary sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-xl border border-slate-200 bg-surface p-6">
            <p className="text-sm text-slate-500">Fixed-price budget</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{inr(job.budget)}</p>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ['Milestones', job.phases?.length || 0],
                ['Advance', `${job.advancePercent || 10}% · ${inr(advanceAmt)}`],
                ['Deadline', fmtDate(job.deadline)],
                ['Proposals', job.bids?.length || 0],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>
              ))}
            </dl>
            {user.role === 'freelancer' && job.status === 'open' && !myBid && (
              <button onClick={scrollToApply} className={`${btn.primary} mt-6 w-full py-2.5`}>Apply now</button>
            )}
            {user.role === 'freelancer' && myBid && (
              <div className="mt-6 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Your proposal: <StatusPill status={myBid.status} /></div>
            )}
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <svg className="mt-0.5 h-4 w-4 flex-none text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 10-9 0v3.5m-.75 10.5h10.5a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6A2.25 2.25 0 006.75 21z" /></svg>
              Each milestone is funded into escrow before work starts and released only on approval.
            </p>
          </div>

          {isOwner && (
            <div className="rounded-xl border border-slate-200 bg-surface p-6">
              <p className="text-sm font-semibold text-slate-900">Hiring progress</p>
              <ol className="mt-4 space-y-3 p-0">
                {[
                  ['Proposals received', job.bids?.length || 0],
                  ['Shortlisted', (job.bids || []).filter(b => b.status === 'shortlisted').length],
                  ['Hired', (job.bids || []).filter(b => b.status === 'hired').length],
                ].map(([k, v], i) => (
                  <li key={k} className="flex list-none items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-slate-600">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${v > 0 ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>{k}
                    </span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs leading-5 text-slate-500">Shortlist the best fits, then hire one. Hiring creates the contract and asks you to fund the advance into escrow.</p>
            </div>
          )}

          {job.client && !isOwner && (
            <div className="rounded-xl border border-slate-200 bg-surface p-6">
              <p className="text-sm font-semibold text-slate-900">About the client</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={job.client.name} />
                <div className="min-w-0">
                  {user.role === 'freelancer'
                    ? <Link to={`/clients/${job.client._id}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline">{job.client.name}</Link>
                    : <p className="truncate text-sm font-semibold text-slate-900">{job.client.name}</p>}
                  {job.client.rating > 0 && <p className="text-xs text-slate-500">★ {Number(job.client.rating).toFixed(1)} rating</p>}
                </div>
              </div>
              {job.client.totalJobsCompleted > 0 && (
                <p className="mt-3 text-sm text-slate-600">{job.client.totalJobsCompleted} project{job.client.totalJobsCompleted === 1 ? '' : 's'} completed on SafeLancer</p>
              )}
            </div>
          )}
        </aside>
        </div>
      </main>
    </div>
  )
}
