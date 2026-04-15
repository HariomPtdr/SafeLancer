import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [profileCompletion, setProfileCompletion] = useState(
    parseInt(localStorage.getItem('profileCompletion') || '0', 10)
  )
  const showBanner = user && user.role !== 'admin' && profileCompletion < 100

  useEffect(() => {
    const sync = () => setProfileCompletion(
      parseInt(localStorage.getItem('profileCompletion') || '0', 10)
    )
    window.addEventListener('profileUpdated', sync)
    return () => window.removeEventListener('profileUpdated', sync)
  }, [])

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const dashboardPath = user?.role === 'client'
    ? '/dashboard/client'
    : user?.role === 'freelancer'
    ? '/dashboard/freelancer'
    : '/admin'

  const barColor =
    profileCompletion < 40 ? 'bg-red-400' :
    profileCompletion < 70 ? 'bg-amber-400' :
    'bg-zinc-900'

  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between">
        <Link to={dashboardPath} className="flex items-center gap-2">
          <span className="text-base font-bold text-zinc-900 tracking-tight">FreeLock</span>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase">Beta</span>
        </Link>
        {user && (
          <div className="flex items-center gap-5">
            <Link to="/jobs" className="text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors">Jobs</Link>
            {user.role === 'client' && (
              <Link to="/freelancers" className="text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors">Find Talent</Link>
            )}
            <Link to="/profile/setup" className="text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors flex items-center gap-1.5">
              Profile
              {profileCompletion < 100 && (
                <span className="text-[10px] bg-zinc-900 text-white rounded px-1.5 py-0.5 leading-none font-semibold">
                  {profileCompletion}%
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3 border-l border-zinc-100 pl-5">
              <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 leading-tight">{user.name}</div>
                <div className="text-[11px] text-zinc-400 capitalize leading-tight">{user.role}</div>
              </div>
            </div>
            <button onClick={logout} className="text-sm text-zinc-400 hover:text-red-500 font-medium transition-colors">
              Logout
            </button>
          </div>
        )}
      </nav>

      {showBanner && (
        <div className="border-b border-zinc-200 bg-white px-6 py-2 flex items-center gap-4">
          <div className="w-28 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 flex-1">
            Profile <strong className="text-zinc-700">{profileCompletion}%</strong> complete
            {profileCompletion < 60
              ? ' — Complete your profile to be found by clients'
              : ' — Almost there!'}
          </span>
          <Link
            to="/profile/setup"
            className="text-xs font-semibold text-zinc-900 hover:underline underline-offset-2 whitespace-nowrap"
          >
            Complete →
          </Link>
        </div>
      )}
    </div>
  )
}
