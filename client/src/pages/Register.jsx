import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import toast, { Toaster } from 'react-hot-toast'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z\d]/.test(password)) score++
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-500' }
  if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-emerald-500' }
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(form.password)

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters'); return false
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error('Please enter a valid email address'); return false
    }
    if (strength.score < 5) {
      toast.error('Password must have 8+ chars, uppercase, lowercase, number, and special character'); return false
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return false
    }
    if (!form.role) {
      toast.error('Please select your role'); return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('profileCompletion', '20')
      toast.success("Account created! Let's set up your profile.")
      setTimeout(() => navigate('/profile/setup'), 600)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const passwordCriteria = [
    { label: '8+ characters', met: form.password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(form.password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(form.password) },
    { label: 'Number', met: /\d/.test(form.password) },
    { label: 'Special character', met: /[^A-Za-z\d]/.test(form.password) },
  ]

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4 py-10">
      <Toaster />

      <div className="mb-8 text-center">
        <div className="text-xl font-bold text-zinc-900 tracking-tight">FreeLock</div>
        <div className="text-sm text-zinc-500 mt-1">Create your account</div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-base font-semibold text-zinc-900 mb-1">Create an account</h1>
        <p className="text-sm text-zinc-500 mb-6">Sign up to get started — takes 30 seconds</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
              placeholder="Your name"
            />
          </div>

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
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-zinc-100'}`} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2.5 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : form.confirmPassword && form.password === form.confirmPassword
                    ? 'border-emerald-300'
                    : 'border-zinc-200 focus:border-zinc-400'
                }`}
                placeholder="Repeat password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium">
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {['client', 'freelancer'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`py-3 px-3 rounded-lg border text-left transition-all ${
                    form.role === role
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold capitalize">{role === 'client' ? 'Client' : 'Freelancer'}</div>
                  <div className={`text-xs mt-0.5 ${form.role === role ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {role === 'client' ? 'I hire talent' : 'I do the work'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-5 text-center text-zinc-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-zinc-900 font-semibold hover:underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
