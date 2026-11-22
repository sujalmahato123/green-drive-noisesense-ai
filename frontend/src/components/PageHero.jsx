import AsciiField from './AsciiField'

export default function PageHero({ index, kicker, title, accent, children }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#050508' }}>
      <AsciiField />
      <div className="ns-page-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '96px 48px 72px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
          <span style={{ color: '#6D5DF6' }}>{index}</span> // {kicker}
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(44px, 7vw, 88px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, maxWidth: 1000, color: '#fff' }}>
          {title}
          {accent && (
            <>
              <br />
              <span style={{ color: '#6D5DF6' }}>{accent}</span>
            </>
          )}
        </h1>
        {children && <div style={{ marginTop: 28, maxWidth: 560, fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)' }}>{children}</div>}
      </div>
    </section>
  )
}
