import { useEffect, useRef } from 'react'

/**
 * 16 overlapping translucent violet glass frames sweeping from the top-left to the
 * bottom-right of the hero.
 *  - Scroll: as the hero scrolls away the frames rotate (X/Y/Z) and fan apart in 3D.
 *  - Mouse: spring-damped parallax tilts the stack and brightens the nearest frames.
 * The layout is applied immediately on mount and on resize, so the frames are in place
 * even before (or without) the animation loop running.
 */
const COUNT = 16
// gentle S-curve, in fractions of the hero box
const P = [
  { x: 0.02, y: -0.1 },
  { x: 0.3, y: 0.0 },
  { x: 0.55, y: 0.65 },
  { x: 0.94, y: 1.02 },
]
const bez = (t, a, b, c, d) => {
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}
const bezD = (t, a, b, c, d) => {
  const u = 1 - t
  return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c)
}

export default function HeroBlades() {
  const wrapRef = useRef(null)
  const cardRefs = useRef([])

  useEffect(() => {
    const host = wrapRef.current.parentElement
    let w = host.clientWidth
    let h = host.clientHeight
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    const vel = { x: 0, y: 0 }
    let scroll = 0 // 0 at rest → 1 when the hero has scrolled out
    let scrollTarget = 0
    let raf = 0
    let visible = true

    const layout = () => {
      const cursorT = (pos.x + 1) / 2
      const cardW = Math.max(170, Math.min(300, w * 0.2))
      const s = scroll
      cardRefs.current.forEach((el, i) => {
        if (!el) return
        const k = i / (COUNT - 1)
        const depth = k - 0.5
        // fan apart along the curve as you scroll
        const t = Math.min(1, Math.max(0, 0.5 + depth * (1 + s * 0.45)))
        const x = bez(t, P[0].x, P[1].x, P[2].x, P[3].x) * w
        const y = bez(t, P[0].y, P[1].y, P[2].y, P[3].y) * h - s * h * 0.12
        const dx = bezD(t, P[0].x, P[1].x, P[2].x, P[3].x) * w
        const dy = bezD(t, P[0].y, P[1].y, P[2].y, P[3].y) * h
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI
        const fanX = pos.x * 64 * depth + pos.x * 16
        const fanY = pos.y * 42 * depth + pos.y * 10
        const rx = 8 + pos.y * 8 + s * 22
        const ry = 58 + pos.x * 10 + s * 26
        const rz = s * 14 * depth
        el.style.width = `${cardW}px`
        el.style.height = `${cardW * 1.28}px`
        el.style.transform = `translate(-50%, -50%) translate3d(${x + fanX}px, ${y + fanY}px, 0) rotate(${ang + rz}deg) perspective(1100px) rotateY(${ry}deg) rotateX(${rx}deg)`
        const glow = Math.max(0, 1 - Math.abs(k - cursorT) * 3)
        el.style.borderColor = `rgba(${200 + glow * 55}, ${180 + glow * 75}, 255, ${0.55 + glow * 0.4})`
        el.style.boxShadow = `0 0 ${24 + glow * 30}px rgba(124, 92, 255, ${0.32 + glow * 0.35}), inset 0 0 26px rgba(167, 139, 250, ${0.16 + glow * 0.2})`
      })
    }

    const ro = new ResizeObserver(() => { w = host.clientWidth; h = host.clientHeight; layout() })
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(host)
    const onMove = (e) => {
      const r = host.getBoundingClientRect()
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
    }
    const onLeave = () => { target.x = 0; target.y = 0 }
    const onScroll = () => {
      const r = host.getBoundingClientRect()
      scrollTarget = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)))
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    scroll = scrollTarget
    layout() // place the frames right away

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      vel.x = (vel.x + (target.x - pos.x) * 0.06) * 0.84
      vel.y = (vel.y + (target.y - pos.y) * 0.06) * 0.84
      pos.x += vel.x
      pos.y += vel.y
      scroll += (scrollTarget - scroll) * 0.1
      layout()
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={wrapRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      {Array.from({ length: COUNT }, (_, i) => {
        const k = i / (COUNT - 1)
        const fade = Math.min(1, 0.45 + Math.min(k, 1 - k) * 3) // dimmer at both ends
        return (
          <div
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 240,
              height: 307,
              borderRadius: 16,
              opacity: fade,
              background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.34) 0%, rgba(22, 16, 46, 0.42) 48%, rgba(139, 92, 246, 0.32) 100%)',
              border: '1.5px solid rgba(200, 180, 255, 0.6)',
              boxShadow: '0 0 24px rgba(124, 92, 255, 0.32), inset 0 0 26px rgba(167, 139, 250, 0.16)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              willChange: 'transform',
            }}
          >
            <div style={{ position: 'absolute', inset: 10, borderRadius: 9, border: '1px solid rgba(200, 180, 255, 0.28)', background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 40%)' }} />
          </div>
        )
      })}
    </div>
  )
}
