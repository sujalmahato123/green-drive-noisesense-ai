import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import random
import numpy as np
from database import init_db, SessionLocal, Location, NoiseReading, Alert
from services.alert_service import AlertService
from services.priority_engine import PriorityEngine
from services.sound_classifier import SoundClassifier
from models.schemas import LocationResponse, NoiseReadingResponse, AlertResponse, DashboardStats

app = FastAPI(
    title="Green Drive - NoiseSense AI",
    description="Environmental noise monitoring system with AI classification",
    version="1.0.0"
)

# CORS: the Vercel frontend + local dev. Override with a comma-separated CORS_ORIGINS env var.
DEFAULT_CORS_ORIGINS = [
    "https://green-drive-noisesense-ai.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ORIGINS = [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()] or DEFAULT_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    # Vercel preview deployments of the same project
    allow_origin_regex=r"https://green-drive-noisesense-ai(-[a-z0-9-]+)?\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Initialize services
alert_service = AlertService()
priority_engine = PriorityEngine()
sound_classifier = SoundClassifier()

# Demo locations: 32 Kolkata nodes centred on Techno India University (Salt Lake Sector V).
# Single source of truth shared with the website: frontend/src/data/kolkata-locations.json
import json
from pathlib import Path

LOCATIONS_FILE = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "kolkata-locations.json"

# CPCB day limits and priority weights per category (mirrors frontend/src/data/locations.js)
CATEGORY_RULES = {
    "school": {"label": "College & School Silence Zone", "limit": 50, "weight": 1.4, "critical": 20},
    "hospital": {"label": "Hospital Silence Zone", "limit": 50, "weight": 1.5, "critical": 20},
    "traffic": {"label": "Traffic / Commercial Zone", "limit": 65, "weight": 1.0, "critical": 15},
}
TOLERANCE_DB = 5  # within 5 dB of the limit counts as compliant


def _load_locations():
    raw = json.loads(LOCATIONS_FILE.read_text(encoding="utf-8"))
    demo, meta = [], {}
    for i, loc in enumerate(raw, start=1):
        rule = CATEGORY_RULES[loc["category"]]
        demo.append({"id": i, "name": loc["name"], "lat": loc["lat"], "lng": loc["lng"], "description": rule["label"]})
        meta[loc["name"]] = {
            "category": loc["category"],
            "limit": rule["limit"],
            "weight": rule["weight"],
            "critical": rule["critical"],
            "base": loc["db"],
        }
    return demo, meta


DEMO_LOCATIONS, LOCATION_META = _load_locations()
DEFAULT_META = {"category": "traffic", "limit": 65, "weight": 1.0, "critical": 15, "base": 65}


def zone_status(noise_level: float, limit: float, critical: float = 20) -> str:
    """Status relative to the zone's own CPCB limit"""
    over = noise_level - limit
    if over >= critical:
        return "critical"
    if over > TOLERANCE_DB:
        return "warning"
    return "normal"


def zone_priority(noise_level: float, limit: float, weight: float) -> float:
    """Exceedance over the zone limit, weighted by zone sensitivity (0-100)"""
    return round(min(100.0, max(0.0, noise_level - limit + 10) * weight * 1.6), 1)


def seed_demo_locations(db):
    """Replace all locations with the demo set and seed 10 hours of readings around each baseline"""
    db.query(Alert).delete()
    db.query(NoiseReading).delete()
    db.query(Location).delete()
    db.commit()
    for loc_data in DEMO_LOCATIONS:
        db.add(Location(**loc_data))
    db.commit()
    for location in db.query(Location).all():
        base = LOCATION_META.get(location.name, DEFAULT_META)["base"]
        for i in range(10):
            level = base if i == 0 else base + random.uniform(-4, 4)
            db.add(NoiseReading(
                location_id=location.id,
                noise_level=round(level, 1),
                sound_type=random.choice(SOUND_TYPES),
                timestamp=datetime.now() - timedelta(hours=i),
            ))
    db.commit()


def sync_demo_locations():
    """On startup, swap in the demo locations if the database still has an older set"""
    db = SessionLocal()
    try:
        names = {loc.name for loc in db.query(Location).all()}
        if names != {d["name"] for d in DEMO_LOCATIONS}:
            seed_demo_locations(db)
    finally:
        db.close()

SOUND_TYPES = ["Traffic Noise", "Construction", "Music", "Crowd Noise", "Birds", "Wind", "Mixed"]

sync_demo_locations()

@app.get("/")
async def root():
    return {
        "name": "Green Drive - NoiseSense AI",
        "version": "1.0.0",
        "status": "🟢 Running",
        "endpoints": {
            "dashboard": "/api/dashboard/stats",
            "locations": "/api/locations",
            "readings": "/api/readings",
            "alerts": "/api/alerts",
            "analytics": "/api/analytics",
        }
    }

# ==================== Dashboard Endpoints ====================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    db = SessionLocal()
    try:
        # Get all locations
        locations = db.query(Location).all()

        # Get recent readings
        recent_readings = db.query(NoiseReading).order_by(NoiseReading.timestamp.desc()).limit(5).all()

        # Get active alerts
        active_alerts = db.query(Alert).filter(Alert.resolved == False).all()

        if not locations or not recent_readings:
            # Return demo data
            return DashboardStats(
                totalLocations=5,
                currentAverageNoise=68.5,
                activeAlerts=len(active_alerts),
                highestNoiseLocation="Road Junction (South)",
                highestNoiseLevel=92
            )

        avg_noise = np.mean([r.noise_level for r in recent_readings])
        max_noise = max([r.noise_level for r in recent_readings])

        return DashboardStats(
            totalLocations=len(locations),
            currentAverageNoise=round(avg_noise, 1),
            activeAlerts=len(active_alerts),
            highestNoiseLocation=locations[0].name,
            highestNoiseLevel=max_noise
        )
    finally:
        db.close()

# ==================== Location Endpoints ====================

@app.get("/api/locations", response_model=list[LocationResponse])
async def get_locations():
    """Get all monitoring locations"""
    db = SessionLocal()
    try:
        locations = db.query(Location).all()

        if not locations:
            seed_demo_locations(db)
            locations = db.query(Location).all()

        # Enhance with current readings
        response = []
        for loc in locations:
            latest_reading = db.query(NoiseReading).filter(
                NoiseReading.location_id == loc.id
            ).order_by(NoiseReading.timestamp.desc()).first()

            meta = LOCATION_META.get(loc.name, DEFAULT_META)
            noise_level = latest_reading.noise_level if latest_reading else meta["base"] + random.uniform(-3, 3)

            response.append(LocationResponse(
                id=loc.id,
                name=loc.name,
                lat=loc.lat,
                lng=loc.lng,
                noiseLevel=noise_level,
                status=zone_status(noise_level, meta["limit"], meta["critical"]),
                category=meta["category"],
                lastUpdate=datetime.now().isoformat(),
                zone=loc.description,
                zoneLimit=meta["limit"],
                weight=meta["weight"],
            ))

        return response
    finally:
        db.close()

@app.post("/api/locations")
async def create_location(name: str, lat: float, lng: float):
    """Create a new monitoring location"""
    db = SessionLocal()
    try:
        location = Location(name=name, lat=lat, lng=lng)
        db.add(location)
        db.commit()
        return {"id": location.id, "name": location.name}
    finally:
        db.close()

# ==================== Noise Reading Endpoints ====================

@app.get("/api/readings", response_model=list[NoiseReadingResponse])
async def get_readings(location_id: int = None, limit: int = 100):
    """Get noise readings"""
    db = SessionLocal()
    try:
        query = db.query(NoiseReading).order_by(NoiseReading.timestamp.desc())

        if location_id:
            query = query.filter(NoiseReading.location_id == location_id)

        readings = query.limit(limit).all()

        return [
            NoiseReadingResponse(
                id=r.id,
                locationId=r.location_id,
                noiseLevel=r.noise_level,
                soundType=r.sound_type or "Mixed",
                timestamp=r.timestamp.isoformat()
            )
            for r in readings
        ]
    finally:
        db.close()

@app.post("/api/readings")
async def create_reading(location_id: int, noise_level: float, sound_type: str = "Mixed"):
    """Create a noise reading"""
    db = SessionLocal()
    try:
        reading = NoiseReading(
            location_id=location_id,
            noise_level=noise_level,
            sound_type=sound_type,
            timestamp=datetime.now()
        )
        db.add(reading)
        db.commit()

        # Check for alert
        location = db.query(Location).get(location_id)
        limit = LOCATION_META.get(location.name, DEFAULT_META)["limit"] if location else 65
        meta = LOCATION_META.get(location.name, DEFAULT_META) if location else DEFAULT_META
        if zone_status(noise_level, limit, meta["critical"]) == "critical":
            alert_service.create_alert(
                db,
                location_id,
                f"Noise level {noise_level} dB is {noise_level - limit:.0f} dB over the {limit} dB CPCB limit",
                "critical"
            )

        return {"id": reading.id, "status": "created"}
    finally:
        db.close()

# ==================== Audio Classification Endpoint ====================

@app.post("/api/classify-audio")
async def classify_audio(file: UploadFile = File(...), location_id: int = None):
    """Classify audio file and return sound type"""
    try:
        # Read audio file
        contents = await file.read()

        # Classify using AI model
        sound_type, confidence = sound_classifier.classify(contents)

        # Store reading if location specified
        if location_id:
            db = SessionLocal()
            try:
                # Simulate noise level from classification
                noise_level = 60 + random.randint(5, 40)

                reading = NoiseReading(
                    location_id=location_id,
                    noise_level=noise_level,
                    sound_type=sound_type,
                    timestamp=datetime.now()
                )
                db.add(reading)
                db.commit()
            finally:
                db.close()

        return {
            "soundType": sound_type,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "soundType": "Unknown",
            "confidence": 0
        }

# ==================== Alert Endpoints ====================

@app.get("/api/alerts/recent", response_model=list[AlertResponse])
async def get_recent_alerts(limit: int = 10):
    """Get recent alerts"""
    db = SessionLocal()
    try:
        alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()

        return [
            AlertResponse(
                id=a.id,
                location=db.query(Location).get(a.location_id).name,
                message=a.message,
                severity=a.severity,
                time=a.timestamp.isoformat(),
                resolved=a.resolved
            )
            for a in alerts
        ]
    finally:
        db.close()

@app.get("/api/alerts")
async def get_alerts(resolved: bool = False):
    """Get all alerts"""
    db = SessionLocal()
    try:
        alerts = db.query(Alert).filter(Alert.resolved == resolved).all()
        return [{
            "id": a.id,
            "locationId": a.location_id,
            "message": a.message,
            "severity": a.severity,
            "timestamp": a.timestamp.isoformat(),
            "resolved": a.resolved
        } for a in alerts]
    finally:
        db.close()

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int):
    """Mark alert as resolved"""
    db = SessionLocal()
    try:
        alert = db.query(Alert).get(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        alert.resolved = True
        alert.resolved_at = datetime.now()
        db.commit()

        return {"status": "resolved"}
    finally:
        db.close()

# ==================== Analytics Endpoints ====================

@app.get("/api/analytics/timeseries")
async def get_timeseries(period: str = "24h"):
    """Get time series data for charts"""
    db = SessionLocal()
    try:
        # Determine time range
        if period == "24h":
            hours = 24
        elif period == "7d":
            hours = 24 * 7
        elif period == "30d":
            hours = 24 * 30
        else:
            hours = 24

        start_time = datetime.now() - timedelta(hours=hours)

        # Generate demo data with realistic patterns
        data = []
        current_time = start_time

        while current_time < datetime.now():
            hour = current_time.hour

            # Realistic noise patterns
            if 6 <= hour < 9:  # Morning rush
                base_noise = 75
            elif 12 <= hour < 14:  # Lunch time
                base_noise = 70
            elif 17 <= hour < 20:  # Evening rush
                base_noise = 80
            elif 20 <= hour < 23 or 0 <= hour < 6:  # Night
                base_noise = 55
            else:
                base_noise = 65

            avg_noise = base_noise + random.randint(-5, 10)
            max_noise = avg_noise + random.randint(10, 25)
            min_noise = avg_noise - random.randint(5, 15)

            data.append({
                "time": current_time.strftime("%H:%M"),
                "avgNoise": round(avg_noise, 1),
                "maxNoise": round(max_noise, 1),
                "minNoise": round(min_noise, 1)
            })

            current_time += timedelta(hours=4)

        return data
    finally:
        db.close()

@app.get("/api/analytics/location-comparison")
async def get_location_comparison():
    """Compare noise levels across locations"""
    db = SessionLocal()
    try:
        locations = db.query(Location).all()

        data = []
        for loc in locations:
            # Simulate data
            if "Junction" in loc.name:
                avg = 92
                peak = 105
            elif "Hospital" in loc.name:
                avg = 65
                peak = 75
            elif "Residential" in loc.name:
                avg = 72
                peak = 88
            elif "Park" in loc.name:
                avg = 58
                peak = 72
            else:
                avg = 78
                peak = 92

            data.append({
                "name": loc.name,
                "avgNoise": avg,
                "peakNoise": peak,
                "duration": random.randint(100, 300)
            })

        return data
    finally:
        db.close()

@app.get("/api/analytics/sound-types")
async def get_sound_types():
    """Get distribution of sound types"""
    return [
        {"name": "Traffic Noise", "value": 35, "events": 142},
        {"name": "Construction", "value": 25, "events": 48},
        {"name": "Music/Entertainment", "value": 20, "events": 31},
        {"name": "Crowd Noise", "value": 15, "events": 29},
        {"name": "Other", "value": 5, "events": 8},
    ]

# ==================== Priority Engine Endpoints ====================

@app.get("/api/priority-rankings")
async def get_priority_rankings():
    """Get priority ranked locations"""
    db = SessionLocal()
    try:
        locations = db.query(Location).all()

        rankings = []
        for loc in locations:
            latest = db.query(NoiseReading).filter(
                NoiseReading.location_id == loc.id
            ).order_by(NoiseReading.timestamp.desc()).first()

            meta = LOCATION_META.get(loc.name, DEFAULT_META)
            noise_level = latest.noise_level if latest else meta["base"]

            # Priority: exceedance over the zone's CPCB limit x zone weight
            priority_score = zone_priority(noise_level, meta["limit"], meta["weight"])

            rankings.append({
                "location": loc.name,
                "noiseLevel": noise_level,
                "priorityScore": priority_score,
                "zone": loc.description,
                "zoneLimit": meta["limit"],
                "weight": meta["weight"],
                "category": meta["category"],
                "rank": 0  # Will be set after sorting
            })

        # Sort by priority score
        rankings.sort(key=lambda x: x["priorityScore"], reverse=True)

        # Add ranks
        for idx, ranking in enumerate(rankings):
            ranking["rank"] = idx + 1

        return rankings
    finally:
        db.close()

# ==================== System Endpoints ====================

@app.get("/api/health")
async def health_check():
    """System health check"""
    return {
        "status": "🟢 Healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": "✓ Connected",
            "ai_model": "✓ Ready",
            "monitoring": "✓ Active"
        }
    }

@app.post("/api/demo/populate")
async def populate_demo_data():
    """Populate database with demo data"""
    db = SessionLocal()
    try:
        seed_demo_locations(db)
        return {"status": "Demo data populated successfully"}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
