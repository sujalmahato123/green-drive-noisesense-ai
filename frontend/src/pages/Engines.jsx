import { useState, useEffect } from 'react'
import { Mic, Cpu, BellRing, Copy, Check } from 'lucide-react'
import PageHero from '../components/PageHero'
import AsciiField from '../components/AsciiField'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const LINE = 'rgba(255,255,255,0.1)'
const VIOLET = '#6D5DF6'
const label = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }

const NODES = [
  { icon: Mic, step: '01', title: 'ESP32 Mic', sub: 'INMP441 · I2S · 16 kHz', stat: 'A-weighted frames every 0.96 s', delay: '0s' },
  { icon: Cpu, step: '02', title: 'YAMNet AI', sub: '521 AudioSet classes', stat: 'Horn · siren · drill · music · crowd', delay: '1.2s' },
  { icon: BellRing, step: '03', title: 'Priority Alert', sub: 'Leq × zone weight', stat: 'Webhook dispatched in < 50 ms', delay: '2.7s' },
]

// CPCB Noise Pollution (Regulation & Control) Rules, 2000 — day 06–22, night 22–06
const LIMITS = {
  SSKM: { type: 'silence', day: 50, night: 40 },
  ESPLANADE: { type: 'commercial', day: 65, night: 55 },
  'SALT LAKE': { type: 'residential', day: 55, night: 45 },
}

const SCHEDULE = {
  MON: { zone: 'SSKM', leq: 74.2, windows: [[8, 11, 'OPD rush'], [17, 20, 'Evening traffic']] },
  TUE: { zone: 'ESPLANADE', leq: 83.6, windows: [[9, 12, 'Office inflow'], [17, 21, 'Peak traffic']] },
  WED: { zone: 'SALT LAKE', leq: 61.8, windows: [[7, 9, 'School run'], [22, 24, 'Night limit check']] },
  THU: { zone: 'SSKM', leq: 71.0, windows: [[10, 13, 'Ambulance corridor'], [22, 24, 'Ward quiet hours']] },
  FRI: { zone: 'ESPLANADE', leq: 86.4, windows: [[17, 23, 'Weekend rush']] },
  SAT: { zone: 'SALT LAKE', leq: 66.3, windows: [[18, 22, 'Community events'], [22, 24, 'Loudspeaker curfew']] },
  SUN: { zone: 'ESPLANADE', leq: 72.5, windows: [[10, 14, 'Market hours']] },
}
const DAYS = Object.keys(SCHEDULE)
const pad = (h) => `${String(h % 24).padStart(2, '0')}:00`

const isoNow = () => {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000)
  return `${d.toISOString().slice(0, 19)}+05:30`
}

