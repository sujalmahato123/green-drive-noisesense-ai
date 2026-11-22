import { useEffect, useRef } from 'react'

/**
 * Cursor spotlight ASCII reveal.
 * Nothing is drawn while the cursor is still or away: the section stays pure black.
 * Glyphs `. : + * # % @` appear only inside a soft 180px radial spotlight around the
 * live cursor (tracked on `window`, since the canvas is pointer-events: none), glow
 * violet → white toward the centre, ripple outward, and fade out over 0.4 s behind it.
 */
const RAMP = ' .:+*#%@'
const CELL = 15
const RADIUS = 180
const FADE_S = 0.4
const VIOLET = [109, 93, 246] // #6D5DF6
const LILAC = [167, 139, 250] // #A78BFA
const WHITE = [255, 255, 255]

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

// smooth cloud-like density so the revealed glyphs have organic texture
const density = (x, y, t) => {
  const v =
    Math.sin(x * 0.0042 + t * 0.35) * 0.9 +
    Math.sin(y * 0.0065 - t * 0.25 + Math.sin(x * 0.002) * 2) * 0.8 +
    Math.sin((x + y) * 0.0031 + t * 0.2) * 0.6
  return Math.max(0, Math.min(1, (v + 1.4) / 3.2))
}

export default function AsciiField({ zIndex = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let energy = new Float32Array(0) // per-cell glow, decays to 0 over FADE_S
    let raf = 0
    let visible = true
    let last = performance.now()
    let client = null
    let mouse = null // cursor in canvas coords, null when off-canvas
    let moved = false // only a moving cursor stamps the spotlight

    const resize = () => {
      const r = parent.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / CELL)
      rows = Math.ceil(h / CELL)
      energy = new Float32Array(cols * rows)
    }
    const locate = () => {
      if (!client) return
      const r = canvas.getBoundingClientRect()
      const x = client.x - r.left
      const y = client.y - r.top
      mouse = x > -RADIUS && x < w + RADIUS && y > -RADIUS && y < h + RADIUS ? { x, y } : null
    }
    const onMove = (e) => { client = { x: e.clientX, y: e.clientY }; moved = true; locate() }
    const onLeave = () => { mouse = null }

    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    resize()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(parent)
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', locate, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)

    let idle = true
    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!visible) return
      if (idle && !moved) return // fully faded and the cursor is still: canvas stays blank

      const t = now * 0.001
      const decay = dt / FADE_S

      // stamp the spotlight into the energy grid (only while the cursor is moving)
      const stamping = moved && mouse
      moved = false
      if (stamping) {
        const c0 = Math.max(0, Math.floor((mouse.x - RADIUS) / CELL))
        const c1 = Math.min(cols - 1, Math.ceil((mouse.x + RADIUS) / CELL))
        const r0 = Math.max(0, Math.floor((mouse.y - RADIUS) / CELL))
        const r1 = Math.min(rows - 1, Math.ceil((mouse.y + RADIUS) / CELL))
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const d = Math.hypot(c * CELL + CELL / 2 - mouse.x, r * CELL + CELL / 2 - mouse.y)
            if (d >= RADIUS) continue
            const f = 1 - d / RADIUS
            const soft = f * f * (3 - 2 * f) // smoothstep falloff
            const i = r * cols + c
            if (soft > energy[i]) energy[i] = soft
          }
        }
      }

      ctx.clearRect(0, 0, w, h)
      ctx.font = `600 11px 'JetBrains Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      let any = false
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          let e = energy[i]
          if (e <= 0) continue
          e = Math.max(0, e - decay)
          energy[i] = e
          if (e < 0.02) continue
          any = true
          const x = c * CELL + CELL / 2
          const y = r * CELL + CELL / 2
          // glyph weight follows cloud density + glow; cycles while lit
          const base = density(x, y, t)
          const cycle = Math.floor(t * 12 + c * 0.7 + r * 0.3) % 3
          const gi = Math.min(RAMP.length - 1, 1 + Math.floor((base * 0.5 + e * 0.6) * (RAMP.length - 2)) + (e > 0.5 ? cycle - 1 : 0))
          if (gi <= 0) continue
          // ripple displacement away from the cursor
          let dx = 0
          let dy = 0
          if (mouse) {
            const vx = x - mouse.x
            const vy = y - mouse.y
            const d = Math.hypot(vx, vy) || 1
            const ripple = Math.sin(d * 0.06 - t * 6) * 3 * e
            dx = (vx / d) * (e * e * 10 + ripple)
            dy = (vy / d) * (e * e * 10 + ripple)
          }
          const col = e < 0.55 ? mix(VIOLET, LILAC, e / 0.55) : mix(LILAC, WHITE, (e - 0.55) / 0.45)
          ctx.fillStyle = `rgba(${col[0] | 0}, ${col[1] | 0}, ${col[2] | 0}, ${Math.min(1, e * 1.25)})`
          ctx.fillText(RAMP[gi], x + dx, y + dy)
        }
      }
      idle = !any
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', locate)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex }} />
}
