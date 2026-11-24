// Shared light-theme building blocks for the logged-in app.

export const humanize = (s = '') => String(s).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const STATUS_TONES = {
  green: ['active', 'completed', 'approved', 'paid', 'released', 'hired', 'verified', 'funded', 'resolved'],
  orange: ['in_progress', 'pending', 'pending_advance', 'submitted', 'under_review', 'shortlisted', 'in_review', 'review'],
  red: ['disputed', 'rejected', 'cancelled', 'banned', 'failed', 'refunded'],
  blue: ['open', 'applied'],
}
const TONE_CLS = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/20',
}

export function StatusPill({ status, tone, children }) {
  const t = tone || Object.keys(STATUS_TONES).find(k => STATUS_TONES[k].includes(String(status).toLowerCase())) || 'gray'
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CLS[t]}`}>
      {children || humanize(status)}
    </span>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-medium text-slate-500">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, highlight }) {
  return (
    <div className={`rounded-xl border bg-surface p-5 ${highlight ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-200'}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${highlight ? 'text-orange-600' : 'text-slate-900'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Section({ title, action, children, className = '' }) {
  return (
    <section className={`mb-8 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty({ title, body, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-surface px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Avatar({ src, name, size = 'h-10 w-10', className = '', textSize = 'text-sm' }) {
  if (src) return <img src={src} alt={name || 'avatar'} className={`${size} flex-none rounded-full object-cover ${className}`} />
  return (
    <div className={`${size} flex flex-none items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700 ${textSize} ${className}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-orange-700 disabled:opacity-50',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-800 no-underline transition-colors hover:bg-slate-50 disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900',
}

export function timeAgo(date) {
  if (!date) return ''
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`
  const d = Math.round(s / 86400)
  if (d < 30) return d === 1 ? 'yesterday' : `${d} days ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export function Chip({ children }) {
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{children}</span>
}

export function BackLink({ onClick, children = 'Back' }) {
  return (
    <button onClick={onClick} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      {children}
    </button>
  )
}
