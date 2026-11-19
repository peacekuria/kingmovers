import logging
import os
import click
from flask import Flask, jsonify, send_from_directory, request
from werkzeug.exceptions import HTTPException
from .config import Config
from .extensions import db, migrate, jwt, cors, limiter
from . import models  # noqa: F401  (register models with SQLAlchemy/Alembic)
from .routes import auth, movers, inventory, quotes, bookings, notifications, admin

BLUEPRINTS = (auth.bp, movers.bp, inventory.bp, quotes.bp, bookings.bp, notifications.bp, admin.bp)


def create_app(config=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    if app.config["ENV"] == "production" and not app.config.get("TESTING"):
        secret = os.getenv("JWT_SECRET_KEY", "")
        if len(secret) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be set to a random value of at least 32 characters in production.")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Each module is its own blueprint; one failing module's errors stay inside its own requests.
    for bp in BLUEPRINTS:
        app.register_blueprint(bp)

    @app.get("/api/health")
    def health():
        try:
            db.session.execute(db.text("SELECT 1"))
            return jsonify(status="ok", db="ok")
        except Exception:
            return jsonify(status="degraded", db="down"), 503

    _register_errors(app)
    _register_spa(app)
    _register_cli(app)

    @app.after_request
    def security_headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        resp.headers.setdefault("Permissions-Policy", "geolocation=(self), camera=(), microphone=()")
        if request.is_secure or request.headers.get("X-Forwarded-Proto") == "https":
            resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return resp

    return app


def _register_errors(app):
    @jwt.unauthorized_loader
    def _missing(reason):
        return jsonify(error="Please sign in."), 401

    @jwt.invalid_token_loader
    def _invalid(reason):
        return jsonify(error="Your session is invalid. Please sign in again."), 401

    @jwt.expired_token_loader
    def _expired(header, payload):
        return jsonify(error="Your session expired. Please sign in again."), 401

    @app.errorhandler(HTTPException)
    def _http(e):
        if request.path.startswith("/api/"):
            return jsonify(error=e.description if e.code != 429 else "Too many requests. Please slow down."), e.code
        return e

    @app.errorhandler(Exception)
    def _unhandled(e):
        app.logger.exception("Unhandled error on %s", request.path)
        db.session.rollback()
        return jsonify(error="Something went wrong on our side."), 500


def _register_spa(app):
    static_dir = app.config.get("STATIC_DIR")
    if not static_dir or not os.path.isdir(static_dir):
        return

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            return jsonify(error="Not found."), 404
        full = os.path.join(static_dir, path)
        if path and os.path.isfile(full):
            resp = send_from_directory(static_dir, path)
            if path.startswith("assets/"):
                resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return resp
        resp = send_from_directory(static_dir, "index.html")
        resp.headers["Cache-Control"] = "no-cache"
        return resp


def _register_cli(app):
    @app.cli.command("seed")
    def seed_cmd():
        """Insert demo movers, users and a sample booking (idempotent)."""
        from .seed import seed
        click.echo(seed())

    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--name", prompt=True)
    @click.option("--phone", prompt=True)
    @click.password_option()
    def create_admin(email, name, phone, password):
        """Create (or promote) an admin account."""
        from .models import User
        if len(password) < 8:
            raise click.BadParameter("Password must be at least 8 characters.")
        email = email.strip().lower()
        u = User.query.filter_by(email=email).first() or User(email=email, name=name, phone=phone)
        u.role, u.active = "admin", True
        u.set_password(password)
        db.session.add(u)
        db.session.commit()
        click.echo(f"Admin ready: {email}")
