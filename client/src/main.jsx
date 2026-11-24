import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyTheme, getTheme } from './utils/theme'

// Follow OS theme changes unless the user picked one explicitly.
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  try { if (!localStorage.getItem('theme')) applyTheme(getTheme()) } catch {}
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
