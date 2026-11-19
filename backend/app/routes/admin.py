import csv
import io
from collections import Counter
from datetime import date
from flask import Blueprint, jsonify, request, Response
from sqlalchemy import func
from ..extensions import db
from ..models import User, Mover, Booking, Review, MOVER_STATUSES
from ..auth_utils import roles_required, error
from ..notify import notify

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/stats")
@roles_required("admin")
def stats(user):
    year = date.today().year
    bookings = Booking.query.all()
    per_month = [0] * 12
    for b in bookings:
        if b.created_at.year == year:
            per_month[b.created_at.month - 1] += 1
    routes = Counter(f"{b.pickup_label} → {b.dropoff_label}" for b in bookings).most_common(5)
    by_status = Counter(b.status for b in bookings)
    ratings = dict(db.session.query(Review.stars, func.count(Review.id)).group_by(Review.stars).all())
    recent = Review.query.order_by(Review.created_at.desc()).limit(5).all()
    return jsonify(
        year=year,
        users=User.query.count(),
        clients=User.query.filter_by(role="client").count(),
        approvedMovers=Mover.query.filter_by(status="approved").count(),
        pendingMovers=Mover.query.filter_by(status="pending").count(),
        bookings=len(bookings),
        revenue=sum(b.total_price for b in bookings),
        perMonth=per_month[: date.today().month],
        byStatus=dict(by_status),
        topRoutes=[{"route": r, "count": c} for r, c in routes],
        ratings={str(k): ratings.get(k, 0) for k in range(1, 6)},
        recentReviews=[{**r.to_dict(), "mover": r.booking.mover.name} for r in recent],
    )


@bp.get("/users")
@roles_required("admin")
def users(user):
    return jsonify(users=[u.to_dict() for u in User.query.order_by(User.created_at.desc()).all()])


@bp.patch("/users/<int:user_id>")
@roles_required("admin")
def update_user(admin, user_id):
    u = db.session.get(User, user_id)
    if not u:
        return error("User not found.", 404)
    if u.id == admin.id:
        return error("You can't suspend your own account.")
    active = (request.get_json(silent=True) or {}).get("active")
    if not isinstance(active, bool):
        return error("`active` must be true or false.")
    u.active = active
    db.session.commit()
    return jsonify(user=u.to_dict())


@bp.get("/movers")
@roles_required("admin")
def movers(user):
    return jsonify(movers=[m.to_dict() for m in Mover.query.order_by(Mover.created_at.desc()).all()])


@bp.patch("/movers/<int:mover_id>")
@roles_required("admin")
def update_mover(admin, mover_id):
    m = db.session.get(Mover, mover_id)
    if not m:
        return error("Mover not found.", 404)
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in MOVER_STATUSES:
        return error("Invalid status.")
    m.status = status
    msg = {"approved": ("You're approved! 🎉", "Clients can now find and book you.", "success"),
           "rejected": ("Registration not approved", "Contact support for details.", "warning"),
           "pending": ("Profile under review", "An admin is reviewing your profile.", "info")}[status]
    notify(m.user_id, *msg, "/mover")
    db.session.commit()
    return jsonify(mover=m.to_dict())


@bp.get("/reports/bookings.csv")
@roles_required("admin")
def bookings_csv(user):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "created_at", "move_date", "client", "mover", "from", "to", "km", "items", "total_kes", "status", "review_stars"])
    for b in Booking.query.order_by(Booking.created_at.desc()).all():
        w.writerow([b.id, b.created_at.isoformat(), b.move_date.isoformat(), b.client.email, b.mover.name, b.pickup_label,
                    b.dropoff_label, b.distance_km, b.items_count, b.total_price, b.status, b.review.stars if b.review else ""])
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=kingmoverskenya-bookings-{date.today()}.csv"})
