# KingMoversKenya · Nairobi

A moving assistant for Nairobi County: inventory checklists, instant quotes in KES, booking, live truck tracking,
in-app chat, reviews, and role-based dashboards for clients, movers and admins.

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, Redux Toolkit + RTK Query, Framer Motion, Leaflet |
| Backend | Flask 3, SQLAlchemy, Alembic (Flask-Migrate), JWT, gunicorn |
| Database | PostgreSQL (SQLite works for local dev) |
| Deploy | One Docker image serves the API and the built frontend |

## Run locally

**Backend** (port 5000)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set DATABASE_URL (or delete it to use SQLite) and JWT_SECRET_KEY
flask db upgrade
flask seed                  # demo data: client/mover/admin @kingmoverskenya.co.ke, password "password"
flask run
```

**Frontend** (port 5173, proxies `/api` to the backend)
```bash
cd frontend
npm install
npm run dev
```

**Tests:** `cd backend && python -m pytest -q`

**Production-like stack with Postgres:** `docker compose up --build`, then open http://localhost:8000

## Deploy

### Render (recommended, one click)
1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, then pick the repo. `render.yaml` creates a Postgres database and the web service,
   and generates `JWT_SECRET_KEY`.
3. Once it's live, set `CORS_ORIGINS` to your real URL (e.g. `https://kingmoverskenya.onrender.com`). Optionally add
   `GOOGLE_MAPS_API_KEY`.
4. Create your admin account from the Render shell:
   `flask create-admin --email you@company.co.ke --name "Your Name" --phone 0712345678`

Migrations run automatically on every deploy (`docker-entrypoint.sh`).

### Any Docker host (Railway, Fly.io, DigitalOcean, a VPS)
```bash
docker build -t kingmoverskenya .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/kingmoverskenya \
  -e JWT_SECRET_KEY=$(python3 -c "import secrets;print(secrets.token_urlsafe(48))") \
  -e CORS_ORIGINS=https://your-domain \
  kingmoverskenya
```
Put it behind HTTPS (the platforms above do this for you). Geolocation and browser notifications only work over HTTPS.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres URL (`postgres://` and `postgresql://` both accepted) |
| `JWT_SECRET_KEY` | yes | 32+ random characters. The app refuses to start in production without it |
| `CORS_ORIGINS` | if the frontend is on another domain | Comma-separated allowed origins |
| `GOOGLE_MAPS_API_KEY` | no | Real driving distances via Distance Matrix (otherwise straight-line × 1.35) |
| `SEED_DEMO_DATA` | no | `true` loads demo movers and users on start. Keep `false` in production |
| `WEB_CONCURRENCY` | no | gunicorn workers (default 2) |
| `RATELIMIT_STORAGE_URI` | no | e.g. `redis://…` to share API rate limits across instances |

## How it works

- **Auth & RBAC:** passwords are hashed (Werkzeug PBKDF2). Sessions use JWTs (12 h by default). Every endpoint
  checks role and ownership on the server. Failed logins lock an email for 15 minutes after 8 attempts.
- **Pricing:** the server always computes the price. The client's figure is only a preview.
- **Live tracking:** while a job is In-Progress, the mover taps *Share my live location* on their phone, which posts
  GPS every ~8 s. The client's map polls every 5 s.
- **Notifications:** booking confirmed, rescheduled, status changes, new messages, mover approval. Stored in the
  database, polled every 15 s, shown as toasts plus a system notification when the tab is in the background.
- **Modularity:** one Flask blueprint per module (`auth`, `movers`, `inventory`, `quotes`, `bookings`,
  `notifications`, `admin`). Each frontend feature is lazy-loaded behind its own error boundary.

## Photos & video

The UI uses real Nairobi photography from Unsplash (free licence), stored in `frontend/public/images/`.
Credits are in `frontend/public/images/CREDITS.md`. The landing hero cycles through the photos with a slow zoom.

To add motion, drop short, muted MP4 loops into `frontend/public/videos/`: `hero.mp4`, `cbd.mp4`, `westlands.mp4`,
`night.mp4`, `suburbs.mp4`. They play over the matching photo. Any missing clip simply leaves the photo showing.
Only use footage you own or have a licence for.

## Git workflow

Work on one branch per feature (`feature/<name>`), open a PR into `main`, and delete the branch after merge.
CI (`.github/workflows/ci.yml`) runs backend tests against Postgres, lint, and the frontend build on every PR.
