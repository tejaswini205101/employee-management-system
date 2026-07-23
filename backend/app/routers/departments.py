from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId

from app.database import departments_collection, employees_collection
from app.schemas import DepartmentCreate, DepartmentOut
from app.auth_utils import get_current_user, require_admin

router = APIRouter(prefix="/api/departments", tags=["departments"])


def dept_helper(d: dict) -> DepartmentOut:
    return DepartmentOut(id=str(d["_id"]), name=d["name"], description=d.get("description"))


@router.get("/", response_model=list[DepartmentOut])
async def list_departments(current_user: dict = Depends(get_current_user)):
    departments = [dept_helper(d) async for d in departments_collection.find()]
    return departments


@router.post("/", response_model=DepartmentOut, status_code=201)
async def create_department(payload: DepartmentCreate, current_user: dict = Depends(require_admin)):
    if await departments_collection.find_one({"name": payload.name}):
        raise HTTPException(status_code=400, detail="Department already exists")
    result = await departments_collection.insert_one(payload.model_dump())
    doc = await departments_collection.find_one({"_id": result.inserted_id})
    return dept_helper(doc)


@router.put("/{department_id}", response_model=DepartmentOut)
async def update_department(department_id: str, payload: DepartmentCreate, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(department_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid department id")

    result = await departments_collection.update_one({"_id": oid}, {"$set": payload.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    doc = await departments_collection.find_one({"_id": oid})
    return dept_helper(doc)


@router.delete("/{department_id}", status_code=204)
async def delete_department(department_id: str, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(department_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid department id")

    in_use = await employees_collection.find_one({"department_id": department_id})
    if in_use:
        raise HTTPException(status_code=400, detail="Cannot delete a department with assigned employees")

    result = await departments_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
