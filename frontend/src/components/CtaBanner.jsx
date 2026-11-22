import { useEffect, useState } from 'react'

const MONO = "'JetBrains Mono', monospace"
const GROTESK = "'Space Grotesk', sans-serif"
const PHRASES = ['urban noise', 'hospital zones', 'traffic horns', 'school campuses']

// Types a phrase, holds, deletes it, then moves to the next one
const useTypewriter = (words, { type = 70, erase = 35, hold = 1600 } = {}) => {
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[i]
    let t
    if (!deleting && text === word) t = setTimeout(() => setDeleting(true), hold)
    else if (deleting && text === '') {
      setDeleting(false)
      setI((v) => (v + 1) % words.length)
    } else {
      t = setTimeout(() => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)), deleting ? erase : type)
    }
    return () => clearTimeout(t)
  }, [text, deleting, i, words, type, erase, hold])

  return text
}

export default function CtaBanner({ onNavigate }) {
  const text = useTypewriter(PHRASES)

  return (
    <section
      style={{
        position: 'relative',
        background: '#F2F2F5',
        color: '#0A0A0E',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        // subtle graph-paper grid
        backgroundImage: 'linear-gradient(rgba(10,10,14,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,14,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        backgroundPosition: 'center top',
      }}
    >
      <div className="ns-page-pad" style={{ maxWidth: 1400, margin: '0 auto', padding: '120px 48px 112px', textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(10,10,14,0.5)', marginBottom: 28 }}>
          <span style={{ color: '#6D5DF6' }}>●</span> 32 nodes live across Kolkata
        </div>
        <h2 aria-label={`Silence the ${PHRASES.join(', ')}`} style={{ fontFamily: GROTESK, fontSize: 'clamp(40px, 7.4vw, 108px)', fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1.05 }}>
          Silence the{' '}
          <span aria-hidden="true" style={{ color: '#6D5DF6', whiteSpace: 'nowrap' }}>
            [{text}
            <span className="ns-caret" style={{ display: 'inline-block', width: '0.06em', height: '0.82em', marginLeft: '0.04em', verticalAlign: '-0.06em', background: '#6D5DF6' }} />
            ]
          </span>
        </h2>
        <p style={{ maxWidth: 520, margin: '28px auto 40px', fontSize: 16, lineHeight: 1.6, color: 'rgba(10,10,14,0.62)' }}>
          Put a listening node on the street, let YAMNet name the source, and send the loudest problem in the most sensitive zone to the team that can fix it.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => onNavigate('control')}
            style={{ background: '#2B44FF', color: '#fff', border: 'none', padding: '15px 26px', fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 30px rgba(43,68,255,0.3)', transition: 'background 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#6D5DF6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2B44FF')}
          >
            Launch Control Center →
          </button>
          <button
            onClick={() => onNavigate('locations')}
            style={{ background: 'transparent', color: '#0A0A0E', border: '1px solid rgba(10,10,14,0.25)', padding: '15px 26px', fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6D5DF6')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(10,10,14,0.25)')}
          >
            Explore 32 locations
          </button>
        </div>
      </div>
    </section>
  )
}
