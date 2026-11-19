from datetime import date, timedelta
from .extensions import db
from .models import User, Mover, Inventory, Booking, Message
from .pricing import road_km, quote

MOVERS = [
    ("Simba Swift Movers", "Same-day moves across the city", 4.8, 312, 3500, 120, 900, "3T Canter", 4, "#f59e0b", (-1.2864, 36.8172, 14), True),
    ("Kilimani Careful Hands", "Fragile & high-value specialists", 4.9, 184, 5000, 150, 1100, "5T Isuzu FRR", 5, "#10b981", (-1.2921, 36.7856, 10), True),
    ("Eastlands Express", "Affordable bedsitter & studio moves", 4.5, 529, 2000, 90, 650, "1.5T Pickup", 2, "#3b82f6", (-1.295, 36.885, 12), True),
    ("Karen Country Relocations", "Spacious homes, careful packing", 4.7, 97, 6500, 160, 1200, "7T Truck", 6, "#a855f7", (-1.3197, 36.7073, 13), False),
    ("Thika Road Haulers", "Northern corridor, Kasarani to Kahawa", 4.4, 141, 2500, 100, 700, "3T Canter", 3, "#ef4444", (-1.22, 36.9, 11), True),
]
DEMO_PASSWORD = "password"


def _user(email, name, phone, role):
    u = User.query.filter_by(email=email).first()
    if not u:
        u = User(email=email, name=name, phone=phone, role=role)
        u.set_password(DEMO_PASSWORD)
        db.session.add(u)
        db.session.flush()
    return u


def seed():
    if Mover.query.count():
        return "Already seeded."
    client = _user("client@kingmoverskenya.co.ke", "Wanjiru Kamau", "0712345678", "client")
    mover_user = _user("mover@kingmoverskenya.co.ke", "Otieno Ochieng", "0722000111", "mover")
    _user("admin@kingmoverskenya.co.ke", "Admin Achieng", "0733222333", "admin")
    pending_user = _user("thikaroad@kingmoverskenya.co.ke", "Kamau Njoroge", "0711999888", "mover")

    created = []
    for i, (name, tag, rating, reviews, base, km, m3, veh, crew, color, (lat, lng, r), avail) in enumerate(MOVERS):
        owner = mover_user if i == 0 else pending_user if i == 4 else None
        m = Mover(name=name, tagline=tag, rating=rating, reviews_count=reviews, base_fee=base, per_km=km, per_m3=m3,
                  vehicle=veh, crew=crew, color=color, coverage_lat=lat, coverage_lng=lng, coverage_radius_km=r,
                  available=avail, status="pending" if i == 4 else "approved", user_id=owner.id if owner else None)
        db.session.add(m)
        created.append(m)
    db.session.flush()

    rooms = {"Bedroom": [
        {"id": "s1", "name": "Bed frame", "kg": 45, "m3": 1.2, "qty": 1, "checked": True},
        {"id": "s2", "name": "Mattress", "kg": 25, "m3": 0.9, "qty": 1, "checked": True},
        {"id": "s3", "name": "Wardrobe", "kg": 70, "m3": 1.5, "qty": 1, "checked": True},
    ], "Living room": [
        {"id": "s4", "name": "Sofa set (5-seater)", "kg": 90, "m3": 2.5, "qty": 1, "checked": True},
        {"id": "s5", "name": "TV & stand", "kg": 30, "m3": 0.6, "qty": 1, "checked": True},
    ], "Kitchen": [
        {"id": "s6", "name": "Fridge", "kg": 60, "m3": 0.8, "qty": 1, "checked": True},
        {"id": "s7", "name": "Gas cooker", "kg": 30, "m3": 0.4, "qty": 1, "checked": True},
    ]}
    inv = Inventory(user_id=client.id, template="1BR", rooms=rooms)
    db.session.add(inv)
    totals = inv.totals()

    a = {"lat": -1.2921, "lng": 36.7856, "label": "Kilimani"}
    b = {"lat": -1.218, "lng": 36.888, "label": "Roysambu"}
    km, _ = road_km(a, b)
    q = quote(created[0], km, totals)
    bk = Booking(client_id=client.id, mover_id=created[0].id, move_date=date.today() + timedelta(days=2),
                 pickup_lat=a["lat"], pickup_lng=a["lng"], pickup_label=a["label"],
                 dropoff_lat=b["lat"], dropoff_lng=b["lng"], dropoff_label=b["label"], distance_km=km,
                 items_count=totals["count"], total_kg=totals["kg"], total_m3=totals["m3"],
                 items=[{"room": r, "name": i["name"], "qty": i["qty"]} for r, its in rooms.items() for i in its],
                 quote=q, total_price=q["total"])
    db.session.add(bk)
    db.session.flush()
    db.session.add(Message(booking_id=bk.id, sender_id=mover_user.id, body="Habari! We will arrive at 8am with 4 crew. Any fragile items?"))
    db.session.commit()
    return f"Seeded {len(created)} movers, 4 users (password '{DEMO_PASSWORD}') and a sample booking."
