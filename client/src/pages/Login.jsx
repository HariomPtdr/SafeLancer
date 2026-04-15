import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      try {
        const { data: meData } = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${data.token}` }
        })
        const pct = meData.portfolio?.completionPercent ?? 20
        localStorage.setItem('profileCompletion', String(pct))
      } catch {
        localStorage.setItem('profileCompletion', '20')
      }
      window.dispatchEvent(new Event('profileUpdated'))
      toast.success(`Welcome back, ${data.user.name}!`)
      setTimeout(() => {
        if (data.user.role === 'client') navigate('/dashboard/client')
        else if (data.user.role === 'freelancer') navigate('/dashboard/freelancer')
        else navigate('/admin')
      }, 500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4">
      <Toaster />

      <div className="mb-8 text-center">
        <div className="text-xl font-bold text-zinc-900 tracking-tight">FreeLock</div>
        <div className="text-sm text-zinc-500 mt-1">Secure Freelancing Platform</div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-base font-semibold text-zinc-900 mb-1">Sign in</h1>
        <p className="text-sm text-zinc-500 mb-6">Enter your credentials to access your portals</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-zinc-500 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-zinc-900 font-semibold hover:underline underline-offset-2">Sign up</Link>
        </p>

        <div className="mt-5 p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-600 mb-1.5">Demo accounts</p>
          <p className="font-mono">client@test.com / Test@123</p>
          <p className="font-mono">freelancer@test.com / Test@123</p>
          <p className="font-mono">admin@test.com / Test@123</p>
        </div>
      </div>
    </div>
  )
}
