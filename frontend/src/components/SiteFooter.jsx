import { useRef } from 'react'
import { Zap } from 'lucide-react'
import AsciiField from './AsciiField'

const MONO = "'JetBrains Mono', monospace"
const LINE = 'rgba(255,255,255,0.1)'

const wordmark = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: '18vw',
  lineHeight: 0.8,
  letterSpacing: '-0.055em',
  whiteSpace: 'nowrap',
  textAlign: 'center',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  userSelect: 'none',
}

export default function SiteFooter({ views, onNavigate }) {
  const ref = useRef(null)
  const wmRef = useRef(null)

  // Track the cursor (clientX + clientY) with CSS variables so the light moves without React re-renders
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
    ref.current.style.setProperty('--beam', '1')
    const wr = wmRef.current.getBoundingClientRect()
    wmRef.current.style.setProperty('--wx', `${e.clientX - wr.left}px`)
    wmRef.current.style.setProperty('--wy', `${e.clientY - wr.top}px`)
  }
  const onLeave = () => ref.current.style.setProperty('--beam', '0')

  return (
    <footer ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ position: 'relative', overflow: 'hidden', background: '#050508', color: '#fff', borderTop: `1px solid ${LINE}`, '--mx': '50%', '--my': '50%', '--beam': '0' }}>
      <AsciiField />

      {/* radial spotlight following the cursor */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle 320px at var(--mx) var(--my), rgba(109,93,246,0.22), rgba(109,93,246,0.06) 45%, transparent 70%)', opacity: 'var(--beam)', transition: 'opacity 0.4s', pointerEvents: 'none', zIndex: 1 }} />

      {/* vertical light beam */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 'var(--mx)', width: 220, transform: 'translateX(-50%)', background: 'linear-gradient(90deg, transparent, rgba(109,93,246,0.16) 35%, rgba(255,255,255,0.12) 50%, rgba(109,93,246,0.16) 65%, transparent)', opacity: 'var(--beam)', transition: 'opacity 0.4s', pointerEvents: 'none', zIndex: 1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 'var(--mx)', width: 1, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.7), transparent)', opacity: 'var(--beam)', transition: 'opacity 0.4s', pointerEvents: 'none', zIndex: 1 }} />

      <div className="ns-page-pad" style={{ position: 'relative', zIndex: 2, maxWidth: 1400, margin: '0 auto', padding: '80px 48px 56px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            Readings analysed 48,880 · Nodes online 32/32 · Median latency 41 ms
          </div>
          <button
            onClick={() => onNavigate('control')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 28px', background: '#6D5DF6', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', boxShadow: '0 0 28px rgba(109,93,246,0.45)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2B44FF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6D5DF6')}
          >
            <Zap size={15} /> Launch App
          </button>
        </div>
        <nav aria-label="Footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
          {views.map((v) => (
            <button key={v.id} onClick={() => onNavigate(v.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
              {v.label}
            </button>
          ))}
        </nav>
      </div>

      {/* edge-to-edge striped wordmark; two lit copies masked to a radial cursor spotlight */}
      <div ref={wmRef} aria-hidden="true" style={{ position: 'relative', zIndex: 2, marginBottom: '-2.2vw', '--wx': '50%', '--wy': '50%' }}>
        <div style={{ ...wordmark, backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.55) 0 3px, transparent 3px 7px)' }}>NOISESENSE</div>
        {[
          { stripe: '#8B7CFF', radius: 340, glow: 'drop-shadow(0 0 14px rgba(109,93,246,0.85))' },
          { stripe: '#FFFFFF', radius: 150, glow: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' },
        ].map((l) => {
          const mask = `radial-gradient(circle ${l.radius}px at var(--wx) var(--wy), #000 0%, rgba(0,0,0,0.55) 45%, transparent 100%)`
          return (
            <div
              key={l.stripe}
              style={{
                ...wordmark,
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(180deg, ${l.stripe} 0 3px, transparent 3px 7px)`,
                WebkitMaskImage: mask,
                maskImage: mask,
                opacity: 'var(--beam)',
                transition: 'opacity 0.4s',
                filter: l.glow,
              }}
            >
              NOISESENSE
            </div>
          )
        })}
      </div>

      {/* CRT scanlines */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, transparent 0 2px, rgba(0,0,0,0.22) 2px 4px)', pointerEvents: 'none', zIndex: 3 }} />

      <div style={{ position: 'relative', zIndex: 4, borderTop: `1px solid ${LINE}`, padding: '14px 28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', background: '#050508' }}>
        <span>Green Drive · NoiseSense AI</span>
        <span>Kolkata acoustic telemetry network</span>
      </div>
    </footer>
  )
}
