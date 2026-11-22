from datetime import datetime
from database import Alert, SystemConfig

class AlertService:
    """Service for managing alerts and notifications"""

    def __init__(self):
        self.critical_threshold = 85
        self.warning_threshold = 75

    def create_alert(self, db, location_id: int, message: str, severity: str):
        """Create a new alert"""
        alert = Alert(
            location_id=location_id,
            message=message,
            severity=severity,
            timestamp=datetime.now()
        )
        db.add(alert)
        db.commit()
        return alert

    def check_threshold(self, noise_level: float) -> str:
        """Determine alert level based on noise threshold"""
        if noise_level >= self.critical_threshold:
            return "critical"
        elif noise_level >= self.warning_threshold:
            return "warning"
        else:
            return "normal"

    def get_active_alerts(self, db):
        """Get all unresolved alerts"""
        return db.query(Alert).filter(Alert.resolved == False).all()

    def resolve_alert(self, db, alert_id: int):
        """Mark alert as resolved"""
        alert = db.query(Alert).get(alert_id)
        if alert:
            alert.resolved = True
            alert.resolved_at = datetime.now()
            db.commit()
        return alert

    def send_notification(self, alert, channel: str = "email"):
        """Send alert notification via different channels"""
        if channel == "email":
            self._send_email(alert)
        elif channel == "sms":
            self._send_sms(alert)
        elif channel == "push":
            self._send_push(alert)

    def _send_email(self, alert):
        """Send email notification (placeholder)"""
        # TODO: Implement actual email sending
        print(f"[EMAIL] Alert {alert.id}: {alert.message}")

    def _send_sms(self, alert):
        """Send SMS notification (placeholder)"""
        # TODO: Implement actual SMS sending
        print(f"[SMS] Alert {alert.id}: {alert.message}")

    def _send_push(self, alert):
        """Send push notification (placeholder)"""
        # TODO: Implement actual push notification
        print(f"[PUSH] Alert {alert.id}: {alert.message}")
