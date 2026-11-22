import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import { streetPointFor } from '../components/StreetView'
import AsciiReveal from '../components/AsciiReveal'
import { LOCATIONS, CPCB, CATEGORY_RULES, statusFor as zoneStatus } from '../data/locations'
import L from 'leaflet'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'
import { ArrowLeft, Download, Upload, X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#0A0A0E',
  line: 'rgba(255,255,255,0.1)',
  dim: 'rgba(255,255,255,0.45)',
  faint: 'rgba(255,255,255,0.25)',
  violet: '#6D5DF6',
  red: '#EF4444',
  amber: '#F59E0B',
  emerald: '#10B981',
}
const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const label = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dim }

const STATUS_COLOR = { CRITICAL: C.red, WARNING: C.amber, COMPLIANT: C.emerald }

// Demo nodes mirror the Locations page dataset (silence zones + traffic hotspots)
const DEMO_NODES = LOCATIONS.map((l, i) => ({
  id: i + 1,
  name: l.name,
  zone: l.zoneLabel,
  limit: CPCB[l.zone].day,
  criticalMargin: l.criticalMargin,
  category: l.category,
  weight: l.weight,
  base: l.db,
  source: l.sources[0],
  lat: l.lat,
  lng: l.lng,
}))

const PRESETS = {
  'Vehicle Horn': { db: 98, conf: 0.94, profile: (i, t) => 0.75 + 0.2 * Math.sin(i * 0.9 + t * 9) },
  Drilling: { db: 92, conf: 0.91, profile: (i, t) => 0.35 + 0.6 * Math.abs(Math.sin(i * 0.5 + t * 22)) },
  Shouting: { db: 84, conf: 0.87, profile: (i, t) => 0.2 + 0.7 * Math.max(0, Math.sin(i * 0.25 - t * 4)) ** 2 },
  'Loud Music': { db: 88, conf: 0.9, profile: (i, t) => 0.3 + 0.55 * Math.abs(Math.sin(i * 0.35 + t * 6)) * (0.6 + 0.4 * Math.sin(t * 3)) },
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const energyLeq = (values) =>
  values.length ? 10 * Math.log10(values.reduce((s, v) => s + 10 ** (v / 10), 0) / values.length) : 0
const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false })

const seedHistory = (base) => Array.from({ length: 24 }, () => clamp(base + (Math.random() - 0.5) * 10, 40, 110))
const makeDemoNodes = () =>
  DEMO_NODES.map((n) => {
    const history = seedHistory(n.base)
    return { ...n, noise: +history[history.length - 1].toFixed(1), history, lastUpdate: clock() }
  })

// Zone metadata for live backend nodes: prefer what the API sends, else match the dataset by name
const zoneFor = (l) => {
  const hit = LOCATIONS.find((d) => d.name.toLowerCase() === (l.name || '').toLowerCase())
  const category = l.category || hit?.category || 'traffic'
  const rule = CATEGORY_RULES[category] || CATEGORY_RULES.traffic
  if (l.zone && l.zoneLimit) return { zone: l.zone, limit: l.zoneLimit, weight: l.weight ?? rule.weight, category, criticalMargin: rule.critical }
  if (hit) return { zone: hit.zoneLabel, limit: hit.limit, weight: hit.weight, category, criticalMargin: hit.criticalMargin }
  return { zone: 'Commercial', limit: 65, weight: 1.0, category, criticalMargin: rule.critical }
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */
const Cross = ({ style }) => (
  <span aria-hidden="true" style={{ position: 'absolute', fontFamily: MONO, fontSize: 12, lineHeight: '12px', width: 12, height: 12, textAlign: 'center', color: 'rgba(255,255,255,0.4)', zIndex: 3, pointerEvents: 'none', ...style }}>+</span>
)

const Brackets = ({ color = 'rgba(255,255,255,0.55)' }) => {
  const b = { position: 'absolute', width: 10, height: 10, borderColor: color, borderStyle: 'solid', pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...b, top: 10, left: 10, borderWidth: '1px 0 0 1px' }} />
      <span style={{ ...b, top: 10, right: 10, borderWidth: '1px 1px 0 0' }} />
      <span style={{ ...b, bottom: 10, left: 10, borderWidth: '0 0 1px 1px' }} />
      <span style={{ ...b, bottom: 10, right: 10, borderWidth: '0 1px 1px 0' }} />
    </>
  )
}

