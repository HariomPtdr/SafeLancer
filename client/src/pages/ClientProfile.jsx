import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { Avatar, StatusPill, Chip, BackLink, inr, timeAgo } from '../components/ui'
import toast from 'react-hot-toast'
import { computeBadges, BADGE_COLORS } from '../utils/badges'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ── SVG icon set ─────────────────────────────────────────────────────────────
const Icons = {
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  globe: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  industry: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
}

const YEARS_HIRING_LABELS = {
  'first-time': 'First time hiring',
  '1-2': '1–2 years hiring',
  '3-5': '3–5 years hiring',
  '5+': '5+ years hiring',
}

const COMM_LABELS = {
  async: 'Async (messages & docs)',
  sync: 'Sync (calls & check-ins)',
  flexible: 'Flexible (mix of both)',
}

export default function ClientProfile() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [openJobs, setOpenJobs] = useState([])
  const navigate = useNavigate()
  const me = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get('/api/jobs').then(({ data }) => setOpenJobs((Array.isArray(data) ? data : []).filter(j => (j.client?._id || j.client) === userId))).catch(() => {})
  }, [userId])

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: p }, { data: r }] = await Promise.all([
          api.get(`/api/portfolio/${userId}`),
          api.get(`/api/ratings/user/${userId}`)
        ])
        setProfile(p)
        setRatings(Array.isArray(r) ? r : [])
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    load()
  }, [userId])

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'transparent' }}><Navbar />
      <div className="flex justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-[#EA580C] border-t-transparent rounded-full" />
      </div>
    </div>
  )
  if (!profile) return (
    <div className="min-h-screen" style={{ background: 'transparent' }}><Navbar />
      <p className="text-center py-12 text-sm" style={{ color: 'rgb(var(--slate-500))' }}>Profile not found</p>
    </div>
  )

  const isBusiness = profile.clientType === 'business'
  const isIndividual = profile.clientType === 'individual'
  const avatarShape = isBusiness ? 'rounded-xl' : 'rounded-full'

  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${FILE_BASE}${profile.avatarUrl}`)
    : null

  const { earned: earnedBadges, total: totalBadges } = computeBadges(profile.user?.role || 'client', profile.user, profile)

  // Prefer the average of loaded reviews; fall back to the rating stored on the user.
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : profile.user?.rating > 0 ? Number(profile.user.rating).toFixed(1) : null

  const isMe = me.id === userId
  const card = 'rounded-xl border border-slate-200 bg-surface'
  const details = [
    profile.location && [Icons.location, 'Location', profile.location],
    isBusiness && profile.industry && [Icons.industry, 'Industry', profile.industry],
    isBusiness && profile.companySize && [Icons.users, 'Company size', `${profile.companySize} people`],
    profile.yearsHiring && [Icons.clock, 'Hiring experience', YEARS_HIRING_LABELS[profile.yearsHiring] || profile.yearsHiring],
    profile.preferredComm && [Icons.chat, 'Prefers', COMM_LABELS[profile.preferredComm] || profile.preferredComm],
  ].filter(Boolean)
  const links = [
    profile.websiteUrl && [Icons.globe, 'Website', profile.websiteUrl],
    profile.linkedinUrl && [Icons.linkedin, 'LinkedIn', profile.linkedinUrl],
  ].filter(Boolean)
  const name = isBusiness && profile.companyName ? profile.companyName : profile.user?.name

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <BackLink onClick={() => navigate(-1)} />

        {/* Header */}
        <section className={`${card} mb-6 overflow-hidden`}>
          <div className="cover-wash h-24 border-b border-slate-200" />
          <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5">
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className={`-mt-12 h-24 w-24 flex-none object-cover ring-4 ring-surface ${avatarShape}`} />
                : <div className={`-mt-12 flex h-24 w-24 flex-none items-center justify-center bg-orange-100 text-3xl font-semibold text-orange-700 ring-4 ring-surface ${avatarShape}`}>{name?.[0]?.toUpperCase()}</div>}
              <div className="min-w-0 pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{name}</h1>
                <p className="mt-0.5 text-sm text-slate-600">
                  {isBusiness && profile.companyName ? <>Represented by {profile.user?.name}</> : (isIndividual ? 'Individual client' : 'Client')}
                  {profile.location && <> · {profile.location}</>}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {profile.paymentVerified
                    ? <StatusPill tone="green">Payment verified</StatusPill>
                    : <StatusPill tone="gray">Payment not verified</StatusPill>}
                  {profile.clientType && <StatusPill tone="blue">{isBusiness ? 'Business' : 'Individual'}</StatusPill>}
                  {avgRating && <span className="font-semibold text-slate-900">★ {avgRating}<span className="font-normal text-slate-500">{ratings.length > 0 && ` (${ratings.length})`}</span></span>}
                </div>
              </div>
            </div>
            {isMe && <Link to="/profile/setup" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-800 no-underline hover:bg-slate-50">Edit profile</Link>}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main */}
          <div className="min-w-0 space-y-6">
            <section className={`${card} p-6`}>
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-700">{profile.bio || `${name} hasn't added a description yet.`}</p>
            </section>

            <section className={`${card}`}>
              <div className="flex items-baseline justify-between px-6 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">Open jobs</h2>
                <span className="text-sm text-slate-500">{openJobs.length}</span>
              </div>
              {openJobs.length === 0 ? (
                <p className="px-6 pb-6 pt-3 text-sm text-slate-500">No open jobs right now.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-200 p-0">
                  {openJobs.map(j => (
                    <li key={j._id} className="list-none">
                      <Link to={`/jobs/${j._id}`} className="group flex items-start justify-between gap-4 px-6 py-4 no-underline hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-orange-700">{j.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Posted {timeAgo(j.createdAt)} · {j.phases?.length || 0} milestones · {(j.bids?.length || 0)} proposals</p>
                          {j.skills?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{j.skills.slice(0, 4).map(sk => <Chip key={sk}>{sk}</Chip>)}</div>}
                        </div>
                        <p className="flex-none text-sm font-semibold text-slate-900">{inr(j.budget)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${card} p-6`}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Reviews from freelancers</h2>
                {ratings.length > 0 && <span className="text-sm text-slate-500">{ratings.length}</span>}
              </div>
              {ratings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No reviews yet. Freelancers can review a client after a contract is completed.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 p-0">
                  {ratings.map((r, i) => (
                    <li key={i} className="list-none py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5"><Avatar name={r.ratedBy?.name || 'F'} size="h-8 w-8" textSize="text-xs" /><span className="text-sm font-semibold text-slate-900">{r.ratedBy?.name || 'Freelancer'}</span></div>
                        <span className="text-sm font-semibold text-orange-600">{'★'.repeat(r.stars)}<span className="text-slate-300">{'★'.repeat(5 - r.stars)}</span></span>
                      </div>
                      {r.review && <p className="mt-2 text-sm leading-6 text-slate-700">{r.review}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className={`${card} p-5`}>
              <h2 className="text-sm font-semibold text-slate-900">Hiring activity</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {[
                  ['Jobs posted', profile.projectsPosted || 0],
                  ['Completed', profile.projectsCompleted || 0],
                  ['Avg budget', profile.avgBudget > 0 ? inr(Math.round(profile.avgBudget)) : '—'],
                  ['Rating', avgRating ? `★ ${avgRating}` : '—'],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 text-lg font-semibold text-slate-900">{v}</dd></div>
                ))}
              </dl>
              {profile.paymentVerified && (
                <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                  <span className="mt-0.5 text-emerald-600">{Icons.shield}</span>
                  Payment method verified. Milestones are funded into escrow before work starts.
                </p>
              )}
            </section>

            {details.length > 0 && (
              <section className={`${card} p-5`}>
                <h2 className="text-sm font-semibold text-slate-900">Details</h2>
                <ul className="mt-3 space-y-3 p-0">
                  {details.map(([icon, label, value]) => (
                    <li key={label} className="flex list-none items-start gap-3">
                      <span className="mt-0.5 text-slate-400">{icon}</span>
                      <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-900">{value}</p></div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {links.length > 0 && (
              <section className={`${card} p-5`}>
                <h2 className="text-sm font-semibold text-slate-900">Links</h2>
                <ul className="mt-3 space-y-1 p-0">
                  {links.map(([icon, label, href]) => (
                    <li key={label} className="list-none">
                      <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-700 no-underline hover:bg-slate-50 hover:text-slate-900">
                        <span className="text-slate-500">{icon}</span>{label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {totalBadges > 0 && (
              <section className={`${card} p-5`}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Badges</h2>
                  <span className="text-xs text-slate-500">{earnedBadges.length} of {totalBadges}</span>
                </div>
                {earnedBadges.length === 0 ? <p className="mt-3 text-sm text-slate-500">No badges earned yet.</p> : (
                  <ul className="mt-3 space-y-2 p-0">
                    {earnedBadges.map(b => {
                      const c = BADGE_COLORS[b.color]
                      return (
                        <li key={b.id} className="flex list-none items-center gap-2.5" title={b.description}>
                          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ${c.icon}`}>{b.icon}</span>
                          <span className="text-sm font-medium text-slate-800">{b.title}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
