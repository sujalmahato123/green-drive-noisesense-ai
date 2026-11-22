import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'
import PageHero from '../components/PageHero'
import AsciiReveal from '../components/AsciiReveal'
import { LOCATIONS, CPCB, STATUS_COLOR, CATEGORIES } from '../data/locations'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const LINE = 'rgba(255,255,255,0.1)'
const label = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }

const defaultViewFor = (loc) => (loc.status === 'CRITICAL' ? 'satellite' : 'land')

const StatusBadge = ({ loc }) => {
  const c = STATUS_COLOR[loc.status]
  return (
    <span style={{ ...label, fontSize: 9, color: '#fff', background: 'rgba(5,8,24,0.85)', border: `1px solid ${c}`, padding: '6px 8px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} />
      <span style={{ color: c, fontWeight: 600 }}>{loc.db} dB</span>
    </span>
  )
}

// Mounts its children (map + canvas) only once the card is near the viewport
const LazyMount = ({ height, children }) => {
  const ref = useRef(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (show) return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShow(true) }, { rootMargin: '400px 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [show])
  return (
    <div ref={ref} style={{ minHeight: height, background: '#050818' }}>
      {show ? children : <div style={{ height, display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>LOADING NODE…</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detail modal                                                        */
/* ------------------------------------------------------------------ */
const LocationModal = ({ loc, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const c = STATUS_COLOR[loc.status]
  const limit = CPCB[loc.zone]
  const over = loc.db - limit.day

  return (
    <div role="dialog" aria-modal="true" aria-label={`${loc.name} detail`} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(5,5,9,0.78)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 16, animation: 'ns-fade-in 0.25s ease both' }}>
      <div onClick={(e) => e.stopPropagation()} className="ns-modal" style={{ width: 'min(1180px, 100%)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', background: '#050508', border: `1px solid ${LINE}`, boxShadow: `0 0 60px rgba(0,0,0,0.6), 0 0 0 1px ${c}33` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${LINE}` }}>
          <span style={label}>
            <span style={{ color: '#6D5DF6' }}>Investigation</span> // {loc.type}
          </span>
          <button onClick={onClose} aria-label="Close detail" style={{ background: 'none', border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: 28, height: 28, display: 'grid', placeItems: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div className="ns-modal-grid">
          <AsciiReveal name={loc.name} lat={loc.lat} lng={loc.lng} sv={loc.sv} noise={loc.db} color={c} defaultView={defaultViewFor(loc)} filtered={false} height={560} zoom={16} hud={{ db: loc.db, limit: loc.limit, category: loc.category }}>
            <StatusBadge loc={loc} />
          </AsciiReveal>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22, borderLeft: `1px solid ${LINE}` }}>
            <div>
              <h2 style={{ fontFamily: GROTESK, fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{loc.name}</h2>
              <div style={{ ...label, marginTop: 8 }}>{loc.lat.toFixed(4)}°N {loc.lng.toFixed(4)}°E</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: GROTESK, fontSize: 64, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: c }}>{loc.db}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>dB(A)</span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: c, border: `1px solid ${c}`, padding: '5px 8px' }}>{loc.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: LINE, border: `1px solid ${LINE}` }}>
              {[
                ['CPCB zone', loc.zoneLabel],
                ['Day / Night', `${limit.day} / ${limit.night} dB`],
                ['Weight', `${loc.weight.toFixed(1)}x`],
                ['Over limit', over > 0 ? `+${over} dB` : 'Within'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#050508', padding: '10px 12px' }}>
                  <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>{k}</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: k === 'Over limit' && over > 0 ? c : '#fff' }}>{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ ...label, fontSize: 9, marginBottom: 10 }}>Why it's loud</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>{loc.cause}</p>
            </div>
            <div>
              <div style={{ ...label, fontSize: 9, marginBottom: 10 }}>Detected sources</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {loc.sources.map((s) => (
                  <span key={s} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)', border: `1px solid ${LINE}`, padding: '5px 8px' }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...label, fontSize: 9, marginBottom: 10 }}>Recommended action</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>{loc.action}</p>
            </div>
            <div style={{ marginTop: 'auto', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Use 👁️ 360° Street View to walk {loc.sv.road} and see the sources for yourself.
              {loc.svNote && <span style={{ display: 'block', marginTop: 6, color: 'rgba(245,158,11,0.8)' }}>{loc.svNote}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Locations() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const q = query.trim().toLowerCase()
  const matches = (l) => !q || [l.name, l.type, l.zoneLabel, l.sv.road, ...l.sources].some((t) => t.toLowerCase().includes(q))
  const shown = LOCATIONS.filter((l) => (filter === 'all' || l.category === filter) && matches(l))
  const count = (f) => LOCATIONS.filter((l) => (f === 'all' || l.category === f) && matches(l)).length
  const silence = LOCATIONS.filter((l) => l.zone === 'silence')
  const silenceOver = silence.filter((l) => l.status !== 'NORMAL').length

  return (
    <div style={{ background: '#050508', color: '#fff' }}>
      <PageHero index="03" kicker="Locations · Investigation" title="32 nodes across Kolkata." accent="Silence zones first.">
        Centred on Techno India University in Salt Lake Sector V. Hospitals, colleges and schools are CPCB silence zones with a 50 dB day limit. Hover a card to lift the signal filter, then switch between satellite, land map and 360° street view to trace each noise source to the street that makes it.
      </PageHero>

      <section style={{ borderBottom: `1px solid ${LINE}` }}>
        {/* filter bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', justifyContent: 'space-between', borderBottom: `1px solid ${LINE}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', minHeight: 56, flex: '1 1 300px', maxWidth: 420, borderRight: `1px solid ${LINE}` }}>
            <Search size={15} color="rgba(255,255,255,0.45)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Techno India, SSKM, Esplanade..."
              aria-label="Search locations"
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: MONO, fontSize: 12 }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <X size={14} />
              </button>
            )}
          </label>
          <div role="tablist" aria-label="Filter by zone" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', overflowX: 'auto', flex: '10 1 auto' }}>
            {CATEGORIES.map(({ id: f, label: name }) => {
              const on = f === filter
              const c = { hospital: '#EF4444', school: '#A78BFA', traffic: '#F59E0B' }[f]
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(f)}
                  className="ns-pill"
                  data-on={on}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', whiteSpace: 'nowrap' }}
                >
                  {c && <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? '#fff' : c, boxShadow: `0 0 8px ${c}` }} />}
                  {name.toUpperCase()} ({count(f)})
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
            <span style={{ color: '#EF4444' }}>{silenceOver} of {silence.length} silence zones over 50 dB</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span>Clear view holds 10 s</span>
          </div>
        </div>

        {/* grid */}
        {!shown.length && (
          <div style={{ padding: '72px 24px', textAlign: 'center' }}>
            <div style={{ ...label, marginBottom: 12 }}>No locations match "{query}"</div>
            <button onClick={() => { setQuery(''); setFilter('all') }} style={{ background: 'none', border: `1px solid ${LINE}`, color: '#fff', padding: '10px 14px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Reset filters</button>
          </div>
        )}
        <div className="ns-grid-4" style={{ background: LINE }}>
          {shown.map((loc, i) => {
            const c = STATUS_COLOR[loc.status]
            const limit = CPCB[loc.zone]
            return (
              <article key={loc.id} style={{ background: '#050508', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <LazyMount height={380}>
                  <AsciiReveal name={loc.name} lat={loc.lat} lng={loc.lng} sv={loc.sv} noise={loc.db} color={c} defaultView={defaultViewFor(loc)} height={380} onExpand={() => setOpen(loc)} hud={{ db: loc.db, limit: loc.limit, category: loc.category }}>
                    <StatusBadge loc={loc} />
                  </AsciiReveal>
                </LazyMount>

                <div style={{ padding: '18px 18px 20px', borderTop: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...label, fontSize: 9 }}>
                      <span style={{ color: '#6D5DF6' }}>{String(LOCATIONS.indexOf(loc) + 1).padStart(2, '0')}</span> // {loc.zoneLabel}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: c }}>● {loc.status}</span>
                  </div>
                  {loc.featured && (
                    <span style={{ alignSelf: 'flex-start', fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fff', background: '#6D5DF6', boxShadow: '0 0 16px rgba(109,93,246,0.6)', padding: '4px 8px' }}>★ Primary campus node</span>
                  )}
                  <h2 style={{ fontFamily: GROTESK, fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{loc.name}</h2>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{loc.type}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: LINE, border: `1px solid ${LINE}` }}>
                    <div style={{ background: '#050508', padding: '8px 10px' }}>
                      <div style={{ ...label, fontSize: 8.5, marginBottom: 4 }}>Live Leq</div>
                      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: c }}>{loc.db} dB</div>
                    </div>
                    <div style={{ background: '#050508', padding: '8px 10px' }}>
                      <div style={{ ...label, fontSize: 8.5, marginBottom: 4 }}>CPCB Limit</div>
                      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>{limit.day} dB</div>
                    </div>
                    <div style={{ background: '#050508', padding: '8px 10px' }}>
                      <div style={{ ...label, fontSize: 8.5, marginBottom: 4 }}>Weight</div>
                      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: loc.weight > 1 ? '#A78BFA' : '#fff' }}>{loc.weight.toFixed(1)}x</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(loc)}
                    style={{ marginTop: 'auto', alignSelf: 'flex-start', background: 'none', border: `1px solid ${LINE}`, color: '#fff', padding: '9px 12px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6D5DF6'; e.currentTarget.style.color = '#6D5DF6' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.color = '#fff' }}
                  >
                    Investigate →
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {open && <LocationModal loc={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
