from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL
DATABASE_URL = "sqlite:///./noisesense.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ==================== Database Models ====================

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    readings = relationship("NoiseReading", back_populates="location", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="location", cascade="all, delete-orphan")


class NoiseReading(Base):
    __tablename__ = "noise_readings"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    noise_level = Column(Float)  # in dB
    sound_type = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    timestamp = Column(DateTime, default=datetime.now, index=True)

    # Relationships
    location = relationship("Location", back_populates="readings")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    message = Column(String)
    severity = Column(String)  # critical, warning, info
    threshold_exceeded = Column(Float, nullable=True)
    resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.now, index=True)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    location = relationship("Location", back_populates="alerts")


class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    critical_threshold = Column(Float, default=85)  # dB
    warning_threshold = Column(Float, default=75)  # dB
    normal_threshold = Column(Float, default=65)  # dB
    alert_email = Column(String, nullable=True)
    sound_classification_enabled = Column(Boolean, default=True)
    time_based_analysis_enabled = Column(Boolean, default=True)
    realtime_monitoring_enabled = Column(Boolean, default=True)
    demo_mode = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    notification_type = Column(String)  # email, sms, push
    recipient = Column(String)
    status = Column(String)  # sent, failed, pending
    timestamp = Column(DateTime, default=datetime.now)


# ==================== Database Initialization ====================

def init_db():
    """Initialize database and create tables"""
    Base.metadata.create_all(bind=engine)

    # Initialize system config if not exists
    db = SessionLocal()
    try:
        config = db.query(SystemConfig).first()
        if not config:
            config = SystemConfig()
            db.add(config)
            db.commit()
    finally:
        db.close()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