/* Minimal JSON syntax highlighter */
const JsonView = ({ data }) => {
  const entries = Object.entries(data)
  return (
    <pre style={{ margin: 0, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{'{'}</span>
      {entries.map(([k, v], i) => (
        <div key={k} style={{ paddingLeft: 18 }}>
          <span style={{ color: '#9D93FF' }}>"{k}"</span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>: </span>
          {typeof v === 'number' ? (
            <span style={{ color: '#F2F2F5' }}>{v}</span>
          ) : (
            <span style={{ color: k === 'status' ? (v === 'ALERT' ? '#EF4444' : '#10B981') : '#7DD3A8' }}>"{v}"</span>
          )}
          {i < entries.length - 1 && <span style={{ color: 'rgba(255,255,255,0.5)' }}>,</span>}
        </div>
      ))}
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{'}'}</span>
    </pre>
  )
}

export default function Engines() {
  const todayIdx = (new Date().getDay() + 6) % 7
  const [day, setDay] = useState(DAYS[todayIdx])
  const [win, setWin] = useState(0)
  const [jitter, setJitter] = useState(0)
  const [ts, setTs] = useState(isoNow())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setJitter(+(Math.random() * 3 - 1.5).toFixed(1))
      setTs(isoNow())
    }, 1600)
    return () => clearInterval(id)
  }, [])

  const sched = SCHEDULE[day]
  const slot = sched.windows[Math.min(win, sched.windows.length - 1)]
  const night = slot[0] >= 22 || slot[0] < 6
  const limits = LIMITS[sched.zone]
  const limit = night ? limits.night : limits.day
  const leq = +(sched.leq + jitter).toFixed(1)
  const alert = leq > limit

  const payload = {
    event: alert ? 'noise.threshold_exceeded' : 'noise.within_limit',
    zone: sched.zone,
    zone_type: limits.type,
    day,
    window: `${pad(slot[0])}-${pad(slot[1])}`,
    period: night ? 'NIGHT' : 'DAY',
    leq_db: leq,
    limit_db: limit,
    exceedance_db: +Math.max(0, leq - limit).toFixed(1),
    status: alert ? 'ALERT' : 'OK',
    ts,
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div style={{ background: '#050508', color: '#fff' }}>
      <PageHero index="02" kicker="Engines" title="From raw pressure wave" accent="to a ranked alert.">
        Three engines run in sequence on every frame: capture on the edge, classify with YAMNet, then score against CPCB limits and the zone it protects.
      </PageHero>

      {/* ---------- Signal pipeline ---------- */}
      <section style={{ borderBottom: `1px solid ${LINE}`, position: 'relative', overflow: 'hidden' }}>
        <AsciiField zIndex={1} />
        <div className="ns-page-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 1400, margin: '0 auto', padding: '72px 48px' }}>
          <div style={{ ...label, marginBottom: 36 }}>
            <span style={{ color: VIOLET }}>A</span> // Signal pipeline · live
          </div>
          <div className="ns-pipeline">
            {NODES.map((n, i) => {
              const Icon = n.icon
              return [
                <div key={n.title} className="ns-node" style={{ animationDelay: n.delay, padding: '26px 24px', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <span style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', border: `1px solid ${LINE}`, color: VIOLET }}>
                      <Icon size={17} />
                    </span>
                    <span style={{ ...label, fontSize: 9 }}>{n.step}</span>
                  </div>
                  <div style={{ fontFamily: GROTESK, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{n.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: VIOLET, marginTop: 6, letterSpacing: '0.06em' }}>{n.sub}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 14, lineHeight: 1.5 }}>{n.stat}</div>
                </div>,
                i < NODES.length - 1 && (
                  <div key={`c-${i}`} className="ns-connector">
                    <span className="ns-pulse" style={{ animationDelay: i === 0 ? '0s' : '1.5s' }} />
                    <span style={{ position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)' }} className="ns-arrow">▶</span>
                  </div>
                ),
              ]
            })}
          </div>
        </div>
      </section>

      {/* ---------- Schedule + webhook ---------- */}
      <section style={{ borderBottom: `1px solid ${LINE}` }}>
        <div className="ns-split" style={{ background: LINE }}>
          <div style={{ background: '#050508', padding: '56px 48px' }} className="ns-page-pad">
            <div style={{ ...label, marginBottom: 14 }}>
              <span style={{ color: VIOLET }}>B</span> // CPCB enforcement schedule
            </div>
            <h2 style={{ fontFamily: GROTESK, fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 32 }}>
              Pick a day. See what the network watches.
            </h2>

            <div role="tablist" aria-label="Day of week" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: LINE, border: `1px solid ${LINE}`, marginBottom: 28 }}>
              {DAYS.map((d, i) => {
                const on = d === day
                return (
                  <button
                    key={d}
                    role="tab"
                    aria-selected={on}
                    onClick={() => { setDay(d); setWin(0) }}
                    style={{ padding: '14px 0', background: on ? VIOLET : '#050508', color: on ? '#fff' : 'rgba(255,255,255,0.55)', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', position: 'relative', boxShadow: on ? '0 0 24px rgba(109,93,246,0.45)' : 'none', transition: 'background 0.2s, color 0.2s' }}
                  >
                    {d}
                    {i === todayIdx && <span style={{ position: 'absolute', top: 5, right: 6, width: 4, height: 4, borderRadius: '50%', background: on ? '#fff' : VIOLET }} />}
                  </button>
                )
              })}
            </div>

            {/* 24h timeline */}
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ ...label, fontSize: 9 }}>Focus · {sched.zone} ({limits.type})</span>
              <span style={{ ...label, fontSize: 9 }}>Day {limits.day} dB · Night {limits.night} dB</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2, height: 46 }}>
              {Array.from({ length: 24 }, (_, h) => {
                const wIdx = sched.windows.findIndex(([a, b]) => h >= a && h < b)
                const selected = wIdx === Math.min(win, sched.windows.length - 1)
                const isNight = h >= 22 || h < 6
                return (
                  <button
                    key={h}
                    aria-label={`${pad(h)}${wIdx >= 0 ? ` — ${sched.windows[wIdx][2]}` : ''}`}
                    onClick={() => wIdx >= 0 && setWin(wIdx)}
                    style={{ border: 'none', padding: 0, cursor: wIdx >= 0 ? 'pointer' : 'default', background: wIdx >= 0 ? (selected ? VIOLET : 'rgba(109,93,246,0.35)') : isNight ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', boxShadow: selected && wIdx >= 0 ? '0 0 12px rgba(109,93,246,0.7)' : 'none', transition: 'background 0.25s' }}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
              {['00', '06', '12', '18', '24'].map((t) => <span key={t}>{t}</span>)}
            </div>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 1, background: LINE, border: `1px solid ${LINE}` }}>
              {sched.windows.map(([a, b, name], i) => {
                const on = i === Math.min(win, sched.windows.length - 1)
                return (
                  <button
                    key={name}
                    onClick={() => setWin(i)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: on ? 'rgba(109,93,246,0.1)' : '#0A0A0E', border: 'none', boxShadow: on ? `inset 2px 0 0 ${VIOLET}` : 'none', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 14 }}>{name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: on ? VIOLET : 'rgba(255,255,255,0.5)' }}>{pad(a)} – {pad(b)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ background: '#08080C', padding: '56px 48px', display: 'flex', flexDirection: 'column' }} className="ns-page-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={label}>
                <span style={{ color: VIOLET }}>C</span> // Webhook preview
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ns-beacon" style={{ '--c': alert ? '#EF4444' : '#10B981' }} />
                <span style={{ ...label, fontSize: 9, color: alert ? '#EF4444' : '#10B981' }}>{alert ? 'Firing' : 'Quiet'}</span>
              </span>
            </div>

            <div style={{ border: `1px solid ${LINE}`, background: '#050508', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#10B981', marginRight: 8 }}>POST</span>/api/alerts · application/json
                </span>
                <button onClick={copy} aria-label="Copy payload" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.7)', padding: '4px 8px', cursor: 'pointer', fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '18px 16px', flex: 1 }}>
                <JsonView data={payload} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: LINE, borderTop: `1px solid ${LINE}` }}>
                {[
                  ['Leq', `${leq} dB`, alert ? '#EF4444' : '#10B981'],
                  ['Limit', `${limit} dB`, '#fff'],
                  ['Latency', '41 ms', VIOLET],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ background: '#050508', padding: '12px 14px' }}>
                    <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>{k}</div>
                    <div style={{ fontFamily: GROTESK, fontSize: 20, fontWeight: 600, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
