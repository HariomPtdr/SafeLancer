import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const STEPS = [
  { label: 'Client',       sub: 'Posts & Funds',    color: '#FF6803', hex: 0xFF6803 },
  { label: 'Escrow',       sub: 'Funds Locked',      color: '#FF6803', hex: 0xF59E0B },
  { label: 'Freelancer',   sub: 'Work In Progress',  color: '#10B981', hex: 0xAE3A02 },
  { label: 'Deliverable',  sub: 'Files Submitted',   color: '#AE3A02', hex: 0xAE3A02 },
  { label: 'Approval',     sub: 'Client Reviews',    color: '#AE3A02', hex: 0xAE3A02 },
  { label: 'Released',     sub: 'Payment Sent',      color: '#BFBFBF', hex: 0xFF6803 },
]

const POSITIONS = [
  new THREE.Vector3(-4.2,  0.55, 0),
  new THREE.Vector3(-2.52, -0.35, 0.1),
  new THREE.Vector3(-0.84,  0.55, -0.1),
  new THREE.Vector3( 0.84, -0.35, 0.1),
  new THREE.Vector3( 2.52,  0.55, -0.1),
  new THREE.Vector3( 4.2,  -0.35, 0),
]

export default function EscrowFlow3D() {
  const wrapRef   = useRef(null)
  const canvasRef = useRef(null)
  const labelsRef = useRef([])

  useEffect(() => {
    const wrap   = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const W = () => wrap.clientWidth  || 600
    const H = () => wrap.clientHeight || 320

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W(), H())
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(52, W() / H(), 0.1, 60)
    cam.position.set(0, 0.1, 8.8)

    scene.add(new THREE.AmbientLight(0xffffff, 2.8))
    const d1 = new THREE.DirectionalLight(0xffffff, 2.2); d1.position.set(5, 8, 5); scene.add(d1)
    const d2 = new THREE.DirectionalLight(0xe0f2fe, 1.4); d2.position.set(-5, 3, 3); scene.add(d2)

    const td = []
    const nodeObjs = STEPS.map((step, i) => {
      const pos = POSITIONS[i].clone()
      const sGeo = new THREE.SphereGeometry(0.38, 32, 32)
      const sMat = new THREE.MeshPhysicalMaterial({ color: step.hex, emissive: step.hex, emissiveIntensity: 0.22, roughness: 0.12, metalness: 0.75, transparent: true, opacity: 0.93 })
      const sphere = new THREE.Mesh(sGeo, sMat)
      sphere.position.copy(pos); sphere.userData = { index: i }; scene.add(sphere)
      td.push(sGeo, sMat)
      const rGeo = new THREE.TorusGeometry(0.58, 0.024, 6, 44)
      const rMat = new THREE.MeshBasicMaterial({ color: step.hex, transparent: true, opacity: 0.30 })
      const ring = new THREE.Mesh(rGeo, rMat)
      ring.position.copy(pos); ring.rotation.x = Math.PI / 2.3; scene.add(ring)
      td.push(rGeo, rMat)
      return { sphere, ring, sMat, rMat, baseY: pos.y, step }
    })

    const curves = []
    for (let i = 0; i < STEPS.length - 1; i++) {
      const a = POSITIONS[i], b = POSITIONS[i + 1]
      const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.45, (a.z + b.z) / 2)
      const curve = new THREE.CatmullRomCurve3([a, mid, b]); curves.push(curve)
      const pts = curve.getPoints(64)
      const lGeo = new THREE.BufferGeometry().setFromPoints(pts)
      const lMat = new THREE.LineDashedMaterial({ color: 0xCBD5E1, dashSize: 0.13, gapSize: 0.09, transparent: true, opacity: 0.70 })
      const line = new THREE.Line(lGeo, lMat); line.computeLineDistances(); scene.add(line)
      td.push(lGeo, lMat)
    }

    const pulses = curves.map((curve, i) => {
      const pGeo = new THREE.SphereGeometry(0.072, 8, 8)
      const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
      const mesh = new THREE.Mesh(pGeo, pMat); scene.add(mesh); td.push(pGeo, pMat)
      return { mesh, curve, t: i / curves.length, speed: 0.0025 + i * 0.0003 }
    })

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-10, -10)
    let hoveredIndex = -1
    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    canvas.addEventListener('mousemove', onMouseMove)

    const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix() })
    ro.observe(wrap)

    let t = 0, id
    const tick = () => {
      id = requestAnimationFrame(tick)
      t += 0.008
      raycaster.setFromCamera(mouse, cam)
      const hits = raycaster.intersectObjects(nodeObjs.map(n => n.sphere))
      hoveredIndex = hits.length ? hits[0].object.userData.index : -1
      canvas.style.cursor = hoveredIndex >= 0 ? 'pointer' : 'default'

      nodeObjs.forEach((node, i) => {
        const hov = i === hoveredIndex
        const ty = node.baseY + Math.sin(t * 0.85 + i * 1.1) * 0.09
        node.sphere.position.y += (ty - node.sphere.position.y) * 0.08
        node.ring.position.y = node.sphere.position.y
        const ts = hov ? 1.24 : 1.0
        node.sphere.scale.x += (ts - node.sphere.scale.x) * 0.12
        node.sphere.scale.y = node.sphere.scale.z = node.sphere.scale.x
        node.sMat.emissiveIntensity += ((hov ? 0.70 : 0.22) - node.sMat.emissiveIntensity) * 0.12
        node.rMat.opacity += ((hov ? 0.80 : 0.30) - node.rMat.opacity) * 0.12
        node.ring.rotation.z += 0.009
        const lEl = labelsRef.current[i]
        if (lEl) {
          const proj = node.sphere.position.clone().project(cam)
          lEl.style.left = (proj.x + 1) / 2 * W() + 'px'
          lEl.style.top  = ((-proj.y + 1) / 2 * H() + node.sphere.scale.x * 44) + 'px'
          lEl.style.opacity = hov ? '1' : '0.72'
          lEl.style.transform = `translateX(-50%) scale(${hov ? 1.08 : 1})`
        }
      })

      pulses.forEach(p => {
        p.t = (p.t + p.speed) % 1
        p.mesh.position.copy(p.curve.getPoint(p.t))
        p.mesh.material.opacity = Math.sin(p.t * Math.PI) * 0.92
      })

      renderer.render(scene, cam)
    }
    tick()

    return () => {
      cancelAnimationFrame(id); ro.disconnect()
      canvas.removeEventListener('mousemove', onMouseMove)
      td.forEach(o => o.dispose?.()); renderer.dispose()
    }
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '320px' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STEPS.map((step, i) => (
          <div key={i} ref={el => { labelsRef.current[i] = el }} style={{ position: 'absolute', textAlign: 'center', transition: 'opacity 0.2s, transform 0.2s', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: step.color, letterSpacing: '0.02em' }}>{step.label}</div>
            <div style={{ fontSize: '9.5px', color: '#BFBFBF', marginTop: '1px' }}>{step.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
