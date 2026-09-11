import json
from datetime import date, datetime, timezone
from typing import Any
from urllib import request, error

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_employee
from ..database import get_db

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def reverse_geocode(lat: float, lng: float) -> str:
    url = (
        "https://nominatim.openstreetmap.org/reverse?format=jsonv2"
        f"&lat={lat}&lon={lng}"
    )

    req = request.Request(
        url,
        headers={
            "User-Agent": "CRM360-College-Project/1.0",
            "Accept-Language": "en",
        },
    )

    try:
        with request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return payload.get("display_name") or "Address not available"
    except (error.URLError, ValueError, json.JSONDecodeError):
        return "Address not available"


@router.get("/health")
def attendance_health():
    return {"message": "Attendance routes are ready."}


@router.post("/check-in", response_model=schemas.AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    payload: schemas.CheckInRequest,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(get_current_employee),
):
    today = date.today()

    existing_record = (
        db.query(models.Attendance)
        .filter(models.Attendance.employee_id == current_employee.id)
        .filter(models.Attendance.date == today)
        .first()
    )
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already recorded for today",
        )

    address = reverse_geocode(payload.lat, payload.lng)
    attendance_record = models.Attendance(
        employee_id=current_employee.id,
        date=today,
        check_in_time=datetime.now(timezone.utc),
        check_in_lat=payload.lat,
        check_in_lng=payload.lng,
        check_in_address=address,
        status="checked_in",
    )

    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    return attendance_record


@router.post("/check-out", response_model=schemas.AttendanceResponse)
def check_out(
    payload: schemas.CheckOutRequest,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(get_current_employee),
):
    today = date.today()

    attendance_record = (
        db.query(models.Attendance)
        .filter(models.Attendance.employee_id == current_employee.id)
        .filter(models.Attendance.date == today)
        .first()
    )

    if attendance_record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No check-in found for today",
        )

    if attendance_record.status == "checked_out":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already checked out for today",
        )

    check_out_time = datetime.now(timezone.utc)
    check_out_address = reverse_geocode(payload.lat, payload.lng)

    duration = check_out_time - attendance_record.check_in_time
    hours = duration.total_seconds() / 3600
    working_hours = f"{hours:.2f} hours"

    attendance_record.check_out_time = check_out_time
    attendance_record.check_out_lat = payload.lat
    attendance_record.check_out_lng = payload.lng
    attendance_record.check_out_address = check_out_address
    attendance_record.working_hours = working_hours
    attendance_record.status = "checked_out"

    db.commit()
    db.refresh(attendance_record)

    return attendance_record


@router.get("/me", response_model=schemas.AttendanceHistoryResponse)
def get_my_attendance(
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(get_current_employee),
):
    history = (
        db.query(models.Attendance)
        .filter(models.Attendance.employee_id == current_employee.id)
        .order_by(models.Attendance.date.desc(), models.Attendance.check_in_time.desc())
        .all()
    )

    return {
        "employee_id": current_employee.id,
        "employee_name": current_employee.name,
        "total_records": len(history),
        "attendance": history,
    }


@router.get("/all", response_model=schemas.ManagerAttendanceResponse)
def get_all_attendance_for_date(
    date_value: str = Query(..., alias="date"),
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(get_current_employee),
):
    try:
        target_date = date.fromisoformat(date_value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    employee_rows = (
        db.query(
            models.Employee.id.label("employee_id"),
            models.Employee.name.label("employee_name"),
            models.Attendance.id.label("id"),
            models.Attendance.date.label("date"),
            models.Attendance.check_in_time.label("check_in_time"),
            models.Attendance.check_in_lat.label("check_in_lat"),
            models.Attendance.check_in_lng.label("check_in_lng"),
            models.Attendance.check_in_address.label("check_in_address"),
            models.Attendance.check_out_time.label("check_out_time"),
            models.Attendance.check_out_lat.label("check_out_lat"),
            models.Attendance.check_out_lng.label("check_out_lng"),
            models.Attendance.check_out_address.label("check_out_address"),
            models.Attendance.working_hours.label("working_hours"),
            models.Attendance.status.label("status"),
        )
        .outerjoin(
            models.Attendance,
            (models.Attendance.employee_id == models.Employee.id)
            & (models.Attendance.date == target_date),
        )
        .filter(models.Employee.is_active.is_(True))
        .order_by(models.Employee.name.asc(), models.Attendance.check_in_time.asc())
        .distinct(models.Employee.id)
        .all()
    )

    attendance_payload = []
    seen_employee_ids = set()

    for row in employee_rows:
        if row.employee_id in seen_employee_ids:
            continue
        seen_employee_ids.add(row.employee_id)

        if row.id is None:
            attendance_payload.append(
                {
                    "id": None,
                    "employee_id": row.employee_id,
                    "employee_name": row.employee_name,
                    "date": target_date,
                    "check_in_time": None,
                    "check_in_lat": None,
                    "check_in_lng": None,
                    "check_in_address": None,
                    "check_out_time": None,
                    "check_out_lat": None,
                    "check_out_lng": None,
                    "check_out_address": None,
                    "working_hours": None,
                    "status": "not_checked_in",
                }
            )
            continue

        attendance_payload.append(
            {
                "id": row.id,
                "employee_id": row.employee_id,
                "employee_name": row.employee_name,
                "date": row.date,
                "check_in_time": row.check_in_time,
                "check_in_lat": row.check_in_lat,
                "check_in_lng": row.check_in_lng,
                "check_in_address": row.check_in_address,
                "check_out_time": row.check_out_time,
                "check_out_lat": row.check_out_lat,
                "check_out_lng": row.check_out_lng,
                "check_out_address": row.check_out_address,
                "working_hours": row.working_hours,
                "status": row.status,
            }
        )

    return {
        "total_records": len(attendance_payload),
        "attendance": attendance_payload,
    }
