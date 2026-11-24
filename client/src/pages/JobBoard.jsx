import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { PageHeader, Empty, StatusPill, Chip, btn, inr, timeAgo, fmtDate } from '../components/ui'

const CATEGORIES = ['All', 'Web Development', 'Mobile', 'Design', 'Data Science', 'DevOps', 'Content', 'Other']
const EXP_LEVELS = ['All', 'Junior', 'Mid', 'Senior']

const EMPTY = { skills: '', minBudget: '', maxBudget: '', search: '', category: '', experienceLevel: '' }

export default function JobBoard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchJobs = async (f) => {
    setLoading(true)
    try {
      const params = {}
      if (f.skills) params.skills = f.skills
      if (f.minBudget) params.minBudget = f.minBudget
      if (f.maxBudget) params.maxBudget = f.maxBudget
      if (f.search) params.search = f.search
      if (f.category) params.category = f.category
      if (f.experienceLevel) params.experienceLevel = f.experienceLevel
      const { data } = await api.get('/api/jobs', { params })
      setJobs(Array.isArray(data) ? data : [])
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchJobs(EMPTY) }, [])

  const applyFilters = (f) => {
    setFilters(f)
    fetchJobs(f)
  }

  const handleTextChange = (field, value) => {
    const updated = { ...filters, [field]: value }
    setFilters(updated)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchJobs(updated), 400)
  }

  const handleSelectChange = (field, value) => {
    const updated = { ...filters, [field]: value === 'All' ? '' : value }
    applyFilters(updated)
  }

  const handleEnter = (e) => { if (e.key === 'Enter') { clearTimeout(debounceRef.current); fetchJobs(filters) } }

  const clearFilters = () => applyFilters(EMPTY)

  const activeCount = ['skills', 'minBudget', 'maxBudget', 'category', 'experienceLevel'].filter(k => filters[k]).length
  const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Find work" title="Jobs you might like" subtitle="Every job is escrow-protected — you start only after the milestone is funded." />

        <div className="relative mb-6">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input placeholder="Search by title or keyword" value={filters.search} aria-label="Search jobs"
            onChange={e => handleTextChange('search', e.target.value)} onKeyDown={handleEnter}
            className="dark-input w-full py-3 pl-12 text-[15px] shadow-sm" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Filters */}
          <aside className="h-fit space-y-5 rounded-xl border border-slate-200 bg-surface p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Filters{activeCount > 0 && <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[11px] text-orange-700">{activeCount}</span>}</p>
              {activeCount > 0 && <button onClick={clearFilters} className="text-xs font-semibold text-orange-700 hover:underline">Clear all</button>}
            </div>
            <div>
              <label className={label}>Category</label>
              <div className="space-y-1">
                {CATEGORIES.map(c => {
                  const on = (filters.category || 'All') === c
                  return (
                    <button key={c} onClick={() => handleSelectChange('category', c)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${on ? 'bg-orange-50 font-semibold text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {c === 'All' ? 'All categories' : c}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className={label}>Experience level</label>
              <div className="flex flex-wrap gap-1.5">
                {EXP_LEVELS.map(l => {
                  const on = (filters.experienceLevel || 'All') === l
                  return (
                    <button key={l} onClick={() => handleSelectChange('experienceLevel', l)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${on ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                      {l === 'All' ? 'Any' : l}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className={label}>Budget (₹)</label>
              <div className="flex items-center gap-2">
                <input placeholder="Min" type="number" value={filters.minBudget} aria-label="Minimum budget"
                  onChange={e => handleTextChange('minBudget', e.target.value)} onKeyDown={handleEnter} className="dark-input w-full min-w-0" />
                <span className="text-slate-400">–</span>
                <input placeholder="Max" type="number" value={filters.maxBudget} aria-label="Maximum budget"
                  onChange={e => handleTextChange('maxBudget', e.target.value)} onKeyDown={handleEnter} className="dark-input w-full min-w-0" />
              </div>
            </div>
            <div>
              <label className={label}>Skills</label>
              <input placeholder="e.g. React, Figma" value={filters.skills} aria-label="Skills"
                onChange={e => handleTextChange('skills', e.target.value)} onKeyDown={handleEnter} className="dark-input w-full" />
            </div>
          </aside>

          {/* Results */}
          <section className="min-w-0">
            <p className="mb-3 text-sm text-slate-500">
              {loading ? 'Searching…' : `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`}
            </p>
            {loading ? (
              <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-44 shimmer-skeleton rounded-xl" />)}</div>
            ) : jobs.length === 0 ? (
              <Empty title="No jobs match your filters" body="Try removing a filter or searching for a broader keyword."
                action={activeCount > 0 || filters.search ? <button onClick={clearFilters} className={btn.secondary}>Clear filters</button> : null} />
            ) : (
              <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-surface">
                {jobs.map(job => (
                  <Link key={job._id} to={`/jobs/${job._id}`} className="group block p-5 no-underline transition-colors hover:bg-slate-50 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Posted {timeAgo(job.createdAt)}{job.category && job.category !== 'Other' && ` · ${job.category}`}</p>
                        <h2 className="mt-1 text-base font-semibold text-slate-900 group-hover:text-orange-700 group-hover:underline">{job.title}</h2>
                      </div>
                      <div className="flex-none text-right">
                        <p className="text-lg font-bold text-slate-900">{inr(job.budget)}</p>
                        <p className="text-xs text-slate-500">Fixed price</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {job.experienceLevel && <span className="font-medium text-slate-700">{job.experienceLevel} level</span>}
                      <span>· {job.phases?.length || 0} milestones</span>
                      <span>· {job.advancePercent || 10}% advance</span>
                      <span>· Due {fmtDate(job.deadline)}</span>
                      {job.verifiedOnly && <StatusPill tone="orange">Verified freelancers only</StatusPill>}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>
                    {job.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">{job.skills.map(s => <Chip key={s}>{s}</Chip>)}</div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                        Escrow protected
                      </span>
                      {job.client?.rating > 0 && <span>Client ★ {Number(job.client.rating).toFixed(1)}</span>}
                      <span>Proposals: <span className="font-medium text-slate-700">{(job.bids?.length || 0) === 0 ? 'Be the first' : job.bids.length}</span></span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
