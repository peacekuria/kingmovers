import pytest
from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.seed import seed


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        seed()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def login(client, email, password="password"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.json
    return {"Authorization": f"Bearer {r.json['token']}"}


@pytest.fixture
def as_client(client):
    return login(client, "client@kingmoverskenya.co.ke")


@pytest.fixture
def as_mover(client):
    return login(client, "mover@kingmoverskenya.co.ke")


@pytest.fixture
def as_admin(client):
    return login(client, "admin@kingmoverskenya.co.ke")
