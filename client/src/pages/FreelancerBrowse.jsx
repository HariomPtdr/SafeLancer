import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

export default function FreelancerBrowse() {
  const [freelancers, setFreelancers] = useState([])
  const [filters, setFilters] = useState({ skills: '', minRating: '', availability: '', maxRate: '' })
  const [loading, setLoading] = useState(true)
  const [demoModal, setDemoModal] = useState(null)
  const [demoForm, setDemoForm] = useState({ message: '', proposedAt: '' })

  const fetchFreelancers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.skills) params.skills = filters.skills
      if (filters.minRating) params.minRating = filters.minRating
      if (filters.availability) params.availability = filters.availability
      if (filters.maxRate) params.maxRate = filters.maxRate
      const { data } = await api.get('/api/jobs/freelancers/browse', { params })
      setFreelancers(data)
    } catch { setFreelancers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchFreelancers() }, [])

  const sendDemoRequest = async () => {
    if (!demoForm.message) return toast.error('Please describe what you want to see')
    try {
      await api.post('/api/demos/request', { freelancerId: demoModal._id, message: demoForm.message, proposedAt: demoForm.proposedAt })
      toast.success('Demo request sent!')
      setDemoModal(null)
      setDemoForm({ message: '', proposedAt: '' })
    } catch { toast.error('Failed to send demo request') }
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <Toaster />
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-zinc-900 mb-5">Find Freelancers</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Skills (React, Node.js)" value={filters.skills}
              onChange={e => setFilters({ ...filters, skills: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
            <input placeholder="Min Rating (1–5)" type="number" min="1" max="5" value={filters.minRating}
              onChange={e => setFilters({ ...filters, minRating: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
            <select value={filters.availability} onChange={e => setFilters({ ...filters, availability: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors">
              <option value="">Any Availability</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
            </select>
            <input placeholder="Max Rate ₹/hr" type="number" value={filters.maxRate}
              onChange={e => setFilters({ ...filters, maxRate: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
          </div>
          <button onClick={fetchFreelancers}
            className="mt-3 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            Apply Filters
          </button>
        </div>

        {loading
          ? <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
            </div>
          : freelancers.length === 0
          ? <div className="text-center py-12 text-zinc-400 text-sm">No freelancers found. Try different filters.</div>
          : freelancers.map(f => (
            <div key={f._id} className="bg-white rounded-xl border border-zinc-200 p-5 mb-3 hover:border-zinc-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {f.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-zinc-900">{f.user?.name}</h2>
                      <div className="flex items-center gap-2 text-sm mt-0.5">
                        {f.user?.rating > 0 && <span className="text-amber-600 text-xs">★ {f.user.rating}</span>}
                        {f.user?.totalJobsCompleted > 0 && <span className="text-zinc-400 text-xs">{f.user.totalJobsCompleted} jobs</span>}
                        <span className={`capitalize text-xs px-2 py-0.5 rounded-md font-medium ${
                          f.availability === 'full-time' ? 'bg-emerald-50 text-emerald-700'
                          : f.availability === 'part-time' ? 'bg-amber-50 text-amber-700'
                          : 'bg-zinc-100 text-zinc-500'
                        }`}>{f.availability || 'full-time'}</span>
                      </div>
                    </div>
                  </div>
                  {f.bio && <p className="text-sm text-zinc-500 mt-2.5 line-clamp-2">{f.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {f.skills?.map(s => <span key={s} className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-xs">{s}</span>)}
                  </div>
                  {f.hourlyRate > 0 && <p className="text-sm text-zinc-500 mt-2">Rate: <strong className="text-zinc-700">₹{f.hourlyRate}/hr</strong></p>}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Link to={`/freelancers/${f.user?._id}`}
                    className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium text-center transition-colors">
                    View Profile
                  </Link>
                  <button onClick={() => setDemoModal(f.user)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    Request Demo
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Demo Modal */}
      {demoModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl p-6 w-full max-w-md">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Request Demo</h2>
            <p className="text-sm text-zinc-500 mb-4">from {demoModal.name}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">What do you want to see?</label>
                <textarea value={demoForm.message} onChange={e => setDemoForm({ ...demoForm, message: e.target.value })} rows={3}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
                  placeholder="e.g. I want to see your React dashboard and how you structure components" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Proposed Meeting Time</label>
                <input type="datetime-local" value={demoForm.proposedAt} onChange={e => setDemoForm({ ...demoForm, proposedAt: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={sendDemoRequest}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  Send Request
                </button>
                <button onClick={() => setDemoModal(null)}
                  className="flex-1 border border-zinc-200 text-zinc-600 font-medium py-2.5 rounded-lg text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
