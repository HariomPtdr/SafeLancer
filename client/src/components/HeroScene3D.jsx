import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroScene3D() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Renderer ───────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.setClearColor(0xEDECE8, 1)   // same warm gray as the section bg
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05

    const scene = new THREE.Scene()

    const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100)
    cam.position.set(-0.5, 1.6, 9.5)
    cam.lookAt(1.6, 0, 0)

    // ── Lights ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff8f0, 2.2))

    const key = new THREE.DirectionalLight(0xffffff, 4.5)
    key.position.set(7, 14, 8)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far  = 60
    key.shadow.camera.left = key.shadow.camera.bottom = -12
    key.shadow.camera.right = key.shadow.camera.top  =  12
    key.shadow.radius = 6
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xe4eeff, 2.0)
    fill.position.set(-6, 6, 4); scene.add(fill)

    const back = new THREE.DirectionalLight(0xffe8d8, 1.4)
    back.position.set(0, -5, -6); scene.add(back)

    // ── Material helpers ───────────────────────────────────
    const td = []
    const G = g => { td.push(g); return g }
    const M = m => { td.push(m); return m }

    const phys = (col, rough, metal) => M(new THREE.MeshPhysicalMaterial({ color: col, roughness: rough, metalness: metal }))

    // Warm cream palette
    const mBody     = phys(0xD6C8A6, 0.72, 0.08)
    const mDoor     = phys(0xC4B48C, 0.65, 0.12)
    const mFrame    = phys(0xB8A47A, 0.60, 0.15)
    const mMetal    = phys(0x6E6050, 0.35, 0.80)
    const mDarkMet  = phys(0x3E3028, 0.22, 0.90)

    // ── VAULT GROUP ────────────────────────────────────────
    const vault = new THREE.Group()
    vault.position.set(1.8, -0.3, 0)

    const add = (geo, mat, px=0, py=0, pz=0, rx=0, ry=0, rz=0) => {
      const m = new THREE.Mesh(G(geo), mat)
      m.position.set(px, py, pz)
      m.rotation.set(rx, ry, rz)
      m.castShadow = m.receiveShadow = true
      vault.add(m); return m
    }

    // Body
    add(new THREE.BoxGeometry(2.6, 3.3, 2.2), mBody)

    // Door panel (protruding forward)
    add(new THREE.BoxGeometry(2.28, 2.98, 0.20), mDoor, 0, 0, 1.21)

    // Door frame (4 border strips)
    add(new THREE.BoxGeometry(2.28, 0.11, 0.20), mFrame,   0,  1.545, 1.21)
    add(new THREE.BoxGeometry(2.28, 0.11, 0.20), mFrame,   0, -1.545, 1.21)
    add(new THREE.BoxGeometry(0.11, 2.98, 0.20), mFrame,  -1.085, 0,  1.21)
    add(new THREE.BoxGeometry(0.11, 2.98, 0.20), mFrame,   1.085, 0,  1.21)

    // Combination dial
    add(new THREE.CylinderGeometry(0.50, 0.50, 0.14, 48), mDarkMet, 0, 0.25, 1.30, Math.PI/2, 0, 0)
    add(new THREE.TorusGeometry(0.54, 0.046, 8, 48),      mMetal,   0, 0.25, 1.27)
    // dial center nub
    add(new THREE.CylinderGeometry(0.09, 0.09, 0.10, 16), mFrame, 0, 0.25, 1.36, Math.PI/2, 0, 0)
    // dial notch (white line at top)
    add(new THREE.BoxGeometry(0.05, 0.16, 0.07), M(new THREE.MeshPhysicalMaterial({ color: 0xF8F4EC, roughness: 0.4 })), 0, 0.80, 1.27)

    // 8 tick marks around dial ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      add(new THREE.BoxGeometry(0.04, 0.04, 0.06), mFrame,
        Math.cos(a) * 0.54, 0.25 + Math.sin(a) * 0.54, 1.24)
    }

    // Handle (right side)
    add(new THREE.TorusGeometry(0.24, 0.062, 10, 26), mDarkMet, 0.80, -0.22, 1.35, 0, Math.PI/2, 0)

    // Lock bolts (3, right edge)
    for (let i = 0; i < 3; i++) {
      add(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12), mMetal, 1.25, 0.60 - i*0.60, 1.12, 0, 0, Math.PI/2)
    }

    // Hinges (2, left edge)
    for (let i = 0; i < 2; i++) {
      add(new THREE.CylinderGeometry(0.09, 0.09, 0.38, 12), mMetal, -1.22, 0.80 - i*1.60, 1.08)
      add(new THREE.BoxGeometry(0.24, 0.36, 0.16),           mFrame, -1.22, 0.80 - i*1.60, 1.06)
    }

    // 4 vertical corner strips
    ;[[-1.19, -1.00], [-1.19, 0.90], [1.19, -1.00], [1.19, 0.90]].forEach(([x, z]) => {
      add(new THREE.BoxGeometry(0.24, 3.5, 0.24), mMetal, x, 0, z)
    })

    // 4 feet
    ;[[-0.88, -1.0], [0.88, -1.0], [-0.88, 0.88], [0.88, 0.88]].forEach(([x, z]) => {
      add(new THREE.CylinderGeometry(0.14, 0.17, 0.26, 12), mMetal, x, -1.78, z)
    })

    // 2 decorative horizontal bars on door
    add(new THREE.BoxGeometry(1.80, 0.06, 0.08), mFrame, 0,  0.88, 1.30)
    add(new THREE.BoxGeometry(1.80, 0.06, 0.08), mFrame, 0, -0.55, 1.30)

    scene.add(vault)

    // ── SHADOW PLANE ───────────────────────────────────────
    const sPlane = new THREE.Mesh(
      G(new THREE.PlaneGeometry(28, 28)),
      M(new THREE.ShadowMaterial({ opacity: 0.16 }))
    )
    sPlane.rotation.x = -Math.PI / 2
    sPlane.position.y = -2.0
    sPlane.receiveShadow = true
    scene.add(sPlane)

    // ── FLOATING ACCENTS ───────────────────────────────────
    const floats = []
    const accent = (geo, mat, x, y, z, phase = 0, rx = 0, ry = 0) => {
      const mesh = new THREE.Mesh(G(geo), M(mat))
      mesh.position.set(x, y, z)
      mesh.castShadow = true
      scene.add(mesh)
      floats.push({ mesh, baseY: y, phase, speed: 0.65 + Math.random() * 0.35, rx, ry })
      return mesh
    }

    // Gold sphere (top-right, like Pixel Rise's golden ball)
    accent(new THREE.SphereGeometry(0.40, 26, 26),
      new THREE.MeshPhysicalMaterial({ color: 0xE8C95A, roughness: 0.22, metalness: 0.58 }),
      4.5, 2.4, 1.8, 0.0, 0.008, 0.010)

    // Cream/off-white document (upper-left area)
    const docGrp = new THREE.Group()
    const docBody = new THREE.Mesh(G(new THREE.BoxGeometry(0.80, 1.05, 0.065)),
      M(new THREE.MeshPhysicalMaterial({ color: 0xF2EDE0, roughness: 0.85, metalness: 0.0 })))
    docBody.castShadow = true; docGrp.add(docBody)
    ;[[0.30, '#D4A8A8'], [0.14, '#BFBFBF'], [-0.02, '#B4D4A8'], [-0.18, '#D4C4A0']].forEach(([ly, col]) => {
      const line = new THREE.Mesh(G(new THREE.BoxGeometry(0.50, 0.042, 0.03)),
        M(new THREE.MeshPhysicalMaterial({ color: parseInt(col.replace('#','0x')), roughness: 0.9 })))
      line.position.set(-0.04, ly, 0.048); docGrp.add(line)
    })
    docGrp.position.set(-1.2, 1.6, 2.4)
    docGrp.rotation.set(0.08, 0.28, 0.14)
    scene.add(docGrp)
    floats.push({ mesh: docGrp, baseY: 1.6, phase: 1.4, speed: 0.58, rx: 0.003, ry: 0.005 })

    // Soft pink cube (above vault, Pixel Rise "camera" equivalent)
    accent(new THREE.BoxGeometry(0.40, 0.40, 0.40),
      new THREE.MeshPhysicalMaterial({ color: 0xECA898, roughness: 0.52, metalness: 0.08 }),
      3.4, 3.0, 0.6, 0.8, 0.012, 0.014)

    // Soft cyan icosahedron (upper-left floating)
    accent(new THREE.IcosahedronGeometry(0.34, 0),
      new THREE.MeshPhysicalMaterial({ color: 0x7EC8D8, roughness: 0.28, metalness: 0.38 }),
      -2.2, 2.6, 0.8, 2.0, 0.010, 0.008)

    // Small gray cube (right, mid-level)
    accent(new THREE.BoxGeometry(0.28, 0.28, 0.28),
      new THREE.MeshPhysicalMaterial({ color: 0xA8B2BC, roughness: 0.62, metalness: 0.18 }),
      4.8, -0.6, 1.2, 1.6, 0.014, 0.012)

    // Soft green sphere (lower right — "checkmark" feel)
    accent(new THREE.SphereGeometry(0.30, 22, 22),
      new THREE.MeshPhysicalMaterial({ color: 0x90D8A8, roughness: 0.28, metalness: 0.32 }),
      4.0, -1.9, 2.4, 3.2, 0.007, 0.012)

    // Tiny cream cube (floating left)
    accent(new THREE.BoxGeometry(0.20, 0.20, 0.20),
      new THREE.MeshPhysicalMaterial({ color: 0xD8D0BC, roughness: 0.78, metalness: 0.04 }),
      -2.6, 0.0, 2.0, 0.4, 0.018, 0.016)

    // Small gold sphere (lower left area)
    accent(new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xE8D060, roughness: 0.28, metalness: 0.52 }),
      0.6, -2.6, 3.0, 4.2, 0.009, 0.013)

    // ── Mouse parallax ─────────────────────────────────────
    let mx = 0, my = 0
    const onMouse = e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2 }
    addEventListener('mousemove', onMouse)

    const onResize = () => {
      cam.aspect = innerWidth / innerHeight
      cam.updateProjectionMatrix()
      renderer.setSize(innerWidth, innerHeight)
    }
    addEventListener('resize', onResize)

    // ── Animation loop ─────────────────────────────────────
    let t = 0, id
    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.006

      // Vault: gentle float + mouse tilt
      vault.position.y = -0.3 + Math.sin(t * 0.5) * 0.10
      vault.rotation.y += (mx * 0.10 - vault.rotation.y) * 0.04
      vault.rotation.x += (-my * 0.05 - vault.rotation.x) * 0.04

      // Floating accents
      floats.forEach(f => {
        f.mesh.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * 0.20
        f.mesh.rotation.x += f.rx
        f.mesh.rotation.y += f.ry
      })

      // Camera parallax
      cam.position.x += (mx * 0.35 - 0.5 - cam.position.x) * 0.03
      cam.position.y += (1.6 - my * 0.28 - cam.position.y) * 0.03
      cam.lookAt(1.6, 0, 0)

      renderer.render(scene, cam)
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      removeEventListener('mousemove', onMouse)
      removeEventListener('resize', onResize)
      td.forEach(o => o.dispose?.())
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  )
}
