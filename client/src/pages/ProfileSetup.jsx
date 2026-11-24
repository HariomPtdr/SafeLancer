import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import SkillSelector from '../components/SkillSelector'
import toast from 'react-hot-toast'
import {
  FREELANCER_BADGES, CLIENT_BADGES, BADGE_COLORS,
  computeBadges, storeBadgeSummary
} from '../utils/badges'
import { calcCompletion as calcCompletionUtil } from '../utils/profileCompletion'

// Upload files are served by the Express server (port 5001), not Vite (5173).
// All /uploads/... URLs must be prefixed with the backend base URL.
const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const INDUSTRIES = [
  'Technology', 'Finance & Fintech', 'Healthcare', 'E-commerce', 'Education',
  'Media & Entertainment', 'Real Estate', 'Manufacturing', 'Consulting', 'Other'
]

const YEARS_HIRING_OPTIONS = [
  { value: 'first-time', label: 'First time', sub: "Haven't hired a freelancer before" },
  { value: '1-2', label: '1–2 years', sub: 'Some experience hiring' },
  { value: '3-5', label: '3–5 years', sub: 'Comfortable with the process' },
  { value: '5+', label: '5+ years', sub: 'Experienced client' },
]

const COMM_OPTIONS = [
  { value: 'async', label: 'Async', sub: 'Messages & docs, respond in your own time' },
  { value: 'sync', label: 'Sync', sub: 'Regular calls and real-time check-ins' },
  { value: 'flexible', label: 'Flexible', sub: 'Mix of both depending on the project' },
]

const COMPANY_SIZES = ['solo', '2–10', '11–50', '51–200', '200+']
// stored values map to display labels
const COMPANY_SIZE_VALUES = ['solo', '2-10', '11-50', '51-200', '200+']

function isValidUrl(url) {
  if (!url) return true
  try { new URL(url); return true } catch { return false }
}

// ─── SVG icon set (used in DetailRowCard) ────────────────────────────────────
const SetupIcons = {
  person: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
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
  paperclip: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
}

