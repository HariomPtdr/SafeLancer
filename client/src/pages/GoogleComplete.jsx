import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'

export default function GoogleComplete() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pending = searchParams.get('pending') || ''
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!role) { toast.error('Please select your role'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/google/complete', { pendingToken: pending, role })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('profileCompletion', '20')
      window.dispatchEvent(new Event('profileUpdated'))
      toast.success("Account created! Let's set up your profile.")
      setTimeout(() => navigate('/profile/setup'), 600)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!pending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#BFBFBF' }}>Invalid session. Please try signing in again.</p>
          <a href="/login" className="text-white font-medium underline underline-offset-2 text-sm">Back to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'transparent' }}>

      <div className="mb-8 text-center">
        <div className="text-xl font-bold text-white tracking-tight">SafeLancer</div>
        <div className="text-sm mt-1" style={{ color: '#BFBFBF' }}>One last step</div>
      </div>

      <div className="dark-card p-8 w-full max-w-sm">
        <h1 className="text-base font-semibold text-white mb-1">How will you use SafeLancer?</h1>
        <p className="text-sm mb-6" style={{ color: '#BFBFBF' }}>Choose your role to complete your account setup.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['client', 'freelancer'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 px-3 rounded-lg border text-left transition-all ${
                  role === r
                    ? 'border-[#FF6803] bg-[#FF6803]/10 text-white'
                    : 'text-white hover:border-[#FF6803]/50'
                }`}
                style={role !== r ? { borderColor: 'rgba(255,104,3,0.10)', background: '#120a02' } : {}}
              >
                <div className="text-sm font-semibold capitalize">{r === 'client' ? 'Client' : 'Freelancer'}</div>
                <div className={`text-xs mt-0.5 ${role === r ? 'text-purple-300' : ''}`} style={role !== r ? { color: '#BFBFBF' } : {}}>
                  {r === 'client' ? 'I hire talent' : 'I do the work'}
                </div>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !role}
            className="btn-purple w-full font-medium py-2.5 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
