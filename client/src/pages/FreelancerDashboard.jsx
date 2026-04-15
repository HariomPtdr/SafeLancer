import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

const PIPELINE = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'interviewed', label: 'Interviewed' },
  { key: 'hired', label: 'Hired' },
]

const STATUS_COLOR = {
  applied: 'bg-zinc-100 text-zinc-600',
  shortlisted: 'bg-blue-50 text-blue-700',
  interview_scheduled: 'bg-amber-50 text-amber-700',
  interviewed: 'bg-purple-50 text-purple-700',
  negotiating: 'bg-orange-50 text-orange-700',
  hired: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
}

export default function FreelancerDashboard() {
  const [contracts, setContracts] = useState([])
  const [negotiations, setNegotiations] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    Promise.all([
      api.get('/api/contracts/my-work'),
      api.get('/api/negotiations/my-negotiations'),
      api.get('/api/jobs/my-applications')
    ]).then(([c, n, a]) => {
      setContracts(c.data)
      setNegotiations(n.data.filter(n => n.status === 'active'))
      setApplications(a.data)
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const activeContracts = contracts.filter(c => c.status === 'active')
  const totalEarned = contracts.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0)

  if (loading) return (
    <div className="min-h-screen bg-zinc-100"><Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-100">
      <Toaster />
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Welcome, {user.name}</h1>
            <p className="text-zinc-500 text-sm">Manage your work and earnings</p>
          </div>
          <Link to="/jobs" className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            Browse Jobs
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Active Contracts', value: activeContracts.length },
            { label: 'Total Earned', value: `₹${totalEarned.toLocaleString()}` },
            { label: 'All Contracts', value: contracts.length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="text-2xl font-bold text-zinc-900">{s.value}</div>
              <div className="text-zinc-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Applications */}
        {applications.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">My Applications ({applications.length})</h2>
            {applications.map(({ job, bid, contractId, negotiationId }) => (
              <div key={bid._id} className="bg-white rounded-xl border border-zinc-200 p-4 mb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-zinc-900 truncate">{job.title}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${STATUS_COLOR[bid.status]}`}>
                        {bid.status === 'interview_scheduled' ? 'Interview Scheduled'
                          : bid.status === 'hired' ? 'Hired'
                          : bid.status === 'negotiating' ? 'In Negotiation'
                          : bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500">{job.client?.name} · ₹{job.budget?.toLocaleString()}</div>

                    {/* Pipeline bar */}
                    <div className="flex gap-1 mt-2">
                      {PIPELINE.map((step) => {
                        const stepIndex = PIPELINE.findIndex(p => p.key === step.key)
                        const currentIndex = PIPELINE.findIndex(p => p.key === bid.status)
                        const isActive = step.key === bid.status
                        const isPast = currentIndex > stepIndex
                        return (
                          <div key={step.key}
                            className={`h-1 flex-1 rounded-full ${
                              isActive ? 'bg-zinc-900'
                              : isPast ? 'bg-zinc-300'
                              : 'bg-zinc-100'
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {bid.status === 'interview_scheduled' && bid.meetingRoomId && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                      <p className="text-sm text-amber-800 font-medium">
                        Interview at {new Date(bid.interviewScheduledAt).toLocaleString()}
                      </p>
                      <Link
                        to={`/interview/${bid.meetingRoomId}?job=${encodeURIComponent(job.title)}&jobId=${job._id}`}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        Join
                      </Link>
                    </div>
                  )}
                  {bid.status === 'rejected' && bid.rejectionReason && (
                    <p className="text-sm text-red-500">Reason: {bid.rejectionReason}</p>
                  )}
                  {bid.status === 'hired' && contractId && (
                    <Link to={`/contracts/${contractId}`}
                      className="inline-block border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      View Contract
                    </Link>
                  )}
                  {bid.status === 'negotiating' && negotiationId && (
                    <Link to={`/negotiations/${negotiationId}`}
                      className="inline-block border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      View Negotiation
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Negotiations */}
        {negotiations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Open Negotiations</h2>
            {negotiations.map(n => (
              <div key={n._id} className="bg-white rounded-xl border border-zinc-200 p-4 mb-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900">{n.job?.title}</div>
                  <div className="text-sm text-zinc-500">Round {n.currentRound}/{n.maxRounds} · with {n.client?.name}</div>
                </div>
                <Link to={`/negotiations/${n._id}`} className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-1.5 rounded-lg text-sm font-medium">
                  Respond
                </Link>
              </div>
            ))}
          </section>
        )}

        {/* Contracts */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">My Contracts</h2>
          {contracts.length === 0
            ? <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
                No contracts yet.{' '}
                <Link to="/jobs" className="text-zinc-900 font-medium underline underline-offset-2">Browse jobs</Link>
              </div>
            : contracts.map(c => (
              <div key={c._id} className="bg-white rounded-xl border border-zinc-200 p-4 mb-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900">{c.job?.title || 'Contract'}</div>
                  <div className="text-sm text-zinc-500">with {c.client?.name} · ₹{c.amount?.toLocaleString()} · <span className="capitalize">{c.status}</span></div>
                </div>
                <Link to={`/contracts/${c._id}`} className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-1.5 rounded-lg text-sm font-medium">
                  View Work
                </Link>
              </div>
            ))
          }
        </section>
      </div>
    </div>
  )
}
