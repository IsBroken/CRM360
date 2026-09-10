from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.attendance import router as attendance_router
from .routes.auth import router as auth_router
from .database import Base, engine
from . import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CRM 360",
    description="Attendance and GPS backend for the CRM 360 SRS project.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://127.0.0.1:4173',
        'http://127.0.0.1:4174',
        'http://127.0.0.1:4175',
        'http://localhost:4173',
        'http://localhost:4174',
        'http://localhost:4175',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router)
app.include_router(attendance_router)


@app.get("/")
def root():
    return {"message": "CRM 360 backend is running."}
