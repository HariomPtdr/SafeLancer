import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Concept: ordered data-stream with trail ghosts, scan pulse, and transaction bursts.
// Intentionally different from ThreeBackground:
//   • Horizontal directional flow  vs. omnidirectional float
//   • Trails / afterimages         vs. solid meshes
//   • Sparse hex chars (2D overlay) for texture
//   • Occasional shockwave burst    vs. steady slow bob

export default function NavbarCanvas() {
  const wrapRef   = useRef(null)
  const threeRef  = useRef(null)   // Three.js canvas
  const overlayRef = useRef(null)  // Canvas2D for hex chars + scanline

  useEffect(() => {
    const wrap    = wrapRef.current
    const c3      = threeRef.current
    const c2      = overlayRef.current
    if (!wrap || !c3 || !c2) return

    const W = () => wrap.clientWidth  || 1200
    const H = () => wrap.clientHeight || 64

    // ── Three.js renderer ──────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas: c3, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W(), H())
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const cam   = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 50)
    cam.position.set(0, 0, 5)

    const vFOV = (50 * Math.PI) / 180
    const visH = () => 2 * Math.tan(vFOV / 2) * 5
    const visW = () => visH() * (W() / H())

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const glow = new THREE.PointLight(0xFF6803, 5.0, 20)
    glow.position.set(0, 0, 2.5)
    scene.add(glow)

    const td = []

    // ── Particles ──────────────────────────────────────────
    const N = 70
    const pts = Array.from({ length: N }, () => {
      const orange = Math.random() < 0.30
      const r      = orange ? 0.048 + Math.random() * 0.038 : 0.020 + Math.random() * 0.022
      const col    = orange ? 0xFF6803 : (Math.random() < 0.5 ? 0xBFBFBF : 0xFFFFFF)
      const geo    = new THREE.SphereGeometry(r, 6, 6)
      const mat    = new THREE.MeshStandardMaterial({
        color: col, emissive: col,
        emissiveIntensity: orange ? 0.90 : 0.18,
        transparent: true, opacity: 0.40 + Math.random() * 0.55,
      })
      td.push(geo, mat)
      const mesh = new THREE.Mesh(geo, mat)
      const vw = visW(), vh = visH()
      const x  = (Math.random() - 0.5) * vw * 1.15
      const y  = (Math.random() - 0.5) * vh * 0.75
      const z  = (Math.random() - 0.5) * 2.0
      mesh.position.set(x, y, z)
      scene.add(mesh)
      return {
        mesh, mat, orange,
        x, y, z,
        speed:      0.007 + Math.random() * 0.022,
        yPhase:     Math.random() * Math.PI * 2,
        yAmp:       0.015 + Math.random() * 0.040,
        baseOp:     0.40 + Math.random() * 0.55,
        pulsePhase: Math.random() * Math.PI * 2,
        burstTimer: 0,
      }
    })

    // ── Trail ghosts (3 ghost copies per particle, fading out) ─
    const GHOSTS = 3
    const ghosts = pts.map(p => {
      const hist = []
      for (let g = 0; g < GHOSTS; g++) {
        const geo = new THREE.SphereGeometry(p.mesh.geometry.parameters.radius * (1 - g * 0.22), 5, 5)
        const mat = new THREE.MeshBasicMaterial({
          color: p.orange ? 0xFF6803 : 0xBFBFBF,
          transparent: true, opacity: 0,
        })
        td.push(geo, mat)
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.copy(p.mesh.position)
        scene.add(mesh)
        hist.push({ mesh, mat })
      }
      return { hist, positions: Array(GHOSTS).fill(null).map(() => new THREE.Vector3()) }
    })

    // ── Connection lines ───────────────────────────────────
    const MAX_SEGS = 8
    const lineBuf  = new Float32Array(MAX_SEGS * 2 * 3)
    const lineGeo  = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lineBuf, 3))
    const lineMat  = new THREE.LineBasicMaterial({ color: 0xFF6803, transparent: true, opacity: 0 })
    scene.add(new THREE.LineSegments(lineGeo, lineMat))
    td.push(lineGeo, lineMat)

    // ── Burst ring (expands on transaction flash) ──────────
    const burstGeo = new THREE.RingGeometry(0.01, 0.05, 24)
    const burstMat = new THREE.MeshBasicMaterial({ color: 0xFF6803, transparent: true, opacity: 0, side: THREE.DoubleSide })
    const burstMesh = new THREE.Mesh(burstGeo, burstMat)
    scene.add(burstMesh); td.push(burstGeo, burstMat)
    let burstActive = false, burstScale = 1, burstCooldown = 0

    // ── Scan plane (thin bright horizontal strip sweeping) ─
    const scanGeo = new THREE.PlaneGeometry(999, 0.012)
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0xFF6803, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const scanMesh = new THREE.Mesh(scanGeo, scanMat)
    scene.add(scanMesh); td.push(scanGeo, scanMat)
    let scanY = 0

    // ── Canvas2D overlay: hex chars ────────────────────────
    const ctx = c2.getContext('2d')
    const HEX  = '0123456789ABCDEF#$₹✓'
    const chars = Array.from({ length: 22 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 64,
      ch: HEX[Math.floor(Math.random() * HEX.length)],
      op: 0.04 + Math.random() * 0.08,
      spd: 0.12 + Math.random() * 0.22,
      size: 7 + Math.random() * 4,
    }))

    const ro = new ResizeObserver(() => {
      renderer.setSize(W(), H())
      cam.aspect = W() / H()
      cam.updateProjectionMatrix()
      c2.width  = W() * Math.min(devicePixelRatio, 2)
      c2.height = H() * Math.min(devicePixelRatio, 2)
      c2.style.width  = W() + 'px'
      c2.style.height = H() + 'px'
      ctx.scale(Math.min(devicePixelRatio, 2), Math.min(devicePixelRatio, 2))
    })
    ro.observe(wrap)

    // Init 2D canvas size
    c2.width  = W() * Math.min(devicePixelRatio, 2)
    c2.height = H() * Math.min(devicePixelRatio, 2)
    c2.style.width  = W() + 'px'
    c2.style.height = H() + 'px'
    ctx.scale(Math.min(devicePixelRatio, 2), Math.min(devicePixelRatio, 2))

    const orangePts = pts.filter(p => p.orange)
    let t = 0, id

    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.016

      const vw   = visW()
      const vh   = visH()
      const halfW = vw * 0.58

      // ── Update particles + trails ──────────────────────
      pts.forEach((p, i) => {
        // Shift ghost history
        const g = ghosts[i]
        for (let k = GHOSTS - 1; k > 0; k--) {
          g.positions[k].copy(g.positions[k - 1])
        }
        g.positions[0].copy(p.mesh.position)

        // Move
        p.x += p.speed
        if (p.x > halfW) {
          p.x = -halfW
          p.y = (Math.random() - 0.5) * vh * 0.75
          // Reset ghost history to new position
          for (let k = 0; k < GHOSTS; k++) g.positions[k].set(p.x, p.y, p.z)
        }
        const yOff = Math.sin(t * 0.85 + p.yPhase) * p.yAmp
        p.mesh.position.set(p.x, p.y + yOff, p.z)
        p.mat.opacity = p.baseOp * (0.60 + 0.40 * Math.sin(t * 1.4 + p.pulsePhase))

        // Ghost trail
        g.hist.forEach((gh, k) => {
          gh.mesh.position.copy(g.positions[Math.min(k + 1, GHOSTS - 1)])
          gh.mat.opacity = p.orange
            ? p.mat.opacity * (0.35 - k * 0.10)
            : p.mat.opacity * (0.15 - k * 0.04)
        })
      })

      // ── Connection lines ───────────────────────────────
      let seg = 0
      outer: for (let i = 0; i < orangePts.length; i++) {
        for (let j = i + 1; j < orangePts.length; j++) {
          if (seg >= MAX_SEGS) break outer
          const a = orangePts[i].mesh.position
          const b = orangePts[j].mesh.position
          if (a.distanceTo(b) < 1.8) {
            const base = seg * 6
            lineBuf[base]   = a.x; lineBuf[base+1] = a.y; lineBuf[base+2] = a.z
            lineBuf[base+3] = b.x; lineBuf[base+4] = b.y; lineBuf[base+5] = b.z
            seg++
          }
        }
      }
      for (let i = seg; i < MAX_SEGS; i++) lineBuf.fill(0, i * 6, i * 6 + 6)
      lineGeo.attributes.position.needsUpdate = true
      lineMat.opacity = seg > 0 ? 0.22 + 0.14 * Math.sin(t * 2.8) : 0

      // ── Burst flash: random orange particle every ~4s ──
      burstCooldown -= 0.016
      if (burstCooldown <= 0 && !burstActive) {
        burstCooldown = 3.5 + Math.random() * 2.5
        const pick = orangePts[Math.floor(Math.random() * orangePts.length)]
        if (pick) {
          burstMesh.position.copy(pick.mesh.position)
          burstActive = true; burstScale = 0.2
          pick.mat.emissiveIntensity = 3.5
          setTimeout(() => { pick.mat.emissiveIntensity = 0.90 }, 280)
        }
      }
      if (burstActive) {
        burstScale += 0.18
        burstMesh.scale.setScalar(burstScale)
        burstMat.opacity = Math.max(0, 0.9 - burstScale * 0.24)
        if (burstMat.opacity <= 0) burstActive = false
      }

      // ── Scan sweep (bottom → top, repeats every ~5s) ──
      scanY += 0.006
      if (scanY > vh * 0.6) scanY = -vh * 0.6
      scanMesh.position.y = scanY
      scanMat.opacity = 0.3 * Math.pow(Math.sin((scanY / (vh * 1.2) + 0.5) * Math.PI), 2)

      // ── Glow travels ──────────────────────────────────
      glow.intensity  = 5.0 + Math.sin(t * 1.9) * 1.6
      glow.position.x = Math.sin(t * 0.30) * (vw * 0.22)

      renderer.render(scene, cam)

      // ── Canvas2D: sparse hex chars ─────────────────────
      ctx.clearRect(0, 0, W(), H())
      chars.forEach(c => {
        c.y += c.spd
        if (c.y > H() + 10) { c.y = -10; c.x = Math.random() * W(); c.ch = HEX[Math.floor(Math.random() * HEX.length)] }
        ctx.save()
        ctx.globalAlpha = c.op * (0.6 + 0.4 * Math.sin(t * 0.7 + c.x))
        ctx.fillStyle   = '#FF6803'
        ctx.font        = `600 ${c.size}px "Courier New", monospace`
        ctx.fillText(c.ch, c.x, c.y)
        ctx.restore()
      })
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
      td.forEach(o => o.dispose?.())
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Three.js layer */}
      <canvas ref={threeRef}   style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* Canvas2D hex-char overlay */}
      <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }} />
    </div>
  )
}
