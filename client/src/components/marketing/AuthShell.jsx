import { Brand } from './SiteChrome'
import ThemeToggle from '../ThemeToggle'
import Icon from './Icon'

const POINTS = [
  ['lock', 'Payment is locked in escrow before work begins'],
  ['fingerprint', 'Every deliverable gets a tamper-proof SHA-256 record'],
  ['clock', 'Freelancers are auto-paid 72h after delivery if the client is silent'],
]

export default function AuthShell({ children, exiting }) {
  return (
    <div className="light-ui grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <div className={`flex flex-1 items-center justify-center py-10 ${exiting ? 'auth-card-exit' : 'auth-card-enter'}`}>
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <aside className="hidden bg-ink lg:flex dark:border-l dark:border-white/10 lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        <p className="text-sm font-semibold text-orange-400">Escrow-protected freelancing</p>
        <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
          Do great work. Get paid every time.
        </h2>
        <ul className="mt-10 space-y-6 p-0">
          {POINTS.map(([icon, text]) => (
            <li key={text} className="flex list-none items-start gap-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/10 text-orange-300"><Icon name={icon} /></span>
              <span className="pt-2 text-[15px] leading-6 text-white/75">{text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12 max-w-md rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-white">Free to join</p>
          <p className="mt-2 text-sm leading-6 text-white/60">No subscriptions. Just a 2% fee on each side when a milestone is paid.</p>
        </div>
      </aside>
    </div>
  )
}

export function GoogleButton({ href, children }) {
  return (
    <a href={href}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-surface py-2.5 text-sm font-semibold text-slate-800 no-underline transition-colors hover:bg-slate-50">
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {children}
    </a>
  )
}

export function Divider({ children = 'or' }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium text-slate-500">{children}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}
