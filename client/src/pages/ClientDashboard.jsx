import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'
import { PageHeader, Stat, Section, Empty, Avatar, StatusPill, btn, inr } from '../components/ui'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function ClientDashboard() {
  const [contracts, setContracts] = useState([])
  const [jobs, setJobs] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [talent, setTalent] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/jobs/freelancers/browse').then(({ data }) => setTalent(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    let done = 0
    const finish = () => { if (++done === 3) setLoading(false) }

    api.get('/api/contracts/my-contracts')
      .then(r => setContracts(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load contracts'))
      .finally(finish)

    api.get('/api/jobs/my-jobs')
      .then(r => setJobs(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load jobs'))
      .finally(finish)

    api.get('/api/auth/me')
      .then(r => setPortfolio(r.data.portfolio ?? null))
      .catch(() => {})
      .finally(finish)
  }, [])

  const allBids = jobs.flatMap(j => (j.bids || []).map(b => ({ ...b, job: j })))
  const awaitingDecision = allBids.filter(b => b.status === 'shortlisted')
  const activeContracts = contracts.filter(c => ['active', 'pending_advance'].includes(c.status))
  const totalValue = contracts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')

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
        modal: { ondismiss: () => toast('Payment cancelled. Go to the contract to complete advance payment.') }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => toast.error(`Payment failed: ${response.error.description}`))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate advance payment')
    }
  }

  const quickAction = async (jobId, bidId, endpoint) => {
    setActionLoading(bidId + endpoint)
    try {
      const { data } = await api.patch(`/api/jobs/${jobId}/applications/${bidId}/${endpoint}`)
      if (endpoint === 'hire') {
        setJobs(prev => prev.map(j => j._id !== jobId ? j : (data.job || j)))
        toast('Freelancer hired! Complete the advance payment to activate the project.')
        await handleAdvancePayment(data.advanceMilestone, data.contract._id)
        return
      }
      setJobs(prev => prev.map(j => j._id !== jobId ? j : (data.job || data)))
      toast.success('Done')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  const avatarSrc = portfolio?.avatarUrl
    ? (portfolio.avatarUrl.startsWith('http') ? portfolio.avatarUrl : `${FILE_BASE}${portfolio.avatarUrl}`)
    : null
  const completion = portfolio ? calcCompletion('client', portfolio) : 0

  if (loading) return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-8 w-64 shimmer-skeleton" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer-skeleton rounded-xl" />)}
        </div>
        <div className="mt-8 h-40 shimmer-skeleton rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Client dashboard"
          title={`Welcome back, ${user.name?.split(' ')[0] || ''}`}
          subtitle="Track your jobs, applicants and escrow-protected contracts."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Stat label="Active contracts" value={activeContracts.length} highlight />
              <Stat label="Total contract value" value={inr(totalValue)} />
              <Stat label="Open jobs" value={openJobs.length} />
              <Stat label="Shortlisted" value={awaitingDecision.length} />
            </div>

            {awaitingDecision.length > 0 && (
              <Section title="Shortlisted — awaiting your decision">
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
                  {awaitingDecision.map(b => {
                    const isLoading = (suf) => actionLoading === b._id + suf
                    return (
                      <div key={b._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <Avatar name={b.freelancer?.name} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{b.freelancer?.name}</p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {b.job.title} · {inr(b.job.budget)}{b.freelancer?.rating > 0 && ` · ★ ${b.freelancer.rating}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => quickAction(b.job._id, b._id, 'hire')} disabled={isLoading('hire')} className={btn.primary}>
                            {isLoading('hire') ? 'Hiring…' : 'Hire'}
                          </button>
                          <button onClick={() => quickAction(b.job._id, b._id, 'reject')} disabled={isLoading('reject')} className={btn.secondary}>
                            {isLoading('reject') ? '…' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            <Section title="Active contracts">
              {activeContracts.length === 0 ? (
                <Empty title="No active contracts yet" body="Hire a freelancer from one of your jobs to start a contract." />
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
                  {activeContracts.map(c => (
                    <Link key={c._id} to={`/contracts/${c._id}`} className="flex items-center gap-4 p-4 no-underline transition-colors hover:bg-slate-50">
                      <Avatar name={c.freelancer?.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{c.job?.title || 'Contract'}</p>
                        <p className="mt-0.5 text-sm text-slate-500">with {c.freelancer?.name} · {c.milestoneCount} milestones</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-semibold text-slate-900">{inr(c.amount)}</p>
                        <div className="mt-1"><StatusPill status={c.status} /></div>
                      </div>
                      <svg className="h-5 w-5 flex-none text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            <Section title="My posted jobs" action={<Link to="/jobs/post" className="text-sm font-semibold text-orange-700 no-underline hover:underline">Post a job</Link>}>
              {jobs.length === 0 ? (
                <Empty title="You haven't posted a job yet" body="Describe what you need and freelancers will start applying."
                  action={<Link to="/jobs/post" className={btn.primary}>Post your first job</Link>} />
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
                  {jobs.map(j => {
                    const bids = j.bids || []
                    const applied = bids.filter(b => b.status === 'applied').length
                    const shortlisted = bids.filter(b => b.status === 'shortlisted').length
                    const hired = bids.filter(b => b.status === 'hired').length
                    return (
                      <div key={j._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                            <StatusPill status={j.status} />
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {inr(j.budget)} budget ·{' '}
                            {bids.length === 0 ? 'No applications yet'
                              : [applied && `${applied} new`, shortlisted && `${shortlisted} shortlisted`, hired && `${hired} hired`].filter(Boolean).join(' · ') || `${bids.length} applications`}
                          </p>
                        </div>
                        <Link to={`/jobs/${j._id}`} className={btn.secondary}>Manage</Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-4">
            {portfolio !== null && (
              <div className="rounded-xl border border-slate-200 bg-surface p-5">
                <div className="flex items-center gap-3">
                  <Avatar src={avatarSrc} name={user.name} size="h-12 w-12" textSize="text-lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs capitalize text-slate-500">{portfolio?.clientType || 'Client'}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-slate-600">{portfolio?.bio || 'Add a short bio so freelancers know who they will work with.'}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs"><span className="font-medium text-slate-700">Profile strength</span><span className="text-slate-500">{completion}%</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <Link to="/profile/setup" className={`${btn.secondary} mt-4 w-full`}>{completion < 100 ? 'Complete profile' : 'Edit profile'}</Link>
              </div>
            )}
            {talent.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Freelancers you might like</p>
                  <Link to="/freelancers" className="text-xs font-semibold text-orange-700 no-underline hover:underline">Browse</Link>
                </div>
                <ul className="mt-3 space-y-3 p-0">
                  {[...talent].sort((a, b) => (b.user?.rating || 0) - (a.user?.rating || 0)).slice(0, 3).map(f => (
                    <li key={f._id} className="list-none">
                      <Link to={`/freelancers/${f.user?._id}`} className="flex items-center gap-3 rounded-lg p-1.5 no-underline transition-colors hover:bg-slate-50">
                        <Avatar name={f.user?.name} size="h-9 w-9" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{f.user?.name}</p>
                          <p className="truncate text-xs text-slate-500">{(f.skills || []).slice(0, 3).join(' · ') || 'Freelancer'}</p>
                        </div>
                        {f.user?.rating > 0 && <span className="text-xs font-semibold text-slate-700">★ {f.user.rating.toFixed(1)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-surface p-5">
              <p className="text-sm font-semibold text-slate-900">How escrow protects you</p>
              <ul className="mt-3 space-y-2.5 p-0 text-sm text-slate-600">
                {['Fund one milestone at a time', 'Review the SHA-256 verified delivery', 'Approve to release, or raise a dispute'].map((t, i) => (
                  <li key={t} className="flex list-none gap-2.5"><span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{i + 1}</span>{t}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
