import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { LOCATIONS, SOUND_LABELS, TOLERANCE_DB } from '../data/locations'

const MONO = "'JetBrains Mono', monospace"

/**
 * Verified street-level capture point for a location, matched by exact name so
 * Control Center nodes (demo or live backend) open the same panorama as the cards.
 */
export const streetPointFor = (name = '', lat, lng) => {
  const hit = LOCATIONS.find((l) => l.name.toLowerCase() === name.toLowerCase())
  return hit ? { lat: hit.sv.lat, lng: hit.sv.lng } : { lat, lng }
}

// Keyless Google Street View embed (no API key needed)
export const streetViewUrl = (lat, lng) => `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`
export const mapsPanoUrl = (lat, lng) => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`

const istClock = () => new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })

/**
 * Live acoustic telemetry HUD drawn over the panorama. pointer-events: none so
 * dragging the 360° view underneath keeps working.
 * hud = { db, limit, category }
 */
function TelemetryHud({ db, limit, category = 'traffic' }) {
  const labels = SOUND_LABELS[category] || SOUND_LABELS.traffic
  const [now, setNow] = useState(istClock)
  const [level, setLevel] = useState(db)
  const [sound, setSound] = useState({ i: 0, conf: 0.92 })

  useEffect(() => {
    setLevel(db)
    const tick = setInterval(() => {
      setNow(istClock())
      // random walk around the location's baseline
      setLevel((v) => Math.max(db - 6, Math.min(db + 6, v + (Math.random() - 0.5) * 2.4 + (db - v) * 0.15)))
    }, 700)
    const relabel = setInterval(() => {
      setSound((s) => ({ i: Math.random() < 0.6 ? 0 : (s.i + 1) % labels.length, conf: 0.78 + Math.random() * 0.18 }))
    }, 3500)
    return () => { clearInterval(tick); clearInterval(relabel) }
  }, [db, labels.length])

  const alert = level > limit + TOLERANCE_DB
  const c = alert ? '#EF4444' : '#10B981'
  const pct = (v) => Math.max(0, Math.min(100, ((v - 30) / 80) * 100))

  return (
    <div
      aria-live="off"
      style={{ position: 'absolute', left: 8, top: 62, zIndex: 2, pointerEvents: 'none', width: 'min(250px, calc(100% - 16px))', background: 'rgba(5,8,24,0.8)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.14)', borderLeft: `2px solid ${c}`, padding: '8px 10px', fontFamily: MONO, color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, letterSpacing: '0.14em' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="ns-beacon" style={{ '--c': '#EF4444', width: 6, height: 6 }} />
          {now} <span style={{ color: '#EF4444' }}>LIVE</span>
        </span>
        <span style={{ color: c, border: `1px solid ${c}`, padding: '1px 5px', fontWeight: 600 }}>{alert ? 'ALERT' : 'COMPLIANT'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 5px' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: c, fontVariantNumeric: 'tabular-nums' }}>{level.toFixed(1)}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>dB(A) vs {limit} dB CPCB limit</span>
      </div>
      <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.12)' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct(level)}%`, background: `linear-gradient(90deg, #10B981, ${c})`, transition: 'width 0.6s ease' }} />
        <div title="CPCB limit" style={{ position: 'absolute', top: -3, bottom: -3, left: `${pct(limit)}%`, width: 1.5, background: '#fff' }} />
      </div>
      <div style={{ marginTop: 7, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ color: '#A78BFA' }}>YAMNet</span> · {labels[sound.i]} • {Math.round(sound.conf * 100)}% conf
      </div>
    </div>
  )
}

export default function StreetView({ lat, lng, title = 'Street View', style, hud }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#050818', ...style }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
          <span className="ns-glow">Loading 360° panorama…</span>
        </div>
      )}
      <iframe
        title={`360° Street View — ${title}`}
        src={streetViewUrl(lat, lng)}
        loading="eager"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoaded(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, opacity: loaded ? 1 : 0, transition: 'opacity 400ms' }}
      />
      <a
        href={mapsPanoUrl(lat, lng)}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Open this panorama in Google Maps (use if the embed is blocked for this lane)"
        style={{ position: 'absolute', right: 8, bottom: 30, zIndex: 2, display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: 'rgba(43,68,255,0.92)', border: '1px solid #6D5DF6', boxShadow: '0 0 16px rgba(43,68,255,0.45)', padding: '6px 9px', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        Open latest 360° in Google Maps <ExternalLink size={10} />
      </a>
      {hud && loaded && <TelemetryHud {...hud} />}
    </div>
  )
}

/* Segmented control shared by the location cards, the detail modal and the Control Center drawer */
export const VIEW_TABS = [
  { id: 'satellite', icon: '🛰️', label: 'Satellite View', short: 'Satellite' },
  { id: 'land', icon: '🗺️', label: 'Land View', short: 'Land' },
  { id: 'street', icon: '👁️', label: '360° Street View', short: '360° Street' },
]

export function ViewSwitch({ view, onChange, compact, tabs = VIEW_TABS }) {
  return (
    <div role="tablist" aria-label="Map view" style={{ display: 'flex', width: '100%', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(5,8,24,0.88)', backdropFilter: 'blur(6px)' }}>
      {tabs.map((o, i) => {
        const on = view === o.id
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={(e) => { e.stopPropagation(); onChange(o.id) }}
            style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: MONO, fontSize: compact ? 8.5 : 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', padding: compact ? '8px 4px' : '10px 8px', border: 'none', borderLeft: i ? '1px solid rgba(255,255,255,0.1)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: on ? '#6D5DF6' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,0.65)', boxShadow: on ? '0 0 16px rgba(109,93,246,0.45)' : 'none', transition: 'background 0.2s, color 0.2s' }}
          >
            <span aria-hidden="true">{o.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{compact && o.short ? o.short : o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
