#!/bin/sh
set -e
# Apply database migrations on every start (safe: Alembic is idempotent).
flask db upgrade
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then flask seed; fi
exec gunicorn wsgi:app \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" --threads "${GUNICORN_THREADS:-4}" --worker-class gthread \
  --timeout 60 --access-logfile - --forwarded-allow-ips="*"
