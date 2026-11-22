# GREEN DRIVE — NoiseSense AI

**Smart Urban Acoustic Telemetry & CPCB Compliance Platform for Kolkata.** Pole-mounted sensors hear the street, Google YAMNet names every sound, and the loudest problem in the most sensitive zone reaches the right team first.

NoiseSense monitors **32 locations** across Kolkata, centred on Techno India University (Salt Lake Sector V): 11 colleges & schools and 11 hospitals (CPCB silence zones, 50 dB) plus 10 major traffic junctions (65 dB).

## What's inside

| View | What it does |
|---|---|
| **Overview** | Landing page: 3D glass-card hero, cursor-reactive ASCII spotlight, scroll-driven story, Detect → Classify → Dispatch walkthrough, engine accordion with 3D point clouds, 36-day impact chart |
| **Engines** | Signal pipeline (ESP32 mic → YAMNet → priority alert), CPCB weekly schedule and live webhook preview |
| **Locations** | 32 hotspots with search and category filters. Each card has Satellite, Land and 360° Street View tabs with a live telemetry HUD, plus an investigation modal |
| **Control Center** | Live dashboard: Kolkata map with noise-radius rings, zone-weighted priority engine, KPIs, AI sound sandbox, Leq trendline, CSV export. Demo mode or live backend |
| **Hardware** | Searchable bill of materials and standards (ESP32-S3, INMP441, YAMNet, CPCB rules…) |

### How locations are scored

- **Status** is measured against each zone's own CPCB day limit:
  **Critical** at +20 dB (silence zones) / +15 dB (traffic), **Warning** above +5 dB, **Normal** within 5 dB.
- **Priority score** = `(dB − limit + 10) × zone weight × 1.6`, capped at 100.
  Weights: hospitals 1.5×, colleges & schools 1.4×, traffic 1.0×.

The location list lives in one file, [`frontend/src/data/kolkata-locations.json`](frontend/src/data/kolkata-locations.json). The website imports it and the backend seeds its database from it.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, Leaflet / react-leaflet, Recharts, lucide-react
- **Backend:** FastAPI, SQLAlchemy + SQLite, Uvicorn
- **AI / audio:** Google YAMNet AI (TensorFlow Hub), librosa
- **Hardware target:** ESP32 + INMP441 I2S MEMS microphone
- **Maps:** Esri World Imagery and Dark Gray Canvas, OpenStreetMap, Google Street View (keyless embed)

## Run it locally

Requirements: Node.js 18+ and Python 3.9+.

```bash
git clone https://github.com/sujalmahato123/green-drive-noisesense-ai.git
cd green-drive-noisesense-ai
```

**Backend** (http://localhost:8000):

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The SQLite database is created and seeded with the 32 locations on first start.

**Frontend** (http://localhost:5173), in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api/*` to the backend, so the Control Center's **Live Device** mode reads from FastAPI; **Demo Mode** works without it.

Or run both together from the project root with `npm install && npm run dev`.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/locations` | All locations with latest level, status, zone, CPCB limit and weight |
| GET | `/api/priority-rankings` | Locations ranked by zone-weighted priority score |
| GET | `/api/dashboard/stats` | Network summary |
| GET | `/api/readings` | Noise readings (`location_id`, `limit`) |
| POST | `/api/readings` | Submit a reading from a sensor node |
| POST | `/api/classify-audio` | Classify an uploaded `.wav` / `.mp3` |
| GET | `/api/alerts`, `/api/alerts/recent` | Alerts |
| GET | `/api/analytics/timeseries` | Leq time series |
| POST | `/api/demo/populate` | Reset and reseed demo data |

## Notes

- Street View panoramas use points checked to open on outdoor imagery near each location; a few sit a short distance from the node (noted on the card).
- The 360° HUD and the Overview's 36-day chart show simulated telemetry around each location's baseline level.
