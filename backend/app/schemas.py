from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth ----------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Departments ----------

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentOut(DepartmentCreate):
    id: str


# ---------- Employees ----------

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    department_id: str
    salary: float = Field(ge=0)
    date_joined: date
    status: str = Field(default="active", pattern="^(active|on_leave|terminated)$")


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department_id: Optional[str] = None
    salary: Optional[float] = Field(default=None, ge=0)
    date_joined: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(active|on_leave|terminated)$")


class EmployeeOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    department_id: str
    department_name: Optional[str] = None
    salary: float
    date_joined: date
    status: str
    created_at: Optional[datetime] = None


# ---------- Attendance ----------

class AttendanceMark(BaseModel):
    employee_id: str
    date: date
    status: str = Field(pattern="^(present|absent|half_day|leave)$")
    notes: Optional[str] = None


class AttendanceOut(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = None
    date: date
    status: str
    notes: Optional[str] = None
    marked_by: Optional[str] = None
    updated_at: Optional[datetime] = None
