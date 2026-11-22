import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import PageHero from '../components/PageHero'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const LINE = 'rgba(255,255,255,0.1)'
const VIOLET = '#6D5DF6'
const label = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'ai', label: 'AI & Audio' },
  { id: 'backend', label: 'Backend' },
  { id: 'standards', label: 'Standards' },
]

const MODULES = [
  { cat: 'hardware', name: 'ESP32-S3', desc: 'Dual-core edge MCU with Wi-Fi; runs capture, A-weighting and uplink.', tags: ['240 MHz', 'Wi-Fi', 'Edge'] },
  { cat: 'hardware', name: 'INMP441 I2S Mic', desc: 'Omnidirectional MEMS microphone with 24-bit digital I2S output.', tags: ['I2S', '61 dB SNR', 'MEMS'] },
  { cat: 'hardware', name: 'MAX9814 Mic Amp', desc: 'Analog fallback mic with automatic gain control for loud junctions.', tags: ['AGC', 'Analog'] },
  { cat: 'hardware', name: 'MicroSD Logger', desc: 'Buffers raw readings locally when the uplink drops.', tags: ['SPI', 'Offline'] },
  { cat: 'hardware', name: '18650 + TP4056', desc: 'Li-ion cell and charge controller for pole-mounted nodes.', tags: ['3.7 V', 'Battery'] },
  { cat: 'hardware', name: '6 V Solar Panel', desc: 'Keeps rooftop and pole nodes running without mains power.', tags: ['Solar', 'Off-grid'] },
  { cat: 'hardware', name: 'IP65 Enclosure', desc: 'Weatherproof housing with acoustic mesh for monsoon conditions.', tags: ['IP65', 'Outdoor'] },
  { cat: 'hardware', name: 'SIM800L GSM', desc: 'Backup cellular uplink for sites without reliable Wi-Fi.', tags: ['2G', 'Fallback'] },
  { cat: 'ai', name: 'Google YAMNet', desc: 'Pretrained AudioSet classifier that labels 521 sound event classes.', tags: ['521 classes', 'MobileNet'] },
  { cat: 'ai', name: 'TensorFlow Lite', desc: 'Runtime for the YAMNet model on the classification server.', tags: ['TFLite', 'Inference'] },
  { cat: 'ai', name: 'Librosa', desc: 'Resampling and log-mel feature extraction for uploaded audio.', tags: ['Python', 'DSP'] },
  { cat: 'ai', name: 'A-Weighting Filter', desc: 'Matches readings to human hearing before dB(A) is computed.', tags: ['dB(A)', 'IEC curve'] },
  { cat: 'ai', name: 'Leq Engine', desc: 'Energy-averaged continuous sound level over rolling windows.', tags: ['Leq', 'Rolling'] },
  { cat: 'ai', name: 'FFT Spectrum', desc: 'Frequency breakdown that powers the live spectrum bars.', tags: ['FFT', 'Realtime'] },
  { cat: 'backend', name: 'FastAPI', desc: 'Async Python API serving readings, alerts, rankings and classification.', tags: ['Python', 'REST'] },
  { cat: 'backend', name: 'SQLite', desc: 'Embedded store for readings, locations and alert history.', tags: ['SQL', 'Embedded'] },
  { cat: 'backend', name: 'SQLAlchemy', desc: 'ORM models for locations, noise readings and alerts.', tags: ['ORM'] },
  { cat: 'backend', name: 'Uvicorn', desc: 'ASGI server running the FastAPI app.', tags: ['ASGI'] },
  { cat: 'backend', name: 'WebSockets', desc: 'Push channel for streaming node readings to the Control Center.', tags: ['Realtime', 'Push'] },
  { cat: 'backend', name: 'React + Vite', desc: 'Frontend for the site and the Control Center.', tags: ['React 18', 'HMR'] },
  { cat: 'backend', name: 'Leaflet Maps', desc: 'Interactive Kolkata map with live node markers.', tags: ['Maps', 'Open source'] },
  { cat: 'backend', name: 'Recharts', desc: 'Leq trendlines and analytics charts.', tags: ['Charts', 'SVG'] },
  { cat: 'standards', name: 'CPCB Noise Rules 2000', desc: 'Day and night limits for industrial, commercial, residential and silence zones.', tags: ['India', 'Legal limits'] },
  { cat: 'standards', name: 'IEC 61672', desc: 'Sound level meter specification used as the calibration reference.', tags: ['Calibration'] },
  { cat: 'standards', name: 'ISO 1996-2', desc: 'Method for measuring environmental noise levels.', tags: ['Measurement'] },
  { cat: 'standards', name: 'WHO Noise Guidelines', desc: 'Health-based targets used to set the silence-zone weighting.', tags: ['Health'] },
]

