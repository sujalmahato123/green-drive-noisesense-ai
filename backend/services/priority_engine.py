from database import NoiseReading
from datetime import datetime, timedelta
import numpy as np

class PriorityEngine:
    """Smart priority ranking engine for locations"""

    # Location sensitivity factors
    LOCATION_SENSITIVITY = {
        "Hospital": 1.5,  # Hospitals are most sensitive
        "Residential": 1.3,
        "School": 1.4,
        "Park": 0.8,
        "Market": 1.0,
        "Road": 0.9,
    }

    def __init__(self):
        self.critical_threshold = 85
        self.warning_threshold = 75

    def calculate_priority(self, noise_level: float, location_id: int, location_name: str = "") -> float:
        """
        Calculate priority score for a location

        Factors:
        - Noise Intensity (40%)
        - Duration (30%)
        - Location Sensitivity (20%)
        - Safety Risk (10%)
        """

        # Factor 1: Noise Intensity (0-40 points)
        intensity_score = self._calculate_intensity_score(noise_level)

        # Factor 2: Duration (0-30 points)
        duration_score = 20  # Default, would fetch from DB in real scenario

        # Factor 3: Location Sensitivity (0-20 points)
        sensitivity_score = self._calculate_sensitivity_score(location_name)

        # Factor 4: Safety Risk (0-10 points)
        safety_score = self._calculate_safety_score(noise_level)

        # Total priority score (0-100)
        total_score = intensity_score + duration_score + sensitivity_score + safety_score

        return min(total_score, 100)

    def _calculate_intensity_score(self, noise_level: float) -> float:
        """Calculate score based on noise intensity"""
        if noise_level >= self.critical_threshold:
            return 40
        elif noise_level >= self.warning_threshold:
            return 25
        else:
            return (noise_level / self.warning_threshold) * 25

    def _calculate_duration_score(self, location_id: int, db) -> float:
        """Calculate score based on noise duration"""
        # Get readings from last 1 hour
        one_hour_ago = datetime.now() - timedelta(hours=1)

        readings = db.query(NoiseReading).filter(
            NoiseReading.location_id == location_id,
            NoiseReading.timestamp >= one_hour_ago
        ).all()

        if not readings:
            return 0

        # Count how many readings exceed threshold
        threshold_violations = sum(1 for r in readings if r.noise_level >= self.warning_threshold)
        violation_percentage = (threshold_violations / len(readings)) * 100

        return (violation_percentage / 100) * 30

    def _calculate_sensitivity_score(self, location_name: str) -> float:
        """Calculate score based on location sensitivity"""
        for key, multiplier in self.LOCATION_SENSITIVITY.items():
            if key in location_name:
                return 20 * multiplier

        return 10  # Default

    def _calculate_safety_score(self, noise_level: float) -> float:
        """Calculate score based on safety risk"""
        # Very high noise can pose safety risks
        if noise_level >= 100:
            return 10
        elif noise_level >= 90:
            return 7
        elif noise_level >= 80:
            return 4
        else:
            return 1

    def rank_locations(self, locations: list, db) -> list:
        """Rank locations by priority"""
        ranked = []

        for location in locations:
            # Get latest reading
            latest = db.query(NoiseReading).filter(
                NoiseReading.location_id == location.id
            ).order_by(NoiseReading.timestamp.desc()).first()

            noise_level = latest.noise_level if latest else 60

            priority_score = self.calculate_priority(
                noise_level,
                location.id,
                location.name
            )

            ranked.append({
                "id": location.id,
                "name": location.name,
                "noiseLevel": noise_level,
                "priorityScore": priority_score
            })

        # Sort by priority score (highest first)
        ranked.sort(key=lambda x: x["priorityScore"], reverse=True)

        # Add rank
        for idx, item in enumerate(ranked):
            item["rank"] = idx + 1

        return ranked

    def get_critical_locations(self, locations: list, threshold: float = 70) -> list:
        """Get locations that need immediate attention"""
        return [loc for loc in locations if loc["priorityScore"] >= threshold]
