from flask import Blueprint, request, jsonify
from ..extensions import limiter
from ..models import Mover
from ..auth_utils import error
from ..pricing import road_km, covers, quote, valid_point

bp = Blueprint("quotes", __name__, url_prefix="/api/quotes")


@bp.post("")
@limiter.limit("60 per minute")
def get_quotes():
    """Public estimator: distance + per-mover price for a load."""
    d = request.get_json(silent=True) or {}
    a, b = valid_point(d.get("pickup") or {}), valid_point(d.get("dropoff") or {})
    if not a or not b:
        return error("Pickup and drop-off are required.")
    t = d.get("totals") or {}
    try:
        totals = {"kg": max(0.0, float(t.get("kg", 0))), "m3": max(0.0, float(t.get("m3", 0)))}
    except (TypeError, ValueError):
        return error("Invalid load totals.")
    km, source = road_km(a, b)
    movers = Mover.query.filter_by(status="approved").all()
    rows = [{"mover": m.to_dict(), "covers": covers(m, a) and m.available, "quote": quote(m, km, totals)} for m in movers]
    rows.sort(key=lambda r: (not r["covers"], r["quote"]["total"]))
    return jsonify(km=km, distanceSource=source, quotes=rows)
