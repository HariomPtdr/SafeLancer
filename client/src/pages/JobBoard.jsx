import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

export default function JobBoard() {
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState({ skills: '', minBudget: '', maxBudget: '', search: '' })
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.skills) params.skills = filters.skills
      if (filters.minBudget) params.minBudget = filters.minBudget
      if (filters.maxBudget) params.maxBudget = filters.maxBudget
      if (filters.search) params.search = filters.search
      const { data } = await api.get('/api/jobs', { params })
      setJobs(data)
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchJobs() }, [])

  return (
    <div className="min-h-screen bg-zinc-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-zinc-900 mb-5">Job Board</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Search jobs..." value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
            <input placeholder="Skills (React, Node.js)" value={filters.skills}
              onChange={e => setFilters({ ...filters, skills: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
            <input placeholder="Min Budget ₹" type="number" value={filters.minBudget}
              onChange={e => setFilters({ ...filters, minBudget: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
            <input placeholder="Max Budget ₹" type="number" value={filters.maxBudget}
              onChange={e => setFilters({ ...filters, maxBudget: e.target.value })}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors" />
          </div>
          <button onClick={fetchJobs}
            className="mt-3 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            Apply Filters
          </button>
        </div>

        {loading
          ? <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
            </div>
          : jobs.length === 0
          ? <div className="text-center py-12 text-zinc-400 text-sm">No jobs found matching your filters</div>
          : jobs.map(job => (
            <div key={job._id} className="bg-white rounded-xl border border-zinc-200 p-5 mb-3 hover:border-zinc-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-zinc-900">{job.title}</h2>
                  <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills?.map(s => (
                      <span key={s} className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-xs font-medium">{s}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500">
                    <span>Budget: <strong className="text-zinc-700">₹{job.budget?.toLocaleString()}</strong></span>
                    <span>Deadline: <strong className="text-zinc-700">{new Date(job.deadline).toLocaleDateString()}</strong></span>
                    <span>Applications: <strong className="text-zinc-700">{job.bids?.length || 0}</strong></span>
                    {job.client?.rating > 0 && <span>Client: <strong className="text-zinc-700">★ {job.client.rating}</strong></span>}
                  </div>
                </div>
                <Link to={`/jobs/${job._id}`}
                  className="ml-4 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors">
                  View & Apply
                </Link>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
