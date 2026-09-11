from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import hash_password, require_admin
from ..database import get_db

router = APIRouter(prefix="/api/employees", tags=["Employees"])


@router.post("", response_model=schemas.EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    company = db.query(models.Company).filter(models.Company.id == employee.company_id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    existing_employee = db.query(models.Employee).filter(models.Employee.email == employee.email).first()
    if existing_employee is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_employee = models.Employee(
        name=employee.name,
        email=employee.email,
        password_hash=hash_password(employee.password),
        company_id=employee.company_id,
        role=employee.role,
        is_active=employee.is_active,
    )

    db.add(db_employee)
    try:
        db.commit()
        db.refresh(db_employee)
    except Exception:
        db.rollback()
        raise

    return db_employee


@router.get("", response_model=list[schemas.EmployeeResponse])
def get_employees(
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    return db.query(models.Employee).order_by(models.Employee.name.asc()).all()


@router.get("/{employee_id}", response_model=schemas.EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=schemas.EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_update: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    company = db.query(models.Company).filter(models.Company.id == employee_update.company_id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    existing_employee = (
        db.query(models.Employee)
        .filter(models.Employee.email == employee_update.email)
        .filter(models.Employee.id != employee_id)
        .first()
    )
    if existing_employee is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    employee.name = employee_update.name
    employee.email = employee_update.email
    employee.company_id = employee_update.company_id
    employee.role = employee_update.role
    employee.is_active = employee_update.is_active

    try:
        db.commit()
        db.refresh(employee)
    except Exception:
        db.rollback()
        raise

    return employee


@router.patch("/{employee_id}/status", response_model=schemas.EmployeeResponse)
def update_employee_status(
    employee_id: int,
    employee_status: schemas.EmployeeStatusUpdate,
    db: Session = Depends(get_db),
    current_employee: models.Employee = Depends(require_admin),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    employee.is_active = employee_status.is_active

    try:
        db.commit()
        db.refresh(employee)
    except Exception:
        db.rollback()
        raise

    return employee
