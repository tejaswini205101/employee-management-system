from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from bson.errors import InvalidId

from app.database import employees_collection, departments_collection
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.auth_utils import get_current_user, require_admin

router = APIRouter(prefix="/api/employees", tags=["employees"])


def serialize_date(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


async def employee_helper(e: dict) -> EmployeeOut:
    dept_name = None
    if e.get("department_id"):
        try:
            dept = await departments_collection.find_one({"_id": ObjectId(e["department_id"])})
            dept_name = dept["name"] if dept else None
        except InvalidId:
            dept_name = None

    return EmployeeOut(
        id=str(e["_id"]),
        first_name=e["first_name"],
        last_name=e["last_name"],
        email=e["email"],
        phone=e.get("phone"),
        position=e["position"],
        department_id=e["department_id"],
        department_name=dept_name,
        salary=e["salary"],
        date_joined=e["date_joined"],
        status=e.get("status", "active"),
        created_at=e.get("created_at"),
    )


@router.get("/", response_model=list[EmployeeOut])
async def list_employees(
    search: Optional[str] = Query(default=None, description="Search by name or email"),
    department_id: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    query: dict = {}
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if department_id:
        query["department_id"] = department_id
    if status_filter:
        query["status"] = status_filter

    cursor = employees_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    results = [await employee_helper(e) async for e in cursor]
    return results


@router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(employee_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid employee id")

    e = await employees_collection.find_one({"_id": oid})
    if not e:
        raise HTTPException(status_code=404, detail="Employee not found")
    return await employee_helper(e)


@router.post("/", response_model=EmployeeOut, status_code=201)
async def create_employee(payload: EmployeeCreate, current_user: dict = Depends(require_admin)):
    if await employees_collection.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="An employee with this email already exists")

    try:
        ObjectId(payload.department_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid department id")

    if not await departments_collection.find_one({"_id": ObjectId(payload.department_id)}):
        raise HTTPException(status_code=400, detail="Department does not exist")

    doc = payload.model_dump()
    doc["date_joined"] = doc["date_joined"].isoformat()
    doc["created_at"] = datetime.utcnow()

    result = await employees_collection.insert_one(doc)
    created = await employees_collection.find_one({"_id": result.inserted_id})
    return await employee_helper(created)


@router.put("/{employee_id}", response_model=EmployeeOut)
async def update_employee(employee_id: str, payload: EmployeeUpdate, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(employee_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid employee id")

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "date_joined" in update_data:
        update_data["date_joined"] = update_data["date_joined"].isoformat()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await employees_collection.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")

    updated = await employees_collection.find_one({"_id": oid})
    return await employee_helper(updated)


@router.delete("/{employee_id}", status_code=204)
async def delete_employee(employee_id: str, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(employee_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid employee id")

    result = await employees_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
