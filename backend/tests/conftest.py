import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.main import app
from app.database import Base, get_db
from app import models  # rejestracja modeli


# Oddzielna baza testowa
database_url = make_url(
    __import__("app.config", fromlist=["get_settings"])
    .get_settings()
    .database_url
).set(database="securescope_test")

if database_url.database != "securescope_test":
    raise RuntimeError("Tests must use the test database")

test_engine = create_engine(database_url, pool_pre_ping=True)


@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    test_engine.dispose()


@pytest.fixture
def client():
    connection = test_engine.connect()
    transaction = connection.begin()

    def override_get_db():
        with Session(
            bind=connection,
            join_transaction_mode="create_savepoint",
        ) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
        transaction.rollback()
        connection.close()
