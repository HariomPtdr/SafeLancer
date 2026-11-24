import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../SafeLancerLogo'
import ThemeToggle from '../ThemeToggle'
import Icon from './Icon'

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2 no-underline">
      <LogoMark size={22} color="#EA580C" keyholeColor="#ffffff" />
      <span className="text-[19px] font-bold tracking-tight text-slate-900">SafeLancer</span>
    </Link>
  )
}

const NAV = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 bg-surface/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-[0_1px_0_rgb(var(--slate-200))]' : ''}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Brand />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map(n => (
              <a key={n.label} href={n.href} className="text-sm font-medium text-slate-600 no-underline transition-colors hover:text-slate-900">
                {n.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100">
            Log in
          </Link>
          <Link to="/register" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-orange-700">
            Sign up
          </Link>
        </div>
        <div className="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <button
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <Icon name={open ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-surface px-4 pb-5 pt-2 md:hidden">
          {NAV.map(n => (
            <a key={n.label} href={n.href} onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-3 text-[15px] font-medium text-slate-700 no-underline hover:bg-slate-50">
              {n.label}
            </a>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/login" className="rounded-lg border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-800 no-underline">Log in</Link>
            <Link to="/register" className="rounded-lg bg-orange-600 py-2.5 text-center text-sm font-semibold text-white no-underline">Sign up</Link>
          </div>
        </div>
      )}
    </header>
  )
}

const FOOTER = [
  { h: 'For clients', links: [['Post a job', '/register?role=client'], ['How escrow works', '/#how-it-works'], ['Pricing', '/#pricing']] },
  { h: 'For freelancers', links: [['Find work', '/register?role=freelancer'], ['Get paid safely', '/#features'], ['Pricing', '/#pricing']] },
  { h: 'Company', links: [['About', '/about'], ['Blog', '/blog'], ['Contact', '/contact']] },
  { h: 'Trust & legal', links: [['Security', '/security'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-page">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
              Escrow-protected freelancing. Funds are locked before work starts and released only when you approve.
            </p>
          </div>
          {FOOTER.map(col => (
            <div key={col.h}>
              <h3 className="text-sm font-semibold text-slate-900">{col.h}</h3>
              <ul className="mt-4 space-y-3 p-0">
                {col.links.map(([label, href]) => (
                  <li key={label} className="list-none">
                    <a href={href} className="text-sm text-slate-600 no-underline hover:text-orange-700">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} SafeLancer. A hackathon project.</span>
          <span>Payments processed by Razorpay</span>
        </div>
      </div>
    </footer>
  )
}
