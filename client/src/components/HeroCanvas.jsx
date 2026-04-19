import { useEffect, useRef } from 'react'

// Canvas2D neural-mesh — mouse repels particles, periodic pulse wave
export default function HeroCanvas() {
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

    // Nodes
    const N = 90
    const nodes = Array.from({ length: N }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r:  1.4 + Math.random() * 2.0,
      phase: Math.random() * Math.PI * 2,
    }))

    let mx = -999, my = -999
    let pulseX = 0, pulseY = 0, pulseR = 0, pulseAlive = false

    const onMove = e => {
      const rect = canvas.getBoundingClientRect()
      mx = e.clientX - rect.left
      my = e.clientY - rect.top
    }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', () => { mx = -999; my = -999 })

    // Periodic pulse from random node
    const triggerPulse = () => {
      const n = nodes[Math.floor(Math.random() * N)]
      pulseX = n.x; pulseY = n.y; pulseR = 0; pulseAlive = true
    }
    const pInt = setInterval(triggerPulse, 3200)

    const CONN  = 135   // max connection distance
    const REPEL = 170   // mouse repel radius

    let t = 0, id

    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.008
      ctx.clearRect(0, 0, W, H)

      // ── Update nodes ───────────────────────────────────────
      nodes.forEach(n => {
        const dx = n.x - mx, dy = n.y - my
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < REPEL && d > 0.5) {
          const f = (1 - d / REPEL) * 0.55
          n.vx += (dx / d) * f
          n.vy += (dy / d) * f
        }
        n.vx *= 0.965; n.vy *= 0.965
        n.x  += n.vx;  n.y  += n.vy
        if (n.x < 0) { n.x = 0; n.vx *= -1 }
        if (n.x > W) { n.x = W; n.vx *= -1 }
        if (n.y < 0) { n.y = 0; n.vy *= -1 }
        if (n.y > H) { n.y = H; n.vy *= -1 }
      })

      // ── Connections ────────────────────────────────────────
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d >= CONN) continue

          // Proximity to mouse boosts line visibility
          const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2
          const md   = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2)
          const boost = md < 220 ? (1 - md / 220) * 1.6 : 0
          const alpha = Math.min(0.72, (1 - d / CONN) * 0.15 + boost * 0.30)

          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(255,104,3,${alpha})`
          ctx.lineWidth   = 0.55 + boost * 0.9
          ctx.stroke()
        }
      }

      // ── Nodes ──────────────────────────────────────────────
      nodes.forEach(n => {
        const dx = n.x - mx, dy = n.y - my
        const d  = Math.sqrt(dx * dx + dy * dy)
        const prox = d < 220 ? (1 - d / 220) : 0
        const base = 0.35 + 0.25 * Math.sin(t * 1.1 + n.phase)
        const a    = Math.min(1, base + prox * 0.55)

        // Glow halo near mouse
        if (prox > 0.05) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 10 + prox * 12)
          g.addColorStop(0, `rgba(255,104,3,${prox * 0.35})`)
          g.addColorStop(1, 'rgba(255,104,3,0)')
          ctx.beginPath()
          ctx.arc(n.x, n.y, 10 + prox * 12, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * (1 + prox * 0.9), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,104,3,${a})`
        ctx.fill()
      })

      // ── Pulse ring ─────────────────────────────────────────
      if (pulseAlive) {
        pulseR += 3.8
        const pa = Math.max(0, 0.55 - pulseR / 280)
        if (pa <= 0) { pulseAlive = false }
        else {
          ctx.beginPath()
          ctx.arc(pulseX, pulseY, pulseR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,104,3,${pa})`
          ctx.lineWidth   = 1.4
          ctx.stroke()
        }
      }

      // ── Cursor glow ────────────────────────────────────────
      if (mx > 0 && my > 0 && mx < W && my < H) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 200)
        g.addColorStop(0, 'rgba(255,104,3,0.07)')
        g.addColorStop(1, 'rgba(255,104,3,0)')
        ctx.beginPath()
        ctx.arc(mx, my, 200, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      clearInterval(pInt)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
    />
  )
}
