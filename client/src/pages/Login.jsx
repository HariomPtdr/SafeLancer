import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'
import AuthShell, { GoogleButton, Divider } from '../components/marketing/AuthShell'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exiting, setExiting] = useState(false)

  const goTo = (path) => {
    setExiting(true)
    setTimeout(() => navigate(path), 220)
  }

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
        const pct = meData.portfolio
          ? calcCompletion(meData.user?.role, meData.portfolio)
          : 20
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
    <AuthShell exiting={exiting}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-600">Log in to manage your contracts and payments.</p>

      <div className="mt-8">
        <GoogleButton href={`${API_URL}/api/auth/google`}>Continue with Google</GoogleButton>
      </div>
      <Divider>or log in with email</Divider>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="input-light"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-light pr-16"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <button type="button" onClick={() => goTo('/register')} className="font-semibold text-orange-700 hover:underline underline-offset-4">
          Sign up
        </button>
      </p>
    </AuthShell>
  )
}
