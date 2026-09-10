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