const Panel = ({ title, index, right, children, glow, brackets, bracketColor, style, bodyStyle }) => (
  <div style={{ position: 'relative', background: C.bg, display: 'flex', flexDirection: 'column', minWidth: 0, ...style }}>
    <Cross style={{ top: -6, left: -6 }} />
    <Cross style={{ top: -6, right: -6 }} />
    <Cross style={{ bottom: -6, left: -6 }} />
    <Cross style={{ bottom: -6, right: -6 }} />
    {glow && (
      <div className="ns-glow" style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${glow}, transparent 70%)`, pointerEvents: 'none' }} />
    )}
    {brackets && <Brackets color={bracketColor} />}
    {title && (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
        <span style={label}>
          {index && <span style={{ color: C.violet, marginRight: 10 }}>{index}</span>}
          {title}
        </span>
        {right}
      </div>
    )}
    <div style={{ position: 'relative', flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
  </div>
)

const Sparkbars = ({ values, color = C.violet, height = 28, highlightLast = true }) => {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(8, ((v - min) / (max - min || 1)) * 100)}%`,
            background: color,
            opacity: highlightLast && i === values.length - 1 ? 1 : 0.25 + (i / values.length) * 0.45,
            transition: 'height 0.4s ease',
          }}
        />
      ))}
    </div>
  )
}

const Tag = ({ color, children, solid }) => (
  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 7px', color: solid ? C.bg : color, background: solid ? color : 'transparent', border: `1px solid ${color}`, whiteSpace: 'nowrap' }}>
    {children}
  </span>
)

