const MONO = "'JetBrains Mono', monospace"

export const NAV_HEIGHT = 60

export default function SiteNav({ views, view, onNavigate }) {
  return (
    <nav className="ns-nav" style={{ position: 'sticky', top: 0, zIndex: 3000, background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <button onClick={() => onNavigate('overview')} aria-label="NoiseSense home" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
        <span style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 5px)', gap: 2 }}>
          {['#6D5DF6', '#2B44FF', '#2B44FF', '#fff'].map((c, i) => <span key={i} style={{ width: 5, height: 5, background: c }} />)}
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>NOISESENSE</span>
      </button>

      <div className="ns-nav-links">
        {views.map((v) => {
          const active = v.id === view
          return (
            <button
              key={v.id}
              onClick={() => onNavigate(v.id)}
              aria-current={active ? 'page' : undefined}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: active ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <span style={{ color: '#6D5DF6', opacity: active ? 1 : 0, marginRight: 6, transition: 'opacity 0.2s' }}>[</span>
              {v.label}
              <span style={{ color: '#6D5DF6', opacity: active ? 1 : 0, marginLeft: 6, transition: 'opacity 0.2s' }}>]</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onNavigate('control')}
        style={{ background: '#6D5DF6', color: '#fff', border: 'none', padding: '10px 18px', fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 22px rgba(109,93,246,0.35)', transition: 'background 0.2s' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#2B44FF')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#6D5DF6')}
      >
        Launch App
      </button>
    </nav>
  )
}
