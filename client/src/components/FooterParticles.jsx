import { useEffect, useRef } from 'react'

// Canvas2D footer particles — blue/cyan palette, attracted to mouse
export default function FooterParticles() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(devicePixelRatio, 2)

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    let W = canvas.offsetWidth, H = canvas.offsetHeight

    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.scale(dpr, dpr)
    })
    ro.observe(canvas)

    // Particle colors: blue / purple / cyan spectrum
    const COLORS = ['rgba(255,104,3,', 'rgba(174,58,2,', 'rgba(191,191,191,', 'rgba(191,191,191,']

    const N = 130
    const pts = Array.from({ length: N }, () => {
      const x = Math.random() * W
      const y = Math.random() * H
      return {
        x, y, ox: x, oy: y,
        vx: 0, vy: 0,
        r:    1.0 + Math.random() * 1.8,
        col:  COLORS[Math.floor(Math.random() * COLORS.length)],
        base: 0.12 + Math.random() * 0.32,
        phase: Math.random() * Math.PI * 2,
      }
    })

    let mx = -999, my = -999
    const onMove = e => {
      const rect = canvas.getBoundingClientRect()
      mx = e.clientX - rect.left
      my = e.clientY - rect.top
    }
    window.addEventListener('mousemove', onMove)

    const ATTRACT = 180
    const CONN    = 95

    let t = 0, id
    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.012
      ctx.clearRect(0, 0, W, H)

      pts.forEach(p => {
        const dx = p.x - mx, dy = p.y - my
        const d  = Math.sqrt(dx * dx + dy * dy)

        // Attract toward cursor
        if (d < ATTRACT && d > 0.5) {
          const f = (1 - d / ATTRACT) * 0.28
          p.vx -= (dx / d) * f
          p.vy -= (dy / d) * f
        }

        // Spring return home
        p.vx += (p.ox - p.x) * 0.009
        p.vy += (p.oy - p.y) * 0.009

        // Organic drift
        p.vx += Math.sin(t * 0.75 + p.phase) * 0.006
        p.vy += Math.cos(t * 0.55 + p.phase * 1.3) * 0.006

        p.vx *= 0.91; p.vy *= 0.91
        p.x  += p.vx;  p.y += p.vy
      })

      // Connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = pts[i], b = pts[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < CONN) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(255,104,3,${(1 - d / CONN) * 0.13})`
            ctx.lineWidth   = 0.5
            ctx.stroke()
          }
        }
      }

      // Particles
      pts.forEach(p => {
        const dx = p.x - mx, dy = p.y - my
        const d  = Math.sqrt(dx * dx + dy * dy)
        const prox  = d < ATTRACT ? (1 - d / ATTRACT) : 0
        const pulse = 0.5 + 0.3 * Math.sin(t * 0.85 + p.phase)
        const alpha = Math.min(1, p.base * pulse + prox * 0.55)

        // Glow for near-cursor particles
        if (prox > 0.15) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8 + prox * 10)
          g.addColorStop(0, `${p.col}${(prox * 0.3).toFixed(2)})`)
          g.addColorStop(1, `${p.col}0)`)
          ctx.beginPath()
          ctx.arc(p.x, p.y, 8 + prox * 10, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (1 + prox * 0.9), 0, Math.PI * 2)
        ctx.fillStyle = `${p.col}${alpha.toFixed(2)})`
        ctx.fill()
      })
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
