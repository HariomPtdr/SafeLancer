// Light/dark theme. The saved choice wins; otherwise follow the OS setting.
// index.html applies the class before first paint to avoid a flash.
const KEY = 'theme'

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff')
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }))
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme) } catch {}
  applyTheme(theme)
}
