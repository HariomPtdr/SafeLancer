import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { PageHeader, Empty, Avatar, StatusPill, Chip, btn } from '../components/ui'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const EMPTY = { search: '', skills: '', minRating: '', availability: '' }

export default function FreelancerBrowse() {
  const navigate = useNavigate()
  const [freelancers, setFreelancers] = useState([])
  const [filters, setFilters] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchFreelancers = async (f) => {
    setLoading(true)
    try {
      const params = {}
      if (f.search) params.search = f.search
      if (f.skills) params.skills = f.skills
      if (f.minRating) params.minRating = f.minRating
      if (f.availability) params.availability = f.availability
      const { data } = await api.get('/api/jobs/freelancers/browse', { params })
      setFreelancers(Array.isArray(data) ? data : [])
    } catch { setFreelancers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchFreelancers(EMPTY) }, [])

  const applyFilters = (f) => { setFilters(f); fetchFreelancers(f) }

  const handleTextChange = (field, value) => {
    const updated = { ...filters, [field]: value }
    setFilters(updated)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchFreelancers(updated), 400)
  }

  const handleSelectChange = (field, value) => applyFilters({ ...filters, [field]: value })

  const handleEnter = (e) => { if (e.key === 'Enter') { clearTimeout(debounceRef.current); fetchFreelancers(filters) } }

  const clearFilters = () => applyFilters(EMPTY)

  const AVAIL = [['', 'Any'], ['full-time', 'Full-time'], ['part-time', 'Part-time']]
  const RATINGS = [['', 'Any rating'], ['4', '4+ ★'], ['4.5', '4.5+ ★']]
  const pill = (on) => `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-surface text-slate-600 hover:border-slate-400'}`
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Find talent" title="Find the right freelancer" subtitle="Browse profiles, then invite someone to your job. Every contract is escrow-protected." />

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_280px]">
          <div className="relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input placeholder="Search by name" value={filters.search} aria-label="Search freelancers by name"
              onChange={e => handleTextChange('search', e.target.value)} onKeyDown={handleEnter} className="dark-input w-full py-3 pl-12 text-[15px]" />
          </div>
          <input placeholder="Skills, e.g. React, Figma" value={filters.skills} aria-label="Skills"
            onChange={e => handleTextChange('skills', e.target.value)} onKeyDown={handleEnter} className="dark-input w-full py-3 text-[15px]" />
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Availability</span>
          {AVAIL.map(([v, l]) => <button key={l} onClick={() => handleSelectChange('availability', v)} className={pill(filters.availability === v)}>{l}</button>)}
          <span className="ml-3 mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</span>
          {RATINGS.map(([v, l]) => <button key={l} onClick={() => handleSelectChange('minRating', v)} className={pill(filters.minRating === v)}>{l}</button>)}
          {hasFilters && <button onClick={clearFilters} className="ml-auto text-sm font-semibold text-orange-700 hover:underline">Clear filters</button>}
        </div>

        <p className="mb-3 text-sm text-slate-500">{loading ? 'Searching…' : `${freelancers.length} freelancer${freelancers.length === 1 ? '' : 's'}`}</p>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">{[0, 1].map(i => <div key={i} className="h-56 shimmer-skeleton rounded-xl" />)}</div>
        ) : freelancers.length === 0 ? (
          <Empty title="No freelancers match" body="Try a different skill or remove a filter."
            action={hasFilters ? <button onClick={clearFilters} className={btn.secondary}>Clear filters</button> : null} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {freelancers.map(f => {
              const avatarUrl = f.avatarUrl ? (f.avatarUrl.startsWith('http') ? f.avatarUrl : `${FILE_BASE}${f.avatarUrl}`) : null
              const avail = f.availability || 'full-time'
              return (
                <article key={f._id} className="flex flex-col rounded-xl border border-slate-200 bg-surface p-6 transition-shadow hover:shadow-md hover:shadow-slate-900/5">
                  <div className="flex items-start gap-4">
                    <Avatar src={avatarUrl} name={f.user?.name} size="h-14 w-14" textSize="text-xl" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/freelancers/${f.user?._id}`} className="text-base font-semibold text-slate-900 no-underline hover:underline">{f.user?.name}</Link>
                      {f.title && <p className="truncate text-sm text-slate-600">{f.title}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        {f.user?.rating > 0 && <span className="font-semibold text-slate-900">★ {f.user.rating.toFixed(1)}</span>}
                        {f.user?.totalJobsCompleted > 0 && <span className="text-slate-500">{f.user.totalJobsCompleted} jobs done</span>}
                        <StatusPill tone={avail === 'full-time' ? 'green' : avail === 'part-time' ? 'blue' : 'gray'}>
                          {avail === 'full-time' ? 'Full-time' : avail === 'part-time' ? 'Part-time' : 'Unavailable'}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                  {f.bio && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{f.bio}</p>}
                  {f.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {f.skills.slice(0, 5).map(s => <Chip key={s}>{s}</Chip>)}
                      {f.skills.length > 5 && <span className="self-center text-xs text-slate-500">+{f.skills.length - 5} more</span>}
                    </div>
                  )}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link to={`/freelancers/${f.user?._id}`} className={btn.secondary}>View profile</Link>
                    <Link to={`/jobs/post?freelancer=${f.user?._id}`} className={btn.primary}>Invite to job</Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
