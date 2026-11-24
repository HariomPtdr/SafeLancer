import { useEffect, useState } from 'react'
import { getTheme, setTheme } from '../utils/theme'

export default function ThemeToggle({ className = '', withLabel = false }) {
  const [theme, setT] = useState(getTheme)

  useEffect(() => {
    const onChange = (e) => setT(e.detail)
    window.addEventListener('themechange', onChange)
    return () => window.removeEventListener('themechange', onChange)
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} mode`

  return (
    <button type="button" onClick={() => setTheme(next)} aria-label={label} title={label}
      className={`inline-flex items-center gap-2 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${className}`}>
      {theme === 'dark' ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.36.39l-1.59 1.59M21 12h-2.25m-.39 6.36l-1.59-1.59M12 18.75V21m-4.77-4.23l-1.59 1.59M5.25 12H3m4.23-4.77L5.64 5.64M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 15A9.72 9.72 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.27-2.6.75-3.75A9.75 9.75 0 003 11.25 9.75 9.75 0 0012.75 21a9.75 9.75 0 009-6z" />
        </svg>
      )}
      {withLabel && <span className="text-sm font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
