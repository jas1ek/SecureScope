from app.auth import hash_password, verify_password


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_projects_requires_authentication(client):
    response = client.get("/projects")

    assert response.status_code == 401


def test_auth_me_requires_authentication(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_invalid_jwt(client):
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401

def test_password_hashing():
    password = "SecureTestPassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$argon2id$")


def test_verify_correct_password():
    password = "SecureTestPassword123!"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_reject_wrong_password():
    hashed = hash_password("SecureTestPassword123!")

    assert verify_password("WrongPassword123!", hashed) is False
