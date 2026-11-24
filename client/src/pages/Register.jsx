import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import AuthShell, { GoogleButton, Divider } from '../components/marketing/AuthShell'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z\d]/.test(password)) score++
  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' }
  if (score === 3) return { score, label: 'Fair', color: '#FF6803' }
  if (score === 4) return { score, label: 'Good', color: '#FF6803' }
  return { score, label: 'Strong', color: '#22c55e' }
}

const ROLES = [
  {
    value: 'client',
    label: "I'm a client",
    sub: 'Hiring for a project',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
      </svg>
    ),
  },
  {
    value: 'freelancer',
    label: "I'm a freelancer",
    sub: 'Looking for work',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
      </svg>
    ),
  },
]

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const presetRole = ['client', 'freelancer'].includes(params.get('role')) ? params.get('role') : ''
  const [step, setStep] = useState(presetRole ? 'form' : 'role')
  const [role, setRole] = useState(presetRole)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    linkedin: '', github: '', portfolio: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exiting, setExiting] = useState(false)

  const goTo = (path) => {
    setExiting(true)
    setTimeout(() => navigate(path), 220)
  }

  const strength = getPasswordStrength(form.password)

  const handleContinue = () => {
    if (!role) { toast.error('Please select your role to continue'); return }
    setExiting(true)
    setTimeout(() => { setStep('form'); setExiting(false) }, 220)
  }

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
    if (role === 'freelancer') {
      if (form.linkedin && !form.linkedin.startsWith('https://')) {
        toast.error('LinkedIn URL must start with https://'); return false
      }
      if (form.github && !form.github.startsWith('https://')) {
        toast.error('GitHub URL must start with https://'); return false
      }
      if (form.portfolio && !form.portfolio.startsWith('https://')) {
        toast.error('Portfolio URL must start with https://'); return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      }
      if (role === 'freelancer') {
        payload.portfolio = form.portfolio || ''
        payload.github = form.github || ''
        payload.linkedin = form.linkedin || ''
      }
      const { data } = await api.post('/api/auth/register', payload)

      if (role === 'freelancer') {
        toast.success('Request sent! Waiting for admin approval.')
        setTimeout(() => navigate('/login'), 600)
      } else {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('profileCompletion', '20')
        toast.success("Account created! Let's set up your profile.")
        setTimeout(() => navigate('/profile/setup'), 600)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const pwToggle = (shown, toggle) => (
    <button type="button" onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800">
      {shown ? 'Hide' : 'Show'}
    </button>
  )

  const footer = (
    <p className="mt-8 text-center text-sm text-slate-600">
      Already have an account?{' '}
      <button type="button" onClick={() => goTo('/login')} className="font-semibold text-orange-700 hover:underline underline-offset-4">
        Log in
      </button>
    </p>
  )

  if (step === 'role') {
    return (
      <AuthShell exiting={exiting}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Join SafeLancer</h1>
        <p className="mt-1.5 text-sm text-slate-600">How do you want to use SafeLancer?</p>

        <div className="mt-8 grid grid-cols-2 gap-3" role="radiogroup">
          {ROLES.map(({ value, label, sub, icon }) => {
            const on = role === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRole(value)}
                className={`relative rounded-xl border p-4 text-left transition-colors ${on ? 'border-orange-600 bg-orange-50 ring-1 ring-orange-600' : 'border-slate-300 bg-surface hover:border-slate-400'}`}
              >
                <span className={`absolute right-3 top-3 h-4 w-4 rounded-full border ${on ? 'border-[5px] border-orange-600' : 'border-slate-300'}`} />
                <div className={on ? 'text-orange-600' : 'text-slate-500'}>{icon}</div>
                <div className="mt-3 text-sm font-semibold text-slate-900">{label}</div>
                <div className="mt-0.5 text-xs text-slate-500">{sub}</div>
              </button>
            )
          })}
        </div>

        <button onClick={handleContinue} disabled={!role} className="btn-primary mt-6">
          {role === 'freelancer' ? 'Apply as a freelancer' : role === 'client' ? 'Join as a client' : 'Create account'}
        </button>
        {footer}
      </AuthShell>
    )
  }

  return (
    <AuthShell exiting={exiting}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <button type="button" onClick={() => setStep('role')} className="text-sm font-semibold text-orange-700 hover:underline underline-offset-4">
          Change role
        </button>
      </div>
      <p className="mt-1.5 text-sm text-slate-600">
        Signing up as a <span className="font-semibold text-slate-900">{role}</span>
      </p>

      {role === 'client' && (
        <>
          <div className="mt-8">
            <GoogleButton href={`${API_URL}/api/auth/google?role=client`}>Sign up with Google</GoogleButton>
          </div>
          <Divider>or sign up with email</Divider>
        </>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${role === 'client' ? '' : 'mt-8'}`}>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
          <input id="name" type="text" required autoComplete="name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} className="input-light" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input id="email" type="email" required autoComplete="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} className="input-light" placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} className="input-light pr-16" placeholder="At least 8 characters" />
            {pwToggle(showPassword, () => setShowPassword(!showPassword))}
          </div>
          {form.password ? (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: i <= strength.score ? strength.color : 'rgb(var(--slate-200))' }} />
                ))}
              </div>
              {strength.label && <p className="mt-1 text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">Use uppercase, lowercase, a number and a symbol.</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
          <div className="relative">
            <input id="confirm" type={showConfirm ? 'text' : 'password'} required autoComplete="new-password" value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className="input-light pr-16"
              style={{ borderColor: form.confirmPassword ? (form.password !== form.confirmPassword ? '#ef4444' : '#22c55e') : undefined }}
              placeholder="Repeat password" />
            {pwToggle(showConfirm, () => setShowConfirm(!showConfirm))}
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        {role === 'freelancer' && (
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Verification links</p>
              <p className="mt-0.5 text-xs text-slate-500">Optional, but they help an admin approve your profile faster.</p>
            </div>
            {[
              { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
              { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
              { key: 'portfolio', label: 'Portfolio / website', placeholder: 'https://yourportfolio.com' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label htmlFor={key} className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
                <input id={key} type="url" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className="input-light" />
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Creating account…' : role === 'freelancer' ? 'Submit for approval' : 'Create account'}
        </button>
        <p className="text-center text-xs text-slate-500">
          By signing up you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </form>
      {footer}
    </AuthShell>
  )
}
