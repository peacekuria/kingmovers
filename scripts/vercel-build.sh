#!/usr/bin/env bash
# Vercel build: build the React app, then (production only) apply database migrations.
# Sensitive env vars (DATABASE_URL, JWT_SECRET_KEY) are available here but cannot be
# downloaded, so migrations run in the build instead of from a laptop.
set -euo pipefail

(cd frontend && VITE_SHOW_DEMO_ACCOUNTS=false npm run build)

if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "[migrate] Skipping database migrations (VERCEL_ENV=${VERCEL_ENV:-unset}); only production deploys migrate."
  exit 0
fi

echo "[migrate] Installing backend dependencies for migrations..."
python3 -m venv /tmp/migrate-venv
/tmp/migrate-venv/bin/pip install --quiet --disable-pip-version-check -r requirements.txt

echo "[migrate] Applying database migrations..."
(cd backend && FLASK_APP=wsgi.py /tmp/migrate-venv/bin/flask db upgrade)
echo "[migrate] Database is up to date."
