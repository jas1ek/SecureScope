import pytest

from app.routers import scans


@pytest.fixture
def accounts(client):
    users = []

    for email in (
        "scan-user-a@example.com",
        "scan-user-b@example.com",
    ):
        password = "SecureTestPassword123!"

        response = client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )
        assert response.status_code in (200, 201), response.text

        response = client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        assert response.status_code == 200, response.text

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post(
            "/projects",
            json={
                "name": f"Project {email}",
                "description": "Security scan test",
            },
            headers=headers,
        )
        assert response.status_code == 201, response.text

        users.append({
            "headers": headers,
            "project_id": response.json()["id"],
        })

    return users


@pytest.fixture
def mock_osv(monkeypatch):
    def fake_analysis(packages):
        assert packages == [("urllib3", "1.26.5")]

        return [{
            "id": "GHSA-test-1234",
            "package": "urllib3",
            "version": "1.26.5",
            "severity": "UNKNOWN",
        }]

    monkeypatch.setattr(
        scans,
        "analyze_requirements",
        fake_analysis,
    )


def upload(client, project_id, headers=None, content=None,
           filename="requirements.txt"):
    if content is None:
        content = b"urllib3==1.26.5\n"

    return client.post(
        f"/projects/{project_id}/scans",
        headers=headers or {},
        files={
            "file": (
                filename,
                content,
                "text/plain",
            )
        },
    )


def test_scan_requires_authentication(client):
    response = upload(client, 1)
    assert response.status_code == 401


def test_scan_rejects_other_users_project(client, accounts):
    user_a, user_b = accounts

    response = upload(
        client,
        user_b["project_id"],
        user_a["headers"],
    )

    assert response.status_code == 404


def test_scan_rejects_wrong_filename(client, accounts):
    user_a = accounts[0]

    response = upload(
        client,
        user_a["project_id"],
        user_a["headers"],
        filename="malware.py",
    )

    assert response.status_code == 400


def test_scan_rejects_oversized_file(client, accounts):
    user_a = accounts[0]

    response = upload(
        client,
        user_a["project_id"],
        user_a["headers"],
        content=b"A" * (64 * 1024 + 1),
    )

    assert response.status_code == 413


def test_scan_rejects_invalid_requirements(client, accounts):
    user_a = accounts[0]

    response = upload(
        client,
        user_a["project_id"],
        user_a["headers"],
        content=b"urllib3>=1.0\n",
    )

    assert response.status_code == 422


def test_scan_rejects_invalid_encoding(client, accounts):
    user_a = accounts[0]

    response = upload(
        client,
        user_a["project_id"],
        user_a["headers"],
        content=b"\xff\xfe\xfd",
    )

    assert response.status_code == 422


def test_scan_saves_findings_and_history(client, accounts, mock_osv):
    user_a = accounts[0]
    project_id = user_a["project_id"]
    headers = user_a["headers"]

    response = upload(client, project_id, headers)

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["status"] == "completed"
    assert len(data["findings"]) == 1

    scan_id = data["scan_id"]

    history = client.get(
        f"/projects/{project_id}/scans",
        headers=headers,
    )

    assert history.status_code == 200
    assert any(
        item["scan_id"] == scan_id
        for item in history.json()
    )

    details = client.get(
        f"/projects/{project_id}/scans/{scan_id}",
        headers=headers,
    )

    assert details.status_code == 200
    assert details.json()["status"] == "completed"
    assert len(details.json()["findings"]) == 1
    assert (
        details.json()["findings"][0]["id"]
        == "GHSA-test-1234"
    )


def test_history_requires_authentication(client, accounts):
    project_id = accounts[0]["project_id"]

    response = client.get(
        f"/projects/{project_id}/scans"
    )

    assert response.status_code == 401


def test_history_rejects_other_user(client, accounts):
    user_a, user_b = accounts

    response = client.get(
        f"/projects/{user_b['project_id']}/scans",
        headers=user_a["headers"],
    )

    assert response.status_code == 404


def test_scan_details_reject_other_user(client, accounts, mock_osv):
    user_a, user_b = accounts

    response = upload(
        client,
        user_b["project_id"],
        user_b["headers"],
    )

    assert response.status_code == 201
    scan_id = response.json()["scan_id"]

    response = client.get(
        f"/projects/{user_b['project_id']}/scans/{scan_id}",
        headers=user_a["headers"],
    )

    assert response.status_code == 404


def test_scan_details_reject_wrong_project(client, accounts, mock_osv):
    user_a, user_b = accounts

    response = upload(
        client,
        user_a["project_id"],
        user_a["headers"],
    )

    assert response.status_code == 201
    scan_id = response.json()["scan_id"]

    response = client.get(
        f"/projects/{user_b['project_id']}/scans/{scan_id}",
        headers=user_b["headers"],
    )

    assert response.status_code == 404
