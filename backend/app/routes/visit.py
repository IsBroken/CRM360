from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_employee
from ..database import get_db
from .attendance import reverse_geocode


router = APIRouter(
    prefix="/api/visits",
    tags=["Visits"],
)


@router.post(
    "",
    response_model=schemas.VisitResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_visit(
    payload: schemas.VisitCreate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(get_current_employee),
):

    attendance = (
        db.query(models.Attendance)
        .filter(models.Attendance.employee_id == current_employee.id)
        .filter(models.Attendance.date == date.today())
        .first()
    )

    if attendance is None or attendance.status != "checked_in":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be checked in to record a visit",
        )

    address = reverse_geocode(
        payload.latitude,
        payload.longitude,
    )

    visit = models.Visit(
        employee_id=current_employee.id,
        client_name=payload.client_name,
        purpose=payload.purpose,
        visit_date=payload.visit_date,
        visit_time=payload.visit_time,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=address,
        notes=payload.notes,
        status="completed",
    )

    db.add(visit)
    db.commit()
    db.refresh(visit)

    return visit


@router.get(
    "/me",
    response_model=list[schemas.VisitResponse],
)
def get_my_visits(
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(get_current_employee),
):
    return (
        db.query(models.Visit)
        .filter(models.Visit.employee_id == current_employee.id)
        .order_by(
            models.Visit.visit_date.desc(),
            models.Visit.visit_time.desc(),
        )
        .all()
    )