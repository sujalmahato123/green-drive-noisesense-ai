from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LocationResponse(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    noiseLevel: float
    status: str  # critical, warning, normal (relative to the zone's CPCB limit)
    lastUpdate: str
    zone: Optional[str] = None
    zoneLimit: Optional[float] = None
    weight: Optional[float] = None
    category: Optional[str] = None


class NoiseReadingResponse(BaseModel):
    id: int
    locationId: int
    noiseLevel: float
    soundType: str
    timestamp: str


class AlertResponse(BaseModel):
    id: int
    location: str
    message: str
    severity: str
    time: str
    resolved: bool = False


class DashboardStats(BaseModel):
    totalLocations: int
    currentAverageNoise: float
    activeAlerts: int
    highestNoiseLocation: str
    highestNoiseLevel: float


class SoundClassificationResponse(BaseModel):
    soundType: str
    confidence: float
    timestamp: str


class LocationCreate(BaseModel):
    name: str
    lat: float
    lng: float
    description: Optional[str] = None


class NoiseReadingCreate(BaseModel):
    location_id: int
    noise_level: float
    sound_type: Optional[str] = "Mixed"
    duration: Optional[int] = None


class AlertCreate(BaseModel):
    location_id: int
    message: str
    severity: str
    threshold_exceeded: Optional[float] = None


class SystemConfigUpdate(BaseModel):
    critical_threshold: Optional[float] = None
    warning_threshold: Optional[float] = None
    normal_threshold: Optional[float] = None
    alert_email: Optional[str] = None
    sound_classification_enabled: Optional[bool] = None
    time_based_analysis_enabled: Optional[bool] = None
    realtime_monitoring_enabled: Optional[bool] = None
    demo_mode: Optional[bool] = None
