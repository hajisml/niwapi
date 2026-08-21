from datetime import datetime

from pydantic import BaseModel


class ReportOut(BaseModel):
    id: int
    image_url: str | None
    latitude: float | None
    longitude: float | None
    severity: int | None
    blockage_type: str | None
    details: str | None
    culvert_importance: int
    forecasted_rainfall_mm: float | None
    risk_score: float | None
    risk_level: str | None
    status: str
    created_at: datetime


class SensorOut(BaseModel):
    id: int
    label: str
    latitude: float | None
    longitude: float | None
    clearance_distance: float
    last_reading: datetime


class SensorTelemetryIn(BaseModel):
    label: str
    latitude: float
    longitude: float
    clearance_distance: float


class WorkOrderOut(BaseModel):
    id: int
    report_id: int
    assigned_team: str
    status: str
    resolution_image_url: str | None
    resolved_at: datetime | None
    created_at: datetime


class WorkOrderCreateIn(BaseModel):
    report_id: int
    assigned_team: str
