from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Inventory
from ..auth_utils import roles_required, error

bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")
TEMPLATES = ("Bedsitter", "Studio", "1BR", "2BR")
MAX_ITEMS = 300


def clean_rooms(rooms):
    """Validate and normalise the client-supplied checklist."""
    if not isinstance(rooms, dict) or len(rooms) > 20:
        return None
    out, total = {}, 0
    for room, items in rooms.items():
        if not isinstance(items, list):
            return None
        clean = []
        for it in items:
            if not isinstance(it, dict):
                return None
            try:
                clean.append({
                    "id": str(it.get("id"))[:40], "name": str(it.get("name", ""))[:80],
                    "kg": max(0.0, min(2000.0, float(it.get("kg", 0)))), "m3": max(0.0, min(50.0, float(it.get("m3", 0)))),
                    "qty": max(1, min(50, int(it.get("qty", 1)))), "checked": bool(it.get("checked")),
                    "custom": bool(it.get("custom")),
                })
            except (TypeError, ValueError):
                return None
        total += len(clean)
        out[str(room)[:60]] = clean
    return out if total <= MAX_ITEMS else None


@bp.get("")
@roles_required("client")
def get_inventory(user):
    inv = Inventory.query.filter_by(user_id=user.id).first()
    return jsonify(inventory=inv.to_dict() if inv else None, totals=inv.totals() if inv else None)


@bp.put("")
@roles_required("client")
def save_inventory(user):
    d = request.get_json(silent=True) or {}
    if d.get("template") not in TEMPLATES:
        return error("Unknown template.")
    rooms = clean_rooms(d.get("rooms"))
    if rooms is None:
        return error("Invalid inventory.")
    inv = Inventory.query.filter_by(user_id=user.id).first() or Inventory(user_id=user.id)
    inv.template, inv.rooms = d["template"], rooms
    db.session.add(inv)
    db.session.commit()
    return jsonify(inventory=inv.to_dict(), totals=inv.totals())
