import { useRef } from 'react'

/**
 * Full-screen staggered pixel-block wipe.
 * phase: 'idle' | 'mount' (blocks at scale 0) | 'in' (blocks cover) | 'out' (blocks dissolve)
 */
export const CURTAIN_IN_MS = 900
export const CURTAIN_OUT_MS = 900

const SPREAD = 420
const JITTER = 120
const COLORS = ['#2B44FF', '#6D5DF6', '#3A3AF4', '#5747F0', '#2B44FF']

export default function PixelCurtain({ phase, label }) {
  const grid = useRef({ cells: [], size: 72 })

  if (phase === 'mount') {
    const size = window.innerWidth < 640 ? 48 : 72
    const cols = Math.ceil(window.innerWidth / size)
    const rows = Math.ceil(window.innerHeight / size)
    const cells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const diag = (c / cols) * 0.75 + (r / rows) * 0.25
        cells.push({
          c,
          r,
          delay: Math.round(diag * SPREAD + Math.random() * JITTER),
          color: COLORS[(c * 7 + r * 13) % COLORS.length],
          spin: Math.random() > 0.5 ? 90 : -90,
        })
      }
    }
    grid.current = { cells, size }
  }

  if (phase === 'idle') return null
  const { cells, size } = grid.current

  const transformFor = (cell) => {
    if (phase === 'in') return 'scale(1.04) rotate(0deg)'
    if (phase === 'out') return `scale(0) rotate(${-cell.spin}deg)`
    return `scale(0) rotate(${cell.spin}deg)`
  }

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all', overflow: 'hidden' }}>
      {cells.map((cell, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cell.c * size,
            top: cell.r * size,
            width: size + 1,
            height: size + 1,
            background: cell.color,
            transform: transformFor(cell),
            transition: phase === 'mount' ? 'none' : `transform 340ms cubic-bezier(0.7, 0, 0.3, 1) ${cell.delay}ms`,
            willChange: 'transform',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          opacity: phase === 'in' ? 1 : 0,
          transition: phase === 'in' ? 'opacity 200ms ease 550ms' : 'opacity 150ms ease',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#fff',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        <span>→ {label}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ width: 6, height: 6, background: '#fff', opacity: 0.35 + i * 0.15 }} />
          ))}
        </span>
      </div>
    </div>
  )
}
