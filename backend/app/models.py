from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db

ROLES = ("client", "mover", "admin")
BOOKING_STATUSES = ("Pending", "In-Progress", "Completed")
MOVER_STATUSES = ("pending", "approved", "rejected")


def now():
    return datetime.now(timezone.utc)


def iso(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:  # SQLite drops tzinfo; values are stored as UTC.
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(32), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="client")
    active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False)

    mover = db.relationship("Mover", back_populates="owner", uselist=False)

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "email": self.email, "phone": self.phone,
            "role": self.role, "active": self.active, "created_at": iso(self.created_at),
            "mover_id": self.mover.id if self.mover else None,
        }


class Mover(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True)
    name = db.Column(db.String(120), nullable=False)
    tagline = db.Column(db.String(200), default="")
    vehicle = db.Column(db.String(60), default="3T Canter")
    crew = db.Column(db.Integer, default=3)
    base_fee = db.Column(db.Integer, default=3000)
    per_km = db.Column(db.Integer, default=110)
    per_m3 = db.Column(db.Integer, default=800)
    rating = db.Column(db.Float, default=0)
    reviews_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(10), default="pending", nullable=False, index=True)
    available = db.Column(db.Boolean, default=True, nullable=False)
    coverage_lat = db.Column(db.Float, default=-1.2864)
    coverage_lng = db.Column(db.Float, default=36.8172)
    coverage_radius_km = db.Column(db.Float, default=10)
    color = db.Column(db.String(9), default="#14b8a6")
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False)

    owner = db.relationship("User", back_populates="mover")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "tagline": self.tagline, "vehicle": self.vehicle, "crew": self.crew,
            "baseFee": self.base_fee, "perKm": self.per_km, "perM3": self.per_m3,
            "rating": round(self.rating or 0, 2), "reviews": self.reviews_count, "status": self.status,
            "available": self.available, "color": self.color,
            "coverage": {"lat": self.coverage_lat, "lng": self.coverage_lng, "radiusKm": self.coverage_radius_km},
            "ownerEmail": self.owner.email if self.owner else None,
        }


class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    template = db.Column(db.String(20), nullable=False, default="1BR")
    rooms = db.Column(db.JSON, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime(timezone=True), default=now, onupdate=now)

    def totals(self):
        kg = m3 = count = 0
        for items in (self.rooms or {}).values():
            for it in items:
                if it.get("checked"):
                    q = int(it.get("qty") or 1)
                    kg += float(it.get("kg") or 0) * q
                    m3 += float(it.get("m3") or 0) * q
                    count += q
        return {"kg": round(kg), "m3": round(m3, 2), "count": count}

    def to_dict(self):
        return {"template": self.template, "rooms": self.rooms, "updated_at": iso(self.updated_at)}


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mover_id = db.Column(db.Integer, db.ForeignKey("mover.id"), nullable=False, index=True)
    move_date = db.Column(db.Date, nullable=False)
    pickup_lat = db.Column(db.Float, nullable=False)
    pickup_lng = db.Column(db.Float, nullable=False)
    pickup_label = db.Column(db.String(160), nullable=False)
    dropoff_lat = db.Column(db.Float, nullable=False)
    dropoff_lng = db.Column(db.Float, nullable=False)
    dropoff_label = db.Column(db.String(160), nullable=False)
    distance_km = db.Column(db.Float, nullable=False)
    items_count = db.Column(db.Integer, default=0)
    total_kg = db.Column(db.Float, default=0)
    total_m3 = db.Column(db.Float, default=0)
    items = db.Column(db.JSON, default=list)
    quote = db.Column(db.JSON, nullable=False)
    total_price = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(12), nullable=False, default="Pending", index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False, index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=now, onupdate=now)

    client = db.relationship("User")
    mover = db.relationship("Mover")
    review = db.relationship("Review", uselist=False, back_populates="booking")
    messages = db.relationship("Message", order_by="Message.created_at", cascade="all, delete-orphan")

    def to_dict(self, detail=False):
        d = {
            "id": self.id, "status": self.status, "date": self.move_date.isoformat(),
            "pickup": {"lat": self.pickup_lat, "lng": self.pickup_lng, "label": self.pickup_label},
            "dropoff": {"lat": self.dropoff_lat, "lng": self.dropoff_lng, "label": self.dropoff_label},
            "km": self.distance_km, "items": self.items_count,
            "totals": {"kg": self.total_kg, "m3": self.total_m3, "count": self.items_count},
            "quote": self.quote, "total": self.total_price,
            "moverId": self.mover_id, "mover": self.mover.to_dict() if self.mover else None,
            "clientId": self.client_id, "clientName": self.client.name, "clientEmail": self.client.email,
            "clientPhone": self.client.phone,
            "review": self.review.to_dict() if self.review else None,
            "messageCount": len(self.messages),
            "createdAt": iso(self.created_at),
        }
        if detail:
            d["itemList"] = self.items
        return d


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False)

    sender = db.relationship("User")

    def to_dict(self):
        return {"id": self.id, "from": self.sender.role, "senderId": self.sender_id, "senderName": self.sender.name,
                "text": self.body, "at": iso(self.created_at)}


class LocationPing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False, index=True)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    heading = db.Column(db.Float)
    speed = db.Column(db.Float)
    recorded_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False, index=True)

    def to_dict(self):
        return {"lat": self.lat, "lng": self.lng, "heading": self.heading, "speed": self.speed, "at": iso(self.recorded_at)}


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    mover_id = db.Column(db.Integer, db.ForeignKey("mover.id"), nullable=False, index=True)
    stars = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False)

    booking = db.relationship("Booking", back_populates="review")
    client = db.relationship("User")

    def to_dict(self):
        return {"id": self.id, "stars": self.stars, "text": self.text, "at": iso(self.created_at),
                "clientName": self.client.name.split(" ")[0]}


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    body = db.Column(db.String(300), default="")
    tone = db.Column(db.String(10), default="info")
    link = db.Column(db.String(120))
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False)

    def to_dict(self):
        return {"id": self.id, "title": self.title, "body": self.body, "tone": self.tone, "link": self.link,
                "read": self.read, "at": iso(self.created_at)}


class LoginAttempt(db.Model):
    """Failed sign-ins, used for brute-force lockout that works across all workers."""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    ip = db.Column(db.String(64), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=now, nullable=False, index=True)
