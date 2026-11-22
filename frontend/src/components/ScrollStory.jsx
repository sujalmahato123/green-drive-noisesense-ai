import { useEffect, useRef, useState } from 'react'
import AsciiField from './AsciiField'

/**
 * Pinned, scroll-driven story:
 *  0.00–0.36  sentence 1 lights up word by word (grey → white)
 *  0.36–0.70  sentence 2 lights up word by word
 *  0.70–1.00  a light panel rises from below and widens to fill the screen,
 *             handing off seamlessly to the light section that follows
 */
const LINES = [
  'Most cities still measure noise with a clipboard and a complaint form.',
  'Every new honk, drill and loudspeaker adds another complaint nobody can prove.',
]
const LIGHT = '#F2F2F5'

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

export default function ScrollStory() {
  const ref = useRef(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      setP(clamp(-r.top / Math.max(1, total)))
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

  const line = p < 0.36 ? 0 : 1
  const local = line === 0 ? clamp(p / 0.32) : clamp((p - 0.36) / 0.3)
  const words = LINES[line].split(' ')
  const panel = clamp((p - 0.7) / 0.3)
  const ease = 1 - Math.pow(1 - panel, 3)

  return (
    <section ref={ref} style={{ position: 'relative', height: '320vh', background: '#050508' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
        <AsciiField />

        <div className="ns-page-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 1000, padding: '0 48px', textAlign: 'center', opacity: 1 - ease * 1.4, transform: `translateY(${-ease * 60}px)` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            <span style={{ color: '#6D5DF6' }}>0{line + 1}</span> / 02 — The problem
          </div>
          <h2 key={line} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(34px, 5.4vw, 72px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.06, animation: 'ns-fade-in 0.4s ease both' }}>
            {words.map((w, i) => {
              const lit = clamp(local * (words.length + 2) - i)
              return (
                <span key={i} style={{ color: `rgba(255,255,255,${0.18 + lit * 0.82})`, transition: 'color 0.15s linear' }}>
                  {w}{i < words.length - 1 ? ' ' : ''}
                </span>
              )
            })}
          </h2>
        </div>

        {/* rising light panel */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            zIndex: 2,
            width: `${46 + ease * 54}%`,
            height: `${ease * 100}%`,
            transform: `translate(-50%, ${(1 - Math.min(1, panel * 4)) * 30}%)`,
            background: LIGHT,
            boxShadow: panel > 0 && panel < 1 ? '0 -30px 80px rgba(109,93,246,0.18)' : 'none',
          }}
        />
      </div>
    </section>
  )
}
