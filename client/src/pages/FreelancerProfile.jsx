import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { Avatar, StatusPill, Chip, BackLink, btn } from '../components/ui'
import toast from 'react-hot-toast'
import { computeBadges, BADGE_COLORS } from '../utils/badges'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const Icons = {
  github: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
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
  paperclip: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

const SectionLabel = ({ text, sub }) => (
  <div className="mb-4 flex items-baseline justify-between gap-3">
    <h2 className="text-lg font-semibold text-slate-900">{text}</h2>
    {sub && <p className="text-sm text-slate-500">{sub}</p>}
  </div>
)

export default function FreelancerProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'rgb(var(--slate-200))' }} />
          <div className="absolute inset-0 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#EA580C' }} />
        </div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen">
      <Navbar />
      <p className="text-center py-12 text-sm" style={{ color: 'rgb(var(--slate-500))' }}>Profile not found</p>
    </div>
  )

  // Prefer the average of loaded reviews; fall back to the rating stored on the user.
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : profile.user?.rating > 0 ? Number(profile.user.rating).toFixed(1) : null

  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${FILE_BASE}${profile.avatarUrl}`)
    : null

  const { earned: earnedBadges, total: totalBadges } = computeBadges('freelancer', profile.user, profile)

  const isMe = me.id === userId
  const verified = profile.user?.verificationStatus === 'approved'
  const avail = profile.availability || 'full-time'
  const fileHref = (u) => (u?.startsWith('http') ? u : `${FILE_BASE}${u}`)
  const card = 'rounded-xl border border-slate-200 bg-surface'
  const links = [
    profile.githubUrl && { href: profile.githubUrl, icon: Icons.github, label: 'GitHub' },
    profile.linkedinUrl && { href: profile.linkedinUrl, icon: Icons.linkedin, label: 'LinkedIn' },
    profile.portfolioUrl && { href: profile.portfolioUrl, icon: Icons.globe, label: 'Portfolio website' },
  ].filter(Boolean)
  const Stars = ({ n }) => (
    <span className="inline-flex gap-0.5">{[1, 2, 3, 4, 5].map(i => (
      <svg key={i} className={`h-3.5 w-3.5 ${i <= n ? 'text-orange-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" /></svg>
    ))}</span>
  )

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
              <Avatar src={avatarUrl} name={profile.user?.name} size="h-24 w-24 -mt-12 ring-4 ring-surface" textSize="text-3xl" />
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{profile.user?.name}</h1>
                  {verified && <StatusPill tone="green">Verified</StatusPill>}
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{profile.title || (profile.skills?.slice(0, 3).join(' · ')) || 'Freelancer'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  {avgRating && <span className="inline-flex items-center gap-1.5"><Stars n={Math.round(avgRating)} /><span className="font-semibold text-slate-900">{avgRating}</span>{ratings.length > 0 && <span className="text-slate-500">({ratings.length})</span>}</span>}
                  {profile.user?.totalJobsCompleted > 0 && <span>{profile.user.totalJobsCompleted} jobs completed</span>}
                  {profile.hourlyRate > 0 && <span className="font-semibold text-slate-900">₹{profile.hourlyRate}/hr</span>}
                  <StatusPill tone={avail === 'full-time' ? 'green' : avail === 'part-time' ? 'blue' : 'gray'}>
                    {avail === 'full-time' ? 'Available full-time' : avail === 'part-time' ? 'Available part-time' : 'Not available'}
                  </StatusPill>
                </div>
              </div>
            </div>
            <div className="flex flex-none gap-2">
              {me.role === 'client' && <Link to={`/jobs/post?freelancer=${userId}`} className={btn.primary}>Invite to job</Link>}
              {isMe && <Link to="/profile/setup" className={btn.secondary}>Edit profile</Link>}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <section className={`${card} p-5`}>
              <h2 className="text-sm font-semibold text-slate-900">Track record</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {[
                  ['Rating', avgRating ? `★ ${avgRating}` : '—'],
                  ['Jobs done', profile.user?.totalJobsCompleted || 0],
                  ['On time', profile.user?.onTimeDeliveryRate > 0 ? `${profile.user.onTimeDeliveryRate.toFixed(0)}%` : '—'],
                  ['Disputes', `${profile.user?.disputeRate?.toFixed(0) || 0}%`],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 text-lg font-semibold text-slate-900">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                <span className="mt-0.5 text-emerald-600">{Icons.shield}</span>
                Work with {profile.user?.name?.split(' ')[0]} is paid through SafeLancer escrow, milestone by milestone.
              </p>
            </section>

            {links.length > 0 && (
              <section className={`${card} p-5`}>
                <h2 className="text-sm font-semibold text-slate-900">Links</h2>
                <ul className="mt-3 space-y-1 p-0">
                  {links.map(l => (
                    <li key={l.label} className="list-none">
                      <a href={l.href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-700 no-underline transition-colors hover:bg-slate-50 hover:text-slate-900">
                        <span className="text-slate-500">{l.icon}</span>{l.label}
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
                {earnedBadges.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No badges earned yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2 p-0">
                    {earnedBadges.map(badge => {
                      const c = BADGE_COLORS[badge.color]
                      return (
                        <li key={badge.id} className="flex list-none items-center gap-2.5" title={badge.description}>
                          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ${c.icon}`}>{badge.icon}</span>
                          <span className="text-sm font-medium text-slate-800">{badge.title}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </aside>

          {/* Main */}
          <div className="min-w-0 space-y-6">
            <section className={`${card} p-6`}>
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-700">{profile.bio || `${profile.user?.name} hasn't written a bio yet.`}</p>
              {profile.skills?.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-slate-900">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">{profile.skills.map(sk => <Chip key={sk}>{sk}</Chip>)}</div>
                </>
              )}
            </section>

            <section className={`${card} p-6`}>
              <SectionLabel text="Portfolio" sub={profile.projectSamples?.length ? `${profile.projectSamples.length} project${profile.projectSamples.length !== 1 ? 's' : ''}` : null} />
              {!profile.projectSamples?.length ? (
                <p className="text-sm text-slate-500">No portfolio samples yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.projectSamples.map((sample, i) => (
                    <article key={i} className="flex flex-col rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-300">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-orange-50 text-orange-600">{Icons.paperclip}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{sample.title}</p>
                          {sample.description && <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{sample.description}</p>}
                        </div>
                      </div>
                      <div className="mt-auto flex items-center gap-3 pt-3 text-xs font-semibold">
                        {sample.fileUrl && <a href={fileHref(sample.fileUrl)} target="_blank" rel="noreferrer" className="text-orange-700 no-underline hover:underline">View file</a>}
                        {sample.fileHash && <a href={`/verify/${sample.fileHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 no-underline hover:underline">{Icons.shield}Verify SHA-256</a>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={`${card} p-6`}>
              <SectionLabel text="Client reviews" sub={ratings.length ? `${ratings.length} review${ratings.length !== 1 ? 's' : ''}` : null} />
              {ratings.length === 0 ? (
                <p className="text-sm text-slate-500">No reviews yet. Reviews appear after a client completes a contract.</p>
              ) : (
                <ul className="divide-y divide-slate-100 p-0">
                  {ratings.map((r, i) => (
                    <li key={i} className="list-none py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.ratedBy?.name || 'C'} size="h-8 w-8" textSize="text-xs" />
                          <span className="text-sm font-semibold text-slate-900">{r.ratedBy?.name || 'Client'}</span>
                        </div>
                        <Stars n={r.stars} />
                      </div>
                      {r.review && <p className="mt-2 text-sm leading-6 text-slate-700">{r.review}</p>}
                      {(r.communication || r.quality || r.timeliness) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {r.communication && <Chip>Communication {r.communication}/5</Chip>}
                          {r.quality && <Chip>Quality {r.quality}/5</Chip>}
                          {r.timeliness && <Chip>Timeliness {r.timeliness}/5</Chip>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
