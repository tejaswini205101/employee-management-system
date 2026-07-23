from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = AsyncIOMotorClient(settings.mongo_uri)
database = client[settings.mongo_db_name]

# Collections
users_collection = database.get_collection("users")
employees_collection = database.get_collection("employees")
departments_collection = database.get_collection("departments")
attendance_collection = database.get_collection("attendance")


async def init_indexes():
    """Create indexes needed for uniqueness/performance. Called on startup."""
    await users_collection.create_index("email", unique=True)
    await employees_collection.create_index("email", unique=True)
    await departments_collection.create_index("name", unique=True)
    # one attendance record per employee per calendar day
    await attendance_collection.create_index(
        [("employee_id", 1), ("date", 1)], unique=True
    )
