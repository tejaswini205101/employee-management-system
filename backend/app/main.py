from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_indexes
from app.routers import auth, employees, departments, attendance

app = FastAPI(
    title="Employee Management System API",
    description="REST API for managing employees and departments",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(attendance.router)


@app.on_event("startup")
async def on_startup():
    await init_indexes()


@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
