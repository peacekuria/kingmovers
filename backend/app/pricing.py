import math
import logging
import requests
from flask import current_app

log = logging.getLogger(__name__)
ROAD_FACTOR = 1.35


def haversine_km(a, b):
    r = 6371
    dlat = math.radians(b["lat"] - a["lat"])
    dlng = math.radians(b["lng"] - a["lng"])
    h = math.sin(dlat / 2) ** 2 + math.cos(math.radians(a["lat"])) * math.cos(math.radians(b["lat"])) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def road_km(a, b):
    """Driving distance. Uses Google Distance Matrix when configured; falls back to a road-factor estimate."""
    key = current_app.config.get("GOOGLE_MAPS_API_KEY")
    if key:
        try:
            r = requests.get(
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                params={"origins": f"{a['lat']},{a['lng']}", "destinations": f"{b['lat']},{b['lng']}", "key": key, "units": "metric"},
                timeout=4,
            )
            el = r.json()["rows"][0]["elements"][0]
            if el.get("status") == "OK":
                return round(el["distance"]["value"] / 1000, 1), "google"
        except Exception as exc:  # network/quota problems must not block quoting
            log.warning("Distance Matrix failed, using estimate: %s", exc)
    return round(haversine_km(a, b) * ROAD_FACTOR, 1), "estimate"


def covers(mover, point):
    return haversine_km({"lat": mover.coverage_lat, "lng": mover.coverage_lng}, point) <= mover.coverage_radius_km


def quote(mover, km, totals):
    distance = round(km * mover.per_km)
    volume = round(totals["m3"] * mover.per_m3)
    weight = round(max(0, totals["kg"] - 300) * 2)  # heavy-load surcharge
    total = mover.base_fee + distance + volume + weight
    return {"base": mover.base_fee, "distance": distance, "volume": volume, "weight": weight, "total": total}


def valid_point(p):
    try:
        lat, lng = float(p["lat"]), float(p["lng"])
    except (TypeError, KeyError, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return {"lat": lat, "lng": lng, "label": str(p.get("label") or "Pinned location")[:160]}
