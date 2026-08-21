from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

import db
import risk
import vision
import weather
from storage import get_storage

router = APIRouter(prefix="/reports", tags=["reports"])

SELECT_REPORT = """
    SELECT id, image_url, ST_Y(location) AS latitude, ST_X(location) AS longitude,
           severity, blockage_type, details, culvert_importance, forecasted_rainfall_mm,
           risk_score, risk_level, status, created_at
    FROM reports
"""


@router.post("", response_model=None)
async def create_report(
    request: Request,
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    details: str = Form(""),
    culvert_importance: int = Form(2),
):
    image_bytes = await photo.read()
    classification = vision.classify_blockage(image_bytes, photo.content_type)
    rainfall_mm = weather.forecasted_rainfall_mm(latitude, longitude)
    score = risk.vulnerability_score(classification["severity"], culvert_importance, rainfall_mm)
    level = risk.risk_level(score)

    image_url = get_storage().save_image(image_bytes, photo.content_type, str(request.base_url))

    row = db.fetch_one(
        """
        INSERT INTO reports
            (image_url, location, severity, blockage_type, details, culvert_importance,
             forecasted_rainfall_mm, risk_score, risk_level, status)
        VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, %s, %s, %s, %s, 'pending')
        RETURNING id
        """,
        (
            image_url,
            longitude,
            latitude,
            classification["severity"],
            classification["blockage_type"],
            details,
            culvert_importance,
            rainfall_mm,
            score,
            level,
        ),
    )
    return db.fetch_one(f"{SELECT_REPORT} WHERE id = %s", (row["id"],))


@router.get("", response_model=None)
def list_reports():
    return db.fetch_all(f"{SELECT_REPORT} ORDER BY risk_score DESC NULLS LAST, created_at DESC")


@router.get("/{report_id}", response_model=None)
def get_report(report_id: int):
    row = db.fetch_one(f"{SELECT_REPORT} WHERE id = %s", (report_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    return row
