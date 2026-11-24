import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FREELANCER_BADGES, CLIENT_BADGES, BADGE_COLORS } from '../utils/badges'
import api from '../api'
import ThemeToggle from './ThemeToggle'
import { LogoMark } from './SafeLancerLogo'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [badgeOpen, setBadgeOpen] = useState(false)
  const [earnedIds, setEarnedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('earnedBadgeIds') || '[]') } catch { return [] }
  })
  const [earnedCount, setEarnedCount] = useState(
    parseInt(localStorage.getItem('earnedBadgeCount') || '0', 10)
  )
  const [totalCount, setTotalCount] = useState(
    parseInt(localStorage.getItem('totalBadgeCount') || '0', 10)
  )
  const badgeRef = useRef(null)
  const jobsRef = useRef(null)
  const [jobsOpen, setJobsOpen] = useState(false)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)

  useEffect(() => {
    const sync = () => {
      try { setEarnedIds(JSON.parse(localStorage.getItem('earnedBadgeIds') || '[]')) } catch {}
      setEarnedCount(parseInt(localStorage.getItem('earnedBadgeCount') || '0', 10))
      setTotalCount(parseInt(localStorage.getItem('totalBadgeCount') || '0', 10))
    }
    window.addEventListener('profileUpdated', sync)
    return () => window.removeEventListener('profileUpdated', sync)
  }, [])

  useEffect(() => {
    if (!badgeOpen) return
    const handler = (e) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) setBadgeOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [badgeOpen])

  useEffect(() => {
    if (!jobsOpen) return
    const handler = (e) => {
      if (jobsRef.current && !jobsRef.current.contains(e.target)) setJobsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [jobsOpen])

  const openJobsDropdown = async () => {
    setJobsOpen(v => !v)
    if (!jobsOpen && jobs.length === 0) {
      setJobsLoading(true)
      try {
        const { data } = await api.get('/api/jobs/my-jobs')
        setJobs(Array.isArray(data) ? data : [])
      } catch {}
      finally { setJobsLoading(false) }
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const dashboardPath = user?.role === 'client'
    ? '/dashboard/client'
    : user?.role === 'freelancer'
    ? '/dashboard/freelancer'
    : '/admin'

  const allBadges = user?.role === 'freelancer' ? FREELANCER_BADGES : CLIENT_BADGES
  const earnedBadges = allBadges.filter(b => earnedIds.includes(b.id))
  const hasAnyBadgeData = totalCount > 0

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef(null)

  // Close every menu on route change
  useEffect(() => { setMobileOpen(false); setUserOpen(false); setBadgeOpen(false); setJobsOpen(false) }, [location.pathname])

  // Outside click + Escape close the account menu; Escape closes all menus
  useEffect(() => {
    const onDown = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { setUserOpen(false); setBadgeOpen(false); setJobsOpen(false); setMobileOpen(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  const jobsActive = location.pathname.startsWith('/jobs/') && location.pathname !== '/jobs/post'

  const linkCls = (active) =>
    `rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors ${active
      ? 'bg-slate-100 text-slate-900'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`

  const panel = 'absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-xl shadow-slate-900/10'
  const menuItem = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 no-underline transition-colors hover:bg-slate-50 hover:text-slate-900'
  const Chevron = ({ open }) => (
    <svg className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
  const I = ({ d }) => (
    <svg className="h-4 w-4 flex-none text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
  const ICON = {
    user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.12a7.5 7.5 0 0115 0A17.93 17.93 0 0112 21.75c-2.68 0-5.22-.58-7.5-1.63z',
    eye: 'M2.04 12.32a1 1 0 010-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3 9.96 7.18.07.2.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3-9.96-7.18zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    card: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
  }

  const publicPath = user?.role === 'freelancer' ? `/freelancers/${user?.id}` : `/clients/${user?.id}`
  const roleLabel = user?.role === 'freelancer' ? 'Freelancer' : user?.role === 'client' ? 'Client' : 'Admin'

  const navLinks = !user ? [] : [
    { label: 'Dashboard', to: dashboardPath, active: isActive(dashboardPath) },
    ...(user.role === 'freelancer' ? [{ label: 'Find work', to: '/jobs', active: location.pathname === '/jobs' || jobsActive }] : []),
    ...(user.role === 'client' ? [{ label: 'Find talent', to: '/freelancers', active: location.pathname === '/freelancers' }] : []),
    ...(user.role !== 'admin' ? [{ label: 'Payments', to: '/payments', active: isActive('/payments') }] : []),
  ]

  const UserAvatar = ({ size = 'h-8 w-8', text = 'text-sm' }) => (
    <span className={`${size} ${text} flex flex-none items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700`}>
      {user?.name?.[0]?.toUpperCase()}
    </span>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: brand + primary links */}
        <div className="flex min-w-0 items-center gap-6">
          <Link to={dashboardPath} className="flex flex-none items-center gap-2 no-underline">
            <LogoMark size={20} color="#EA580C" keyholeColor="#ffffff" />
            <span className="text-[17px] font-bold tracking-tight text-slate-900">SafeLancer</span>
          </Link>

          {user && (
            <div className="nav-desktop-links flex items-center gap-1">
              {navLinks.slice(0, 1).map(l => <Link key={l.label} to={l.to} className={linkCls(l.active)}>{l.label}</Link>)}

              {user.role === 'client' && (
                <div className="relative" ref={jobsRef}>
                  <button onClick={openJobsDropdown} aria-expanded={jobsOpen}
                    className={`flex items-center gap-1 ${linkCls(jobsOpen || jobsActive)}`}>
                    My jobs <Chevron open={jobsOpen} />
                  </button>
                  {jobsOpen && (
                    <div className={`${panel} left-0 w-80`}>
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">My posted jobs</p>
                        <Link to="/dashboard/client" className="text-xs font-semibold text-orange-700 no-underline hover:underline">View all</Link>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {jobsLoading ? (
                          <div className="flex justify-center py-6"><div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" /></div>
                        ) : jobs.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-slate-500">No jobs posted yet</p>
                            <Link to="/jobs/post" className="mt-2 inline-block text-sm font-semibold text-orange-700 no-underline hover:underline">Post your first job</Link>
                          </div>
                        ) : jobs.map(j => {
                          const bids = j.bids || []
                          const pending = bids.filter(b => b.status === 'applied').length
                          return (
                            <Link key={j._id} to={`/jobs/${j._id}`}
                              className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 no-underline last:border-0 hover:bg-slate-50">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">{j.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  ₹{j.budget?.toLocaleString('en-IN')} · {bids.length} applicant{bids.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              {pending > 0
                                ? <span className="flex-none rounded-full bg-orange-600 px-2 py-0.5 text-[11px] font-semibold text-white">{pending} new</span>
                                : <span className="flex-none rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">{j.status.replace(/_/g, ' ')}</span>}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {navLinks.slice(1).map(l => <Link key={l.label} to={l.to} className={linkCls(l.active)}>{l.label}</Link>)}
            </div>
          )}
        </div>

        {/* Right: CTA, badges, account */}
        {user && (
          <div className="flex flex-none items-center gap-2">
            {user.role === 'client' && (
              <Link to="/jobs/post" className="nav-desktop-links hidden items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-orange-700 sm:flex">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" d="M12 5v14m7-7H5" /></svg>
                Post a job
              </Link>
            )}

            {user.role !== 'admin' && (
              <div className="nav-desktop-links relative" ref={badgeRef}>
                <button onClick={() => setBadgeOpen(v => !v)} aria-expanded={badgeOpen} aria-label="Badges"
                  title="Badges & achievements"
                  className={`relative flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-colors ${badgeOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.38c0-.62-.5-1.12-1.13-1.12h-.87m-6.5 4.5v-3.38c0-.62.5-1.12 1.12-1.12h.88m5.5 0a6.03 6.03 0 01-2.77-.9M8.62 14.25a6.03 6.03 0 002.77-.9m0 0a6.73 6.73 0 002.25-5.2V3.75m-4.5 9.6a6.73 6.73 0 01-2.25-5.2V3.75m6.75 0h-9.75m9.75 0h1.5a2.25 2.25 0 012.25 2.25v.25c0 1.6-1.13 2.96-2.69 3.27M7.88 3.75h-1.5A2.25 2.25 0 004.13 6v.25c0 1.6 1.12 2.96 2.68 3.27" />
                  </svg>
                  {hasAnyBadgeData && <span className="tabular-nums">{earnedCount}<span className="font-normal text-slate-400">/{totalCount}</span></span>}
                </button>
                {badgeOpen && (
                  <div className={`${panel} right-0 w-80`}>
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">Badges & achievements</p>
                        {hasAnyBadgeData && <span className="text-xs text-slate-500">{earnedCount} of {totalCount}</span>}
                      </div>
                      {hasAnyBadgeData && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.round((earnedCount / totalCount) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto p-3">
                      {!hasAnyBadgeData ? (
                        <div className="py-6 text-center">
                          <p className="text-sm font-medium text-slate-700">No badge data yet</p>
                          <p className="mt-1 text-xs text-slate-500">Open your profile to load your badges.</p>
                          <Link to="/profile/setup" className="mt-3 inline-block text-sm font-semibold text-orange-700 no-underline hover:underline">Go to profile</Link>
                        </div>
                      ) : earnedBadges.length > 0 ? (
                        <div className="space-y-1.5">
                          {earnedBadges.map(badge => {
                            const c = BADGE_COLORS[badge.color]
                            return (
                              <div key={badge.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${c.earned}`}>
                                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${c.icon}`}>{badge.icon}</div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold leading-tight">{badge.title}</p>
                                  <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{badge.description}</p>
                                </div>
                              </div>
                            )
                          })}
                          <Link to="/profile/setup" className="block pt-2 text-center text-xs font-semibold text-orange-700 no-underline hover:underline">See all badges</Link>
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-sm text-slate-500">No badges earned yet</p>
                          <Link to="/profile/setup" className="mt-2 inline-block text-xs font-semibold text-orange-700 no-underline hover:underline">See how to earn them</Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <ThemeToggle />

            {/* Account menu */}
            <div className="nav-desktop-links relative" ref={userRef}>
              <button onClick={() => setUserOpen(v => !v)} aria-expanded={userOpen} aria-haspopup="menu" aria-label="Account menu"
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors ${userOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}>
                <UserAvatar />
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-800 lg:block">{user.name?.split(' ')[0]}</span>
                <span className="text-slate-400"><Chevron open={userOpen} /></span>
              </button>
              {userOpen && (
                <div className={`${panel} right-0 w-64`} role="menu">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
                    <UserAvatar size="h-10 w-10" text="text-base" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email || roleLabel}</p>
                    </div>
                  </div>
                  <div className="py-1.5">
                    {user.role !== 'admin' && (
                      <>
                        <Link to="/profile/setup" className={menuItem} role="menuitem"><I d={ICON.user} />My profile</Link>
                        <Link to={publicPath} className={menuItem} role="menuitem"><I d={ICON.eye} />View public profile</Link>
                        <Link to="/payments" className={menuItem} role="menuitem"><I d={ICON.card} />Payments & payouts</Link>
                      </>
                    )}
                    <div className="mx-4 my-1.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="text-slate-500">Signed in as</span>
                      <span className="font-semibold text-slate-700">{roleLabel}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 py-1.5">
                    <button onClick={logout} className={`${menuItem} text-red-600 hover:bg-red-50 hover:text-red-700`} role="menuitem">
                      <svg className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={ICON.logout} /></svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="nav-hamburger rounded-lg p-2 text-slate-700 hover:bg-slate-100" style={{ display: 'none' }}
              onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'} />
              </svg>
            </button>
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && user && (
        <div className="border-t border-slate-200 bg-surface px-4 pb-5 pt-3 shadow-lg">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <UserAvatar size="h-10 w-10" text="text-base" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email || roleLabel}</p>
            </div>
            {hasAnyBadgeData && user.role !== 'admin' && (
              <span className="ml-auto flex-none rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">🏅 {earnedCount}/{totalCount}</span>
            )}
          </div>
          {user.role === 'client' && (
            <Link to="/jobs/post" className="mb-2 flex items-center justify-center rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white no-underline">+ Post a job</Link>
          )}
          {[
            navLinks[0],
            ...(user.role === 'client' ? [{ label: 'My jobs', to: '/dashboard/client', active: jobsActive }] : []),
            ...navLinks.slice(1),
            ...(user.role !== 'admin' ? [
              { label: 'My profile', to: '/profile/setup', active: isActive('/profile/setup') },
              { label: 'View public profile', to: publicPath, active: false },
            ] : []),
          ].map(l => (
            <Link key={l.label} to={l.to}
              className={`block rounded-lg px-3 py-3 text-[15px] font-medium no-underline ${l.active ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              {l.label}
            </Link>
          ))}
          <button onClick={() => { setMobileOpen(false); logout() }}
            className="mt-3 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            Log out
          </button>
        </div>
      )}
    </header>
  )
}
