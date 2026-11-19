from datetime import date, datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from ..extensions import db, limiter
from ..models import Booking, Mover, Inventory, Message, LocationPing, Review, BOOKING_STATUSES
from ..auth_utils import roles_required, error
from ..pricing import road_km, covers, quote, valid_point
from ..notify import notify

bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")


def _parse_date(s):
    try:
        d = date.fromisoformat(s)
    except (TypeError, ValueError):
        return None
    return d if d > date.today() and d <= date.today() + timedelta(days=365) else None


def _can_view(user, b):
    if user.role == "admin":
        return True
    if user.role == "client":
        return b.client_id == user.id
    return user.mover is not None and b.mover_id == user.mover.id


def _get(user, booking_id):
    b = db.session.get(Booking, booking_id)
    if not b or not _can_view(user, b):
        return None
    return b


@bp.post("")
@roles_required("client")
@limiter.limit("20 per hour")
def create(user):
    d = request.get_json(silent=True) or {}
    a, b = valid_point(d.get("pickup") or {}), valid_point(d.get("dropoff") or {})
    move_date = _parse_date(d.get("date"))
    mover = db.session.get(Mover, int(d.get("moverId") or 0))
    if not a or not b:
        return error("Pickup and drop-off are required.")
    if not move_date:
        return error("Choose a moving date from tomorrow onwards.")
    if not mover or mover.status != "approved" or not mover.available:
        return error("That mover is not available.")
    if not covers(mover, a):
        return error("That mover does not cover your pickup location.")
    inv = Inventory.query.filter_by(user_id=user.id).first()
    totals = inv.totals() if inv else {"kg": 0, "m3": 0, "count": 0}
    if not totals["count"]:
        return error("Your inventory is empty. Add the items you're moving first.")

    km, _ = road_km(a, b)
    q = quote(mover, km, totals)  # price is always computed server-side
    items = [{"room": r, "name": i["name"], "qty": i["qty"]} for r, its in inv.rooms.items() for i in its if i.get("checked")]
    bk = Booking(
        client_id=user.id, mover_id=mover.id, move_date=move_date,
        pickup_lat=a["lat"], pickup_lng=a["lng"], pickup_label=a["label"],
        dropoff_lat=b["lat"], dropoff_lng=b["lng"], dropoff_label=b["label"],
        distance_km=km, items_count=totals["count"], total_kg=totals["kg"], total_m3=totals["m3"],
        items=items, quote=q, total_price=q["total"],
    )
    db.session.add(bk)
    db.session.flush()
    notify(user.id, "Move confirmed 🎉", f"{mover.name} is booked for {move_date.isoformat()}.", "success", "/moves")
    notify(mover.user_id, "New job booked", f"{user.name}: {a['label']} → {b['label']} on {move_date.isoformat()}.", "info", "/mover")
    db.session.commit()
    return jsonify(booking=bk.to_dict(detail=True)), 201


@bp.get("")
@roles_required()
def list_bookings(user):
    q = Booking.query
    if user.role == "client":
        q = q.filter_by(client_id=user.id)
    elif user.role == "mover":
        if not user.mover:
            return jsonify(bookings=[])
        q = q.filter_by(mover_id=user.mover.id)
    status = request.args.get("status")
    if status in BOOKING_STATUSES:
        q = q.filter_by(status=status)
    rows = q.order_by(Booking.move_date.asc() if user.role == "mover" else Booking.created_at.desc()).limit(200).all()
    return jsonify(bookings=[b.to_dict() for b in rows])


@bp.get("/<int:booking_id>")
@roles_required()
def get_booking(user, booking_id):
    b = _get(user, booking_id)
    return jsonify(booking=b.to_dict(detail=True)) if b else error("Booking not found.", 404)


@bp.patch("/<int:booking_id>/reschedule")
@roles_required("client")
def reschedule(user, booking_id):
    b = _get(user, booking_id)
    if not b:
        return error("Booking not found.", 404)
    if b.status != "Pending":
        return error("Only pending moves can be rescheduled.")
    new_date = _parse_date((request.get_json(silent=True) or {}).get("date"))
    if not new_date:
        return error("Choose a moving date from tomorrow onwards.")
    b.move_date = new_date
    notify(user.id, "Move rescheduled", f"Your move is now scheduled for {new_date.isoformat()}.", "info", "/moves")
    notify(b.mover.user_id, "Job rescheduled", f"{user.name} moved their job to {new_date.isoformat()}.", "warning", "/mover")
    db.session.commit()
    return jsonify(booking=b.to_dict(detail=True))


