# Pulse — Docker & deploy

Mid-level ops layer: one production image (built React UI + Express API), Compose for local runs, SQLite on a volume.

## Local with Docker

```bash
cp .env.example .env
# Set JWT_SECRET to something non-default
docker compose up --build
```

App: `http://localhost:3001` (UI and `/api` on the same origin).

SQLite lives in the `pulse-data` volume (`DATABASE_PATH=/app/data/pulse.db`).

## What the image does

1. Installs deps (including native `better-sqlite3`)
2. Builds the Vite client into `client/dist`
3. Runs DB init, then Express — which serves `/api/*` and the static UI

## Cloud deploy (one mid-level path)

**Render (Docker):**

1. New Web Service → connect `gdebo16-cmd/Pulse`
2. Runtime: Docker (uses this repo’s `Dockerfile`)
3. Set env: `JWT_SECRET`, `PORT=3001`, `CLIENT_ORIGIN=https://<your-service>.onrender.com`, `DATABASE_PATH=/app/data/pulse.db`
4. Add a persistent disk mounted at `/app/data` (SQLite needs it; free tier ephemeral disks lose data on restart)

**Fly.io** is the same idea: `fly launch` with the Dockerfile, a volume on `/app/data`, and secrets for `JWT_SECRET`.

Do not commit real secrets. Prefer provider secret stores.

## Without Docker

See root `README.md` (`npm run dev`).
