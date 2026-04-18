import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeDashboardHero({ userName, role, actionLabel, onAction }) {
  const wrapRef   = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap   = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const W = () => wrap.clientWidth  || 800
    const H = () => wrap.clientHeight || 260

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W(), H())
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0B0501, 0.035)

    const cam = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 60)
    cam.position.set(0, 0, 4.8)

    // ── Lights ────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a0800, 3.5))

    const addPt = (color, intensity, x, y, z, dist = 16) => {
      const l = new THREE.PointLight(color, intensity, dist)
      l.position.set(x, y, z); scene.add(l); return l
    }
    const ptA = addPt(0xFF6803, 5.5,  3,  2, 5)
    const ptB = addPt(0xFF6803, 3.5, -3,  1, 4)
    const ptC = addPt(0xAE3A02, 2.8,  0, -2, 5)
    const dir = new THREE.DirectionalLight(0xFF6803, 2.2)
    dir.position.set(4, 6, 5); scene.add(dir)

    // ── Material helpers ──────────────────────────────────
    const td = []
    const solid = (col, emit = col, ei = 0.65, op = 0.92) => {
      const m = new THREE.MeshStandardMaterial({ color: col, emissive: emit, emissiveIntensity: ei, roughness: 0.08, metalness: 0.92, transparent: true, opacity: op })
      td.push(m); return m
    }
    const wire = (col, op = 0.85) => {
      const m = new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: op })
      td.push(m); return m
    }
    const g = geo => { td.push(geo); return geo }

    // ── Centerpiece: Shield (nested icosahedrons) ─────────
    const coreGeo = g(new THREE.IcosahedronGeometry(0.90, 1))
    const core = new THREE.Mesh(coreGeo, solid(0x3a1400, 0xFF6803, 0.85, 0.96))
    core.position.set(3.1, 0, 0)
    scene.add(core)

    const shellGeo = g(new THREE.IcosahedronGeometry(1.28, 1))
    const shell = new THREE.Mesh(shellGeo, wire(0xFF6803, 0.45))
    shell.position.copy(core.position)
    scene.add(shell)

    // Orbit rings
    const orb1 = new THREE.Mesh(g(new THREE.TorusGeometry(1.6, 0.016, 8, 80)), wire(0xFF6803, 0.55))
    orb1.position.copy(core.position); orb1.rotation.x = 1.1; orb1.rotation.z = 0.3
    scene.add(orb1)
    const orb2 = new THREE.Mesh(g(new THREE.TorusGeometry(1.85, 0.010, 8, 80)), wire(0xAE3A02, 0.35))
    orb2.position.copy(core.position); orb2.rotation.x = 0.5; orb2.rotation.y = 1.0
    scene.add(orb2)

    // Orbiting data nodes
    const orbiters = Array.from({ length: 4 }, (_, i) => {
      const m = new THREE.Mesh(g(new THREE.SphereGeometry(0.08, 10, 10)), solid(0xFF6803, 0xFF6803, 1.0))
      scene.add(m)
      return { mesh: m, angle: (i / 4) * Math.PI * 2, speed: 0.020 + i * 0.007 }
    })

    // ── Data blocks (replacing coins) ─────────────────────
    const blockCols = [0x3a1400, 0xFF6803, 0xFF6803, 0xFF6803, 0xAE3A02]
    const blocks = Array.from({ length: 6 }, (_, i) => {
      const mesh = new THREE.Mesh(
        g(new THREE.BoxGeometry(0.38, 0.38, 0.38)),
        solid(blockCols[i % 5], blockCols[i % 5], 0.6, 0.90)
      )
      mesh.position.set(-4.0 + i * 1.35 + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      scene.add(mesh)
      return { mesh, ry: 0.010 + Math.random() * 0.012, rx: 0.006 + Math.random() * 0.006, amp: 0.12 + Math.random() * 0.18, speed: 0.5 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2, baseY: mesh.position.y }
    })

    // ── Accent shapes ─────────────────────────────────────
    const AGEO = [() => new THREE.OctahedronGeometry(1), () => new THREE.IcosahedronGeometry(1, 0), () => new THREE.TetrahedronGeometry(1.1), () => new THREE.OctahedronGeometry(1, 1)]
    const AMAT = [solid(0x3a1400, 0x3a1400, 0.65, 0.82), wire(0xFF6803, 0.75), solid(0xAE3A02, 0xAE3A02, 0.6, 0.78), wire(0xAE3A02, 0.68)]
    const accents = Array.from({ length: 10 }, (_, i) => {
      const geo2 = g(AGEO[i % 4]())
      const mesh = new THREE.Mesh(geo2, AMAT[i % 4])
      mesh.scale.setScalar(0.18 + Math.random() * 0.45)
      mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2 - 0.5)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      scene.add(mesh)
      return { mesh, rx: (Math.random() - 0.5) * 0.02, ry: (Math.random() - 0.5) * 0.02, amp: 0.08 + Math.random() * 0.18, speed: 0.4 + Math.random() * 0.8, phase: Math.random() * Math.PI * 2, baseY: mesh.position.y }
    })

    // ── Network edges (background connections) ─────────────
    const nodePts = Array.from({ length: 8 }, () => new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2))
    const ePts = []
    for (let i = 0; i < nodePts.length; i++)
      for (let j = i + 1; j < nodePts.length; j++)
        if (nodePts[i].distanceTo(nodePts[j]) < 4.5) {
          ePts.push(nodePts[i].x, nodePts[i].y, nodePts[i].z)
          ePts.push(nodePts[j].x, nodePts[j].y, nodePts[j].z)
        }
    if (ePts.length) {
      const eg = new THREE.BufferGeometry()
      eg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ePts), 3))
      const em = new THREE.LineBasicMaterial({ color: 0xFF6803, transparent: true, opacity: 0.20 })
      td.push(eg, em)
      scene.add(new THREE.LineSegments(eg, em))
    }

    // ── Particles ─────────────────────────────────────────
    const mkPts = (n, spread, sz, op, col) => {
      const a = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) { a[i*3] = (Math.random()-.5)*spread; a[i*3+1] = (Math.random()-.5)*spread*.35; a[i*3+2] = (Math.random()-.5)*spread*.4 }
      const geo2 = new THREE.BufferGeometry()
      geo2.setAttribute('position', new THREE.BufferAttribute(a, 3))
      const mat2 = new THREE.PointsMaterial({ color: col, size: sz, transparent: true, opacity: op })
      td.push(geo2, mat2)
      const pts = new THREE.Points(geo2, mat2)
      scene.add(pts); return pts
    }
    const pA = mkPts(100, 14, 0.08, 0.85, 0xFF6803)
    const pB = mkPts(220, 20, 0.05, 0.55, 0xFF6803)

    // ── Resize ────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      renderer.setSize(W(), H())
      cam.aspect = W() / H()
      cam.updateProjectionMatrix()
    })
    ro.observe(wrap)

    // ── Mouse ─────────────────────────────────────────────
    let mx = 0, my = 0
    const onMouse = e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2 }
    addEventListener('mousemove', onMouse)

    // ── Loop ──────────────────────────────────────────────
    let t = 0, id
    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.009

      core.rotation.x  += 0.009; core.rotation.y  += 0.013; core.rotation.z  += 0.004
      shell.rotation.x -= 0.005; shell.rotation.y += 0.010
      orb1.rotation.z  += 0.016; orb2.rotation.y  += 0.010

      orbiters.forEach(o => {
        o.angle += o.speed
        o.mesh.position.set(core.position.x + Math.cos(o.angle) * 1.6, core.position.y + Math.sin(o.angle * 0.7) * 0.5, core.position.z + Math.sin(o.angle) * 0.65)
      })

      blocks.forEach(b => { b.mesh.rotation.y += b.ry; b.mesh.rotation.x += b.rx; b.mesh.position.y = b.baseY + Math.sin(t * b.speed + b.phase) * b.amp })
      accents.forEach(a => { a.mesh.rotation.x += a.rx; a.mesh.rotation.y += a.ry; a.mesh.position.y = a.baseY + Math.sin(t * a.speed + a.phase) * a.amp })

      ptA.intensity = 5.5 + Math.sin(t * 1.4) * 1.5
      ptB.intensity = 3.5 + Math.sin(t * 0.9 + 1) * 1.0
      ptC.intensity = 2.8 + Math.sin(t * 1.8 + 2) * 0.8

      pA.rotation.y -= 0.0007; pB.rotation.y += 0.0005

      cam.position.x += (mx * 0.4  - cam.position.x) * 0.05
      cam.position.y += (-my * 0.25 - cam.position.y) * 0.05
      cam.lookAt(1.2, 0, 0)

      renderer.render(scene, cam)
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
      removeEventListener('mousemove', onMouse)
      td.forEach(o => o.dispose?.())
      renderer.dispose()
    }
  }, [])

  const isClient = role === 'client'

  return (
    <div ref={wrapRef} style={{
      position: 'relative', height: '260px', borderRadius: '22px', overflow: 'hidden',
      marginBottom: '24px', background: '#0B0501',
      border: '1px solid rgba(255,104,3,0.20)',
      boxShadow: '0 0 40px rgba(255,104,3,0.10), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Left readability gradient */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg,rgba(11,5,1,0.82) 0%,rgba(11,5,1,0.38) 44%,transparent 72%)' }} />
      {/* Bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55px', pointerEvents: 'none', background: 'linear-gradient(to top,rgba(11,5,1,0.5),transparent)' }} />

      {/* Overlay content */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#FF6803,#AE3A02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 0 12px rgba(255,104,3,0.5)' }}>
              {isClient ? '💼' : '⚡'}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6803', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isClient ? 'Client Portal' : 'Freelancer Portal'}
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '5px', lineHeight: 1.15, textShadow: '0 0 30px rgba(255,104,3,0.4)' }}>
            Welcome back,{' '}<span style={{ color: '#FF6803' }}>{userName}</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#6b5445' }}>
            {isClient ? 'Manage your contracts, jobs, and team' : 'Track your work, earnings, and applications'}
          </p>
        </div>

        {actionLabel && (
          <button onClick={onAction} style={{ background: 'linear-gradient(135deg,#FF6803,#AE3A02)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 20px rgba(255,104,3,0.4)', transition: 'transform 0.15s,box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,104,3,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,104,3,0.4)' }}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
