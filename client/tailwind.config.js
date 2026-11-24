// Colors that change between light and dark mode read from CSS variables
// defined in src/theme-tokens.css. 500/600 shades stay fixed so buttons keep
// their brand color in both themes.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
const scale = (n, keys) => Object.fromEntries(keys.map(k => [k, v(`${n}-${k}`)]))
const TINT = [50, 100, 200, 700, 800]

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        orange: { ...scale('orange', TINT), accent: '#FF9500' },
        emerald: scale('emerald', TINT),
        green: scale('green', TINT),
        red: scale('red', TINT),
        blue: scale('blue', TINT),
        amber: scale('amber', TINT),
        violet: scale('violet', TINT),
        surface: v('surface'),
        page: v('page'),
        ink: v('ink'),
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeInUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
