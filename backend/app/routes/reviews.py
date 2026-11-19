import re
from flask import Blueprint, jsonify
from sqlalchemy import func
from ..extensions import db
from ..models import Review

bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")
_PRIVATE = re.compile(r"\d|my current location|pinned", re.I)


def _public_name(full):
    parts = (full or "").split()
    if not parts:
        return "Verified client"
    return parts[0] + (f" {parts[-1][0]}." if len(parts) > 1 else "")


def _public_place(label):
    # Never expose exact coordinates or "current location" pins on a public page.
    return None if not label or _PRIVATE.search(label) else label


@bp.get("/featured")
def featured():
    """Real reviews from completed bookings, for the public landing page."""
    count, avg = db.session.query(func.count(Review.id), func.avg(Review.stars)).one()
    rows = (Review.query.filter(Review.stars >= 4, func.length(Review.text) >= 20)
            .order_by(Review.created_at.desc()).limit(12).all())
    out = []
    for r in rows:
        b = r.booking
        a, z = _public_place(b.pickup_label), _public_place(b.dropoff_label)
        out.append({
            "id": r.id, "stars": r.stars, "text": r.text, "name": _public_name(r.client.name),
            "route": f"{a} → {z}" if a and z else None, "mover": b.mover.name,
            "at": r.created_at.date().isoformat(),
        })
    return jsonify(count=count, average=round(float(avg), 1) if avg else None, reviews=out)
