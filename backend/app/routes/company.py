from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import require_admin
from ..database import get_db

router = APIRouter(prefix="/api/companies", tags=["Companies"])


@router.post("", response_model=schemas.CompanyResponse)
def create_company(
    company: schemas.CompanyCreate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    db_company = models.Company(
        name=company.name,
        address=company.address,
        latitude=company.latitude,
        longitude=company.longitude,
        allowed_radius=company.allowed_radius,
        is_active=company.is_active,
    )
    db.add(db_company)
    try:
        db.commit()
        db.refresh(db_company)
    except Exception:
        db.rollback()
        raise
    return db_company


@router.get("", response_model=list[schemas.CompanyResponse])
def get_companies(
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    return db.query(models.Company).order_by(models.Company.name.asc()).all()


@router.get("/{company_id}", response_model=schemas.CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


@router.put("/{company_id}", response_model=schemas.CompanyResponse)
def update_company(
    company_id: int,
    company_update: schemas.CompanyUpdate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    company.name = company_update.name
    company.address = company_update.address
    company.latitude = company_update.latitude
    company.longitude = company_update.longitude
    company.allowed_radius = company_update.allowed_radius
    company.is_active = company_update.is_active

    try:
        db.commit()
        db.refresh(company)
    except Exception:
        db.rollback()
        raise
    return company


@router.patch("/{company_id}/status", response_model=schemas.CompanyResponse)
def update_company_status(
    company_id: int,
    company_status: schemas.CompanyStatusUpdate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    company.is_active = company_status.is_active

    try:
        db.commit()
        db.refresh(company)
    except Exception:
        db.rollback()
        raise
    return company
