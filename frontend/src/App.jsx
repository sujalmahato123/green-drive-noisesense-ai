import { useState, useRef, useCallback, useEffect } from 'react'
import SiteNav, { NAV_HEIGHT } from './components/SiteNav'
import SiteFooter from './components/SiteFooter'
import CtaBanner from './components/CtaBanner'
import PixelCurtain, { CURTAIN_IN_MS, CURTAIN_OUT_MS } from './components/PixelCurtain'
import Overview from './pages/Overview'
import Engines from './pages/Engines'
import Locations from './pages/Locations'
import Hardware from './pages/Hardware'
import Dashboard from './pages/Dashboard'
import './index.css'

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'engines', label: 'Engines' },
  { id: 'locations', label: 'Locations' },
  { id: 'control', label: 'Control Center' },
  { id: 'hardware', label: 'Hardware' },
]
const isView = (id) => VIEWS.some((v) => v.id === id)
const viewFromHash = () => {
  const id = window.location.hash.replace('#', '')
  return isView(id) ? id : 'overview'
}

function App() {
  const [view, setView] = useState(viewFromHash)
  const [curtain, setCurtain] = useState({ phase: 'idle', label: '' })
  const viewRef = useRef(view)
  const busy = useRef(false)
  const timers = useRef([])
  const pending = useRef(null)

  const navigate = useCallback((next) => {
    if (!isView(next) || next === viewRef.current || busy.current) return
    if (window.location.hash !== `#${next}`) window.history.pushState(null, '', `#${next}`)
    const label = VIEWS.find((v) => v.id === next).label

    const commit = () => {
      viewRef.current = next
      setView(next)
      window.scrollTo(0, 0)
    }

    // No animation for reduced-motion users or background tabs (browsers throttle their timers)
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit()
      return
    }

    busy.current = true
    pending.current = { commit, deadline: performance.now() + CURTAIN_IN_MS + CURTAIN_OUT_MS }
    setCurtain({ phase: 'mount', label })
    requestAnimationFrame(() => requestAnimationFrame(() => setCurtain({ phase: 'in', label })))
    timers.current = [
      setTimeout(() => {
        commit()
        setCurtain({ phase: 'out', label })
      }, CURTAIN_IN_MS),
      setTimeout(() => {
        setCurtain({ phase: 'idle', label: '' })
        busy.current = false
        pending.current = null
      }, CURTAIN_IN_MS + CURTAIN_OUT_MS),
    ]
  }, [])

  // Browser back / forward, plus recovery if the tab was hidden mid-transition
  useEffect(() => {
    const onPop = () => navigate(viewFromHash())
    const onVisible = () => {
      if (document.hidden || !pending.current || performance.now() < pending.current.deadline) return
      timers.current.forEach(clearTimeout)
      pending.current.commit()
      pending.current = null
      busy.current = false
      setCurtain({ phase: 'idle', label: '' })
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('visibilitychange', onVisible)
      timers.current.forEach(clearTimeout)
    }
  }, [navigate])

  const go = (id) => () => navigate(id)

  let page
  switch (view) {
    case 'engines':
      page = <Engines />
      break
    case 'locations':
      page = <Locations onNavigate={navigate} />
      break
    case 'hardware':
      page = <Hardware />
      break
    case 'control':
      page = <Dashboard onSwitchToOverview={go('overview')} stickyTop={NAV_HEIGHT} />
      break
    default:
      page = <Overview onSwitchToControl={go('control')} onNavigate={navigate} />
  }

  return (
    <div style={{ background: '#050508', minHeight: '100vh' }}>
      <SiteNav views={VIEWS} view={view} onNavigate={navigate} />
      <main>{page}</main>
      {view !== 'control' && (
        <>
          <CtaBanner onNavigate={navigate} />
          <SiteFooter views={VIEWS} onNavigate={navigate} />
        </>
      )}
      <PixelCurtain phase={curtain.phase} label={curtain.label} />
    </div>
  )
}

export default App
