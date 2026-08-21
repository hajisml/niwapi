from fastapi import APIRouter

import db
from schemas import SensorTelemetryIn

router = APIRouter(prefix="/sensors", tags=["sensors"])

SELECT_SENSOR = """
    SELECT id, label, ST_Y(location) AS latitude, ST_X(location) AS longitude,
           clearance_distance, last_reading
    FROM sensors
"""


@router.get("", response_model=None)
def list_sensors():
    return db.fetch_all(f"{SELECT_SENSOR} ORDER BY label")


@router.post("/telemetry", response_model=None)
def ingest_telemetry(reading: SensorTelemetryIn):
    row = db.fetch_one(
        """
        INSERT INTO sensors (label, location, clearance_distance, last_reading)
        VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, now())
        ON CONFLICT (label) DO UPDATE
            SET location = EXCLUDED.location,
                clearance_distance = EXCLUDED.clearance_distance,
                last_reading = now()
        RETURNING id
        """,
        (reading.label, reading.longitude, reading.latitude, reading.clearance_distance),
    )
    return db.fetch_one(f"{SELECT_SENSOR} WHERE id = %s", (row["id"],))
