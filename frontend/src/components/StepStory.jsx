import { useEffect, useRef, useState } from 'react'
import { Radio, Activity, Siren } from 'lucide-react'

/**
 * Pinned 3-step walkthrough on a light background: a giant step word with an icon square,
 * a short explanation bottom-left, and a dark bracketed card on the right whose text
 * types itself each time its step scrolls into place.
 */
const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const INK = '#12121A'

const STEPS = [
  {
    word: 'Detect',
    icon: Radio,
    blurb: ['A pole-mounted ESP32 listens all day.', 'Every 0.96 s it measures dB(A)', 'and flags anything over the CPCB limit.'],
    card: 'NEW READING',
    tag: 'LIVE',
    text: 'Esplanade node 01 is reading 94 dB(A) at 18:42 — 29 dB over the commercial day limit, sustained for 6 minutes.',
    chips: ['ESP32 · INMP441', 'Esplanade', '18:42 IST'],
    who: 'Node 01 is listening',
    cta: 'Flag it',
  },
  {
    word: 'Classify',
    icon: Activity,
    blurb: ['YAMNet names what it hears.', 'Horns, sirens, drills and music are', 'separated before anything is ranked.'],
    card: 'CLASSIFICATION',
    tag: 'YAMNET',
    text: 'Pressure horns 0.91 · bus engines 0.72 · crowd 0.40. Pattern is persistent, not a one-off spike — priority score 96 / 100.',
    chips: ['521 classes', 'Horn 0.91', 'Persistent'],
    who: 'YAMNet scored 40 frames',
    cta: 'Rank it',
  },
  {
    word: 'Dispatch',
    icon: Siren,
    blurb: ['The right team gets one clear alert.', 'Zone, cause, evidence and the street', 'view, in under 50 ms.'],
    card: 'ALERT',
    tag: 'READY',
    text: 'Send to Kolkata Traffic Police, Esplanade division: horn enforcement needed at the Chowringhee crossing during the evening peak.',
    chips: ['Webhook', 'Traffic Police', '< 50 ms'],
    who: 'Ranked #1 of 8 hotspots',
    cta: 'Dispatch',
  },
]

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

const useTyping = (text, key) => {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), 22)
    return () => clearInterval(id)
  }, [text, key])
  return text.slice(0, n)
}

const Brackets = () => {
  const b = { position: 'absolute', width: 14, height: 14, borderColor: 'rgba(18,18,26,0.55)', borderStyle: 'solid' }
  return (
    <>
      <span style={{ ...b, top: -12, left: -12, borderWidth: '1px 0 0 1px' }} />
      <span style={{ ...b, top: -12, right: -12, borderWidth: '1px 1px 0 0' }} />
      <span style={{ ...b, bottom: -12, left: -12, borderWidth: '0 0 1px 1px' }} />
      <span style={{ ...b, bottom: -12, right: -12, borderWidth: '0 1px 1px 0' }} />
    </>
  )
}

const StepCard = ({ s, idx }) => {
  const typed = useTyping(s.text, idx)
  const done = typed.length >= s.text.length
  return (
    <div style={{ position: 'relative' }}>
      <Brackets />
      <div style={{ background: '#111117', color: '#fff', border: '1px solid #000', boxShadow: '0 30px 60px rgba(10,10,14,0.18)' }}>
        <div style={{ margin: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>
            <span>{s.card}</span>
            <span>{s.tag}</span>
          </div>
          <p style={{ padding: '22px 18px 0', minHeight: 132, fontSize: 'clamp(15px, 1.4vw, 19px)', lineHeight: 1.5 }}>
            {typed}
            <span className="ns-glow" style={{ display: 'inline-block', width: 2, height: '1.05em', verticalAlign: '-0.15em', marginLeft: 2, background: '#E879F9', opacity: done ? 0.9 : 1 }} />
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '18px 18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {s.chips.map((c, i) => (
              <span key={c} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 9px', opacity: done || typed.length > (i + 1) * 30 ? 1 : 0.25, transition: 'opacity 0.3s' }}>{c}</span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#6D5DF6', display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 9, color: '#fff' }}>N</span>
              {s.who}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', background: done ? '#2B44FF' : 'rgba(43,68,255,0.4)', color: '#fff', padding: '10px 14px', transition: 'background 0.3s' }}>{s.cta}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StepStory() {
  const ref = useRef(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const r = ref.current.getBoundingClientRect()
      setP(clamp(-r.top / Math.max(1, r.height - window.innerHeight)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const idx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))
  const s = STEPS[idx]
  const Icon = s.icon

  return (
    <section ref={ref} style={{ position: 'relative', height: `${STEPS.length * 100}vh`, background: '#F2F2F5', color: INK, borderBottom: '1px solid rgba(0,0,0,0.09)' }}>
      <div style={{ position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        <div className="ns-page-pad ns-steps" style={{ height: '100%', maxWidth: 1400, margin: '0 auto', padding: '0 48px' }}>
          {/* left: giant word + blurb */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '9vh 0 8vh' }}>
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 1.6vw, 24px)', animation: 'ns-fade-in 0.45s ease both' }}>
              <span style={{ width: 'clamp(46px, 4.4vw, 62px)', height: 'clamp(46px, 4.4vw, 62px)', flexShrink: 0, background: INK, color: '#fff', display: 'grid', placeItems: 'center' }}>
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <span style={{ fontFamily: GROTESK, fontSize: 'clamp(52px, 8vw, 116px)', fontWeight: 500, letterSpacing: '-0.05em', lineHeight: 0.9 }}>{s.word}</span>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                {STEPS.map((_, i) => (
                  <span key={i} style={{ height: 2, width: i === idx ? 36 : 14, background: i === idx ? '#6D5DF6' : 'rgba(18,18,26,0.2)', transition: 'all 0.3s' }} />
                ))}
              </div>
              <p key={idx} style={{ fontSize: 16, lineHeight: 1.55, color: 'rgba(18,18,26,0.62)', animation: 'ns-fade-in 0.45s ease 0.1s both' }}>
                {s.blurb.map((l) => <span key={l} style={{ display: 'block' }}>{l}</span>)}
              </p>
            </div>
          </div>

          {/* right: bracketed dark card */}
          <div style={{ display: 'grid', alignItems: 'center', height: '100%' }}>
            <div key={idx} style={{ animation: 'ns-fade-in 0.5s ease both' }}>
              <StepCard s={s} idx={idx} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
