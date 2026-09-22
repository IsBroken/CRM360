from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_current_employee, verify_password
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def authenticate_employee(email: str, password: str, db: Session):
    employee = db.query(models.Employee).filter(models.Employee.email == email).first()

    if not employee or not verify_password(password, employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive employee",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return employee


@router.post("/login", response_model=schemas.LoginResponse)
def login_user(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    employee = authenticate_employee(payload.email, payload.password, db)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": str(employee.id)}, access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=schemas.LoginResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    employee = authenticate_employee(form_data.username, form_data.password, db)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": str(employee.id)}, access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.EmployeeResponse)
def get_me(
    current_employee: models.Employee = Depends(get_current_employee),
):
    return current_employee
