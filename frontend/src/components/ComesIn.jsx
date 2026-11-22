import { useEffect, useRef, useState } from 'react'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"

const STATS = [
  { label: 'Readings analysed', value: 48880, format: (v) => v.toLocaleString('en-IN') },
  { label: 'Median alert latency', value: 41, format: (v) => `${v} ms` },
  { label: 'Hotspots monitored', value: 8, format: (v) => String(v) },
]

// Counts numbers up once the row scrolls into view
const useCountUp = (target, run, ms = 1400) => {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const start = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, run, ms])
  return v
}

const Stat = ({ s, run }) => {
  const v = useCountUp(s.value, run)
  return (
    <div style={{ borderTop: '1px solid rgba(10,10,14,0.22)', paddingTop: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(10,10,14,0.55)', marginBottom: 10 }}>{s.label}</div>
      <div style={{ fontFamily: GROTESK, fontSize: 'clamp(38px, 4.4vw, 60px)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.format(v)}</div>
    </div>
  )
}

export default function ComesIn() {
  const ref = useRef(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setRun(true) }, { threshold: 0.35 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} style={{ background: '#F2F2F5', color: '#0A0A0E', minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="ns-page-pad" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '120px 48px 64px' }}>
        <h2 style={{ fontFamily: GROTESK, fontSize: 'clamp(44px, 7vw, 96px)', fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 0.98, textAlign: 'center' }}>
          This is where <span style={{ color: '#6D5DF6' }}>NoiseSense</span>
          <br />
          comes in.
        </h2>
      </div>
      <div className="ns-page-pad ns-stats" style={{ padding: '0 48px 72px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {STATS.map((s) => <Stat key={s.label} s={s} run={run} />)}
      </div>
    </section>
  )
}
