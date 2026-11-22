import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import { Plus, Minus, Crosshair, Lock, Unlock, Eye, Maximize2 } from 'lucide-react'
import StreetView, { ViewSwitch } from './StreetView'

/**
 * Zone card: a live, zoomable Leaflet map covered by a blue binary-glyph matrix.
 * Hover (or tap) dissolves the whole matrix; it stays clear for 6 s after the cursor
 * leaves, or indefinitely while "Lock map view" is on.
 */
const TILE = 256
const CELL = 11
const RADIUS = 120
const CLEAR_SECONDS = 10
const MONO = "'JetBrains Mono', monospace"
const IMAGERY = (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
const ESRI = (service) => `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`

// Tile stacks for the two map tabs (360° Street View is an iframe layer on top)
const TILESETS = {
  satellite: {
    layers: [
      { url: ESRI('World_Imagery'), maxNativeZoom: 19 },
      { url: ESRI('Reference/World_Transportation'), maxNativeZoom: 19, opacity: 0.55 },
      { url: ESRI('Reference/World_Boundaries_and_Places'), maxNativeZoom: 19, opacity: 0.8 },
    ],
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  },
  land: {
    // Carto Voyager now requires an API key; OpenStreetMap carries the same street & landmark labels
    layers: [{ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxNativeZoom: 19 }],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
}

const toTile = (lat, lng, z) => {
  const n = 2 ** z
  const latR = (lat * Math.PI) / 180
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n,
  }
}

// Integer hash -> [0, 1)
const hash = (n) => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

const pillBase = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  background: 'rgba(5,8,24,0.82)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '6px 9px',
}
const ctrlBtn = { ...pillBase, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }

