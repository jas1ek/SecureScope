from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_projects_requires_authentication():
    response = client.get("/projects")

    assert response.status_code == 401


def test_auth_me_requires_authentication():
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_invalid_jwt():
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
