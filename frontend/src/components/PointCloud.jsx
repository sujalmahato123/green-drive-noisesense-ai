import { useEffect, useRef } from 'react'

/**
 * Rotating 3D point cloud with perspective projection.
 * shape: 'sphere' | 'wave' | 'helix' | 'knot'
 */
const TAU = Math.PI * 2

const build = (shape) => {
  const pts = []
  if (shape === 'sphere') {
    const n = 900
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      pts.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r])
    }
  } else if (shape === 'wave') {
    const g = 34
    for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) pts.push([(i / (g - 1)) * 2.4 - 1.2, 0, (j / (g - 1)) * 2.4 - 1.2])
  } else if (shape === 'helix') {
    const n = 220
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1)
      const a = s * TAU * 2.2
      const y = s * 2.4 - 1.2
      // two strands
      pts.push([Math.cos(a) * 0.55, y, Math.sin(a) * 0.55])
      pts.push([Math.cos(a + Math.PI) * 0.55, y, Math.sin(a + Math.PI) * 0.55])
      // twisted ribbon between them
      if (i % 4 === 0) {
        for (let k = 1; k < 8; k++) {
          const u = k / 8
          pts.push([Math.cos(a) * 0.55 * (1 - 2 * u), y, Math.sin(a) * 0.55 * (1 - 2 * u)])
        }
      }
    }
  } else {
    // (2,3) torus knot with a thin tube of points around it
    const n = 320
    const p = 2
    const q = 3
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU
      const r = 0.62 + 0.28 * Math.cos(q * t)
      const c = [r * Math.cos(p * t), 0.28 * Math.sin(q * t) * 1.4, r * Math.sin(p * t)]
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU + i * 0.3
        pts.push([c[0] + Math.cos(a) * 0.06, c[1] + Math.sin(a) * 0.06, c[2] + Math.cos(a + 1) * 0.06])
      }
    }
  }
  return pts
}

const hexToRgb = (hex) => {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export default function PointCloud({ shape = 'sphere', color = '#6D5DF6' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas.parentElement
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pts = build(shape)
    const [cr, cg, cb] = hexToRgb(color)
    let w = 0
    let h = 0
    let raf = 0
    let visible = true
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }

    const resize = () => {
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 0.8
      tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 0.6
    }
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    resize()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(parent)
    window.addEventListener('mousemove', onMove, { passive: true })

    const draw = (ms) => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      const t = ms * 0.001
      tilt.x += (tilt.tx - tilt.x) * 0.05
      tilt.y += (tilt.ty - tilt.y) * 0.05
      const ry = t * 0.45 + tilt.x
      const rx = (shape === 'wave' ? 0.55 : 0.35) + tilt.y
      const cosY = Math.cos(ry)
      const sinY = Math.sin(ry)
      const cosX = Math.cos(rx)
      const sinX = Math.sin(rx)
      const scale = Math.min(w, h) * (shape === 'wave' ? 0.36 : 0.38)
      const fov = 3.2

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < pts.length; i++) {
        let [x, y, z] = pts[i]
        if (shape === 'wave') y = 0.22 * Math.sin(x * 3 + t * 1.6) * Math.cos(z * 2.6 - t * 1.2) + 0.08 * Math.sin((x + z) * 6 + t * 2)
        if (shape === 'helix') {
          const twist = Math.sin(y * 1.5 + t) * 0.25
          const c = Math.cos(twist)
          const s = Math.sin(twist)
          ;[x, z] = [x * c - z * s, x * s + z * c]
        }
        // rotate Y then X
        const x1 = x * cosY - z * sinY
        const z1 = x * sinY + z * cosY
        const y1 = y * cosX - z1 * sinX
        const z2 = y * sinX + z1 * cosX
        const p = fov / (fov + z2)
        const sx = w / 2 + x1 * scale * p
        const sy = h / 2 + y1 * scale * p
        const depth = (1 - z2) / 2 // 0 back .. 1 front
        const size = 0.8 + depth * 1.6
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.18 + depth * 0.75})`
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size)
      }
      ctx.globalCompositeOperation = 'source-over'
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('mousemove', onMove)
    }
  }, [shape, color])

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', filter: `drop-shadow(0 0 6px ${color}88)` }} />
}
