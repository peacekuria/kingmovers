from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .extensions import db
from .models import User


def current_user():
    return db.session.get(User, int(get_jwt_identity()))


def roles_required(*roles):
    """Require a valid JWT for an active user whose role is in `roles` (any role if empty)."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = current_user()
            if not user or not user.active:
                return jsonify(error="Account not found or suspended."), 401
            if roles and user.role not in roles:
                return jsonify(error="You don't have access to this resource."), 403
            return fn(user, *args, **kwargs)
        return wrapper
    return deco


def error(msg, code=400):
    return jsonify(error=msg), code
