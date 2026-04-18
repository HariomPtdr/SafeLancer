import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const C = {
  bg:    0x060300,
  org:   0xFF6803,
  rust:  0xAE3A02,
  amber: 0xD4830A,
  gray:  0xBFBFBF,
}

export default function ThreeBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(C.bg)
    scene.fog = new THREE.FogExp2(C.bg, 0.010)

    const cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100)
    cam.position.z = 6

    const td = []
    const G = g => { td.push(g); return g }
    const M = m => { td.push(m); return m }

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a0800, 1.8))
    const pt1 = new THREE.PointLight(C.org,  5.0, 30); pt1.position.set( 4,  2,  5); scene.add(pt1)
    const pt2 = new THREE.PointLight(C.rust, 3.5, 24); pt2.position.set(-5, -1,  4); scene.add(pt2)
    const pt3 = new THREE.PointLight(C.amber,2.5, 22); pt3.position.set( 0,  5,  6); scene.add(pt3)

    const mouseLight = new THREE.PointLight(C.org, 0, 12)
    mouseLight.position.set(0, 0, 3)
    scene.add(mouseLight)

    // ── Background glow blobs (additive, very subtle) ─────────
    const blobConfigs = [
      { r: 6.0, x: -5,  y: -2.0, z: -8, col: C.org,   op: 0.042 },
      { r: 4.5, x:  5,  y:  3.0, z: -7, col: C.rust,  op: 0.032 },
      { r: 4.0, x: -1,  y:  3.5, z: -6, col: C.amber, op: 0.026 },
      { r: 3.0, x:  6,  y: -3.5, z: -5, col: C.org,   op: 0.022 },
    ]
    const blobs = blobConfigs.map(b => {
      const geo = G(new THREE.SphereGeometry(b.r, 12, 12))
      const mat = M(new THREE.MeshBasicMaterial({
        color: b.col, transparent: true, opacity: b.op,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
      }))
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(b.x, b.y, b.z)
      scene.add(mesh)
      return { mesh, mat, baseOp: b.op }
    })

    // ── Helpers ───────────────────────────────────────────────
    const bmat = (col, op) => M(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op }))
    const wire  = (col, op) => M(new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: op }))

    const floaters = []
    const push = (mesh, baseY, speed, phase, amp, rx = 0, ry = 0) =>
      floaters.push({ mesh, baseY, speed, phase, amp, rx, ry })
    const place = (geo, mat, x, y, z, rx = 0, ry = 0) => {
      const m = new THREE.Mesh(G(geo), mat)
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m)
      push(m, y, 0.28 + Math.random() * 0.42, Math.random() * Math.PI * 2, 0.16 + Math.random() * 0.28, (Math.random()-.5)*0.009, (Math.random()-.5)*0.009)
      return m
    }

    // ── LARGE SOLID SPHERES (bottom-right + top-far-right) ────
    // These are the prominent golden spheres visible in the design
    const sphere1 = new THREE.Mesh(G(new THREE.SphereGeometry(1.85, 24, 24)), bmat(C.amber, 0.68))
    sphere1.position.set(8.5, -4.5, -0.5)
    scene.add(sphere1)
    push(sphere1, -4.5, 0.22, 0.0, 0.18)

    const sphere2 = new THREE.Mesh(G(new THREE.SphereGeometry(1.3, 20, 20)), bmat(0xC07820, 0.60))
    sphere2.position.set(10.0, 2.8, -1.5)
    scene.add(sphere2)
    push(sphere2, 2.8, 0.18, 1.2, 0.14)

    // ── LARGE ORANGE RING (top-right) ─────────────────────────
    const bigRing = new THREE.Mesh(G(new THREE.TorusGeometry(1.55, 0.14, 12, 50)), bmat(C.org, 0.68))
    bigRing.position.set(8.2, 2.2, -0.3)
    bigRing.rotation.x = 0.25; bigRing.rotation.y = 0.15
    scene.add(bigRing)
    push(bigRing, 2.2, 0.20, 0.5, 0.20, 0.003, 0.004)

    // ── WIREFRAME ICOSAHEDRON (bottom-left) ───────────────────
    const icoWire = new THREE.Mesh(G(new THREE.IcosahedronGeometry(1.35, 1)), wire(C.org, 0.55))
    icoWire.position.set(-6.5, -3.8, 0.5)
    scene.add(icoWire)
    push(icoWire, -3.8, 0.24, 0.8, 0.22, 0.005, 0.007)

    // Secondary smaller wireframe icosahedra
    place(new THREE.IcosahedronGeometry(0.50, 1), wire(C.org,  0.48),  6.2,  1.5, -1.0)
    place(new THREE.IcosahedronGeometry(0.35, 0), wire(C.rust, 0.38), -5.5, -1.5, -1.5)

    // ── FLAT DOCUMENT CARD (left, tilted) ─────────────────────
    ;[[-5.2, 0.8, -0.5, -0.35, 0.28], [-2.8, -2.0, -2.0, 0.20, -0.38], [5.5, 0.6, -1.2, 0.15, -0.22]].forEach(([x, y, z, rx, ry], idx) => {
      const grp = new THREE.Group()
      grp.add(new THREE.Mesh(G(new THREE.BoxGeometry(1.55, 1.05, 0.055)), bmat(0x3a3530, 0.82)))
      ;[[0.28, C.org, 0.72], [0.06, C.rust, 0.65], [-0.16, C.org, 0.58]].forEach(([ly, col, op]) => {
        const ln = new THREE.Mesh(G(new THREE.BoxGeometry(1.08, 0.052, 0.030)), bmat(col, op))
        ln.position.set(0, ly, 0.045); grp.add(ln)
      })
      grp.position.set(x, y, z); grp.rotation.set(rx, ry, 0); scene.add(grp)
      push(grp, y, 0.25 + idx * 0.07, idx * 1.3, 0.20, 0.003, 0.005)
    })

    // ── FLOATING DIAMOND / OCTAHEDRON SHAPES ──────────────────
    const diamondCols = [C.org, C.amber, C.rust, C.org, C.amber, C.rust, C.org, C.amber]
    const diamondPos  = [
      [-4.5, 3.2, -1.0], [3.8, -3.5, -0.5], [-7.0, 1.5, -1.5], [6.0, -1.8, -1.0],
      [-2.5, 3.8, -2.0], [4.5, 2.8, -1.5],  [-6.0, -1.2, -0.5],[2.0, -4.5, -1.0],
    ]
    diamondPos.forEach(([x, y, z], i) => {
      const sz = 0.22 + (i % 3) * 0.12
      const geo2 = i % 2 === 0
        ? new THREE.OctahedronGeometry(sz, 0)
        : new THREE.BoxGeometry(sz, sz, sz)
      place(G(geo2), bmat(diamondCols[i], 0.60 + (i % 3) * 0.04), x, y, z,
        Math.random() * Math.PI, Math.random() * Math.PI)
    })

    // ── COINS / DISCS ─────────────────────────────────────────
    ;[[-4.5, 2.8, 0.5], [4.2, -1.8, 0.8], [5.8, 3.2, -0.5], [-2.2, -3.0, -1.0]].forEach(([x, y, z], i) => {
      const grp = new THREE.Group()
      grp.add(new THREE.Mesh(G(new THREE.CylinderGeometry(0.42, 0.42, 0.080, 32)), bmat(C.amber, 0.68)))
      const rim = new THREE.Mesh(G(new THREE.TorusGeometry(0.42, 0.038, 8, 32)), bmat(C.rust, 0.60))
      rim.rotation.x = Math.PI / 2; grp.add(rim)
      grp.position.set(x, y, z)
      grp.rotation.set(Math.PI / 2 + (Math.random()-.5)*0.8, Math.random()*Math.PI, 0)
      scene.add(grp)
      push(grp, y, 0.32 + i * 0.08, i * 1.4, 0.22, 0.007, 0.013)
    })

    // ── MILESTONE RINGS ───────────────────────────────────────
    place(new THREE.TorusGeometry(0.55, 0.060, 8, 36), bmat(C.rust, 0.55),   6.5, -2.5, -0.5, Math.PI/4, Math.PI/6)
    place(new THREE.TorusGeometry(0.42, 0.048, 8, 32), wire(C.org,  0.45),  -4.0,  4.0, -1.5, 0.5, 0.3)
    place(new THREE.TorusGeometry(0.38, 0.042, 8, 28), bmat(C.org,  0.52),   5.0,  4.2, -2.0, 0.8, -0.5)

    // ── HALF-SPHERE DOME (bottom-center) ──────────────────────
    const domeGeo = G(new THREE.SphereGeometry(0.72, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2))
    const dome    = new THREE.Mesh(domeGeo, bmat(C.amber, 0.60))
    dome.position.set(1.5, -4.8, 0.5); dome.rotation.x = Math.PI
    scene.add(dome)
    push(dome, -4.8, 0.28, 2.1, 0.18)

    // ── SMALL DATA BLOCKS ─────────────────────────────────────
    ;[[-7.0, 2.0, -1.0], [7.2, 0.5, -1.5], [-4.0, -4.0, -1.0], [3.5, -3.5, 0.0], [-6.2, -3.5, -2.0], [5.8, -4.0, -1.5], [0, 4.5, -2.0]].forEach(([x, y, z]) => {
      place(new THREE.BoxGeometry(0.30, 0.30, 0.30), bmat(C.rust, 0.55), x, y, z, Math.random()*Math.PI, Math.random()*Math.PI)
    })

    // ── LOCK SHAPES ───────────────────────────────────────────
    ;[[-1.8, 3.5, -2.0, 0.2], [2.5, -4.0, -1.5, -0.3]].forEach(([x, y, z, ry]) => {
      const grp = new THREE.Group()
      grp.add(new THREE.Mesh(G(new THREE.BoxGeometry(0.50, 0.42, 0.14)), bmat(C.rust, 0.58)))
      const shackle = new THREE.Mesh(G(new THREE.TorusGeometry(0.19, 0.042, 8, 20, Math.PI)), wire(C.amber, 0.45))
      shackle.position.y = 0.24; grp.add(shackle)
      grp.position.set(x, y, z); grp.rotation.y = ry; scene.add(grp)
      push(grp, y, 0.30 + Math.random()*0.30, Math.random()*Math.PI*2, 0.22, 0.005, 0.008)
    })

    // ── INTERACTIVE PARTICLES ─────────────────────────────────
    const COUNTS = [320, 420, 0]
    const SPREADS = [24, 32, 20]
    const SIZES   = [0.070, 0.045, 0.028]
    const OPS     = [0.42, 0.24, 0.14]
    const COLORS  = [C.org, C.rust, C.gray]

    const layers = COUNTS.map((n, li) => {
      const origin = new Float32Array(n * 3)
      const pos    = new Float32Array(n * 3)
      const vel    = new Float32Array(n * 3)

      for (let i = 0; i < n; i++) {
        const x = (Math.random()-.5) * SPREADS[li]
        const y = (Math.random()-.5) * SPREADS[li] * 0.55
        const z = (Math.random()-.5) * SPREADS[li] * 0.35
        origin[i*3]=x; origin[i*3+1]=y; origin[i*3+2]=z
        pos[i*3]=x;    pos[i*3+1]=y;    pos[i*3+2]=z
        vel[i*3]=0;    vel[i*3+1]=0;    vel[i*3+2]=0
      }

      const geo = new THREE.BufferGeometry()
      const posAttr = new THREE.BufferAttribute(pos, 3)
      posAttr.setUsage(THREE.DynamicDrawUsage)
      geo.setAttribute('position', posAttr)
      const mat = new THREE.PointsMaterial({ color: COLORS[li], size: SIZES[li], transparent: true, opacity: OPS[li], sizeAttenuation: true })
      td.push(geo, mat)
      const pts = new THREE.Points(geo, mat)
      scene.add(pts)
      return { n, origin, pos, vel, geo, posAttr, pts }
    })

    // ── Cursor ripple ring ────────────────────────────────────
    const rippleGeo = G(new THREE.RingGeometry(0.01, 0.04, 32))
    const rippleMat = M(new THREE.MeshBasicMaterial({
      color: C.org, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }))
    const ripple = new THREE.Mesh(rippleGeo, rippleMat)
    ripple.position.z = 1
    scene.add(ripple)
    let rippleScale = 0.1, rippleAlive = false

    // ── Mouse state ───────────────────────────────────────────
    let mxN = 0, myN = 0
    const mouseWorld = new THREE.Vector3(0, 0, 0)
    const _vec = new THREE.Vector3()
    let isMouseInWindow = false
    let mouseVelX = 0, mouseVelY = 0, prevMxN = 0, prevMyN = 0

    const updateMouseWorld = () => {
      _vec.set(mxN, -myN, 0.5).unproject(cam)
      const dir = _vec.sub(cam.position).normalize()
      const dist = (1 - cam.position.z) / dir.z
      mouseWorld.copy(cam.position).addScaledVector(dir, dist)
    }

    const onMouse = e => {
      prevMxN = mxN; prevMyN = myN
      mxN = (e.clientX / innerWidth  - 0.5) * 2
      myN = (e.clientY / innerHeight - 0.5) * 2
      mouseVelX = mxN - prevMxN
      mouseVelY = myN - prevMyN
      updateMouseWorld()
    }
    const onEnter = () => { isMouseInWindow = true }
    const onLeave = () => { isMouseInWindow = false }

    addEventListener('mousemove', onMouse)
    addEventListener('mouseenter', onEnter)
    addEventListener('mouseleave', onLeave)

    const onResize = () => {
      cam.aspect = innerWidth / innerHeight
      cam.updateProjectionMatrix()
      renderer.setSize(innerWidth, innerHeight)
      updateMouseWorld()
    }
    addEventListener('resize', onResize)

    const REPEL_RADIUS   = 2.8
    const REPEL_STRENGTH = 0.012
    const SPRING_K       = 0.008
    const DAMPING        = 0.88
    const RIPPLE_SPEED   = 0.14

    let t = 0, id

    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.004

      floaters.forEach(f => {
        f.mesh.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * f.amp
        f.mesh.rotation.x += f.rx
        f.mesh.rotation.y += f.ry
      })

      blobs.forEach((b, i) => {
        b.mat.opacity = b.baseOp * (1 + 0.28 * Math.sin(t * 0.55 + i * 1.4))
        b.mesh.scale.setScalar(1 + 0.04 * Math.sin(t * 0.40 + i * 0.9))
      })

      pt1.intensity = 5.0 + Math.sin(t * 1.2) * 1.5
      pt2.intensity = 3.5 + Math.sin(t * 0.85 + 1.2) * 1.0
      pt3.intensity = 2.5 + Math.sin(t * 0.70 + 2.1) * 0.8

      if (isMouseInWindow) {
        mouseLight.position.x += (mouseWorld.x * 1.1 - mouseLight.position.x) * 0.10
        mouseLight.position.y += (mouseWorld.y * 1.1 - mouseLight.position.y) * 0.10
        mouseLight.intensity   += (2.5 - mouseLight.intensity) * 0.08
      } else {
        mouseLight.intensity   += (0 - mouseLight.intensity) * 0.05
      }

      const mx = mouseWorld.x, my = mouseWorld.y
      layers.forEach(({ n, origin, pos, vel, posAttr }) => {
        for (let i = 0; i < n; i++) {
          const ix = i*3, iy = ix+1, iz = ix+2
          vel[ix] += (origin[ix] - pos[ix]) * SPRING_K
          vel[iy] += (origin[iy] - pos[iy]) * SPRING_K
          if (isMouseInWindow) {
            const dx = pos[ix]-mx, dy = pos[iy]-my
            const dSq = dx*dx + dy*dy
            if (dSq < REPEL_RADIUS*REPEL_RADIUS && dSq > 0.0001) {
              const d = Math.sqrt(dSq)
              const force = REPEL_STRENGTH * (1 - d/REPEL_RADIUS)
              vel[ix] += (dx/d)*force*1.8 + mouseVelX*8*force
              vel[iy] += (dy/d)*force*1.8 - mouseVelY*8*force
            }
          }
          vel[ix] *= DAMPING; vel[iy] *= DAMPING; vel[iz] *= DAMPING
          pos[ix] += vel[ix]; pos[iy] += vel[iy]; pos[iz] += vel[iz]
        }
        posAttr.needsUpdate = true
      })

      if (isMouseInWindow) {
        const speed = Math.sqrt(mouseVelX*mouseVelX + mouseVelY*mouseVelY)
        if (speed > 0.004 && !rippleAlive) {
          rippleAlive = true; rippleScale = 0.1
          ripple.position.set(mouseWorld.x, mouseWorld.y, 1)
        }
      }
      if (rippleAlive) {
        rippleScale += RIPPLE_SPEED
        ripple.scale.setScalar(rippleScale)
        rippleMat.opacity = Math.max(0, 0.45 - rippleScale * 0.045)
        if (rippleMat.opacity <= 0) rippleAlive = false
      }
      ripple.position.x += (mouseWorld.x - ripple.position.x) * 0.06
      ripple.position.y += (mouseWorld.y - ripple.position.y) * 0.06

      cam.position.x += (mxN * 0.48  - cam.position.x) * 0.028
      cam.position.y += (-myN * 0.32 - cam.position.y) * 0.028
      cam.lookAt(0, 0, 0)

      mouseVelX *= 0.85; mouseVelY *= 0.85

      renderer.render(scene, cam)
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      removeEventListener('mousemove', onMouse)
      removeEventListener('mouseenter', onEnter)
      removeEventListener('mouseleave', onLeave)
      removeEventListener('resize', onResize)
      td.forEach(o => o.dispose?.())
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
}
