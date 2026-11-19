from flask import Blueprint, request, jsonify
from ..extensions import db
from sqlalchemy import func
from ..extensions import db
from ..models import Mover, Review, Booking
from ..auth_utils import roles_required, error
from ..pricing import covers, valid_point

bp = Blueprint("movers", __name__, url_prefix="/api/movers")

EDITABLE = {
    "name": (str, 120), "tagline": (str, 200), "vehicle": (str, 60), "crew": (int, None), "baseFee": (int, None),
    "perKm": (int, None), "perM3": (int, None), "available": (bool, None),
}
COLUMN = {"baseFee": "base_fee", "perKm": "per_km", "perM3": "per_m3"}


@bp.get("")
def list_movers():
    """Public list of approved movers. Pass ?lat=&lng= to flag coverage for a point."""
    point = valid_point(request.args) if request.args.get("lat") else None
    out = []
    for m in Mover.query.filter_by(status="approved").order_by(Mover.rating.desc()).all():
        d = m.to_dict()
        d["covers"] = covers(m, point) if point else True
        out.append(d)
    return jsonify(movers=out)


@bp.get("/<int:mover_id>/reviews")
def reviews(mover_id):
    rows = Review.query.filter_by(mover_id=mover_id).order_by(Review.created_at.desc()).limit(20).all()
    return jsonify(reviews=[r.to_dict() for r in rows])


@bp.get("/me")
@roles_required("mover")
def my_profile(user):
    if not user.mover:
        return error("No mover profile linked to this account.", 404)
    return jsonify(mover=user.mover.to_dict())


@bp.patch("/me")
@roles_required("mover")
def update_profile(user):
    m = user.mover
    if not m:
        return error("No mover profile linked to this account.", 404)
    d = request.get_json(silent=True) or {}
    for key, (typ, maxlen) in EDITABLE.items():
        if key not in d:
            continue
        try:
            val = typ(d[key]) if typ is not bool else bool(d[key])
        except (TypeError, ValueError):
            return error(f"Invalid value for {key}.")
        if typ is int and not 0 <= val <= 1_000_000:
            return error(f"{key} is out of range.")
        if typ is str:
            val = val.strip()[:maxlen]
            if key == "name" and len(val) < 2:
                return error("Company name is too short.")
        setattr(m, COLUMN.get(key, key), val)
    cov = d.get("coverage")
    if cov:
        p = valid_point(cov)
        try:
            radius = float(cov.get("radiusKm", m.coverage_radius_km))
        except (TypeError, ValueError):
            return error("Invalid coverage radius.")
        if not p or not 1 <= radius <= 60:
            return error("Invalid coverage zone.")
        m.coverage_lat, m.coverage_lng, m.coverage_radius_km = p["lat"], p["lng"], radius
    db.session.commit()
    return jsonify(mover=m.to_dict())


@bp.get("/stats")
def public_stats():
    """Real platform numbers for the landing page (no personal data)."""
    approved = Mover.query.filter_by(status="approved")
    total_reviews, avg = db.session.query(func.count(Review.id), func.avg(Review.stars)).one()
    return jsonify(
        movers=approved.count(),
        completedMoves=Booking.query.filter_by(status="Completed").count(),
        avgRating=round(float(avg), 1) if avg else 0,
        reviews=total_reviews,
        estates=len({(round(m.coverage_lat, 2), round(m.coverage_lng, 2)) for m in approved}),
    )
