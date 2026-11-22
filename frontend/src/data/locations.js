/**
 * Kolkata monitoring locations, centred on Techno India University (Salt Lake Sector V).
 *
 * The raw list lives in kolkata-locations.json, which the FastAPI backend also reads,
 * so the website, Control Center and database always share one dataset.
 *
 * `sv` is the Street View capture point. Google's keyless embed snaps to the nearest
 * panorama (sometimes an indoor shop photo, sometimes none), so every point was checked
 * to open on outdoor imagery; `svNote` explains points that sit away from the node.
 */
import RAW from './kolkata-locations.json'

// CPCB Noise Pollution (Regulation & Control) Rules, 2000 — dB(A) Leq, day 06–22 / night 22–06
export const CPCB = {
  silence: { label: 'Silence Zone', day: 50, night: 40 },
  residential: { label: 'Residential', day: 55, night: 45 },
  commercial: { label: 'Commercial', day: 65, night: 55 },
  industrial: { label: 'Industrial', day: 75, night: 70 },
}

export const STATUS_COLOR = { CRITICAL: '#EF4444', WARNING: '#F59E0B', NORMAL: '#10B981' }

// Zone rules per category
export const CATEGORY_RULES = {
  school: { zone: 'silence', zoneLabel: 'College & School Silence Zone', weight: 1.4, critical: 20 },
  hospital: { zone: 'silence', zoneLabel: 'Hospital Silence Zone', weight: 1.5, critical: 20 },
  traffic: { zone: 'commercial', zoneLabel: 'Traffic / Commercial Zone', weight: 1.0, critical: 15 },
}

// Within 5 dB of the limit counts as compliant; critical at +20 dB in silence zones, +15 dB in traffic zones
export const TOLERANCE_DB = 5
export const statusFor = (db, limit, criticalMargin = 20) => {
  const over = db - limit
  if (over >= criticalMargin) return 'CRITICAL'
  if (over > TOLERANCE_DB) return 'WARNING'
  return 'NORMAL'
}

export const CATEGORIES = [
  { id: 'all', label: 'All Zones' },
  { id: 'school', label: 'Colleges & Schools' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'traffic', label: 'Traffic Areas' },
]

// YAMNet-style labels the live HUD cycles through, per category
export const SOUND_LABELS = {
  school: ['Vehicle horn', 'Traffic noise', 'Crowd / children', 'Loudspeaker'],
  hospital: ['Ambulance siren', 'Vehicle horn', 'Traffic noise', 'Crowd'],
  traffic: ['Vehicle horn', 'Bus engine', 'Traffic noise', 'Siren'],
}

const explain = (l, limit) => {
  const over = l.db - limit
  const [a, b, c] = l.sources.map((s) => s.toLowerCase())
  if (l.category === 'traffic') {
    return {
      cause: `${l.sources[0]} and ${b} keep this junction ${over > 0 ? `${over} dB over` : 'near'} the 65 dB commercial limit through the day.`,
      action: 'Horn-free enforcement with signal-linked cameras at peak hours; adaptive signal timing to cut idling queues.',
    }
  }
  const place = l.category === 'hospital' ? 'wards' : 'classrooms'
  return {
    cause: over > TOLERANCE_DB
      ? `${l.sources[0]}, ${b} and ${c} carry into the ${place}, ${over} dB over the 50 dB silence-zone limit.`
      : `Levels sit close to the 50 dB silence-zone limit; ${a} is the main source to watch.`,
    action: l.category === 'hospital'
      ? 'Enforce the 100 m silence radius with horn cameras and fines; keep taxi and bus stops off the hospital frontage.'
      : 'No-horn and no-loudspeaker order during class hours; staggered drop-off lanes at the gates.',
  }
}

export const LOCATIONS = RAW.map((l) => {
  const rule = CATEGORY_RULES[l.category]
  const limit = CPCB[rule.zone].day
  return {
    ...l,
    zone: rule.zone,
    zoneLabel: rule.zoneLabel,
    weight: rule.weight,
    limit,
    criticalMargin: rule.critical,
    status: statusFor(l.db, limit, rule.critical),
    ...explain(l, limit),
  }
})
