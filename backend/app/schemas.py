from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CheckInRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class CheckOutRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in_time: datetime
    check_in_lat: float
    check_in_lng: float
    check_in_address: str
    check_out_time: Optional[datetime] = None
    check_out_lat: Optional[float] = None
    check_out_lng: Optional[float] = None
    check_out_address: Optional[str] = None
    working_hours: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class AttendanceHistoryResponse(BaseModel):
    employee_id: int
    employee_name: str
    total_records: int
    attendance: list[AttendanceResponse]

    model_config = ConfigDict(from_attributes=True)


class ManagerAttendanceEntry(BaseModel):
    id: Optional[int] = None
    employee_id: int
    employee_name: str
    date: date
    check_in_time: Optional[datetime] = None
    check_in_lat: Optional[float] = None
    check_in_lng: Optional[float] = None
    check_in_address: Optional[str] = None
    check_out_time: Optional[datetime] = None
    check_out_lat: Optional[float] = None
    check_out_lng: Optional[float] = None
    check_out_address: Optional[str] = None
    working_hours: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class ManagerAttendanceResponse(BaseModel):
    total_records: int
    attendance: list[ManagerAttendanceEntry]

    model_config = ConfigDict(from_attributes=True)


class CompanyCreate(BaseModel):
    name: str
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    allowed_radius: float = Field(default=100.0, gt=0)
    is_active: bool = True


class CompanyUpdate(BaseModel):
    name: str
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    allowed_radius: float = Field(..., gt=0)
    is_active: bool


class CompanyStatusUpdate(BaseModel):
    is_active: bool


class CompanyResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    allowed_radius: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    company_id: int = Field(..., gt=0)
    role: str = Field(default="employee", min_length=1)
    is_active: bool = True


class EmployeeUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    company_id: int = Field(..., gt=0)
    role: str = Field(..., min_length=1)
    is_active: bool


class EmployeeStatusUpdate(BaseModel):
    is_active: bool


class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    company_id: Optional[int] = None
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
