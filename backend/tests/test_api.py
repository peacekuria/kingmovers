from datetime import date, timedelta
from tests.conftest import login

TOMORROW = (date.today() + timedelta(days=1)).isoformat()
KILIMANI = {"lat": -1.2921, "lng": 36.7856, "label": "Kilimani"}
KASARANI = {"lat": -1.22, "lng": 36.9, "label": "Kasarani"}


def test_health(client):
    assert client.get("/api/health").json["status"] == "ok"


def test_register_validation_and_login(client):
    bad = client.post("/api/auth/register", json={"name": "A B", "email": "x@y.ke", "phone": "123", "password": "longenough"})
    assert bad.status_code == 400 and "phone" in bad.json["error"].lower()
    r = client.post("/api/auth/register", json={"name": "Amina Hassan", "email": "Amina@Mail.com", "phone": "0711 222 333", "password": "supersecret"})
    assert r.status_code == 201 and r.json["user"]["email"] == "amina@mail.com"
    assert client.post("/api/auth/register", json={"name": "Dup", "email": "amina@mail.com", "phone": "0711222333", "password": "supersecret"}).status_code == 409
    assert client.post("/api/auth/login", json={"email": "amina@mail.com", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/register", json={"name": "Hack", "email": "h@h.ke", "phone": "0711222333", "password": "supersecret", "role": "admin"}).status_code == 400


def test_password_is_hashed(app):
    from app.models import User
    u = User.query.filter_by(email="client@kingmoverskenya.co.ke").first()
    assert u.password_hash != "password" and u.check_password("password")


def test_rbac(client, as_client, as_mover):
    assert client.get("/api/bookings").status_code == 401
    assert client.get("/api/admin/stats", headers=as_client).status_code == 403
    assert client.get("/api/admin/stats", headers=as_mover).status_code == 403
    assert client.put("/api/inventory", headers=as_mover, json={}).status_code == 403
    bid = client.get("/api/bookings", headers=as_client).json["bookings"][0]["id"]
    assert client.patch(f"/api/bookings/{bid}/status", headers=as_client, json={"status": "Completed"}).status_code == 403


def test_public_movers_and_quotes(client):
    movers = client.get("/api/movers").json["movers"]
    assert all(m["status"] == "approved" for m in movers)
    assert "Thika Road Haulers" not in [m["name"] for m in movers]  # pending
    r = client.post("/api/quotes", json={"pickup": KILIMANI, "dropoff": KASARANI, "totals": {"kg": 400, "m3": 9}})
    assert r.status_code == 200 and r.json["km"] > 10
    top = r.json["quotes"][0]
    assert top["covers"] and top["quote"]["total"] == sum(top["quote"][k] for k in ("base", "distance", "volume", "weight"))


def test_full_booking_lifecycle(client, as_client, as_mover):
    inv = client.get("/api/inventory", headers=as_client).json
    assert inv["totals"]["count"] > 0
    assert client.put("/api/inventory", headers=as_client, json={"template": "Nope", "rooms": {}}).status_code == 400

    movers = client.get("/api/movers").json["movers"]
    simba = next(m for m in movers if m["name"] == "Simba Swift Movers")
    r = client.post("/api/bookings", headers=as_client, json={"moverId": simba["id"], "date": TOMORROW, "pickup": KILIMANI, "dropoff": KASARANI})
    assert r.status_code == 201, r.json
    b = r.json["booking"]
    assert b["status"] == "Pending" and b["total"] == b["quote"]["total"]

    # past dates rejected; reschedule works while Pending
    assert client.patch(f"/api/bookings/{b['id']}/reschedule", headers=as_client, json={"date": "2020-01-01"}).status_code == 400
    later = (date.today() + timedelta(days=5)).isoformat()
    assert client.patch(f"/api/bookings/{b['id']}/reschedule", headers=as_client, json={"date": later}).json["booking"]["date"] == later

    # messaging both ways
    assert client.post(f"/api/bookings/{b['id']}/messages", headers=as_client, json={"text": "Jambo, 3rd floor no lift"}).status_code == 201
    assert client.post(f"/api/bookings/{b['id']}/messages", headers=as_mover, json={"text": "Noted!"}).status_code == 201
    assert len(client.get(f"/api/bookings/{b['id']}/messages", headers=as_client).json["messages"]) == 2

    # tracking only while In-Progress
    assert client.post(f"/api/bookings/{b['id']}/location", headers=as_mover, json={"lat": -1.28, "lng": 36.8}).status_code == 400
    assert client.patch(f"/api/bookings/{b['id']}/status", headers=as_mover, json={"status": "In-Progress"}).status_code == 200
    assert client.post(f"/api/bookings/{b['id']}/location", headers=as_mover, json={"lat": -1.28, "lng": 36.8}).status_code == 201
    loc = client.get(f"/api/bookings/{b['id']}/location", headers=as_client).json["location"]
    assert loc["lat"] == -1.28

    # review only after completion, once
    assert client.post(f"/api/bookings/{b['id']}/review", headers=as_client, json={"stars": 5}).status_code == 400
    client.patch(f"/api/bookings/{b['id']}/status", headers=as_mover, json={"status": "Completed"})
    assert client.post(f"/api/bookings/{b['id']}/review", headers=as_client, json={"stars": 5, "text": "Asante!"}).status_code == 201
    assert client.post(f"/api/bookings/{b['id']}/review", headers=as_client, json={"stars": 4}).status_code == 409

    titles = [n["title"] for n in client.get("/api/notifications", headers=as_client).json["notifications"]]
    assert {"Move confirmed 🎉", "Move rescheduled", "Move In-Progress", "Move Completed"} <= set(titles)


def test_other_client_cannot_see_booking(client, as_client):
    bid = client.get("/api/bookings", headers=as_client).json["bookings"][0]["id"]
    client.post("/api/auth/register", json={"name": "Other Person", "email": "o@o.ke", "phone": "0700111222", "password": "supersecret"})
    other = login(client, "o@o.ke", "supersecret")
    assert client.get(f"/api/bookings/{bid}", headers=other).status_code == 404
    assert client.get(f"/api/bookings/{bid}/messages", headers=other).status_code == 404


def test_mover_registration_and_approval(client, as_admin):
    r = client.post("/api/auth/register", json={"name": "Juma Ali", "email": "juma@movers.ke", "phone": "0722333444", "password": "supersecret", "role": "mover", "company": "Juma Logistics"})
    assert r.status_code == 201
    h = {"Authorization": f"Bearer {r.json['token']}"}
    me = client.get("/api/movers/me", headers=h).json["mover"]
    assert me["status"] == "pending" and "Juma Logistics" not in [m["name"] for m in client.get("/api/movers").json["movers"]]
    assert client.patch("/api/movers/me", headers=h, json={"perKm": 130, "coverage": {"lat": -1.3, "lng": 36.8, "radiusKm": 15}}).json["mover"]["perKm"] == 130
    assert client.patch(f"/api/admin/movers/{me['id']}", headers=as_admin, json={"status": "approved"}).status_code == 200
    assert "Juma Logistics" in [m["name"] for m in client.get("/api/movers").json["movers"]]


def test_admin_suspend_and_reports(client, as_admin):
    users = client.get("/api/admin/users", headers=as_admin).json["users"]
    cl = next(u for u in users if u["email"] == "client@kingmoverskenya.co.ke")
    client.patch(f"/api/admin/users/{cl['id']}", headers=as_admin, json={"active": False})
    assert client.post("/api/auth/login", json={"email": "client@kingmoverskenya.co.ke", "password": "password"}).status_code == 403
    stats = client.get("/api/admin/stats", headers=as_admin).json
    assert stats["bookings"] >= 1 and len(stats["perMonth"]) == date.today().month
    csv = client.get("/api/admin/reports/bookings.csv", headers=as_admin)
    assert csv.status_code == 200 and csv.data.startswith(b"id,created_at")


def test_login_lockout(client):
    for _ in range(8):
        assert client.post("/api/auth/login", json={"email": "client@kingmoverskenya.co.ke", "password": "nope"}).status_code == 401
    r = client.post("/api/auth/login", json={"email": "client@kingmoverskenya.co.ke", "password": "password"})
    assert r.status_code == 429


def test_public_stats(client):
    s = client.get("/api/movers/stats").json
    assert s["movers"] == 4 and 0 < s["avgRating"] <= 5 and s["completedMoves"] >= 0


def test_featured_reviews_are_real_and_private(client, as_client, as_mover):
    r = client.get("/api/reviews/featured").json
    assert r["count"] >= 1 and all(x["stars"] >= 4 for x in r["reviews"])
    assert all(len(x["name"].split()) <= 2 for x in r["reviews"])  # first name + initial only
    # A review for a move pinned at exact coordinates must not leak them publicly.
    movers = client.get("/api/movers").json["movers"]
    simba = next(m for m in movers if m["name"] == "Simba Swift Movers")
    pin = {"lat": -1.2911, "lng": 36.7861, "label": "Pinned (-1.291, 36.786)"}
    b = client.post("/api/bookings", headers=as_client, json={"moverId": simba["id"], "date": TOMORROW, "pickup": pin, "dropoff": KASARANI}).json["booking"]
    client.patch(f"/api/bookings/{b['id']}/status", headers=as_mover, json={"status": "Completed"})
    client.post(f"/api/bookings/{b['id']}/review", headers=as_client, json={"stars": 5, "text": "Brilliant crew, careful and quick with everything."})
    newest = client.get("/api/reviews/featured").json["reviews"][0]
    assert newest["name"] == "Wanjiru K." and newest["route"] is None
    assert "-1.29" not in str(newest)