/* ------------------------------------------------------------------ */
/* Header widgets                                                      */
/* ------------------------------------------------------------------ */
const LiveClock = () => {
  const [now, setNow] = useState(clock())
  useEffect(() => {
    const id = setInterval(() => setNow(clock()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em' }}>{now} IST</span>
}

const ModeSwitch = ({ demo, onChange }) => (
  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${C.line}`, padding: 2 }}>
    <div style={{ position: 'absolute', top: 2, bottom: 2, left: 2, width: 'calc(50% - 2px)', background: demo ? C.violet : C.emerald, transform: demo ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.35s cubic-bezier(0.2,0.8,0.2,1), background 0.35s', boxShadow: `0 0 18px ${demo ? 'rgba(109,93,246,0.5)' : 'rgba(16,185,129,0.45)'}` }} />
    {[
      { key: true, text: 'Demo Mode' },
      { key: false, text: 'Live Device (ESP32)' },
    ].map((o) => (
      <button
        key={o.text}
        onClick={() => onChange(o.key)}
        style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '7px 14px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: demo === o.key ? '#fff' : C.dim, transition: 'color 0.3s' }}
      >
        {o.text}
      </button>
    ))}
  </div>
)

/* ------------------------------------------------------------------ */
/* Map                                                                 */
/* ------------------------------------------------------------------ */
const iconCache = {}
const markerIcon = (color, active) => {
  const key = `${color}-${active}`
  if (!iconCache[key]) {
    iconCache[key] = L.divIcon({
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html: `<div class="ns-marker" style="--c:${color}"><span class="ns-ring"></span><span class="ns-ring ns-ring2"></span><span class="ns-core${active ? ' ns-active' : ''}"></span></div>`,
    })
  }
  return iconCache[key]
}

const FlyTo = ({ target }) => {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng + 0.025], 13.4, { duration: 0.8 })
  }, [target?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const noiseRadius = (db) => Math.max(60, (db - 45) * 7) // metres, matches the location cards

// Same 3-tab investigation viewer as the Locations cards, without the ASCII filter
const DrawerMedia = ({ node }) => (
  <div style={{ borderBottom: `1px solid ${C.line}` }}>
    <AsciiReveal
      key={node.id}
      name={node.name}
      lat={node.lat}
      lng={node.lng}
      sv={streetPointFor(node.name, node.lat, node.lng)}
      noise={node.noise}
      color={STATUS_COLOR[node.status]}
      defaultView={node.status === 'CRITICAL' ? 'satellite' : 'land'}
      filtered={false}
      hud={{ db: node.noise, limit: node.limit, category: node.category }}
      height={300}
      zoom={16}
    />
  </div>
)

const LocationDrawer = ({ node, onClose }) => {
  const open = Boolean(node)
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 360, maxWidth: '92%', zIndex: 1000, background: 'rgba(10,10,14,0.92)', backdropFilter: 'blur(12px)', borderLeft: `1px solid ${C.line}`, transform: open ? 'translateX(0)' : 'translateX(105%)', transition: 'transform 0.45s cubic-bezier(0.2,0.8,0.2,1)', display: 'flex', flexDirection: 'column' }}>
      {node && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
            <span style={label}>Node {String(node.id).padStart(2, '0')} // Detail</span>
            <button onClick={onClose} aria-label="Close location detail" style={{ background: 'none', border: `1px solid ${C.line}`, color: C.dim, cursor: 'pointer', width: 24, height: 24, display: 'grid', placeItems: 'center' }}>
              <X size={12} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
          <DrawerMedia node={node} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontFamily: GROTESK, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{node.name}</div>
              <div style={{ ...label, marginTop: 6 }}>{node.zone}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: GROTESK, fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: STATUS_COLOR[node.status] }}>{node.noise.toFixed(1)}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>dB(A)</span>
            </div>
            <Sparkbars values={node.history} color={STATUS_COLOR[node.status]} height={44} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
              {[
                ['Status', <Tag key="s" color={STATUS_COLOR[node.status]}>{node.status}</Tag>],
                ['Zone Weight', `${node.weight.toFixed(1)}x`],
                ['Priority', `${node.score} / 100`],
                ['Pattern', node.persistent ? 'Persistent' : 'Temporary'],
                ['Source', node.source],
                ['CPCB Limit', `${node.limit} dB`],
              ].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, padding: '10px 12px' }}>
                  <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>{k}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, letterSpacing: '0.08em' }}>
              {node.lat.toFixed(4)}°N {node.lng.toFixed(4)}°E · UPDATED {node.lastUpdate}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sound sandbox                                                       */
/* ------------------------------------------------------------------ */
const Waveform = ({ preset, active }) => {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 0.08), 80)
    return () => clearInterval(id)
  }, [])
  const profile = PRESETS[preset]?.profile
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 3, height: 92, overflow: 'hidden' }}>
      {Array.from({ length: 56 }, (_, i) => {
        const amp = active && profile ? clamp(profile(i, t) + (Math.random() - 0.5) * 0.12, 0.06, 1) : 0.06 + 0.05 * Math.abs(Math.sin(i * 0.6 + t * 2))
        return (
          <div key={i} style={{ flex: 1, height: `${amp * 100}%`, background: active ? C.violet : '#2A2A35', boxShadow: active && amp > 0.7 ? '0 0 10px rgba(109,93,246,0.7)' : 'none', transition: 'height 0.08s linear' }} />
        )
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: C.line }} />
    </div>
  )
}

const SoundSandbox = () => {
  const [preset, setPreset] = useState(null)
  const [status, setStatus] = useState('idle') // idle | analysing | done | error
  const [result, setResult] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const timer = useRef()

  useEffect(() => () => clearTimeout(timer.current), [])

  const runPreset = (name) => {
    clearTimeout(timer.current)
    setPreset(name)
    setFileName('')
    setStatus('analysing')
    timer.current = setTimeout(() => {
      const p = PRESETS[name]
      setResult({ soundType: name, confidence: p.conf, db: p.db, origin: 'Preset sample' })
      setStatus('done')
    }, 900)
  }

  const classifyFile = async (file) => {
    if (!file) return
    if (!/\.(wav|mp3)$/i.test(file.name)) {
      setStatus('error')
      setResult({ error: 'Only .wav or .mp3 files are supported' })
      return
    }
    setFileName(file.name)
    setPreset('Loud Music')
    setStatus('analysing')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await axios.post('/api/classify-audio', fd, { timeout: 8000 })
      if (!data || typeof data !== 'object' || !data.soundType || data.error) throw new Error('no classifier')
      setResult({ soundType: data.soundType, confidence: data.confidence, db: null, origin: 'Classified by YAMNet backend' })
      setStatus('done')
    } catch {
      // No backend (e.g. the static Vercel deploy): simulate a classification from the file name
      const name = file.name.toLowerCase()
      const guess =
        /horn|honk|car|traffic|bus/.test(name) ? 'Vehicle Horn'
          : /drill|construct|hammer/.test(name) ? 'Drilling'
            : /shout|crowd|voice|speech|yell/.test(name) ? 'Shouting'
              : /music|song|speaker|dj/.test(name) ? 'Loud Music'
                : Object.keys(PRESETS)[Math.floor(Math.random() * 4)]
      const p = PRESETS[guess]
      setPreset(guess)
      setTimeout(() => {
        setResult({ soundType: guess, confidence: +(p.conf - Math.random() * 0.08).toFixed(2), db: p.db, origin: 'Simulated classification (demo mode, no backend)' })
        setStatus('done')
      }, 900)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    classifyFile(e.dataTransfer.files?.[0])
  }

  const conf = result?.confidence != null ? Math.round(result.confidence * (result.confidence <= 1 ? 100 : 1)) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 18, height: '100%' }}>
      <div style={{ border: `1px solid ${C.line}`, padding: '12px 14px 10px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ ...label, fontSize: 9 }}>Input Signal</span>
          <span style={{ ...label, fontSize: 9, color: status === 'analysing' ? C.violet : C.faint }}>
            {status === 'analysing' ? '● Analysing' : preset ? `● ${preset}` : '○ Standby'}
          </span>
        </div>
        <Waveform preset={preset} active={status === 'analysing' || status === 'done'} />
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', border: `1px dashed ${dragging ? C.violet : 'rgba(255,255,255,0.2)'}`, background: dragging ? 'rgba(109,93,246,0.08)' : 'transparent', transition: 'all 0.2s' }}
      >
        <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', border: `1px solid ${C.line}`, color: C.violet, flexShrink: 0 }}>
          <Upload size={15} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>
            {fileName || 'Drop .wav / .mp3 or browse'}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 4 }}>{result?.origin && fileName ? result.origin : 'Sent to POST /api/classify-audio'}</div>
        </div>
        <input type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" style={{ display: 'none' }} onChange={(e) => classifyFile(e.target.files?.[0])} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {Object.keys(PRESETS).map((name) => {
          const on = preset === name && !fileName
          return (
            <button
              key={name}
              onClick={() => runPreset(name)}
              style={{ padding: '11px 10px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', color: on ? '#fff' : 'rgba(255,255,255,0.7)', background: on ? 'rgba(109,93,246,0.18)' : 'transparent', border: `1px solid ${on ? C.violet : C.line}`, boxShadow: on ? '0 0 22px rgba(109,93,246,0.45), inset 0 0 12px rgba(109,93,246,0.25)' : 'none', transition: 'all 0.25s' }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = 'rgba(109,93,246,0.6)' }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = C.line }}
            >
              {name}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
        {status === 'error' ? (
          <div style={{ gridColumn: '1 / -1', background: C.bg, padding: '12px 14px', fontFamily: MONO, fontSize: 11, color: C.red }}>
            ⚠ {result?.error}
          </div>
        ) : (
          [
            ['Classification', status === 'analysing' ? '…' : result?.soundType || '—'],
            ['Confidence', status === 'analysing' ? '…' : conf != null ? `${conf}%` : '—'],
            ['Level', status === 'analysing' ? '…' : result?.db ? `${result.db} dB` : '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: C.bg, padding: '10px 14px' }}>
              <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>{k}</div>
              <div style={{ fontFamily: GROTESK, fontSize: 17, fontWeight: 600, color: k === 'Classification' && result ? C.violet : '#fff' }}>{v}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
const Dashboard = ({ onSwitchToOverview, stickyTop = 0 }) => {
  const [demoMode, setDemoMode] = useState(true)
  const [threshold, setThreshold] = useState(65)
  const [nodes, setNodes] = useState(makeDemoNodes)
  const [trend, setTrend] = useState([])
  const [link, setLink] = useState('demo') // demo | connecting | ok | down
  const [selectedId, setSelectedId] = useState(null)
  const seededLive = useRef(false)
  const [liveOffline, setLiveOffline] = useState(false) // live mode requested but no backend reachable

  /* Demo telemetry: drift every node toward its baseline with random spikes */
  useEffect(() => {
    if (!demoMode) return
    setLink('demo')
    const id = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => {
          const spike = Math.random() < 0.06 ? 6 + Math.random() * 8 : 0
          const v = clamp(n.noise + (Math.random() - 0.5) * 4 + (n.base - n.noise) * 0.25 + spike, 40, 110)
          return { ...n, noise: +v.toFixed(1), history: [...n.history.slice(-23), v], lastUpdate: clock() }
        })
      )
    }, 2000)
    return () => clearInterval(id)
  }, [demoMode])

  /* Live telemetry: poll the FastAPI backend */
  useEffect(() => {
    if (demoMode) return
    let cancelled = false
    let connected = false
    seededLive.current = false
    setLink('connecting')
    const poll = async () => {
      try {
        const reqs = [axios.get('/api/locations', { timeout: 4000 })]
        if (!seededLive.current) reqs.push(axios.get('/api/analytics/timeseries?period=24h', { timeout: 4000 }))
        const [locRes, tsRes] = await Promise.all(reqs)
        if (cancelled) return
        setNodes((prev) =>
          locRes.data.map((l) => {
            const old = prev.find((p) => p.id === l.id && !p.base)
            const { zone, limit, weight, category, criticalMargin } = zoneFor(l)
            return {
              id: l.id,
              name: l.name,
              zone,
              limit,
              weight,
              category,
              criticalMargin,
              source: 'ESP32 · INMP441',
              lat: l.lat,
              lng: l.lng,
              noise: +Number(l.noiseLevel).toFixed(1),
              history: [...(old?.history || []).slice(-23), l.noiseLevel],
              lastUpdate: l.lastUpdate ? new Date(l.lastUpdate).toLocaleTimeString('en-GB', { hour12: false }) : clock(),
            }
          })
        )
        if (tsRes) {
          setTrend(tsRes.data.map((d) => ({ t: d.time, leq: d.avgNoise, peak: d.maxNoise, crit: 0 })))
          seededLive.current = true
        }
        connected = true
        setLiveOffline(false)
        setLink('ok')
      } catch {
        if (cancelled) return
        if (!connected) {
          // backend never answered (e.g. static hosting): quietly stay on simulated telemetry
          setLiveOffline(true)
          setDemoMode(true)
        } else {
          setLink('down')
        }
      }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [demoMode])

  const switchMode = (demo) => {
    if (demo === demoMode) return
    setSelectedId(null)
    setTrend([])
    if (demo) setNodes(makeDemoNodes())
    setDemoMode(demo)
  }

  /* Derived telemetry */
  // Status follows each zone's own CPCB day limit (silence zones 50 dB, residential 55, traffic 65)
  // Same rule as the Locations page: within 5 dB = compliant; critical at +20 dB (silence) / +15 dB (traffic)
  const statusFor = useCallback((v, limit, margin) => { const st = zoneStatus(v, limit, margin); return st === 'NORMAL' ? 'COMPLIANT' : st }, [])

  const ranked = useMemo(
    () =>
      nodes
        .map((n) => {
          const score = Math.min(100, Math.round(Math.max(0, n.noise - n.limit + 10) * n.weight * 1.6))
          const above = n.history.filter((v) => v >= n.limit).length
          const persistent = n.history.length >= 6 && above / n.history.length >= 0.6
          return { ...n, score, persistent, status: statusFor(n.noise, n.limit, n.criticalMargin) }
        })
        .sort((a, b) => b.score - a.score),
    [nodes, statusFor]
  )

  const leq = energyLeq(nodes.map((n) => n.noise))
  const peak = Math.max(...nodes.map((n) => n.noise), 0)
  const critical = ranked.filter((n) => n.status === 'CRITICAL')
  const top = ranked[0]
  const selected = ranked.find((n) => n.id === selectedId) || null

  useEffect(() => {
    if (!nodes.length) return
    setTrend((tr) => [...tr.slice(-39), { t: clock(), leq: +leq.toFixed(1), peak: +peak.toFixed(1), crit: critical.length }])
  }, [nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    const stamp = new Date().toISOString()
    const rows = [
      ['rank', 'location', 'zone', 'cpcb_limit_db', 'zone_weight', 'noise_db', 'priority_score', 'status', 'pattern', 'network_threshold_db', 'mode', 'exported_at'],
      ...ranked.map((n, i) => [i + 1, n.name, n.zone, n.limit, n.weight, n.noise, n.score, n.status, n.persistent ? 'PERSISTENT' : 'TEMPORARY', threshold, demoMode ? 'DEMO' : 'LIVE', stamp]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `noisesense-report-${stamp.slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const beacon = {
    demo: { c: C.violet, text: 'Simulated Feed' },
    connecting: { c: C.amber, text: 'Linking ESP32' },
    ok: { c: C.emerald, text: 'Uplink Active' },
    down: { c: C.red, text: 'Link Down · Retrying' },
  }[link]

  const leqSeries = trend.slice(-16).map((d) => d.leq)
  const critSeries = trend.slice(-16).map((d) => d.crit)

  return (
    <div style={{ background: C.bg, color: '#fff', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      {/* ============ Command header ============ */}
      <header style={{ position: 'sticky', top: stickyTop, zIndex: 2000, background: 'rgba(10,10,14,0.88)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px 28px', padding: '14px 28px' }}>
          <button onClick={onSwitchToOverview} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${C.line}`, color: 'rgba(255,255,255,0.8)', padding: '8px 12px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.violet)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}>
            <ArrowLeft size={13} /> Overview
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: GROTESK, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>NOISESENSE <span style={{ color: C.violet }}>/</span> COMMAND</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ns-beacon" style={{ '--c': beacon.c }} />
              <span style={{ ...label, fontSize: 9, color: beacon.c }}>{beacon.text}</span>
              <span style={{ color: C.faint }}>·</span>
              <LiveClock />
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <ModeSwitch demo={demoMode} onChange={switchMode} />
          {liveOffline && demoMode && (
            <span title="No FastAPI backend reachable from this deployment" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.amber, border: '1px solid rgba(245,158,11,0.4)', padding: '5px 8px' }}>
              Live backend offline · demo telemetry
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={label}>Threshold</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.faint }}>50</span>
            <input aria-label="Alert threshold in decibels" className="cc-range" type="range" min="50" max="100" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: 130 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.faint }}>100</span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(109,93,246,0.16)', border: `1px solid ${C.violet}`, padding: '4px 8px', minWidth: 58, textAlign: 'center' }}>{threshold} dB</span>
          </div>

          <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.violet, color: '#fff', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(109,93,246,0.35)' }}>
            <Download size={13} /> Export CSV Report
          </button>
        </div>
        <div style={{ position: 'relative', height: 1, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, width: '25%', height: 1, background: `linear-gradient(90deg, transparent, ${beacon.c}, transparent)`, animation: 'ns-scan 3.5s linear infinite' }} />
        </div>
      </header>

      {/* ============ Bento grid ============ */}
      <main style={{ padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: C.line, border: `1px solid ${C.line}`, maxWidth: 1600, margin: '0 auto' }}>
          {/* --- KPI row --- */}
          <div className="cc-kpis">
            <Panel brackets bodyStyle={{ padding: '26px 28px' }}>
              <div style={label}>Active Nodes</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '14px 0 18px' }}>
                <span style={{ fontFamily: GROTESK, fontSize: 48, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>{link === 'down' ? 0 : nodes.length}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.dim }}>/ {nodes.length}</span>
                <span style={{ marginLeft: 'auto' }}><Tag color={link === 'down' ? C.red : C.emerald}>{link === 'down' ? 'Offline' : 'Online'}</Tag></span>
              </div>
              <Sparkbars values={nodes.map((n) => n.noise)} color={C.emerald} highlightLast={false} />
            </Panel>

            <Panel brackets bodyStyle={{ padding: '26px 28px' }}>
              <div style={label}>Network Leq</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '14px 0 18px' }}>
                <span style={{ fontFamily: GROTESK, fontSize: 48, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>{leq.toFixed(1)}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.dim }}>dB(A)</span>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: leq >= threshold ? C.amber : C.emerald }}>
                  {leq >= threshold ? '▲' : '▼'} {Math.abs(leq - threshold).toFixed(1)}
                </span>
              </div>
              <Sparkbars values={leqSeries.length ? leqSeries : [0]} />
            </Panel>

            <Panel brackets bracketColor={critical.length ? C.red : undefined} glow={critical.length ? 'rgba(239,68,68,0.22)' : null} bodyStyle={{ padding: '26px 28px' }}>
              <div style={{ ...label, color: critical.length ? C.red : C.dim }}>Critical Alerts</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '14px 0 18px' }}>
                <span style={{ fontFamily: GROTESK, fontSize: 48, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: critical.length ? C.red : '#fff' }}>{critical.length}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginLeft: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {critical.length ? `of ${nodes.length} nodes` : 'All clear'}
                </span>
              </div>
              <Sparkbars values={critSeries.length ? critSeries : [0]} color={C.red} />
            </Panel>

            <Panel brackets bodyStyle={{ padding: '26px 28px' }}>
              <div style={label}>Top Threat</div>
              <div style={{ margin: '14px 0 18px', minHeight: 48 }}>
                <div style={{ fontFamily: GROTESK, fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top?.name || '—'}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: top ? STATUS_COLOR[top.status] : C.dim }}>{top?.noise.toFixed(1)} dB</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{top?.source}</span>
                </div>
              </div>
              <Sparkbars values={top?.history.slice(-16) || [0]} color={top ? STATUS_COLOR[top.status] : C.violet} />
            </Panel>
          </div>

          {/* --- Map + priority engine --- */}
          <div className="cc-mid">
            <Panel
              index="01"
              title="Kolkata Acoustic Grid"
              right={
                <span style={{ display: 'flex', gap: 14 }}>
                  {Object.entries(STATUS_COLOR).map(([k, c]) => (
                    <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: C.dim }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} />{k}
                    </span>
                  ))}
                </span>
              }
              bodyStyle={{ height: 480, overflow: 'hidden' }}
            >
              <div className="cc-map" style={{ position: 'absolute', inset: 0 }}>
                <MapContainer center={[22.572, 88.405]} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  {/* CartoDB Dark Matter now requires an API key; Esri Dark Gray Canvas is keyless */}
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
                    maxZoom={16}
                  />
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={16}
                    opacity={0.7}
                  />
                  {ranked.map((n) => (
                    <Circle key={`r-${n.id}`} center={[n.lat, n.lng]} radius={noiseRadius(n.noise)} interactive={false} pathOptions={{ color: STATUS_COLOR[n.status], weight: 1, opacity: 0.55, fillColor: STATUS_COLOR[n.status], fillOpacity: 0.1 }} />
                  ))}
                  {ranked.map((n) => (
                    <Marker key={n.id} position={[n.lat, n.lng]} icon={markerIcon(STATUS_COLOR[n.status], n.id === selectedId)} eventHandlers={{ click: () => setSelectedId(n.id) }} />
                  ))}
                  <FlyTo target={selected} />
                </MapContainer>
                <LocationDrawer node={selected} onClose={() => setSelectedId(null)} />
              </div>
            </Panel>

            <Panel index="02" title={`Priority Engine · ${ranked.length}`} right={<span style={{ ...label, fontSize: 9, color: C.faint }}>Score = (dB − limit + 10) × W × 1.6</span>} bodyStyle={{ maxHeight: 480, overflowY: 'auto' }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 2, background: C.bg, display: 'grid', gridTemplateColumns: '34px 1fr 46px 54px', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${C.line}` }}>
                {['#', 'Location', 'Wt', 'dB'].map((h) => (
                  <span key={h} style={{ ...label, fontSize: 9, color: C.faint, textAlign: h === '#' || h === 'Location' ? 'left' : 'right' }}>{h}</span>
                ))}
              </div>
              {ranked.map((n, i) => {
                const color = STATUS_COLOR[n.status]
                const sel = n.id === selectedId
                return (
                  <div
                    key={n.id}
                    className="cc-row"
                    onClick={() => setSelectedId(n.id)}
                    style={{ position: 'relative', padding: '14px 18px', borderBottom: i < ranked.length - 1 ? `1px solid ${C.line}` : 'none', cursor: 'pointer', background: sel ? 'rgba(109,93,246,0.08)' : n.status === 'CRITICAL' ? 'radial-gradient(ellipse at 0% 50%, rgba(239,68,68,0.12), transparent 60%)' : 'transparent', boxShadow: sel ? `inset 2px 0 0 ${C.violet}` : 'none' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 46px 54px', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontFamily: GROTESK, fontSize: 20, fontWeight: 600, color: i === 0 ? color : 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, marginTop: 3 }}>{n.zone}</div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: n.weight > 1 ? C.violet : C.dim, textAlign: 'right' }}>{n.weight.toFixed(1)}x</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color, textAlign: 'right' }}>{n.noise.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 12, alignItems: 'center', marginTop: 10 }}>
                      <span />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, width: `${n.score}%`, background: `linear-gradient(90deg, ${C.violet}, ${color})`, boxShadow: `0 0 10px ${color}`, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: '#fff', width: 26, textAlign: 'right' }}>{n.score}</span>
                      </div>
                      <Tag color={n.persistent ? color : 'rgba(255,255,255,0.4)'} solid={n.persistent && n.status === 'CRITICAL'}>
                        {n.persistent ? 'Persistent' : 'Temporary'}
                      </Tag>
                    </div>
                  </div>
                )
              })}
            </Panel>
          </div>

          {/* --- Sandbox + trend --- */}
          <div className="cc-bottom">
            <Panel index="03" title="AI Sound Sandbox" right={<span style={{ ...label, fontSize: 9, color: C.faint }}>YAMNet · 521 classes</span>}>
              <SoundSandbox />
            </Panel>

            <Panel
              index="04"
              title="Network Leq Trendline"
              right={
                <span style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: C.dim }}>
                  <span><span style={{ color: C.violet }}>━</span> LEQ</span>
                  <span><span style={{ color: 'rgba(255,255,255,0.5)' }}>┅</span> PEAK</span>
                  <span><span style={{ color: C.red }}>┄</span> THRESHOLD</span>
                </span>
              }
              bodyStyle={{ padding: '18px 18px 10px', minHeight: 380 }}
            >
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={trend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leqFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.violet} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: MONO }} axisLine={{ stroke: C.line }} tickLine={false} minTickGap={40} />
                  <YAxis domain={[40, 110]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: C.violet, strokeDasharray: '3 3' }}
                    contentStyle={{ background: C.bg, border: `1px solid ${C.violet}`, borderRadius: 0, fontFamily: MONO, fontSize: 11 }}
                    labelStyle={{ color: C.dim }}
                    formatter={(v, k) => [`${v} dB`, k === 'leq' ? 'Leq' : 'Peak']}
                  />
                  <ReferenceLine y={threshold} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.8} />
                  <Area type="monotone" dataKey="peak" stroke="rgba(255,255,255,0.4)" strokeDasharray="2 3" fill="none" isAnimationActive={false} dot={false} />
                  <Area type="monotone" dataKey="leq" stroke={C.violet} strokeWidth={2} fill="url(#leqFill)" isAnimationActive={false} dot={false} activeDot={{ r: 4, fill: C.violet, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div style={{ maxWidth: 1600, margin: '14px auto 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.faint }}>
          <span>Green Drive · NoiseSense AI</span>
          <span>{demoMode ? 'Demo telemetry · 2s refresh' : 'Live · /api/locations · 5s poll'}</span>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
