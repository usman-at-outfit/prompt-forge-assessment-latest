# Deployment

---

## Overview

| App | Platform | Config File |
|---|---|---|
| Frontend | Vercel | `promptforge-client/vercel.json` |
| Backend | Railway | `promptforge-server/railway.toml` |
| Database | MongoDB Atlas (optional) | via `MONGODB_URI` env var |

---

## Frontend — Vercel

### Configuration

`promptforge-client/vercel.json` handles SPA routing (all paths redirect to `index.html`).

### Deploy Steps

1. Push to GitHub
2. Connect the `promptforge-client/` directory to a Vercel project (set root directory to `promptforge-client`)
3. Set environment variable: `VITE_API_URL=https://your-backend.railway.app/api/v1`
4. Vercel runs `npm run build` automatically on push

### Manual Build

```bash
cd promptforge-client
npm install
npm run build
# dist/ is the output
```

### Environment Variables (Vercel)

| Variable | Example Value |
|---|---|
| `VITE_API_URL` | `https://your-api.railway.app/api/v1` |

---

## Backend — Railway

### Configuration

`promptforge-server/railway.toml` defines the build and start commands.

### Deploy Steps

1. Push to GitHub
2. Connect `promptforge-server/` directory to a Railway project
3. Set environment variables (see [environment.md](environment.md))
4. Railway runs `npm run build && npm run start:prod` automatically

### Manual Build

```bash
cd promptforge-server
npm install
npm run build
npm run start:prod
```

### Seed Data (first deploy)

After the backend is running and `MONGODB_URI` is set:

```bash
cd promptforge-server
npm run seed
```

This populates models, prompt templates, and agent templates.

---

## Database — MongoDB Atlas

1. Create a free cluster at MongoDB Atlas
2. Create a database user with read/write access
3. Whitelist Railway's egress IPs (or allow all: `0.0.0.0/0` for demo)
4. Set `MONGODB_URI` in Railway environment variables

If `MONGODB_URI` is not set, the backend falls back to the local runtime store (`data/runtime-store.json`), which is sufficient for demos but not suitable for production multi-instance deployments.

---

## Environments

| Environment | Frontend URL | Backend URL | Notes |
|---|---|---|---|
| Local dev | `http://localhost:5173` | `http://localhost:3000` | Run both manually |
| Staging | Vercel preview URL | Railway staging service | Optional |
| Production | Vercel production URL | Railway production service | |

---

## Local Development

```bash
# Terminal 1 — Backend
cd promptforge-server
npm install
npm run start:dev        # Hot reload on :3000

# Terminal 2 — Frontend
cd promptforge-client
npm install
npm run dev              # Vite dev server on :5173
```

Ensure `VITE_API_URL` is not set (or set to `http://localhost:3000/api/v1`) in local `.env`.

---

## CORS Configuration

CORS is configured in `src/main.ts`. Allowed origins should include:
- `http://localhost:5173` (local dev)
- Your Vercel production domain

Update the `origin` array in `main.ts` when adding new deployment environments.

---

## Health Check

```
GET /api/v1/health
→ { "status": "ok", "timestamp": "..." }
```

Railway and Vercel can use this endpoint for uptime monitoring.

---

## Known Issues

- **Windows EPERM error** — If `npm run build` or `npm run dev` fails with `EPERM: operation not permitted, lstat 'C:\Users\...'`, this is an environment-level Node/Windows permission issue, not an app bug. Try running the terminal as Administrator or using WSL.
