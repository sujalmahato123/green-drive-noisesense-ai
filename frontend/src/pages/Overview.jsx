import AsciiField from '../components/AsciiField'
import HeroBlades from '../components/HeroBlades'
import EngineAccordion from '../components/EngineAccordion'
import ScrollStory from '../components/ScrollStory'
import ComesIn from '../components/ComesIn'
import StepStory from '../components/StepStory'
import ImpactChart from '../components/ImpactChart'

const Overview = ({ onSwitchToControl }) => {
  const techStack = ['ESP32', 'INMP441', 'YAMNet', 'FastAPI', 'SQLite', 'Leaflet', 'WebSockets', 'TensorFlow', 'Kafka']

  return (
    <div style={{ backgroundColor: '#050508', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero: fanned glass deck, copy anchored to the bottom */}
      <section style={{ backgroundColor: '#050508', minHeight: 'min(80vh, 740px)', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.09)', position: 'relative', overflow: 'hidden' }}>
        <HeroBlades />
        {/* glyph layer sits above the blades and scrims but under the copy, so the cursor glow is never dimmed */}
        <AsciiField zIndex={4} />
        {/* scrims keep the copy legible where it sits over the glass */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', background: 'linear-gradient(0deg, rgba(5,5,8,0.7) 0%, rgba(5,5,8,0.3) 30%, transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(5,5,8,0.55), transparent 55%)' }} />

        <div className="ns-page-pad" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1400, margin: '0 auto', padding: '0 48px 56px' }}>
          <h1 style={{ fontSize: 'clamp(46px, 6.3vw, 92px)', fontWeight: 600, lineHeight: 0.94, letterSpacing: '-0.045em', fontFamily: 'Space Grotesk', marginBottom: 32 }}>
            Hear the city.<br/>
            <span style={{ color: '#8B7CFF' }}>Silence the chaos.</span>
          </h1>
          <div>
            <button onClick={onSwitchToControl} style={{ backgroundColor: '#2B44FF', color: 'white', padding: '14px 26px', border: 'none', fontSize: 12, fontFamily: 'JetBrains Mono', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, transition: 'background 0.25s', boxShadow: '0 0 28px rgba(43,68,255,0.35)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#6D5DF6'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2B44FF'}>
              Launch Control Center →
            </button>
          </div>
        </div>
      </section>

      {/* Pinned problem story: words light up, then a light panel rises into the next section */}
      <ScrollStory />

      {/* "This is where NoiseSense comes in." + stats */}
      <ComesIn />

      {/* Detect → Classify → Dispatch walkthrough */}
      <StepStory />

      {/* 4-Column Accordion */}
      <EngineAccordion />

      {/* Tech Stack Badges */}
      <section style={{ backgroundColor: '#F2F2F5', color: '#0A0A0E', padding: '4rem 3rem', borderBottom: '1px solid rgba(0,0,0,0.09)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '3rem', letterSpacing: '-0.02em', fontFamily: 'Space Grotesk' }}>Works with your hardware.</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          {techStack.map((tech, i) => (
            <div key={i} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', border: '1px solid #0A0A0E', borderRadius: '20px', fontSize: '12px', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', transform: `rotate(${-14 + (i * 2.8) % 28}deg)`, transition: 'all 0.3s', cursor: 'pointer' }} onMouseEnter={e => { e.target.style.transform = 'rotate(0deg) scale(1.08)'; e.target.style.boxShadow = '0 10px 25px rgba(109,93,246,0.2)'; }} onMouseLeave={e => { e.target.style.transform = `rotate(${-14 + (i * 2.8) % 28}deg)`; e.target.style.boxShadow = 'none'; }}>
              {tech}
            </div>
          ))}
        </div>
      </section>

      <ImpactChart />
    </div>
  )
}

export default Overview