@bp.patch("/<int:booking_id>/status")
@roles_required("mover")
def set_status(user, booking_id):
    b = _get(user, booking_id)
    if not b:
        return error("Booking not found.", 404)
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in BOOKING_STATUSES:
        return error("Invalid status.")
    if b.status == "Completed":
        return error("Completed jobs can't be changed.")
    if status == b.status:
        return jsonify(booking=b.to_dict(detail=True))
    b.status = status
    body = {"In-Progress": "Your movers are on the way. Track them live!", "Completed": "Move completed. Leave a review?",
            "Pending": "Your move is scheduled."}[status]
    notify(b.client_id, f"Move {status}", body, "success" if status == "Completed" else "info", f"/track/{b.id}")
    db.session.commit()
    return jsonify(booking=b.to_dict(detail=True))


@bp.get("/<int:booking_id>/messages")
@roles_required()
def messages(user, booking_id):
    b = _get(user, booking_id)
    return jsonify(messages=[m.to_dict() for m in b.messages]) if b else error("Booking not found.", 404)


@bp.post("/<int:booking_id>/messages")
@roles_required("client", "mover")
@limiter.limit("30 per minute")
def send_message(user, booking_id):
    b = _get(user, booking_id)
    if not b:
        return error("Booking not found.", 404)
    text = ((request.get_json(silent=True) or {}).get("text") or "").strip()
    if not text or len(text) > 1000:
        return error("Message must be 1–1000 characters.")
    m = Message(booking_id=b.id, sender_id=user.id, body=text)
    db.session.add(m)
    to = b.mover.user_id if user.role == "client" else b.client_id
    notify(to, f"New message from {user.name.split(' ')[0]}", text[:100], "info", f"/track/{b.id}")
    db.session.commit()
    return jsonify(message=m.to_dict()), 201


@bp.get("/<int:booking_id>/location")
@roles_required()
def location(user, booking_id):
    b = _get(user, booking_id)
    if not b:
        return error("Booking not found.", 404)
    last = LocationPing.query.filter_by(booking_id=b.id).order_by(LocationPing.recorded_at.desc()).first()
    return jsonify(location=last.to_dict() if last else None, status=b.status)


@bp.post("/<int:booking_id>/location")
@roles_required("mover")
@limiter.limit("120 per minute")
def push_location(user, booking_id):
    b = _get(user, booking_id)
    if not b:
        return error("Booking not found.", 404)
    if b.status != "In-Progress":
        return error("Live location is only shared while a job is In-Progress.")
    d = request.get_json(silent=True) or {}
    p = valid_point(d)
    if not p:
        return error("Invalid coordinates.")
    def _num(k):
        try:
            return float(d[k]) if d.get(k) is not None else None
        except (TypeError, ValueError):
            return None
    db.session.add(LocationPing(booking_id=b.id, lat=p["lat"], lng=p["lng"], heading=_num("heading"), speed=_num("speed")))
    # Keep only the last 24h of pings per booking.
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    LocationPing.query.filter(LocationPing.booking_id == b.id, LocationPing.recorded_at < cutoff).delete()
    db.session.commit()
    return jsonify(ok=True), 201


@bp.post("/<int:booking_id>/review")
@roles_required("client")
def review(user, booking_id):
    b = _get(user, booking_id)
    if not b:
        return error("Booking not found.", 404)
    if b.status != "Completed":
        return error("You can review a mover once the move is completed.")
    if b.review:
        return error("You've already reviewed this move.", 409)
    d = request.get_json(silent=True) or {}
    try:
        stars = int(d.get("stars"))
    except (TypeError, ValueError):
        stars = 0
    if not 1 <= stars <= 5:
        return error("Rating must be 1–5 stars.")
    r = Review(booking_id=b.id, client_id=user.id, mover_id=b.mover_id, stars=stars, text=(d.get("text") or "").strip()[:1000])
    db.session.add(r)
    m = b.mover
    m.rating = ((m.rating or 0) * m.reviews_count + stars) / (m.reviews_count + 1)
    m.reviews_count += 1
    notify(m.user_id, "New review", f"{user.name.split(' ')[0]} rated you {stars}★.", "success", "/mover/profile")
    db.session.commit()
    return jsonify(booking=b.to_dict(detail=True)), 201
