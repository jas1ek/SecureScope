def register_and_login(client, email):
    password = "SecureTestPassword123!"

    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


def test_users_cannot_access_other_projects(client):
    # Uzytkownik A
    headers_a = register_and_login(
        client, "user-a@example.com"
    )

    response = client.post(
        "/projects",
        json={
            "name": "Private Project",
            "description": "Only user A can access",
        },
        headers=headers_a,
    )
    assert response.status_code == 201

    project_id = response.json()["id"]

    # Uzytkownik B
    headers_b = register_and_login(
        client, "user-b@example.com"
    )

    # B nie moze odczytac projektu A
    response = client.get(
        f"/projects/{project_id}",
        headers=headers_b,
    )
    assert response.status_code == 404

    # B nie moze edytowac projektu A
    response = client.patch(
        f"/projects/{project_id}",
        json={"name": "Hacked"},
        headers=headers_b,
    )
    assert response.status_code == 404

    # B nie moze usunac projektu A
    response = client.delete(
        f"/projects/{project_id}",
        headers=headers_b,
    )
    assert response.status_code == 404

    # B nie widzi projektu A na liscie
    response = client.get(
        "/projects",
        headers=headers_b,
    )
    assert response.status_code == 200
    assert all(
        project["id"] != project_id
        for project in response.json()
    )

    # A nadal moze odczytac swoj projekt
    response = client.get(
        f"/projects/{project_id}",
        headers=headers_a,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Private Project"
