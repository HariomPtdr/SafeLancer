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
  applied: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-indigo-100 text-indigo-700',
  interview_scheduled: 'bg-yellow-100 text-yellow-700',
  interviewed: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-orange-100 text-orange-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
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
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name}</h1>
            <p className="text-slate-500 text-sm">Manage your work and earnings</p>
          </div>
          <Link to="/jobs" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            Browse Jobs
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Active Contracts', value: activeContracts.length, color: 'text-indigo-600' },
            { label: 'Total Earned', value: `₹${totalEarned.toLocaleString()}`, color: 'text-emerald-600' },
            { label: 'All Contracts', value: contracts.length, color: 'text-orange-600' }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* My Applications */}
        {applications.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">My Applications ({applications.length})</h2>

            {/* Pipeline progress bar legend */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto">
              {PIPELINE.map((step, i) => (
                <div key={step.key} className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 whitespace-nowrap">{step.label}</span>
                  {i < PIPELINE.length - 1 && <span className="text-slate-300 text-xs">→</span>}
                </div>
              ))}
            </div>

            {applications.map(({ job, bid, contractId, negotiationId }) => (
              <div key={bid._id} className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 truncate">{job.title}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[bid.status]}`}>
                        {bid.status === 'interview_scheduled' ? 'Interview Scheduled'
                          : bid.status === 'hired' ? 'Hired'
                          : bid.status === 'negotiating' ? 'In Negotiation'
                          : bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {job.client?.name} · ₹{job.budget?.toLocaleString()}
                    </div>

                    {/* Pipeline indicator */}
                    <div className="flex gap-1 mt-2">
                      {PIPELINE.map((step) => {
                        const stepIndex = PIPELINE.findIndex(p => p.key === step.key)
                        const currentIndex = PIPELINE.findIndex(p => p.key === bid.status)
                        const isActive = step.key === bid.status
                        const isPast = currentIndex > stepIndex
                        return (
                          <div key={step.key}
                            className={`h-1.5 flex-1 rounded-full ${
                              isActive ? 'bg-indigo-600'
                              : isPast ? 'bg-indigo-300'
                              : 'bg-slate-200'
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Contextual actions */}
                <div className="mt-3 space-y-2">
                  {bid.status === 'interview_scheduled' && bid.meetingRoomId && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        Interview at {new Date(bid.interviewScheduledAt).toLocaleString()}
                      </p>
                      <Link
                        to={`/interview/${bid.meetingRoomId}?job=${encodeURIComponent(job.title)}&jobId=${job._id}`}
                        className="mt-2 inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                      >
                        Join Interview
                      </Link>
                    </div>
                  )}

                  {bid.status === 'rejected' && bid.rejectionReason && (
                    <p className="text-sm text-red-500">Reason: {bid.rejectionReason}</p>
                  )}

                  {bid.status === 'hired' && contractId && (
                    <Link to={`/contracts/${contractId}`}
                      className="inline-block bg-green-50 text-green-700 hover:bg-green-100 px-4 py-1.5 rounded-lg text-sm font-medium">
                      View Contract
                    </Link>
                  )}

                  {bid.status === 'negotiating' && negotiationId && (
                    <Link to={`/negotiations/${negotiationId}`}
                      className="inline-block bg-orange-50 text-orange-700 hover:bg-orange-100 px-4 py-1.5 rounded-lg text-sm font-medium">
                      View Negotiation
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Open Negotiations */}
        {negotiations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Open Negotiations</h2>
            {negotiations.map(n => (
              <div key={n._id} className="bg-white rounded-xl border border-orange-200 p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{n.job?.title}</div>
                  <div className="text-sm text-slate-500">Round {n.currentRound}/{n.maxRounds} · with {n.client?.name}</div>
                </div>
                <Link to={`/negotiations/${n._id}`} className="bg-orange-50 text-orange-700 px-4 py-1.5 rounded-lg text-sm font-medium">
                  Respond
                </Link>
              </div>
            ))}
          </section>
        )}

        {/* My Contracts */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">My Contracts</h2>
          {contracts.length === 0
            ? <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
                No contracts yet. <Link to="/jobs" className="text-indigo-600">Browse jobs</Link>
              </div>
            : contracts.map(c => (
              <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{c.job?.title || 'Contract'}</div>
                  <div className="text-sm text-slate-500">with {c.client?.name} · ₹{c.amount?.toLocaleString()} · <span className="capitalize">{c.status}</span></div>
                </div>
                <Link to={`/contracts/${c._id}`} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-sm font-medium">
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
