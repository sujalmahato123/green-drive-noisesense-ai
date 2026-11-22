import { useState, useEffect } from 'react'
import AsciiField from './AsciiField'
import PointCloud from './PointCloud'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const LINE = 'rgba(255,255,255,0.1)'

const PANELS = [
  {
    title: 'Smart Map',
    heading: 'Every node, live on one map.',
    desc: 'Five Kolkata nodes stream dB(A) readings onto a zone-aware map, colour-coded against CPCB limits.',
    shape: 'sphere',
    color: '#6D5DF6',
    goodAt: ['Zone-aware markers', 'Silence-zone overlays', 'Drill-down per node'],
    working: ['Syncing 5 node positions', 'Refreshing CPCB overlays', 'Recolouring markers', 'Pushing map tiles'],
  },
  {
    title: 'YAMNet AI',
    heading: 'Knows a horn from a siren.',
    desc: 'Google YAMNet labels every 0.96 s frame across 521 AudioSet classes before anything is ranked.',
    shape: 'wave',
    color: '#93C5FD',
    goodAt: ['521 sound classes', 'Horn vs. siren split', 'Runs on uploaded clips'],
    working: ['Resampling to 16 kHz', 'Building log-mel frames', 'Scoring 521 classes', 'Emitting top label'],
  },
  {
    title: 'Leq Engine',
    heading: 'Energy, not just peaks.',
    desc: 'Rolling equivalent continuous level separates a passing truck from a junction that never goes quiet.',
    shape: 'helix',
    color: '#E879F9',
    goodAt: ['A-weighted dB(A)', 'Rolling Leq windows', 'Day / night periods'],
    working: ['Applying A-weighting', 'Integrating 60 s window', 'Comparing to CPCB limit', 'Tagging persistent load'],
  },
  {
    title: 'Priority Ranker',
    heading: 'The loudest problem isn’t always first.',
    desc: 'Leq above limit multiplied by zone weight, so a hospital at 74 dB outranks a market at 80.',
    shape: 'knot',
    color: '#818CF8',
    goodAt: ['Zone-weighted scores', 'Persistent vs. temporary', 'Webhook alerts < 50 ms'],
    working: ['Scoring 5 locations', 'Applying zone weights', 'Re-ranking queue', 'Dispatching webhook'],
  },
]

const useViewportWidth = () => {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return w
}

const WorkingNow = ({ items, color }) => {
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
    const id = setInterval(() => setStep((s) => (s + 1) % (items.length + 2)), 1100)
    return () => clearInterval(id)
  }, [items])
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((item, i) => {
        const done = i < step
        const running = i === step
        return (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 11, color: done ? '#fff' : running ? color : 'rgba(255,255,255,0.4)', transition: 'color 0.3s' }}>
            <span style={{ width: 12, height: 12, flexShrink: 0, border: `1px solid ${done ? color : 'rgba(255,255,255,0.3)'}`, background: done ? color : 'transparent', display: 'grid', placeItems: 'center', fontSize: 9, color: '#0A0A0E', transition: 'all 0.3s' }}>
              {done ? '✓' : ''}
            </span>
            {item}
            {running && <span className="ns-glow" style={{ marginLeft: 4, fontSize: 9, letterSpacing: '0.14em' }}>· RUNNING</span>}
          </li>
        )
      })}
    </ul>
  )
}

/* Expanded content: strict 2-column grid, text left, 3D canvas boxed on the right */
const PanelBody = ({ p, index, twoCol }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: twoCol ? 'minmax(0, 1fr) minmax(0, 300px)' : 'minmax(0, 1fr)',
      gap: 24,
      alignItems: 'center',
      padding: twoCol ? '36px 32px' : '24px 20px 28px',
      height: '100%',
      overflow: 'hidden',
      animation: 'ns-fade-in 0.5s ease 0.15s both',
    }}
  >
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>
          <span style={{ color: p.color }}>{index}</span> // {p.title}
        </div>
        <h3 style={{ fontFamily: GROTESK, fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 12 }}>{p.heading}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', maxWidth: 460 }}>{p.desc}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 24 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Good at</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {p.goodAt.map((g) => (
              <li key={g} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ width: 4, height: 4, flexShrink: 0, background: p.color }} />{g}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Working now</div>
          <WorkingNow items={p.working} color={p.color} />
        </div>
      </div>
    </div>

    {/* 3D canvas lives only inside its own square box */}
    <div style={{ width: '100%', maxWidth: twoCol ? 300 : 260, aspectRatio: '1 / 1', margin: '0 auto', padding: 12, boxSizing: 'border-box', border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.015)' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <PointCloud shape={p.shape} color={p.color} />
      </div>
    </div>
  </div>
)

export default function EngineAccordion() {
  const [active, setActive] = useState(0)
  const width = useViewportWidth()
  const stacked = width < 1024 // full-width header bars below lg
  const twoCol = width >= 768 // text + canvas side by side from md up

  return (
    <section style={{ background: '#050508', color: '#fff', borderBottom: `1px solid ${LINE}`, position: 'relative', overflow: 'hidden' }}>
      <AsciiField />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: stacked ? 'column' : 'row', height: stacked ? 'auto' : 540 }}>
        {PANELS.map((p, i) => {
          const open = i === active
          const index = String(i + 1).padStart(2, '0')

          if (stacked) {
            return (
              <div key={p.title} style={{ borderTop: i > 0 ? `1px solid ${LINE}` : 'none', background: 'transparent' }}>
                <button
                  onClick={() => setActive(i)}
                  aria-expanded={open}
                  style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: open ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                    <span style={{ color: p.color }}>{index}</span> // {p.title}
                  </span>
                  <span style={{ width: 8, height: 8, background: p.color, boxShadow: open ? `0 0 12px ${p.color}` : 'none', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
                {open && <PanelBody p={p} index={index} twoCol={twoCol} />}
              </div>
            )
          }

          return (
            <div
              key={p.title}
              role={open ? undefined : 'button'}
              tabIndex={open ? -1 : 0}
              aria-expanded={open}
              aria-label={open ? undefined : `Expand ${p.title}`}
              onClick={() => setActive(i)}
              onKeyDown={(e) => { if (!open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setActive(i) } }}
              style={{
                position: 'relative',
                flex: open ? '1 1 0' : '0 0 68px',
                minWidth: 0,
                borderLeft: i > 0 ? `1px solid ${LINE}` : 'none',
                background: 'transparent',
                cursor: open ? 'default' : 'pointer',
                overflow: 'hidden',
                transition: 'flex 0.6s cubic-bezier(0.7, 0, 0.2, 1), background 0.3s',
              }}
              onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
            >
              {open ? (
                <PanelBody p={p} index={index} twoCol />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', pointerEvents: 'none' }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    <span style={{ color: p.color }}>{index}</span> // {p.title}
                  </span>
                  <span style={{ width: 8, height: 8, background: p.color, boxShadow: `0 0 10px ${p.color}` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
