import os
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal, engine, Base
from app.models import Attendance, Employee


DEMO_PASSWORD = os.getenv("DEMO_EMPLOYEE_PASSWORD", "DemoPass123!")

DEMO_EMPLOYEES = [
    {"name": "Test Employee", "email": "employee@crm360.com"},
    {"name": "Ayesha Khan", "email": "ayesha.khan@crm360.com"},
    {"name": "Bilal Ahmed", "email": "bilal.ahmed@crm360.com"},
    {"name": "Sarah Ali", "email": "sarah.ali@crm360.com"},
]

LOCATIONS = [
    {
        "lat": 31.5204,
        "lng": 74.3587,
        "address": "Gurumangat Road, Rehman Park, Gulberg, Lahore Cant, Lahore Cantonment Tehsil, Lahore District, Lahore Division, Punjab, 54660, Pakistan",
    },
    {
        "lat": 31.4783,
        "lng": 74.2915,
        "address": "Johar Town, Lahore, Punjab, Pakistan",
    },
    {
        "lat": 31.5050,
        "lng": 74.3202,
        "address": "Model Town, Lahore, Punjab, Pakistan",
    },
]


def get_seed_dates(days_back: int = 12):
    today = date.today()
    return [today - timedelta(days=offset) for offset in range(days_back, 0, -1)]


def build_attendance_payloads():
    seed_dates = get_seed_dates(days_back=12)
    records = []

    # Create 12 realistic attendance entries spread across the last two weeks.
    # Each employee gets at most one record per day by checking before insert.
    employee_order = [0, 1, 2, 3]

    for index, target_date in enumerate(seed_dates):
        if index % 2 == 0:
            selected_employees = employee_order[:3]
        else:
            selected_employees = employee_order[1:]

        for employee_number in selected_employees:
            check_in_minute = 45 + ((employee_number * 7 + index) % 20)
            check_in_hour = 8 + ((employee_number + index) % 2)
            check_out_minute = 30 + ((employee_number * 11 + index * 13) % 30)
            check_out_hour = 17 + ((employee_number + 1) % 2)

            if check_in_minute >= 60:
                check_in_minute -= 60
                check_in_hour += 1

            if check_out_minute >= 60:
                check_out_minute -= 60
                check_out_hour += 1

            check_in_dt = datetime.combine(target_date, datetime.min.time()).replace(
                hour=check_in_hour,
                minute=check_in_minute,
            )
            check_out_dt = datetime.combine(target_date, datetime.min.time()).replace(
                hour=check_out_hour,
                minute=check_out_minute,
            )

            if check_out_dt <= check_in_dt:
                check_out_dt = check_in_dt + timedelta(hours=8, minutes=30)

            location = LOCATIONS[(employee_number + index) % len(LOCATIONS)]
            duration = check_out_dt - check_in_dt
            working_hours = f"{duration.total_seconds() / 3600:.2f} hours"

            records.append(
                {
                    "date": target_date,
                    "employee_order": employee_number,
                    "check_in_time": check_in_dt,
                    "check_out_time": check_out_dt,
                    "check_in_lat": location["lat"],
                    "check_in_lng": location["lng"],
                    "check_in_address": location["address"],
                    "check_out_lat": location["lat"] + 0.0008,
                    "check_out_lng": location["lng"] + 0.0006,
                    "check_out_address": location["address"],
                    "working_hours": working_hours,
                    "status": "checked_out",
                }
            )

    # Keep the dataset compact for a demo while still covering a 1-2 week history.
    return records[:15]


def seed_demo_data():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        employees_by_email = {employee.email: employee for employee in db.query(Employee).all()}

        for details in DEMO_EMPLOYEES:
            if details["email"] not in employees_by_email:
                employee = Employee(
                    name=details["name"],
                    email=details["email"],
                    password_hash=hash_password(DEMO_PASSWORD),
                    is_active=True,
                )
                db.add(employee)
                db.flush()
                employees_by_email[employee.email] = employee

        records = build_attendance_payloads()
        created_count = 0
        skipped_count = 0

        for item in records:
            employee = employees_by_email[DEMO_EMPLOYEES[item["employee_order"]]["email"]]
            existing = (
                db.query(Attendance)
                .filter(Attendance.employee_id == employee.id)
                .filter(Attendance.date == item["date"])
                .first()
            )

            if existing is not None:
                skipped_count += 1
                continue

            attendance = Attendance(
                employee_id=employee.id,
                date=item["date"],
                check_in_time=item["check_in_time"],
                check_out_time=item["check_out_time"],
                check_in_lat=item["check_in_lat"],
                check_in_lng=item["check_in_lng"],
                check_in_address=item["check_in_address"],
                check_out_lat=item["check_out_lat"],
                check_out_lng=item["check_out_lng"],
                check_out_address=item["check_out_address"],
                working_hours=item["working_hours"],
                status=item["status"],
            )
            db.add(attendance)
            created_count += 1

        db.commit()

        print(f"Seed complete: created {created_count} attendance records, skipped {skipped_count} duplicates.")
        print(f"Demo login password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed_demo_data()