const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label

export default function Hardware() {
  const [cat, setCat] = useState('all')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const matchesQuery = (m) => !q || [m.name, m.desc, ...m.tags].some((s) => s.toLowerCase().includes(q))
  const results = useMemo(() => MODULES.filter((m) => (cat === 'all' || m.cat === cat) && matchesQuery(m)), [cat, q]) // eslint-disable-line react-hooks/exhaustive-deps
  const countFor = (id) => MODULES.filter((m) => (id === 'all' || m.cat === id) && matchesQuery(m)).length

  return (
    <div style={{ background: '#050508', color: '#fff' }}>
      <PageHero index="05" kicker="Hardware & Stack" title="Every module," accent="one signal chain.">
        The full bill of materials, from the MEMS microphone on the pole to the standard the alert is judged against.
      </PageHero>

      <section style={{ borderBottom: `1px solid ${LINE}` }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', borderBottom: `1px solid ${LINE}` }}>
          <div role="tablist" aria-label="Module category" style={{ display: 'flex', overflowX: 'auto', flex: '1 1 auto' }}>
            {CATEGORIES.map((c) => {
              const on = c.id === cat
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setCat(c.id)}
                  style={{ padding: '18px 22px', background: on ? 'rgba(109,93,246,0.08)' : 'transparent', border: 'none', borderRight: `1px solid ${LINE}`, boxShadow: on ? `inset 0 -2px 0 ${VIOLET}` : 'none', color: on ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
                >
                  {c.label} <span style={{ color: on ? VIOLET : 'rgba(255,255,255,0.3)', marginLeft: 6 }}>{String(countFor(c.id)).padStart(2, '0')}</span>
                </button>
              )
            })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', flex: '1 1 280px', maxWidth: 460, minHeight: 56, borderLeft: `1px solid ${LINE}` }}>
            <Search size={15} color="rgba(255,255,255,0.45)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${MODULES.length} modules...`}
              aria-label="Search modules"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em' }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <X size={14} />
              </button>
            )}
          </label>
        </div>

        {/* Grid */}
        {results.length ? (
          <div className="ns-grid-4" style={{ background: LINE }}>
            {results.map((m) => (
              <article
                key={m.name}
                style={{ background: '#050508', padding: '26px 24px 24px', minHeight: 210, display: 'flex', flexDirection: 'column', gap: 14, transition: 'background 0.25s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#101018')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#050508')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...label, fontSize: 9, color: VIOLET }}>{catLabel(m.cat)}</span>
                  <span style={{ width: 6, height: 6, background: VIOLET, boxShadow: `0 0 10px ${VIOLET}` }} />
                </div>
                <h3 style={{ fontFamily: GROTESK, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{m.name}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{m.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.tags.map((t) => (
                    <span key={t} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', border: `1px solid ${LINE}`, padding: '3px 7px' }}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ ...label, marginBottom: 12 }}>No modules match "{query}"</div>
            <button onClick={() => { setQuery(''); setCat('all') }} style={{ background: 'none', border: `1px solid ${LINE}`, color: '#fff', padding: '10px 14px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