/* ------------------------------------------------------------------ */
/* Glyph matrix (canvas)                                               */
/* ------------------------------------------------------------------ */
function useGlyphMatrix(wrapRef, canvasRef, lat, lng, enabled = true) {
  useEffect(() => {
    if (!enabled || !canvasRef.current) return undefined
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const zoom = 17
    const center = toTile(lat, lng, zoom)
    const tx0 = Math.floor(center.x) - 2
    const ty0 = Math.floor(center.y) - 1
    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let lum = new Float32Array(0)
    let reveal = new Float32Array(0)
    let mouse = null
    let visible = true
    let raf = 0
    let imageLum = null

    const fallbackLum = (c, r) => {
      const v = 0.5 + 0.25 * Math.sin(c * 0.35) * Math.cos(r * 0.42) + 0.25 * Math.sin((c + r) * 0.18)
      return Math.min(1, Math.max(0, v * 0.8 + hash(c * 7919 + r) * 0.2))
    }
    const rebuildLum = () => {
      lum = new Float32Array(cols * rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) lum[r * cols + c] = imageLum ? imageLum(c * CELL + CELL / 2, r * CELL + CELL / 2) : fallbackLum(c, r)
      }
    }
    const resize = () => {
      w = wrap.clientWidth
      h = wrap.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / CELL)
      rows = Math.ceil(h / CELL)
      reveal = new Float32Array(cols * rows)
      rebuildLum()
    }

    // Read real luminance from aerial imagery so the glyphs trace the actual streets
    const off = document.createElement('canvas')
    off.width = 5 * TILE
    off.height = 3 * TILE
    const octx = off.getContext('2d', { willReadFrequently: true })
    let pending = 15
    for (let i = 0; i < 15; i++) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        octx.drawImage(img, (i % 5) * TILE, Math.floor(i / 5) * TILE)
        if (--pending === 0) {
          try {
            const data = octx.getImageData(0, 0, off.width, off.height).data
            const ox = (center.x - tx0) * TILE
            const oy = (center.y - ty0) * TILE
            imageLum = (px, py) => {
              const mx = Math.round(ox + px - w / 2)
              const my = Math.round(oy + py - h / 2)
              if (mx < 0 || my < 0 || mx >= off.width || my >= off.height) return 0.3
              const k = (my * off.width + mx) * 4
              return Math.min(1, (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 200)
            }
            rebuildLum()
          } catch {
            imageLum = null
          }
        }
      }
      img.src = IMAGERY(zoom, tx0 + (i % 5), ty0 + Math.floor(i / 5))
    }

    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect()
      const p = e.touches ? e.touches[0] : e
      mouse = { x: p.clientX - r.left, y: p.clientY - r.top }
    }
    const clearMouse = () => { mouse = null }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(wrap)
    wrap.addEventListener('mousemove', toLocal)
    wrap.addEventListener('touchmove', toLocal, { passive: true })
    wrap.addEventListener('mouseleave', clearMouse)
    wrap.addEventListener('touchend', clearMouse)

    let frame = 0
    const draw = (t) => {
      raf = requestAnimationFrame(draw)
      if (!visible || frame++ % 2) return
      if (canvas.style.opacity === '0' && getComputedStyle(canvas).opacity === '0') return // fully hidden
      const time = t * 0.001

      // cursor ripple: dissolve a wobbling cluster around the pointer
      if (mouse) {
        const c0 = Math.max(0, Math.floor((mouse.x - RADIUS * 1.3) / CELL))
        const c1 = Math.min(cols - 1, Math.ceil((mouse.x + RADIUS * 1.3) / CELL))
        const r0 = Math.max(0, Math.floor((mouse.y - RADIUS * 1.3) / CELL))
        const r1 = Math.min(rows - 1, Math.ceil((mouse.y + RADIUS * 1.3) / CELL))
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const i = r * cols + c
            const d = Math.hypot(c * CELL + CELL / 2 - mouse.x, r * CELL + CELL / 2 - mouse.y)
            const wob = 0.7 + 0.25 * Math.sin(c * 0.9 + time * 3.1) * Math.cos(r * 0.7 - time * 2.3) + 0.3 * hash(i * 31 + Math.floor(time * 6))
            const rad = RADIUS * wob
            if (d < rad) reveal[i] = Math.max(reveal[i], Math.min(1, (1 - d / rad) * 2.4))
          }
        }
      }

      ctx.clearRect(0, 0, w, h)
      ctx.font = `600 9px 'JetBrains Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          if (reveal[i] > 0.001) reveal[i] *= 0.94
          const a = 1 - reveal[i]
          if (a < 0.03) continue
          const x = c * CELL
          const y = r * CELL
          ctx.fillStyle = `rgba(5, 8, 24, ${0.92 * a})`
          ctx.fillRect(x, y, CELL, CELL)
          const L = lum[i]
          if (L < 0.12) continue
          const glyph = L < 0.22 ? '·' : hash(i + Math.floor(time * (1 + hash(i) * 3)) * 7717) > 0.5 ? '1' : '0'
          ctx.fillStyle = `rgba(${Math.round(43 + L * 110)}, ${Math.round(68 + L * 130)}, 255, ${(0.25 + 0.75 * L) * a})`
          ctx.fillText(glyph, x + CELL / 2, y + CELL / 2 + 0.5)
        }
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener('mousemove', toLocal)
      wrap.removeEventListener('touchmove', toLocal)
      wrap.removeEventListener('mouseleave', clearMouse)
      wrap.removeEventListener('touchend', clearMouse)
    }
  }, [lat, lng, enabled]) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
/**
 * filtered=true  → location card: ASCII overlay, hover reveal, 10 s hold, lock toggle
 * filtered=false → detail modal: always clear, same 3-tab viewer
 */
export default function AsciiReveal({ name = '', lat, lng, sv, noise = 70, zoom = 16, height = 420, color = '#6D5DF6', defaultView = 'satellite', filtered = true, onExpand, hud, children }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [map, setMap] = useState(null)
  const [hover, setHover] = useState(false)
  const [locked, setLocked] = useState(false)
  const [left, setLeft] = useState(0) // seconds of clear view remaining after the cursor leaves
  const [view, setView] = useState(defaultView)
  const [mapView, setMapView] = useState(defaultView === 'street' ? 'satellite' : defaultView)
  const [streetMounted, setStreetMounted] = useState(false)
  const point = sv || { lat, lng }

  useGlyphMatrix(wrapRef, canvasRef, lat, lng, filtered)

  // 10 s persistence countdown
  useEffect(() => {
    if (hover || locked || left <= 0) return
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [hover, locked, left])

  const revealed = !filtered || hover || locked || left > 0
  const street = view === 'street'

  // Mount the panorama iframe on first use only, then keep it alive
  useEffect(() => {
    if (revealed && street) setStreetMounted(true)
  }, [revealed, street])

  const changeView = (v) => {
    setView(v)
    if (v !== 'street') setMapView(v)
  }
  const reveal = () => { setHover(true); setLeft(0) }
  const onLeave = () => {
    if (hover) setLeft(CLEAR_SECONDS)
    setHover(false)
  }
  const toggleLock = (e) => {
    e.stopPropagation()
    if (locked) {
      setLocked(false)
      setHover(false)
      setLeft(0)
    } else {
      setLocked(true)
    }
  }
  const enterStreet = (e) => {
    e.stopPropagation()
    changeView('street')
    reveal()
  }

  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        html: `<div class="ns-marker" style="--c:${color}"><span class="ns-ring"></span><span class="ns-ring ns-ring2"></span><span class="ns-core ns-active"></span></div>`,
      }),
    [color]
  )

  const status = locked
    ? { text: 'View locked', c: '#10B981' }
    : hover
      ? { text: 'Clear view', c: '#A78BFA' }
      : left > 0
        ? { text: `Clear · ${left}s`, c: '#A78BFA' }
        : { text: 'Filtered', c: 'rgba(255,255,255,0.6)' }

  const tiles = TILESETS[mapView]
  const radius = Math.max(60, (noise - 45) * 7) // audible footprint in metres
  const TOP = 46
  const BOTTOM = 48

  return (
    <div
      ref={wrapRef}
      onMouseEnter={filtered ? reveal : undefined}
      onMouseLeave={filtered ? onLeave : undefined}
      onClick={() => { if (!revealed) reveal() }}
      style={{ position: 'relative', height, overflow: 'hidden', background: '#050818', cursor: revealed ? (street ? 'default' : 'grab') : 'crosshair' }}
    >
      {/* satellite / land map */}
      <div className="cc-map" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: BOTTOM, zIndex: 0, pointerEvents: revealed && !street ? 'auto' : 'none' }}>
        <MapContainer ref={setMap} center={[lat, lng]} zoom={zoom} minZoom={11} maxZoom={19} zoomControl={false} scrollWheelZoom style={{ height: '100%', width: '100%', background: '#050818' }}>
          {tiles.layers.map((layer, i) => (
            <TileLayer key={`${mapView}-${i}`} url={layer.url} maxNativeZoom={layer.maxNativeZoom} maxZoom={19} opacity={layer.opacity ?? 1} attribution={i === 0 ? tiles.attribution : undefined} />
          ))}
          <Circle center={[lat, lng]} radius={radius * 1.8} pathOptions={{ color, weight: 1, opacity: 0.55, dashArray: '4 6', fillOpacity: 0.03 }} />
          <Circle center={[lat, lng]} radius={radius} pathOptions={{ color, weight: 2, opacity: 0.95, fillColor: color, fillOpacity: mapView === 'satellite' ? 0.2 : 0.12, className: 'ns-noise-ring' }} />
          <Marker position={[lat, lng]} icon={icon} interactive={false} />
        </MapContainer>
      </div>

      {/* 360° street view */}
      {streetMounted && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, bottom: BOTTOM, zIndex: 450, opacity: street ? 1 : 0, pointerEvents: revealed && street ? 'auto' : 'none', transition: 'opacity 300ms' }}>
          <StreetView lat={point.lat} lng={point.lng} title={name} hud={hud} />
        </div>
      )}
      {street && <div style={{ position: 'absolute', inset: 0, zIndex: 440, background: '#050818' }} />}

      {/* ASCII filter */}
      {filtered && (
        <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 500, opacity: revealed ? 0 : 1, transition: 'opacity 350ms ease' }} />
      )}

      {/* overlays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 600, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: TOP, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>{children}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {filtered && (
              <>
                <span style={{ ...pillBase, color: status.c, display: 'flex', alignItems: 'center', gap: 5, position: 'relative', overflow: 'hidden', padding: '6px 7px' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.c, boxShadow: revealed ? `0 0 8px ${status.c}` : 'none' }} />
                  {status.text}
                  {left > 0 && !hover && !locked && (
                    <span style={{ position: 'absolute', left: 0, bottom: 0, height: 2, width: `${(left / CLEAR_SECONDS) * 100}%`, background: '#A78BFA', transition: 'width 1s linear' }} />
                  )}
                </span>
                <button onClick={toggleLock} aria-pressed={locked} title={locked ? 'Reset filter' : 'Lock view'} style={{ ...ctrlBtn, padding: '6px 7px', background: locked ? '#6D5DF6' : pillBase.background, borderColor: locked ? '#6D5DF6' : 'rgba(255,255,255,0.14)' }}>
                  {locked ? <Unlock size={11} /> : <Lock size={11} />}
                  {locked ? 'Reset' : 'Lock View'}
                </button>
              </>
            )}
            {onExpand && (
              <button onClick={(e) => { e.stopPropagation(); onExpand() }} aria-label={`Open ${name} detail`} title="Open detail" style={{ ...ctrlBtn, padding: '6px 7px' }}>
                <Maximize2 size={11} />
              </button>
            )}
          </div>
        </div>

        {filtered && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: revealed ? 0 : 1, transition: 'opacity 300ms', pointerEvents: 'none' }}>
            <button onClick={enterStreet} style={{ ...ctrlBtn, pointerEvents: revealed ? 'none' : 'auto', fontSize: 9.5, padding: '10px 14px', background: 'rgba(109,93,246,0.9)', borderColor: '#6D5DF6', boxShadow: '0 0 28px rgba(109,93,246,0.55)' }}>
              <Eye size={13} /> Enter 360° Street View
            </button>
          </div>
        )}

        {/* zoom stack (map tabs only) */}
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 1, opacity: revealed && !street ? 1 : 0, transition: 'opacity 300ms', pointerEvents: revealed && !street ? 'auto' : 'none' }}>
          {[
            { label: 'Zoom in', icon: <Plus size={13} />, on: () => map?.zoomIn() },
            { label: 'Zoom out', icon: <Minus size={13} />, on: () => map?.zoomOut() },
            { label: 'Recenter on node', icon: <Crosshair size={13} />, on: () => map?.flyTo([lat, lng], zoom, { duration: 0.6 }) },
          ].map((b) => (
            <button key={b.label} aria-label={b.label} title={b.label} onClick={(e) => { e.stopPropagation(); b.on() }} style={{ ...ctrlBtn, width: 28, height: 28, padding: 0, justifyContent: 'center' }}>
              {b.icon}
            </button>
          ))}
        </div>

        {/* 3-tab view bar, always below the viewport */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: BOTTOM, padding: '0 8px', display: 'flex', alignItems: 'center', background: '#07070B', borderTop: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto' }}>
          <ViewSwitch view={view} onChange={(v) => { changeView(v); if (!revealed) reveal() }} compact={height < 460} />
        </div>
      </div>
    </div>
  )
}
