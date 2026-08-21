from fastapi import APIRouter, File, HTTPException, Request, UploadFile

import db
from schemas import WorkOrderCreateIn
from storage import get_storage

router = APIRouter(prefix="/work-orders", tags=["work-orders"])

SELECT_WORK_ORDER = """
    SELECT id, report_id, assigned_team, status, resolution_image_url, resolved_at, created_at
    FROM work_orders
"""


@router.post("", response_model=None)
def create_work_order(payload: WorkOrderCreateIn):
    report = db.fetch_one("SELECT id FROM reports WHERE id = %s", (payload.report_id,))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    row = db.fetch_one(
        "INSERT INTO work_orders (report_id, assigned_team, status) VALUES (%s, %s, 'dispatched') RETURNING id",
        (payload.report_id, payload.assigned_team),
    )
    db.fetch_one("UPDATE reports SET status = 'dispatched' WHERE id = %s RETURNING id", (payload.report_id,))
    return db.fetch_one(f"{SELECT_WORK_ORDER} WHERE id = %s", (row["id"],))


@router.get("", response_model=None)
def list_work_orders():
    return db.fetch_all(f"{SELECT_WORK_ORDER} ORDER BY created_at DESC")


@router.patch("/{work_order_id}/resolve", response_model=None)
async def resolve_work_order(
    work_order_id: int,
    request: Request,
    photo: UploadFile | None = File(None),
):
    work_order = db.fetch_one(f"{SELECT_WORK_ORDER} WHERE id = %s", (work_order_id,))
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    resolution_image_url = None
    if photo is not None:
        image_bytes = await photo.read()
        resolution_image_url = get_storage().save_image(image_bytes, photo.content_type, str(request.base_url))

    db.fetch_one(
        """
        UPDATE work_orders
        SET status = 'resolved', resolved_at = now(), resolution_image_url = COALESCE(%s, resolution_image_url)
        WHERE id = %s
        RETURNING id
        """,
        (resolution_image_url, work_order_id),
    )
    db.fetch_one(
        """
        UPDATE reports
        SET status = 'resolved', risk_score = 0, risk_level = 'Low'
        WHERE id = %s
        RETURNING id
        """,
        (work_order["report_id"],),
    )
    return db.fetch_one(f"{SELECT_WORK_ORDER} WHERE id = %s", (work_order_id,))
