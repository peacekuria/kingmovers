import os
from datetime import timedelta
from sqlalchemy.pool import NullPool

ON_VERCEL = bool(os.getenv("VERCEL"))


def _db_url():
    # Vercel/Neon integrations expose DATABASE_URL and/or POSTGRES_URL.
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "sqlite:///kingmoverskenya.db"
    # Render/Heroku hand out postgres:// URLs; SQLAlchemy needs an explicit driver.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


class Config:
    # Serverless deploys are always production, even if FLASK_ENV is forgotten.
    ENV = os.getenv("FLASK_ENV") or ("production" if ON_VERCEL else "development")
    SQLALCHEMY_DATABASE_URI = _db_url()
    # Serverless functions must not hold pooled connections between invocations.
    SQLALCHEMY_ENGINE_OPTIONS = {"poolclass": NullPool} if ON_VERCEL else {"pool_pre_ping": True}
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-me-dev-only-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRES_HOURS", "12")))
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_HEADERS_ENABLED = True
    # Built frontend served by Flask in the single-container deployment.
    STATIC_DIR = os.getenv("STATIC_DIR", "")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    JWT_SECRET_KEY = "test-secret-test-secret-test-secret"
    RATELIMIT_ENABLED = False
    STATIC_DIR = ""
