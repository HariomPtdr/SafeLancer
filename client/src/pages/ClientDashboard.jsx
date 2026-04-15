import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

export default function ClientDashboard() {
  const [contracts, setContracts] = useState([])
  const [jobs, setJobs] = useState([])
  const [negotiations, setNegotiations] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/api/contracts/my-contracts'),
      api.get('/api/jobs/my-jobs'),
      api.get('/api/negotiations/my-negotiations')
    ]).then(([c, j, n]) => {
      setContracts(c.data)
      setJobs(j.data)
      setNegotiations(n.data.filter(n => n.status === 'active'))
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const allBids = jobs.flatMap(j => (j.bids || []).map(b => ({ ...b, job: j })))

  const interviewsToday = allBids.filter(b => {
    if (b.status !== 'interview_scheduled' || !b.interviewScheduledAt) return false
    const d = new Date(b.interviewScheduledAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const awaitingDecision = allBids.filter(b => b.status === 'interviewed')

  const activeContracts = contracts.filter(c => c.status === 'active')
  const totalValue = contracts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')
  const pendingInterviews = allBids.filter(b => b.status === 'interview_scheduled').length
  const toReview = allBids.filter(b => b.status === 'applied').length

  const quickAction = async (jobId, bidId, endpoint) => {
    setActionLoading(bidId + endpoint)
    try {
      const { data } = await api.patch(`/api/jobs/${jobId}/applications/${bidId}/${endpoint}`)
      if (endpoint === 'negotiate') {
        navigate(`/negotiations/${data.negotiationId}`)
        return
      }
      setJobs(prev => prev.map(j => {
        if (j._id !== jobId) return j
        return data.job || data
      }))
      toast.success('Done')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

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
            <p className="text-slate-500 text-sm">Manage your contracts and jobs</p>
          </div>
          <div className="flex gap-2">
            <Link to="/freelancers" className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
              Find Talent
            </Link>
            <Link to="/jobs/post" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
              + Post Job
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Active Contracts', value: activeContracts.length, color: 'text-indigo-600' },
            { label: 'Total Value', value: `₹${totalValue.toLocaleString()}`, color: 'text-emerald-600' },
            { label: 'Open Jobs', value: openJobs.length, color: 'text-orange-600' },
            { label: 'Pending Interviews', value: pendingInterviews, color: 'text-yellow-600' },
            { label: 'To Review', value: toReview, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Interviews Today */}
        {interviewsToday.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Interviews Scheduled Today</h2>
            {interviewsToday.map(b => (
              <div key={b._id} className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{b.freelancer?.name}</div>
                  <div className="text-sm text-slate-500">
                    {b.job.title} · {new Date(b.interviewScheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Link
                  to={`/interview/${b.meetingRoomId}?job=${encodeURIComponent(b.job.title)}&jobId=${b.job._id}&bidId=${b._id}`}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Join Interview
                </Link>
              </div>
            ))}
          </section>
        )}

        {/* Awaiting Decision */}
        {awaitingDecision.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Awaiting Your Decision</h2>
            {awaitingDecision.map(b => {
              const isLoading = (suf) => actionLoading === b._id + suf
              return (
                <div key={b._id} className="bg-white rounded-xl border border-purple-200 p-4 mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">{b.freelancer?.name}</div>
                      <div className="text-sm text-slate-500">{b.job.title} · ₹{b.job.budget?.toLocaleString()}</div>
                      {b.freelancer?.rating > 0 && (
                        <div className="text-yellow-600 text-xs mt-0.5">★ {b.freelancer.rating} · {b.freelancer.totalJobsCompleted} jobs</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => quickAction(b.job._id, b._id, 'hire')} disabled={isLoading('hire')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                        {isLoading('hire') ? '...' : 'Hire'}
                      </button>
                      <button onClick={() => quickAction(b.job._id, b._id, 'negotiate')} disabled={isLoading('negotiate')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                        {isLoading('negotiate') ? '...' : 'Negotiate'}
                      </button>
                      <button onClick={() => quickAction(b.job._id, b._id, 'reject')} disabled={isLoading('reject')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Active Contracts */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Active Contracts</h2>
          {activeContracts.length === 0
            ? <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">No active contracts yet</div>
            : activeContracts.map(c => (
              <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{c.job?.title || 'Contract'}</div>
                  <div className="text-sm text-slate-500">with {c.freelancer?.name} · ₹{c.amount?.toLocaleString()} · {c.milestoneCount} phases</div>
                </div>
                <Link to={`/contracts/${c._id}`} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  View Contract
                </Link>
              </div>
            ))
          }
        </section>

        {/* Open Negotiations */}
        {negotiations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Open Negotiations</h2>
            {negotiations.map(n => (
              <div key={n._id} className="bg-white rounded-xl border border-orange-200 p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{n.job?.title}</div>
                  <div className="text-sm text-slate-500">Round {n.currentRound}/{n.maxRounds} · with {n.freelancer?.name}</div>
                </div>
                <Link to={`/negotiations/${n._id}`} className="bg-orange-50 text-orange-700 hover:bg-orange-100 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  View
                </Link>
              </div>
            ))}
          </section>
        )}

        {/* Jobs with pipeline counts */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">My Posted Jobs</h2>
          {jobs.length === 0
            ? <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
                No jobs yet. <Link to="/jobs/post" className="text-indigo-600">Post your first job</Link>
              </div>
            : jobs.map(j => {
              const bids = j.bids || []
              const counts = {
                applied: bids.filter(b => b.status === 'applied').length,
                shortlisted: bids.filter(b => b.status === 'shortlisted').length,
                interview: bids.filter(b => b.status === 'interview_scheduled').length,
                hired: bids.filter(b => b.status === 'hired').length,
              }
              return (
                <div key={j._id} className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{j.title}</div>
                      <div className="text-sm text-slate-500 mt-0.5">₹{j.budget?.toLocaleString()} · <span className="capitalize">{j.status}</span></div>
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        {counts.applied > 0 && <span>{counts.applied} applied</span>}
                        {counts.shortlisted > 0 && <span className="text-indigo-600">{counts.shortlisted} shortlisted</span>}
                        {counts.interview > 0 && <span className="text-yellow-600">{counts.interview} interview today</span>}
                        {counts.hired > 0 && <span className="text-green-600">{counts.hired} hired</span>}
                        {bids.length === 0 && <span>No applications yet</span>}
                      </div>
                    </div>
                    <Link to={`/jobs/${j._id}`} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0">
                      Manage Applications
                    </Link>
                  </div>
                </div>
              )
            })
          }
        </section>
      </div>
    </div>
  )
}
