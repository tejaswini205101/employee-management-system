from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from bson.errors import InvalidId

from app.database import attendance_collection, employees_collection
from app.schemas import AttendanceMark, AttendanceOut
from app.auth_utils import get_current_user, require_admin

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


async def attendance_helper(a: dict) -> AttendanceOut:
    employee_name = None
    try:
        emp = await employees_collection.find_one({"_id": ObjectId(a["employee_id"])})
        if emp:
            employee_name = f"{emp['first_name']} {emp['last_name']}"
    except InvalidId:
        pass

    return AttendanceOut(
        id=str(a["_id"]),
        employee_id=a["employee_id"],
        employee_name=employee_name,
        date=a["date"],
        status=a["status"],
        notes=a.get("notes"),
        marked_by=a.get("marked_by"),
        updated_at=a.get("updated_at"),
    )


@router.get("/me", response_model=list[AttendanceOut])
async def my_attendance(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Attendance for the logged-in person. We match on email, since a login
    account (users collection) and an employee record (employees collection)
    are linked by email rather than a stored foreign key.
    """
    employee = await employees_collection.find_one({"email": current_user["email"]})
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to your account yet. Ask an admin to add you as an employee using the same email you registered with.",
        )

    query: dict = {"employee_id": str(employee["_id"])}
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = date_from.isoformat()
        if date_to:
            query["date"]["$lte"] = date_to.isoformat()

    cursor = attendance_collection.find(query).sort("date", -1)
    return [await attendance_helper(a) async for a in cursor]


@router.get("/", response_model=list[AttendanceOut])
async def list_attendance(
    employee_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: dict = Depends(require_admin),
):
    """Admin view across all employees, optionally filtered."""
    query: dict = {}
    if employee_id:
        query["employee_id"] = employee_id
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = date_from.isoformat()
        if date_to:
            query["date"]["$lte"] = date_to.isoformat()

    cursor = attendance_collection.find(query).sort("date", -1)
    return [await attendance_helper(a) async for a in cursor]


@router.post("/mark", response_model=AttendanceOut, status_code=201)
async def mark_attendance(payload: AttendanceMark, current_user: dict = Depends(require_admin)):
    """
    Admin marks (or corrects) attendance for one employee on one date.
    Upserts, so marking the same employee/date twice just updates the record
    instead of erroring.
    """
    try:
        ObjectId(payload.employee_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid employee id")

    if not await employees_collection.find_one({"_id": ObjectId(payload.employee_id)}):
        raise HTTPException(status_code=400, detail="Employee does not exist")

    date_str = payload.date.isoformat()
    update_doc = {
        "employee_id": payload.employee_id,
        "date": date_str,
        "status": payload.status,
        "notes": payload.notes,
        "marked_by": current_user["email"],
        "updated_at": datetime.utcnow(),
    }

    await attendance_collection.update_one(
        {"employee_id": payload.employee_id, "date": date_str},
        {"$set": update_doc},
        upsert=True,
    )
    record = await attendance_collection.find_one(
        {"employee_id": payload.employee_id, "date": date_str}
    )
    return await attendance_helper(record)


@router.delete("/{attendance_id}", status_code=204)
async def delete_attendance(attendance_id: str, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(attendance_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid attendance id")

    result = await attendance_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")
