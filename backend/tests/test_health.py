from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_requires_valid_password():
    response = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": "notanemail", "password": "123"},
    )
    # invalid email + short password should fail validation before hitting the DB
    assert response.status_code == 422
