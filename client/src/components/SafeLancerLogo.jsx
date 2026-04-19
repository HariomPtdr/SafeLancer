export function LogoMark({ size = 28, color = '#FF6803', keyholeColor = '#0B0501' }) {
  const h = Math.round(size * 1.125)
  return (
    <svg width={size} height={h} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 17 L9 10.5 Q9 3 16 3 Q23 3 23 10.5 L23 17"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="2.5" y="16" width="27" height="17.5" rx="3.5" fill={color} />
      <path d="M16 21.5 L19.5 26.5 L16 31.5 L12.5 26.5 Z" fill={keyholeColor} />
    </svg>
  )
}

export default function SafeLancerLogo({ size = 28, showText = true, textStyle = {}, keyholeColor = '#0B0501' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.32) }}>
      <LogoMark size={size} keyholeColor={keyholeColor} />
      {showText && (
        <span style={{
          fontWeight: 700,
          fontSize: Math.round(size * 0.57),
          color: '#F5EDE4',
          letterSpacing: '-0.025em',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          lineHeight: 1,
          ...textStyle
        }}>
          SafeLancer
        </span>
      )}
    </div>
  )
}
