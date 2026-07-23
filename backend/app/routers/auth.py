from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId

from app.database import users_collection
from app.schemas import UserRegister, Token, UserOut
from app.auth_utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_helper(user: dict) -> UserOut:
    return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"], role=user.get("role", "staff"))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    existing = await users_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # first registered user becomes admin, rest are staff by default
    is_first_user = await users_collection.count_documents({}) == 0
    doc = {
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "role": "admin" if is_first_user else "staff",
    }
    result = await users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(doc["_id"])})
    return Token(access_token=token, user=user_helper(doc))


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    return Token(access_token=token, user=user_helper(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return user_helper(current_user)
