import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

const STATUS_LABELS = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700' },
  shortlisted: { label: 'Shortlisted', color: 'bg-indigo-100 text-indigo-700' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-yellow-100 text-yellow-700' },
  interviewed: { label: 'Interviewed', color: 'bg-purple-100 text-purple-700' },
  negotiating: { label: 'In Negotiation', color: 'bg-orange-100 text-orange-700' },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600' },
}

const TABS = ['All', 'Applied', 'Shortlisted', 'Interview', 'Interviewed']
const TAB_STATUS = {
  All: null,
  Applied: ['applied'],
  Shortlisted: ['shortlisted'],
  Interview: ['interview_scheduled'],
  Interviewed: ['interviewed'],
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [job, setJob] = useState(null)
  const [proposal, setProposal] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [actionLoading, setActionLoading] = useState(null)
  const [schedulingBidId, setSchedulingBidId] = useState(null)
  const [scheduledAt, setScheduledAt] = useState('')

  const reload = () =>
    api.get(`/api/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => toast.error('Job not found'))

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/api/jobs/${id}/apply`, { proposal })
      toast.success('Application submitted!')
      await reload()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally { setSubmitting(false) }
  }

  const action = async (bidId, endpoint, body = {}) => {
    setActionLoading(bidId + endpoint)
    try {
      const { data } = await api.patch(`/api/jobs/${id}/applications/${bidId}/${endpoint}`, body)
      setJob(data.job || data)
      toast.success('Done')
      return data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  const handleSchedule = async (bidId) => {
    if (!scheduledAt) return toast.error('Pick a date and time')
    setActionLoading(bidId + 'schedule')
    try {
      const { data } = await api.patch(`/api/jobs/${id}/applications/${bidId}/schedule-interview`, { scheduledAt })
      setJob(data)
      setSchedulingBidId(null)
      setScheduledAt('')
      toast.success('Interview scheduled!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule')
    } finally { setActionLoading(null) }
  }

  const handleNegotiate = async (bidId) => {
    setActionLoading(bidId + 'negotiate')
    try {
      const { data } = await api.patch(`/api/jobs/${id}/applications/${bidId}/negotiate`)
      toast.success('Negotiation started!')
      setTimeout(() => navigate(`/negotiations/${data.negotiationId}`), 800)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start negotiation')
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    </div>
  )
  if (!job) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <p className="text-center py-12 text-slate-500">Job not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">

        {/* Job card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
            <span>Fixed Budget: <strong className="text-slate-700">₹{job.budget?.toLocaleString()}</strong></span>
            <span>Deadline: <strong className="text-slate-700">{new Date(job.deadline).toLocaleDateString()}</strong></span>
            <span>Status: <strong className="capitalize text-slate-700">{job.status}</strong></span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {job.skills?.map(s => (
              <span key={s} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{s}</span>
            ))}
          </div>
          <p className="mt-4 text-slate-600 leading-relaxed">{job.description}</p>
          {job.client && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm">
              <span className="text-slate-500">Posted by: </span>
              <span className="font-medium text-slate-700">{job.client.name}</span>
              {job.client.rating > 0 && <span className="ml-2 text-yellow-600">★ {job.client.rating}</span>}
            </div>
          )}
        </div>

        {/* Freelancer: apply or status */}
        {user.role === 'freelancer' && job.status === 'open' && !myBid && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Apply for this Job</h2>
            <p className="text-sm text-slate-500 mb-4">Fixed budget: ₹{job.budget?.toLocaleString()} — set by client</p>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Proposal</label>
                <textarea required rows={5} value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your approach, experience, and why you're the right fit..." />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Apply Now'}
              </button>
            </form>
          </div>
        )}

        {myBid && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Your Application</h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_LABELS[myBid.status]?.color}`}>
                {STATUS_LABELS[myBid.status]?.label}
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{myBid.proposal}</p>

            {myBid.status === 'interview_scheduled' && myBid.meetingRoomId && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  Interview at {new Date(myBid.interviewScheduledAt).toLocaleString()}
                </p>
                <Link
                  to={`/interview/${myBid.meetingRoomId}?job=${encodeURIComponent(job.title)}&jobId=${job._id}`}
                  className="mt-2 inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                >
                  Join Interview
                </Link>
              </div>
            )}

            {myBid.status === 'rejected' && myBid.rejectionReason && (
              <p className="mt-2 text-sm text-red-500">Reason: {myBid.rejectionReason}</p>
            )}
          </div>
        )}

        {/* Client: pipeline view */}
        {user.role === 'client' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Applications ({job.bids?.length || 0})
            </h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab} ({tabCount(tab)})
                </button>
              ))}
            </div>

            {filteredBids().length === 0
              ? <p className="text-slate-400 text-center py-6 text-sm">No applications in this stage</p>
              : filteredBids().map(b => {
                const isLoading = (suf) => actionLoading === b._id + suf
                const badge = STATUS_LABELS[b.status]
                return (
                  <div key={b._id} className="border border-slate-100 rounded-xl p-4 mb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800">{b.freelancer?.name}</span>
                          {b.freelancer?.rating > 0 && (
                            <span className="text-yellow-600 text-sm">★ {b.freelancer.rating}</span>
                          )}
                          {b.freelancer?.totalJobsCompleted > 0 && (
                            <span className="text-slate-400 text-xs">{b.freelancer.totalJobsCompleted} jobs</span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge?.color}`}>
                            {badge?.label}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{b.proposal}</p>

                        {b.status === 'interview_scheduled' && (
                          <p className="text-xs text-yellow-700 mt-1 font-medium">
                            Interview: {new Date(b.interviewScheduledAt).toLocaleString()}
                          </p>
                        )}
                        {b.status === 'rejected' && b.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1">Reason: {b.rejectionReason}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.status === 'applied' && (
                        <>
                          <button onClick={() => action(b._id, 'shortlist')} disabled={isLoading('shortlist')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            {isLoading('shortlist') ? '...' : 'Shortlist'}
                          </button>
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === 'shortlisted' && (
                        <>
                          {schedulingBidId === b._id ? (
                            <div className="flex items-center gap-2">
                              <input type="datetime-local" value={scheduledAt}
                                onChange={e => setScheduledAt(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              <button onClick={() => handleSchedule(b._id)} disabled={isLoading('schedule')}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                                {isLoading('schedule') ? '...' : 'Confirm'}
                              </button>
                              <button onClick={() => setSchedulingBidId(null)}
                                className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setSchedulingBidId(b._id)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                              Schedule Interview
                            </button>
                          )}
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === 'interview_scheduled' && (
                        <>
                          <Link
                            to={`/interview/${b.meetingRoomId}?job=${encodeURIComponent(job.title)}&jobId=${job._id}&bidId=${b._id}`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                          >
                            Join Interview
                          </Link>
                          <button onClick={() => action(b._id, 'interview-done')} disabled={isLoading('interview-done')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            {isLoading('interview-done') ? '...' : 'Mark Done'}
                          </button>
                        </>
                      )}

                      {b.status === 'interviewed' && (
                        <>
                          <button onClick={() => action(b._id, 'hire')} disabled={isLoading('hire')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            {isLoading('hire') ? '...' : `Hire Directly ₹${job.budget?.toLocaleString()}`}
                          </button>
                          <button onClick={() => handleNegotiate(b._id)} disabled={isLoading('negotiate')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            {isLoading('negotiate') ? '...' : 'Start Negotiation'}
                          </button>
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === 'negotiating' && (
                        <Link to={`/negotiations`}
                          className="bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                          View Negotiation
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>
    </div>
  )
}
