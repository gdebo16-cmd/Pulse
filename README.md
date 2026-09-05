# Pulse

Mid-level portfolio app: a small **team status board** with auth, a CRUD API, a React UI, SQLite, and tests.

Built as a public full-stack example for Gabriel DeBoer.

## Stack

- **API:** Node.js, Express, better-sqlite3, JWT auth stubs
- **UI:** React + Vite
- **Tests:** Node native test runner (smoke)

## Quick start

```bash
cp .env.example .env
npm install
npm run db:init
npm run dev
```

- API: `http://localhost:3001`
- UI: `http://localhost:5173`

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite client together |
| `npm run server` | API only |
| `npm run client` | Vite client only |
| `npm run db:init` | Create SQLite tables |
| `npm test` | Smoke tests |

## Layout

```
server/     Express API, DB, auth stubs, routes
client/     React + Vite UI
tests/      Smoke tests
```

## Next cuts (team)

- **Percy:** real auth services, ownership checks, feed UI, fuller tests
- **Cumulus:** Docker + cloud deploy
- **Major:** README/pin/recruiting polish

## License

Private learning / portfolio use unless otherwise noted.