// Use shared completion calculator (single source of truth)
const calcCompletion = calcCompletionUtil

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Field({ label, hint, required, bonus, error, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium" style={{ color: 'rgb(var(--slate-600))' }}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {bonus && <span className="ml-1.5 text-xs font-normal" style={{ color: 'rgb(var(--slate-500))' }}>+{bonus}%</span>}
        </label>
        {hint && <span className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasErr) {
  return `dark-input w-full${hasErr ? ' border-red-500' : ''}`
}

// ─── Badges card ──────────────────────────────────────────────────────────────
function BadgesCard({ user, portfolio }) {
  const { earned, locked, total } = computeBadges(user?.role, user, portfolio)

  return (
    <div className="dark-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">Badges</h3>
        <span className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>{earned.length} / {total} earned</span>
      </div>

      {earned.length === 0 && locked.length === 0 && (
        <p className="text-sm italic" style={{ color: 'rgb(var(--slate-500))' }}>Complete your profile to start earning badges.</p>
      )}

      {/* Earned */}
      {earned.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {earned.map(badge => {
            const c = BADGE_COLORS[badge.color]
            return (
              <div key={badge.id} className={`flex items-start gap-2 border rounded-lg px-2.5 py-2 ${c.earned}`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${c.icon}`}>
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-tight truncate">{badge.title}</p>
                  <p className="text-[10px] opacity-60 mt-0.5 leading-tight line-clamp-2">{badge.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Divider */}
      {earned.length > 0 && locked.length > 0 && (
        <p className="mb-1.5 text-xs font-medium text-slate-500">Still to unlock</p>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {locked.map(badge => (
            <div key={badge.id} className="flex items-start gap-2 rounded-lg px-2.5 py-2 opacity-40"
              style={{ border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))' }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgb(var(--slate-100))', color: 'rgb(var(--slate-500))' }}>
                {badge.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: 'rgb(var(--slate-500))' }}>{badge.title}</p>
                <p className="text-[10px] mt-0.5 leading-tight line-clamp-2" style={{ color: 'rgb(var(--slate-500))' }}>{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// PaymentVerifyModal is now in components/PaymentVerifyModal.jsx

// ─── Avatar display ───────────────────────────────────────────────────────────
function Avatar({ url, name, size = 14, shape = 'circle', className = '', style: styleProp = {} }) {
  const sizeClass = `w-${size} h-${size}`
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'
  const borderClass = className ? '' : 'border'
  const borderStyle = className ? {} : { borderColor: 'rgba(255,104,3,0.20)' }
  const fullUrl = url ? (url.startsWith('http') ? url : `${FILE_BASE}${url}`) : null
  if (fullUrl) {
    return (
      <img src={fullUrl} alt={name}
        className={`${sizeClass} ${shapeClass} object-cover object-top ${borderClass} ${className}`}
        style={{ ...borderStyle, ...styleProp }} />
    )
  }
  return (
    <div className={`${sizeClass} ${shapeClass} flex items-center justify-center text-orange-700 font-bold flex-shrink-0 ${borderClass} ${className}`}
      style={{ background: 'rgb(var(--orange-100))', fontSize: size > 10 ? '1.25rem' : '0.875rem', ...borderStyle, ...styleProp }}>
      {name?.[0]?.toUpperCase()}
    </div>
  )
}

// ─── Checklist helper ────────────────────────────────────────────────────────
function getChecklistItems(role, portfolio) {
  const clientType = portfolio?.clientType
  if (role === 'freelancer') {
    return [
      { label: 'Bio', done: !!portfolio?.bio, pct: 20 },
      { label: 'Skills', done: (portfolio?.skills?.length || 0) > 0, pct: 20 },
      { label: 'GitHub URL', done: !!portfolio?.githubUrl, pct: 25 },
      { label: 'LinkedIn URL', done: !!portfolio?.linkedinUrl, pct: 10 },
      { label: 'Portfolio Website', done: !!portfolio?.portfolioUrl, pct: 5 },
    ]
  } else if (clientType === 'individual') {
    return [
      { label: 'Bio', done: !!portfolio?.bio, pct: 15 },
      { label: 'Profile Photo', done: !!portfolio?.avatarUrl, pct: 15 },
      { label: 'Location', done: !!portfolio?.location, pct: 15 },
      { label: 'Hiring Experience', done: !!portfolio?.yearsHiring, pct: 15 },
      { label: 'LinkedIn URL', done: !!portfolio?.linkedinUrl, pct: 10 },
      { label: 'Communication Style', done: !!portfolio?.preferredComm, pct: 10 },
      { label: 'Payment Verified', done: !!portfolio?.paymentVerified, pct: 10 },
    ]
  } else if (clientType === 'business') {
    return [
      { label: 'Bio', done: !!portfolio?.bio, pct: 10 },
      { label: 'Company Logo', done: !!portfolio?.avatarUrl, pct: 10 },
      { label: 'Location', done: !!portfolio?.location, pct: 10 },
      { label: 'Company Name', done: !!portfolio?.companyName, pct: 10 },
      { label: 'Industry', done: !!portfolio?.industry, pct: 10 },
      { label: 'Company Size', done: !!portfolio?.companySize, pct: 10 },
      { label: 'Hiring Experience', done: !!portfolio?.yearsHiring, pct: 10 },
      { label: 'Payment Verified', done: !!portfolio?.paymentVerified, pct: 10 },
      { label: 'Website URL', done: !!portfolio?.websiteUrl, pct: 5 },
      { label: 'LinkedIn URL', done: !!portfolio?.linkedinUrl, pct: 5 },
      { label: 'Communication Style', done: !!portfolio?.preferredComm, pct: 5 },
    ]
  }
  // No client type yet: completion is capped at 30% (base 20 + bio 10),
  // and choosing a type unlocks the remaining 70%.
  return [
    { label: 'Bio', done: !!portfolio?.bio, pct: 10 },
    { label: 'Choose individual or business', done: false, pct: 70 },
  ]
}

// ─── Profile Card (view mode) ─────────────────────────────────────────────────
function ProfileCard({ portfolio, user, fullUser, completion, onEdit, onCompletionChange }) {
  const isFreelancer = user?.role === 'freelancer'
  const isIndividual = portfolio?.clientType === 'individual'
  const isBusiness = portfolio?.clientType === 'business'
  const avatarShape = isBusiness ? 'square' : 'circle'
  const isVerified = portfolio?.paymentVerified || false

  const checklist = getChecklistItems(user?.role, portfolio)
  const doneCount = checklist.filter(i => i.done).length
  const missing = checklist.filter(i => !i.done)

  const publicProfilePath = isFreelancer
    ? `/freelancers/${user?.id}`
    : `/clients/${user?.id}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* ── LEFT ────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-3">

        {/* Cover + Header card */}
        <div className="dark-card">
          <div className="cover-wash h-32 rounded-t-[14px] border-b border-slate-200" />
          <div className="px-5 pb-5" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-start justify-between -mt-8 mb-2">
              <Avatar url={portfolio?.avatarUrl} name={user?.name} size={20} shape={avatarShape}
                className="border-4 shadow flex-shrink-0" style={{ borderColor: 'rgb(var(--surface))', boxShadow: '0 0 0 0 transparent' }} />
              <div className="flex gap-2 mt-9">
                <button onClick={onEdit}
                  className="btn-purple text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                  </svg>
                  Edit Profile
                </button>
                <Link to={publicProfilePath}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  style={{ border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))', color: 'rgb(var(--slate-600))' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgb(var(--slate-900))'; e.currentTarget.style.background = 'rgb(var(--slate-100))' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgb(var(--slate-600))'; e.currentTarget.style.background = 'rgb(var(--surface))' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Public view
                </Link>
              </div>
            </div>

            <h2 className="text-base font-bold leading-tight mt-1" style={{ color: 'rgb(var(--slate-900))' }}>{user?.name}</h2>
            {isBusiness && portfolio?.companyName && (
              <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--slate-600))' }}>{portfolio.companyName}</p>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {isFreelancer ? (
                <>
                  {fullUser?.rating > 0 && (
                    <span className="font-semibold text-sm" style={{ color: '#f59e0b' }}>★ {fullUser.rating.toFixed(1)}</span>
                  )}
                  {fullUser?.totalJobsCompleted > 0 && (
                    <span className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>{fullUser.totalJobsCompleted} jobs</span>
                  )}
                  {portfolio?.availability && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {portfolio.availability === 'full-time' ? 'Available full-time' : portfolio.availability === 'part-time' ? 'Available part-time' : portfolio.availability.replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  )}
                  {fullUser?.verificationStatus === 'approved' && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified by SafeLancer
                    </span>
                  )}
                  {fullUser?.verificationStatus === 'pending' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.18)' }}>
                      Pending Verification
                    </span>
                  )}
                  {fullUser?.verificationStatus === 'rejected' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.20)' }}>
                      Verification Rejected
                    </span>
                  )}
                </>
              ) : (
                <>
                  {portfolio?.clientType && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'rgb(var(--surface))', color: 'rgb(var(--slate-600))', border: '1px solid rgb(var(--slate-200))' }}>
                      {isIndividual ? 'Individual' : 'Business'}
                    </span>
                  )}
                  {isBusiness && portfolio?.industry && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: 'rgb(var(--surface))', color: 'rgb(var(--slate-600))', border: '1px solid rgb(var(--slate-200))' }}>
                      {portfolio.industry}
                    </span>
                  )}
                  {isVerified && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Payment Verified
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Bio */}
            {portfolio?.bio
              ? <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgb(var(--slate-600))' }}>{portfolio.bio}</p>
              : <p className="mt-2 text-xs italic" style={{ color: 'rgb(var(--slate-500))' }}>No bio yet. <button onClick={onEdit} className="underline underline-offset-2 transition-colors" style={{ color: '#EA580C' }}>Add one →</button></p>
            }
          </div>
        </div>

        {/* Stats row — freelancer (only when there's real data) */}
        {isFreelancer && fullUser && fullUser.totalJobsCompleted > 0 && (
          <div className="dark-card">
            <div className="grid grid-cols-4" style={{ borderBottom: 'none' }}>
              {[
                { value: fullUser.rating > 0 ? fullUser.rating.toFixed(1) : '—', label: 'Avg Rating' },
                { value: fullUser.totalJobsCompleted || 0, label: 'Jobs Done' },
                { value: fullUser.onTimeDeliveryRate > 0 ? `${fullUser.onTimeDeliveryRate.toFixed(0)}%` : '—', label: 'On-time' },
                { value: `${fullUser.disputeRate?.toFixed(0) || 0}%`, label: 'Disputes' },
              ].map((stat, idx) => (
                <div key={stat.label} className="py-3 px-2 text-center" style={idx > 0 ? { borderLeft: '1px solid rgb(var(--slate-200))' } : {}}>
                  <div className="text-xl font-bold" style={{ color: 'rgb(var(--slate-900))' }}>{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgb(var(--slate-500))' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills — freelancer */}
        {isFreelancer && (
          <div className="dark-card p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Skills</h3>
            {portfolio?.skills?.length > 0
              ? <div className="flex flex-wrap gap-1.5">
                  {portfolio.skills.map(skill => (
                    <span key={skill} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{skill}</span>
                  ))}
                </div>
              : <button onClick={onEdit} className="text-xs italic transition-colors" style={{ color: 'rgb(var(--slate-500))' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--slate-600))'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--slate-500))'}>No skills added yet. Add some →</button>
            }
          </div>
        )}

        {/* Details */}
        {(portfolio?.githubUrl || portfolio?.linkedinUrl || portfolio?.portfolioUrl ||
          portfolio?.location || portfolio?.websiteUrl || portfolio?.yearsHiring || portfolio?.resumeUrl) && (
          <div className="dark-card p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Links & details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {portfolio?.githubUrl && (
                <DetailRowCard icon={SetupIcons.github} label="GitHub">
                  <a href={portfolio.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline underline-offset-2 font-medium truncate block transition-colors" style={{ color: '#EA580C' }}>{portfolio.githubUrl}</a>
                </DetailRowCard>
              )}
              {portfolio?.linkedinUrl && (
                <DetailRowCard icon={SetupIcons.linkedin} label="LinkedIn">
                  <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline underline-offset-2 font-medium truncate block transition-colors" style={{ color: '#EA580C' }}>{portfolio.linkedinUrl}</a>
                </DetailRowCard>
              )}
              {portfolio?.portfolioUrl && (
                <DetailRowCard icon={SetupIcons.globe} label="Portfolio">
                  <a href={portfolio.portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline underline-offset-2 font-medium truncate block transition-colors" style={{ color: '#EA580C' }}>{portfolio.portfolioUrl}</a>
                </DetailRowCard>
              )}
              {portfolio?.location && (
                <DetailRowCard icon={SetupIcons.location} label="Location">
                  <span className="text-xs font-medium" style={{ color: 'rgb(var(--slate-900))' }}>{portfolio.location}</span>
                </DetailRowCard>
              )}
              {portfolio?.yearsHiring && (
                <DetailRowCard icon={SetupIcons.clock} label="Hiring Experience">
                  <span className="text-xs font-medium" style={{ color: 'rgb(var(--slate-900))' }}>
                    {YEARS_HIRING_OPTIONS.find(o => o.value === portfolio.yearsHiring)?.label || portfolio.yearsHiring}
                  </span>
                </DetailRowCard>
              )}
              {portfolio?.preferredComm && (
                <DetailRowCard icon={SetupIcons.chat} label="Communication">
                  <span className="text-xs font-medium capitalize" style={{ color: 'rgb(var(--slate-900))' }}>{portfolio.preferredComm}</span>
                </DetailRowCard>
              )}
              {isBusiness && portfolio?.companySize && (
                <DetailRowCard icon={SetupIcons.users} label="Company Size">
                  <span className="text-xs font-medium" style={{ color: 'rgb(var(--slate-900))' }}>{portfolio.companySize} people</span>
                </DetailRowCard>
              )}
              {isBusiness && portfolio?.websiteUrl && (
                <DetailRowCard icon={SetupIcons.globe} label="Website">
                  <a href={portfolio.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline underline-offset-2 font-medium truncate block transition-colors" style={{ color: '#EA580C' }}>{portfolio.websiteUrl}</a>
                </DetailRowCard>
              )}
              {portfolio?.resumeUrl && (
                <DetailRowCard
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--slate-500))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Resume"
                >
                  <a
                    href={portfolio.resumeUrl.startsWith('http') ? portfolio.resumeUrl : `${FILE_BASE}${portfolio.resumeUrl}`}
                    target="_blank" rel="noopener noreferrer" download
                    className="text-xs hover:underline underline-offset-2 font-medium transition-colors" style={{ color: '#EA580C' }}>View / Download</a>
                </DetailRowCard>
              )}
            </div>
          </div>
        )}

        {/* Payment — link to payment settings */}
        {!isFreelancer && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={
            isVerified
              ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }
              : { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }
          }>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={
              isVerified
                ? { background: 'rgb(var(--emerald-100))' }
                : { background: 'rgb(var(--slate-100))' }
            }>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: isVerified ? 'rgb(var(--emerald-700))' : 'rgb(var(--slate-500))' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'rgb(var(--slate-900))' }}>{isVerified ? 'Payment Verified' : 'Payment Not Verified'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--slate-600))' }}>{isVerified ? 'Your payment method is confirmed' : 'Verify your payment to build trust with freelancers'}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Sidebar ──────────────────────────────────────────── */}
      <div className="lg:col-span-1 space-y-3">

        {/* Profile Strength */}
        <div className="dark-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--slate-900))' }}>Profile Strength</h3>
            <span className="text-sm font-bold" style={{ color: '#EA580C' }}>{completion}%</span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden mb-3" style={{ background: 'rgb(var(--orange-50))' }}>
            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${completion}%`, background: 'linear-gradient(90deg, #EA580C, #C2410C)' }} />
          </div>

          {completion === 100 ? (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: '#10b981' }}>Profile complete — you're ready to go!</span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                {missing.length} item{missing.length !== 1 ? 's' : ''} left
              </p>
              {missing.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgb(var(--orange-50))', border: '1px solid rgb(var(--orange-200))' }}>
                      <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'rgba(255,104,3,0.20)' }} />
                  )}
                  <span className={`text-xs flex-1 leading-tight ${item.done ? 'line-through' : ''}`}
                    style={{ color: item.done ? 'rgb(var(--slate-500))' : 'rgb(var(--slate-600))' }}>
                    {item.label}
                  </span>
                  {!item.done && item.pct > 0 && (
                    <span className="text-[10px] font-medium" style={{ color: 'rgb(var(--slate-500))' }}>+{item.pct}%</span>
                  )}
                </div>
              ))}
              <button onClick={onEdit}
                className="btn-purple w-full mt-2.5 text-xs font-medium py-2 rounded-lg transition-colors">
                Complete Profile →
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2.5 text-[10px]"
            style={{ borderTop: '1px solid rgb(var(--slate-200))', color: 'rgb(var(--slate-500))' }}>
            <span>{doneCount} / {checklist.length} complete</span>
            <span>{completion < 100 ? `${100 - completion}% remaining` : 'All done!'}</span>
          </div>
        </div>

        {/* Badges */}
        <BadgesCard user={fullUser || user} portfolio={portfolio} />
      </div>
    </div>
  )
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>{label}</p>
        {children}
      </div>
    </div>
  )
}

function DetailRowCard({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-700 flex-shrink-0"
        style={{ background: 'rgb(var(--orange-100))' }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] leading-none mb-0.5" style={{ color: 'rgb(var(--slate-500))' }}>{label}</p>
        {children}
      </div>
    </div>
  )
}

// ─── Profile Edit Form ────────────────────────────────────────────────────────
function ProfileEditForm({ portfolio, user, onSave, onCancel }) {
  const isFreelancer = user?.role === 'freelancer'
  const [form, setForm] = useState({
    bio: portfolio?.bio || '',
    skills: portfolio?.skills || [],
    githubUrl: portfolio?.githubUrl || '',
    linkedinUrl: portfolio?.linkedinUrl || '',
    portfolioUrl: portfolio?.portfolioUrl || '',
    availability: portfolio?.availability || 'full-time',
    companyName: portfolio?.companyName || '',
    industry: portfolio?.industry || '',
    clientType: portfolio?.clientType || '',
    location: portfolio?.location || '',
    yearsHiring: portfolio?.yearsHiring || '',
    preferredComm: portfolio?.preferredComm || '',
    companySize: portfolio?.companySize || '',
    websiteUrl: portfolio?.websiteUrl || '',
  })
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [sampleTitle, setSampleTitle] = useState('')
  const [localPortfolio, setLocalPortfolio] = useState(portfolio)
  const [saving, setSaving] = useState(false)

  const isIndividual = form.clientType === 'individual'
  const isBusiness = form.clientType === 'business'

  const validate = () => {
    const e = {}
    if (!form.bio.trim()) e.bio = 'Bio is required'
    else if (form.bio.trim().length < 20) e.bio = 'Bio must be at least 20 characters'
    else if (form.bio.trim().length > 1000) e.bio = 'Bio cannot exceed 1000 characters'
    if (isFreelancer) {
      if (form.skills.length === 0) e.skills = 'Add at least one skill'
      if (!form.githubUrl) e.githubUrl = 'GitHub URL is required'
      else if (!isValidUrl(form.githubUrl)) e.githubUrl = 'Enter a valid URL'
      if (!form.portfolioUrl) e.portfolioUrl = 'Portfolio URL is required'
      else if (!isValidUrl(form.portfolioUrl)) e.portfolioUrl = 'Enter a valid URL'
    } else {
      if (!form.clientType) e.clientType = 'Please select your client type'
      if (!form.location) e.location = 'Location is required'
      if (!form.yearsHiring) e.yearsHiring = 'Please select your hiring experience'
      if (!form.preferredComm) e.preferredComm = 'Please select your communication style'
      if (isBusiness) {
        if (!form.companyName) e.companyName = 'Company name is required'
        if (!form.industry) e.industry = 'Please select your industry'
        if (!form.companySize) e.companySize = 'Please select your company size'
        if (!form.websiteUrl) e.websiteUrl = 'Company website is required'
        else if (!isValidUrl(form.websiteUrl)) e.websiteUrl = 'Enter a valid URL'
      }
    }
    if (!form.linkedinUrl) e.linkedinUrl = 'LinkedIn URL is required'
    else if (!isValidUrl(form.linkedinUrl)) e.linkedinUrl = 'Enter a valid URL'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const syncCompletion = (patch = {}) => {
    const merged = { ...localPortfolio, ...patch }
    const pct = calcCompletion(user?.role, merged)
    localStorage.setItem('profileCompletion', String(pct))
    window.dispatchEvent(new Event('profileUpdated'))
    return pct
  }

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the errors before saving'); return }
    setSaving(true)
    try {
      const { data } = await api.post('/api/portfolio/update', { ...form, skills: form.skills })
      const merged = { ...data, avatarUrl: localPortfolio?.avatarUrl || data.avatarUrl }
      syncCompletion(merged)
      onSave(merged)
      toast.success('Profile saved!')
    } catch { toast.error('Failed to save profile') }
    finally { setSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, GIF, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setAvatarUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const { data } = await api.post('/api/portfolio/upload-avatar', fd)
      setLocalPortfolio(prev => {
        const updated = { ...prev, avatarUrl: data.avatarUrl }
        const pct = calcCompletion(user?.role, updated)
        localStorage.setItem('profileCompletion', String(pct))
        window.dispatchEvent(new Event('profileUpdated'))
        return updated
      })
      toast.success('Photo uploaded!')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed'
      toast.error(`Upload failed: ${msg}`)
      console.error('Avatar upload error:', err?.response?.data || err?.message)
    }
    finally { setAvatarUploading(false) }
  }

  const handleSampleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', sampleTitle || file.name)
    try {
      const { data } = await api.post('/api/portfolio/upload-sample', fd)
      setLocalPortfolio(prev => {
        const updated = { ...prev, projectSamples: [...(prev?.projectSamples || []), data.sample] }
        const pct = calcCompletion(user?.role, updated)
        localStorage.setItem('profileCompletion', String(pct))
        window.dispatchEvent(new Event('profileUpdated'))
        return updated
      })
      setSampleTitle('')
      toast.success('Portfolio sample uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeUploading(true)
    const fd = new FormData()
    fd.append('resume', file)
    try {
      const { data } = await api.post('/api/portfolio/upload-resume', fd)
      setLocalPortfolio(prev => {
        const updated = { ...prev, resumeUrl: data.resumeUrl }
        const pct = calcCompletion(user?.role, updated)
        localStorage.setItem('profileCompletion', String(pct))
        window.dispatchEvent(new Event('profileUpdated'))
        return updated
      })
      toast.success('Resume uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setResumeUploading(false) }
  }

  const avatarShape = isBusiness ? 'rounded-xl' : 'rounded-full'

  return (
    <div className="space-y-4">
      <div className="dark-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgb(var(--slate-200))' }}>
          <h3 className="text-base font-semibold" style={{ color: 'rgb(var(--slate-900))' }}>
            {isFreelancer ? 'Freelancer Profile' : 'Client Profile'}
          </h3>
          <span className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>Fields marked <span className="text-red-500">*</span> are required</span>
        </div>

        {/* ── Client Type Selector ── */}
        {!isFreelancer && (
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'rgb(var(--slate-600))' }}>
              Who are you? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs mb-3" style={{ color: 'rgb(var(--slate-500))' }}>This helps freelancers understand your context before applying.</p>
            <div className="flex flex-col gap-2">
              {[
                { value: 'individual', icon: SetupIcons.person, title: 'Individual', sub: 'Building something for yourself, a side project, or a personal idea' },
                { value: 'business',   icon: SetupIcons.building, title: 'Business', sub: 'A startup, company, or agency hiring on behalf of an organisation' },
              ].map(opt => {
                const selected = form.clientType === opt.value
                return (
                  <button key={opt.value} type="button"
                    onClick={() => { setForm({ ...form, clientType: opt.value }); setErrors({ ...errors, clientType: '' }) }}
                    className="text-left rounded-xl px-4 py-3 transition-all flex items-center gap-4"
                    style={selected
                      ? { border: '1px solid rgb(var(--orange-200))', background: 'rgb(var(--slate-100))' }
                      : { border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={selected
                        ? { background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: '#fff' }
                        : { background: 'rgb(var(--slate-100))', color: 'rgb(var(--slate-500))' }}>
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: selected ? 'rgb(var(--slate-900))' : 'rgb(var(--slate-600))' }}>{opt.title}</p>
                      <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgb(var(--slate-500))' }}>{opt.sub}</p>
                    </div>
                    {selected && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            {errors.clientType && <p className="text-xs text-red-500 mt-1">{errors.clientType}</p>}
          </div>
        )}

        {/* ── Avatar / Logo Upload ── */}
        {(!isFreelancer && form.clientType) || isFreelancer ? (
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'rgb(var(--slate-600))' }}>
              {isFreelancer ? 'Profile Photo' : isBusiness ? 'Company Logo' : 'Profile Photo'}
              <span className="ml-1.5 text-xs font-normal" style={{ color: 'rgb(var(--slate-500))' }}>
                {isFreelancer ? '' : '+' + (isIndividual ? '15' : '10') + '%'}
              </span>
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              {localPortfolio?.avatarUrl
                ? <img
                    src={localPortfolio.avatarUrl.startsWith('http') ? localPortfolio.avatarUrl : `${FILE_BASE}${localPortfolio.avatarUrl}`}
                    alt="avatar"
                    className={`w-16 h-16 object-cover ${avatarShape}`}
                    style={{ border: '1px solid rgb(var(--slate-200))' }} />
                : <div className={`w-16 h-16 flex items-center justify-center ${avatarShape}`}
                    style={{ background: 'rgb(var(--surface))', border: '2px dashed rgba(255,104,3,0.20)' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--slate-500))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
              }
              <div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                  style={{ border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))', color: 'rgb(var(--slate-600))' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--slate-100))'; e.currentTarget.style.color = 'rgb(var(--slate-900))' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--surface))'; e.currentTarget.style.color = 'rgb(var(--slate-600))' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {avatarUploading ? 'Uploading…' : localPortfolio?.avatarUrl ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                </label>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--slate-500))' }}>JPG, PNG · Max 10 MB</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Business-only fields ── */}
        {!isFreelancer && isBusiness && (
          <>
            <Field label="Company Name" required bonus={10} error={errors.companyName}>
              <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                className={inputClass(errors.companyName)} placeholder="e.g. TechStart Ltd" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry" required bonus={10} error={errors.industry}>
                <select value={form.industry}
                  onChange={e => { setForm({ ...form, industry: e.target.value }); setErrors({ ...errors, industry: '' }) }}
                  className={inputClass(errors.industry)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </Field>
              <Field label="Company Size" required bonus={10} error={errors.companySize}>
                <select value={form.companySize}
                  onChange={e => setForm({ ...form, companySize: e.target.value })}
                  className={inputClass(false)}>
                  <option value="">Select size</option>
                  {COMPANY_SIZE_VALUES.map((val, i) => (
                    <option key={val} value={val}>{COMPANY_SIZES[i]} people</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Company Website" required bonus={5} error={errors.websiteUrl} hint="https://...">
              <input value={form.websiteUrl}
                onChange={e => { setForm({ ...form, websiteUrl: e.target.value }); setErrors({ ...errors, websiteUrl: '' }) }}
                className={inputClass(errors.websiteUrl)} placeholder="https://yourcompany.com" />
            </Field>
          </>
        )}

        {/* ── Bio ── */}
        {(isFreelancer || form.clientType) && (
          <Field label="Bio" required bonus={isFreelancer ? 20 : isIndividual ? 15 : 10} hint={`${form.bio.length}/1000`} error={errors.bio}>
            <textarea value={form.bio}
              onChange={e => { setForm({ ...form, bio: e.target.value }); setErrors({ ...errors, bio: '' }) }}
              rows={4} maxLength={1000} className={inputClass(errors.bio)}
              placeholder={
                isFreelancer
                  ? 'Describe your expertise, projects you work on, and what makes you stand out…'
                  : isIndividual
                  ? 'Describe what you are building, why it matters to you, and what kind of freelancer you are looking for…'
                  : 'Describe what your company does, the types of projects you hire for, and what you look for in a freelancer…'
              }
            />
          </Field>
        )}

        {/* ── Freelancer-specific fields ── */}
        {isFreelancer && (
          <>
            <Field label="Skills" required bonus={20} error={errors.skills}>
              <SkillSelector selected={form.skills}
                onChange={skills => { setForm({ ...form, skills }); setErrors({ ...errors, skills: '' }) }}
                error={errors.skills} />
            </Field>
            <Field label="Availability">
              <select value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}
                className={inputClass(false)}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </Field>
            <Field label="GitHub URL" required bonus={25} error={errors.githubUrl} hint="https://...">
              <input value={form.githubUrl}
                onChange={e => { setForm({ ...form, githubUrl: e.target.value }); setErrors({ ...errors, githubUrl: '' }) }}
                className={inputClass(errors.githubUrl)} placeholder="https://github.com/username" />
            </Field>

            {/* ── Resume Upload ── */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgb(var(--slate-600))' }}>
                Resume / CV
                <span className="ml-1.5 text-xs font-normal" style={{ color: 'rgb(var(--slate-500))' }}>PDF or DOC, max 5MB</span>
              </label>
              {localPortfolio?.resumeUrl ? (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--slate-200))' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--orange-50))' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--slate-900))' }}>Resume uploaded</p>
                    <a
                      href={localPortfolio.resumeUrl.startsWith('http') ? localPortfolio.resumeUrl : `${FILE_BASE}${localPortfolio.resumeUrl}`}
                      target="_blank" rel="noopener noreferrer" download
                      className="text-xs hover:underline underline-offset-2 transition-colors"
                      style={{ color: '#EA580C' }}>View / Download</a>
                  </div>
                  <label className="cursor-pointer flex-shrink-0">
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgb(var(--orange-50))', color: '#EA580C', border: '1px solid rgb(var(--orange-200))' }}>
                      {resumeUploading ? 'Uploading…' : 'Replace'}
                    </span>
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                  <div className="rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-colors"
                    style={{ background: 'rgb(var(--surface))', border: '1px dashed rgba(255,104,3,0.25)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,104,3,0.50)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,104,3,0.25)'}>
                    {resumeUploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    <p className="text-xs font-medium" style={{ color: 'rgb(var(--slate-600))' }}>
                      {resumeUploading ? 'Uploading…' : 'Click to upload your resume'}
                    </p>
                    <p className="text-xs" style={{ color: 'rgb(var(--slate-500))' }}>PDF, DOC, DOCX</p>
                  </div>
                </label>
              )}
            </div>
          </>
        )}

        {/* ── Shared client fields (shown once clientType is chosen) ── */}
        {!isFreelancer && form.clientType && (
          <>
            <Field label="Location" required bonus={isIndividual ? 15 : 10} error={errors.location}>
              <input value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className={inputClass(false)} placeholder="e.g. Mumbai, India" />
            </Field>

            <Field label="Years hiring freelancers" required bonus={isIndividual ? 15 : 10} error={errors.yearsHiring}>
              <div className="flex flex-col gap-2">
                {YEARS_HIRING_OPTIONS.map(opt => {
                  const selected = form.yearsHiring === opt.value
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, yearsHiring: opt.value })}
                      className="text-left rounded-xl px-4 py-3 transition-all flex items-center gap-4"
                      style={selected
                        ? { border: '1px solid rgb(var(--orange-200))', background: 'rgb(var(--slate-100))' }
                        : { border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                        style={selected
                          ? { background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: '#fff' }
                          : { background: 'rgb(var(--slate-100))', color: 'rgb(var(--slate-500))' }}>
                        {SetupIcons.clock}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: selected ? 'rgb(var(--slate-900))' : 'rgb(var(--slate-600))' }}>{opt.label}</p>
                        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgb(var(--slate-500))' }}>{opt.sub}</p>
                      </div>
                      {selected && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Preferred communication style" required bonus={isIndividual ? 10 : 5} error={errors.preferredComm}>
              <div className="flex flex-col gap-2">
                {COMM_OPTIONS.map(opt => {
                  const commIcons = { async: SetupIcons.chat, sync: SetupIcons.phone, flexible: SetupIcons.sparkles }
                  const selected = form.preferredComm === opt.value
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, preferredComm: opt.value })}
                      className="text-left rounded-xl px-4 py-3 transition-all flex items-center gap-4"
                      style={selected
                        ? { border: '1px solid rgb(var(--orange-200))', background: 'rgb(var(--slate-100))' }
                        : { border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                        style={selected
                          ? { background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: '#fff' }
                          : { background: 'rgb(var(--slate-100))', color: 'rgb(var(--slate-500))' }}>
                        {commIcons[opt.value]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: selected ? 'rgb(var(--slate-900))' : 'rgb(var(--slate-600))' }}>{opt.label}</p>
                        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgb(var(--slate-500))' }}>{opt.sub}</p>
                      </div>
                      {selected && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EA580C' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </Field>
          </>
        )}

        <Field label="LinkedIn URL" required bonus={isFreelancer ? 10 : isIndividual ? 10 : 5} error={errors.linkedinUrl} hint="https://...">
          <input value={form.linkedinUrl}
            onChange={e => { setForm({ ...form, linkedinUrl: e.target.value }); setErrors({ ...errors, linkedinUrl: '' }) }}
            className={inputClass(errors.linkedinUrl)} placeholder="https://linkedin.com/in/username" />
        </Field>

        {isFreelancer && (
          <Field label="Portfolio Website" required bonus={5} error={errors.portfolioUrl} hint="https://...">
            <input value={form.portfolioUrl}
              onChange={e => { setForm({ ...form, portfolioUrl: e.target.value }); setErrors({ ...errors, portfolioUrl: '' }) }}
              className={inputClass(errors.portfolioUrl)} placeholder="https://yourportfolio.com" />
          </Field>
        )}
      </div>

      {/* ── Live completion preview ── */}
      {(() => {
        const liveData = { ...localPortfolio, ...form }
        const livePct = calcCompletion(user?.role, liveData)
        const isComplete = livePct >= 100
        return (
          <div className="dark-card px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'rgb(var(--slate-500))' }}>Profile completion</span>
                <span className="text-xs font-semibold" style={{ color: isComplete ? '#10b981' : '#EA580C' }}>{livePct}%</span>
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgb(var(--orange-50))' }}>
                <div className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${livePct}%`, background: isComplete ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#EA580C,#C2410C)' }} />
              </div>
            </div>
            {isComplete && (
              <div className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: '#10b981' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Ready
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Save / Cancel ── always at the very bottom ── */}
      <div className="dark-card p-4 flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="btn-purple flex-1 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
        <button onClick={onCancel}
          className="flex-1 font-medium py-2.5 rounded-lg text-sm transition-colors"
          style={{ border: '1px solid rgb(var(--slate-200))', background: 'rgb(var(--surface))', color: 'rgb(var(--slate-600))' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--slate-100))'; e.currentTarget.style.color = 'rgb(var(--slate-900))' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--surface))'; e.currentTarget.style.color = 'rgb(var(--slate-600))' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────
export default function ProfileSetup() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [portfolio, setPortfolio] = useState(null)
  const [fullUser, setFullUser] = useState(null)
  const [completion, setCompletion] = useState(parseInt(localStorage.getItem('profileCompletion') || '20', 10))
  const [mode, setMode] = useState('loading')

  useEffect(() => {
    api.get('/api/auth/me').then(({ data }) => {
      const p = data.portfolio
      setPortfolio(p)
      setFullUser(data.user)
      const role = data.user?.role || user?.role
      const pct = calcCompletion(role, p)
      setCompletion(pct)
      localStorage.setItem('profileCompletion', String(pct))
      storeBadgeSummary(role, data.user, p)
      window.dispatchEvent(new Event('profileUpdated'))
      setMode(!p?.bio ? 'edit' : 'view')
    }).catch(() => setMode('edit'))
  }, [])

  const handleSaved = (updatedPortfolio) => {
    setPortfolio(updatedPortfolio)
    const pct = calcCompletion(user?.role, updatedPortfolio)
    setCompletion(pct)
    localStorage.setItem('profileCompletion', String(pct))
    window.dispatchEvent(new Event('profileUpdated'))
    setMode('view')
  }

  const handleCancel = () => {
    if (!portfolio?.bio) navigate(user?.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer')
    else setMode('view')
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Loading state */}
      {mode === 'loading' && (
        <div className="max-w-2xl mx-auto p-6">
          <div className="dark-card p-12 text-center">
            <div className="mx-auto mb-3" style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '2px solid rgb(var(--orange-50))',
              borderTop: '2px solid #EA580C',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p className="text-sm" style={{ color: 'rgb(var(--slate-500))' }}>Loading your profile…</p>
          </div>
        </div>
      )}

      {/* View mode */}
      {mode === 'view' && portfolio && (
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">Profile</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My profile</h1>
            <p className="mt-1.5 text-sm text-slate-600">This is how clients and freelancers see you.</p>
          </div>
          <ProfileCard portfolio={portfolio} user={user} fullUser={fullUser} completion={completion}
            onEdit={() => setMode('edit')}
            onCompletionChange={pct => { setCompletion(pct); storeBadgeSummary(user?.role, fullUser, { ...portfolio, paymentVerified: true }); window.dispatchEvent(new Event('profileUpdated')) }} />
        </div>
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">Profile</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Edit profile</h1>
            <p className="mt-1.5 text-sm text-slate-600">A complete profile helps you win work and unlocks job posting and applying.</p>
          </div>
          <ProfileEditForm portfolio={portfolio} user={user} onSave={handleSaved} onCancel={handleCancel} />
        </div>
      )}
    </div>
  )
}
