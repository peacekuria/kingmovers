import re
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..extensions import db, limiter
from ..models import User, Mover, LoginAttempt
from ..auth_utils import roles_required, error
from ..notify import notify

bp = Blueprint("auth", __name__, url_prefix="/api/auth")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^(\+?254|0)[17]\d{8}$")
LOCK_WINDOW = timedelta(minutes=15)
MAX_FAILS_PER_EMAIL = 8
MAX_FAILS_PER_IP = 40


def _client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    return (fwd.split(",")[0].strip() or request.remote_addr or "?")[:64]


def _locked(email, ip):
    since = datetime.now(timezone.utc) - LOCK_WINDOW
    recent = LoginAttempt.query.filter(LoginAttempt.created_at >= since)
    return (recent.filter_by(email=email).count() >= MAX_FAILS_PER_EMAIL
            or recent.filter_by(ip=ip).count() >= MAX_FAILS_PER_IP)


def _session(user):
    return {"token": create_access_token(identity=str(user.id), additional_claims={"role": user.role}), "user": user.to_dict()}


@bp.post("/register")
@limiter.limit("10 per hour")
def register():
    d = request.get_json(silent=True) or {}
    name = (d.get("name") or "").strip()
    email = (d.get("email") or "").strip().lower()
    phone = re.sub(r"[\s-]", "", d.get("phone") or "")
    password = d.get("password") or ""
    role = d.get("role") or "client"
    if role not in ("client", "mover"):  # admins are created via `flask create-admin`
        return error("Role must be client or mover.")
    if len(name) < 2:
        return error("Please enter your full name.")
    if not EMAIL_RE.match(email):
        return error("Please enter a valid email address.")
    if not PHONE_RE.match(phone):
        return error("Enter a Kenyan phone number, e.g. 0712 345 678.")
    if len(password) < 8:
        return error("Password must be at least 8 characters.")
    if User.query.filter_by(email=email).first():
        return error("An account with that email already exists.", 409)

    user = User(name=name, email=email, phone=phone, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    if role == "mover":
        company = (d.get("company") or name).strip()[:120]
        db.session.add(Mover(user_id=user.id, name=company, tagline="Newly registered mover", status="pending"))
        for admin in User.query.filter_by(role="admin", active=True):
            notify(admin.id, "New mover registration", f"{company} is awaiting approval.", "warning", "/admin/movers")
    db.session.commit()
    return jsonify(_session(user)), 201


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    d = request.get_json(silent=True) or {}
    email, ip = (d.get("email") or "").strip().lower()[:255], _client_ip()
    if _locked(email, ip):
        return error("Too many failed attempts. Try again in 15 minutes.", 429)
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(d.get("password") or ""):
        db.session.add(LoginAttempt(email=email, ip=ip))
        # Housekeeping: drop attempts older than a day.
        LoginAttempt.query.filter(LoginAttempt.created_at < datetime.now(timezone.utc) - timedelta(days=1)).delete()
        db.session.commit()
        return error("Wrong email or password.", 401)
    LoginAttempt.query.filter_by(email=email).delete()
    db.session.commit()
    if not user.active:
        return error("This account has been suspended. Contact support.", 403)
    return jsonify(_session(user))


@bp.get("/me")
@roles_required()
def me(user):
    return jsonify(user=user.to_dict())
