import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'
import { PageHeader, Stat, Section, Empty, Avatar, StatusPill, btn, inr, humanize, timeAgo } from '../components/ui'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const PIPELINE = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'hired', label: 'Hired' },
]

const TX_LABEL = {
  phase_payment: 'Phase Payment',
  advance_payment: 'Advance Payment',
  dispute_release: 'Dispute Release',
  split_payment: 'Split Payment',
  auto_release: 'Auto Release',
  withdrawal_penalty: 'Withdrawal Penalty',
  withdrawal_advance: 'Advance on Withdrawal',
  withdrawal_phase: 'Phase on Withdrawal',
}

export default function FreelancerDashboard() {
  const [contracts, setContracts] = useState([])
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [openJobs, setOpenJobs] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  const refreshEarnings = () => {
    api.get('/api/transactions/my').then(({ data }) => {
      setWalletBalance(data.walletBalance)
      setTransactions(data.transactions || [])
    }).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/contracts/my-work'),
      api.get('/api/jobs/my-applications'),
      api.get('/api/auth/me'),
      api.get('/api/transactions/my'),
    ]).then(([c, a, me, tx]) => {
      setContracts(c.data || [])
      setApplications(a.data || [])
      setPortfolio(me.data.portfolio)
      setVerificationStatus(me.data.user?.verificationStatus || 'pending')
      setWalletBalance(tx.data?.walletBalance || 0)
      setTransactions(tx.data?.transactions || [])
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get('/api/jobs').then(({ data }) => setOpenJobs(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    window.addEventListener('payoutsProcessed', refreshEarnings)
    return () => window.removeEventListener('payoutsProcessed', refreshEarnings)
  }, [])

  const activeContracts = contracts.filter(c => ['active', 'pending_advance'].includes(c.status))
  const totalEarned = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  // Recommend open jobs the freelancer hasn't applied to, ranked by skill overlap.
  const mySkills = (portfolio?.skills || []).map(x => x.toLowerCase())
  const appliedIds = new Set(applications.map(a => a.job?._id))
  const recommended = openJobs
    .filter(j => j.status === 'open' && !appliedIds.has(j._id))
    .map(j => ({ j, score: (j.skills || []).filter(sk => mySkills.includes(sk.toLowerCase())).length }))
    .sort((a, b) => b.score - a.score || new Date(b.j.createdAt) - new Date(a.j.createdAt))
    .slice(0, 3)

  const visibleApps = applications.filter(({ bid }) => bid.status !== 'rejected' || bid.rejectionReason)
  const completion = portfolio ? calcCompletion('freelancer', portfolio) : 0
  const avatarSrc = portfolio?.avatarUrl
    ? (portfolio.avatarUrl.startsWith('http') ? portfolio.avatarUrl : `${FILE_BASE}${portfolio.avatarUrl}`)
    : null
  const VERIFY = {
    approved: { tone: 'green', label: 'Verified' },
    pending: { tone: 'orange', label: 'Pending verification' },
    rejected: { tone: 'red', label: 'Verification rejected' },
  }[verificationStatus]

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
          eyebrow="Freelancer dashboard"
          title={`Welcome back, ${user.name?.split(' ')[0] || ''}`}
          subtitle="Your contracts, applications and earnings in one place."
          actions={<button onClick={() => navigate('/jobs')} className={btn.primary}>Find work</button>}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Stat label="Wallet balance" value={inr(walletBalance)} highlight />
              <Stat label="Total earned" value={inr(totalEarned)} hint="after 2% fee" />
              <Stat label="Active contracts" value={activeContracts.length} />
              <Stat label="All contracts" value={contracts.length} />
            </div>

            {recommended.length > 0 && (
              <Section title={recommended[0].score > 0 ? 'Jobs matching your skills' : 'Latest jobs'} action={<Link to="/jobs" className="text-sm font-semibold text-orange-700 no-underline hover:underline">See all jobs</Link>}>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
                  {recommended.map(({ j, score }) => (
                    <Link key={j._id} to={`/jobs/${j._id}`} className="group block p-4 no-underline transition-colors hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-orange-700">{j.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Posted {timeAgo(j.createdAt)} · {j.experienceLevel || 'Mid'} level · {(j.bids?.length || 0) === 0 ? 'no proposals yet' : `${j.bids.length} proposals`}
                          </p>
                        </div>
                        <p className="flex-none text-sm font-semibold text-slate-900">{inr(j.budget)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {(j.skills || []).slice(0, 4).map(sk => (
                          <span key={sk} className={`rounded-full px-2 py-0.5 text-xs font-medium ${mySkills.includes(sk.toLowerCase()) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{sk}</span>
                        ))}
                        {score > 0 && <span className="text-xs text-slate-500">· {score} skill{score === 1 ? '' : 's'} match</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            <Section title="My contracts">
              {contracts.length === 0 ? (
                <Empty title="No contracts yet" body="Apply to jobs and get hired to start earning."
                  action={<Link to="/jobs" className={btn.primary}>Browse jobs</Link>} />
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
                  {contracts.map(c => (
                    <Link key={c._id} to={`/contracts/${c._id}`} className="flex items-center gap-4 p-4 no-underline transition-colors hover:bg-slate-50">
                      <Avatar name={c.client?.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{c.job?.title || 'Contract'}</p>
                        <p className="mt-0.5 text-sm text-slate-500">for {c.client?.name}</p>
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

            {visibleApps.length > 0 && (
              <Section title="My applications">
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
                  {visibleApps.map(({ job, bid, contractId }) => {
                    const currentIndex = PIPELINE.findIndex(p => p.key === bid.status)
                    return (
                      <div key={bid._id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                          <StatusPill status={bid.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{job.client?.name} · {inr(job.budget)}</p>
                        {bid.status !== 'rejected' && (
                          <div className="mt-3 flex max-w-sm items-center gap-2">
                            {PIPELINE.map((step, i) => (
                              <div key={step.key} className="flex-1">
                                <div className={`h-1.5 rounded-full ${i <= currentIndex ? 'bg-orange-500' : 'bg-slate-200'}`} />
                                <p className={`mt-1 text-[11px] ${i <= currentIndex ? 'font-medium text-slate-700' : 'text-slate-400'}`}>{step.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {bid.status === 'rejected' && bid.rejectionReason && (
                          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Reason: {bid.rejectionReason}</p>
                        )}
                        {bid.status === 'hired' && contractId && (
                          <Link to={`/contracts/${contractId}`} className={`${btn.secondary} mt-3`}>View contract</Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            <Section title="Earnings history">
              {transactions.length === 0 ? (
                <Empty title="No earnings yet" body="Complete a milestone to receive your first payment." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr><th className="px-4 py-2.5">Payment</th><th className="hidden px-4 py-2.5 sm:table-cell">Date</th><th className="px-4 py-2.5 text-right">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map(tx => (
                        <tr key={tx._id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{tx.milestone?.title || tx.description || 'Payment'}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {TX_LABEL[tx.type] || humanize(tx.type)}
                              {tx.contract?.hashId && <> · <Link to={`/contracts/${tx.contract._id}`} className="hover:underline">#{tx.contract.hashId}</Link></>}
                            </p>
                          </td>
                          <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-semibold text-emerald-700">+{inr(tx.amount)}</p>
                            <div className="mt-1"><StatusPill status={tx.status} /></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    <p className="text-xs text-slate-500">
                      {portfolio?.title || 'Freelancer'}{user.rating > 0 && ` · ★ ${Number(user.rating).toFixed(1)}`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {VERIFY && <StatusPill tone={VERIFY.tone}>{VERIFY.label}</StatusPill>}
                  {portfolio?.availability && <StatusPill tone="blue">{humanize(portfolio.availability)}</StatusPill>}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-slate-600">{portfolio?.bio || 'Add a bio so clients know what you do best.'}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs"><span className="font-medium text-slate-700">Profile strength</span><span className="text-slate-500">{completion}%</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <Link to="/profile/setup" className={`${btn.secondary} mt-4 w-full`}>{completion < 100 ? 'Complete profile' : 'Edit profile'}</Link>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-surface p-5">
              <p className="text-sm font-semibold text-slate-900">Getting paid on SafeLancer</p>
              <ul className="mt-3 space-y-2.5 p-0 text-sm text-slate-600">
                {['Start only after the milestone is funded', 'Upload work — it gets a SHA-256 record', 'No reply in 72h? Funds auto-release'].map((t, i) => (
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
