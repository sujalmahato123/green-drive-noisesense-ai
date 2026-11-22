import { useState, useMemo } from 'react'
import AsciiField from './AsciiField'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const LINE = 'rgba(255,255,255,0.1)'
const VIOLET = '#6D5DF6'
const LIMIT = 65 // CPCB commercial day limit
const MIN = 40
const MAX = 100

// 36 days of network Leq, deterministic so the chart is stable between renders
const buildSeries = () => {
  const today = new Date()
  return Array.from({ length: 36 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (35 - i))
    const weekend = d.getDay() === 5 || d.getDay() === 6
    const v = 71 + 8 * Math.sin(i * 0.55) + 5 * Math.sin(i * 1.7 + 1) + (weekend ? 6 : 0) + ((i * 37) % 7) * 0.6
    return {
      label: `${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${String(d.getDate()).padStart(2, '0')}`,
      value: +v.toFixed(1),
    }
  })
}

export default function ImpactChart() {
  const data = useMemo(buildSeries, [])
  const [hover, setHover] = useState(null)
  const avg = data.reduce((s, d) => s + d.value, 0) / data.length
  const peak = data.reduce((m, d) => (d.value > m.value ? d : m), data[0])
  const over = data.filter((d) => d.value > LIMIT).length
  const pct = (v) => ((v - MIN) / (MAX - MIN)) * 100

  return (
    <section style={{ background: '#050508', color: '#fff', borderBottom: `1px solid ${LINE}`, position: 'relative', overflow: 'hidden' }}>
      <AsciiField zIndex={1} />
      <div className="ns-page-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 1400, margin: '0 auto', padding: '88px 48px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
              <span style={{ color: VIOLET }}>06</span> // Impact · 36-day network Leq
            </div>
            <h2 style={{ fontFamily: GROTESK, fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {over} of 36 days<br />
              <span style={{ color: VIOLET }}>over the limit.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 1, background: LINE, border: `1px solid ${LINE}` }}>
            {[
              ['Avg Leq', `${avg.toFixed(1)} dB`],
              ['Peak', `${peak.value} dB`],
              ['CPCB Limit', `${LIMIT} dB`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#050508', padding: '14px 20px' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{k}</div>
                <div style={{ fontFamily: GROTESK, fontSize: 22, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', height: 300, paddingTop: 44 }} onMouseLeave={() => setHover(null)}>
          {/* limit line */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct(LIMIT) * 2.56}px`, borderTop: '1px dashed rgba(239,68,68,0.6)', zIndex: 1, pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', right: 0, top: -18, fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: 'rgba(239,68,68,0.85)' }}>CPCB {LIMIT} dB</span>
          </div>

          <div style={{ position: 'relative', height: 256, display: 'flex', alignItems: 'flex-end', gap: 'clamp(2px, 0.6vw, 8px)', borderBottom: `1px solid ${LINE}` }}>
            {data.map((d, i) => {
              const on = hover === i
              const dim = hover !== null && !on
              const overLimit = d.value > LIMIT
              return (
                <button
                  key={d.label}
                  aria-label={`${d.label}: ${d.value} dB`}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  style={{ position: 'relative', flex: 1, height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                >
                  <span
                    style={{
                      width: '100%',
                      maxWidth: 10,
                      height: `${pct(d.value)}%`,
                      background: on ? '#fff' : overLimit ? VIOLET : 'rgba(109,93,246,0.4)',
                      opacity: dim ? 0.3 : 1,
                      boxShadow: on ? '0 0 18px rgba(109,93,246,0.9)' : 'none',
                      transition: 'opacity 0.2s, background 0.2s, box-shadow 0.2s',
                    }}
                  />
                  {on && (
                    <span
                      role="tooltip"
                      style={{ position: 'absolute', bottom: `calc(${pct(d.value)}% + 12px)`, left: '50%', transform: `translateX(${i < 4 ? '-15%' : i > 31 ? '-85%' : '-50%'})`, whiteSpace: 'nowrap', background: '#050508', border: `1px solid ${VIOLET}`, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', padding: '6px 10px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: '#fff', zIndex: 5, pointerEvents: 'none' }}
                    >
                      {d.label}: <span style={{ color: d.value > LIMIT ? '#EF4444' : '#10B981' }}>{d.value} dB</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)' }}>
          <span>{data[0].label}</span>
          <span>Sample network data · hover any bar</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      </div>
    </section>
  )
}
