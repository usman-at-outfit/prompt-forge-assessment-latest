# Environment Variables

---

## Backend (`promptforge-server/.env`)

Create a `.env` file in `promptforge-server/`. This file is gitignored and must not be committed.

```dotenv
# ─── Server ──────────────────────────────────────────────
PORT=3000
NODE_ENV=development         # "production" enables secure cookie settings

# ─── Database (optional) ─────────────────────────────────
# If absent, the app uses the local runtime JSON fallback store.
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/promptforge

# ─── JWT ─────────────────────────────────────────────────
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production-refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Variable Reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `NODE_ENV` | No | — | `production` enables secure/httpOnly cookies |
| `MONGODB_URI` | No | — | Absence triggers runtime fallback mode |
| `JWT_SECRET` | Yes | `promptforge-dev-secret` | Must be changed for production |
| `JWT_REFRESH_SECRET` | Yes | `promptforge-dev-refresh-secret` | Must be changed for production |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |

> **Security warning:** The default JWT secrets are public (hardcoded in the codebase). Always override them with strong, random secrets in any non-development environment.

---

## Frontend (`promptforge-client/.env`)

Create a `.env` file in `promptforge-client/`. This file is gitignored.

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
```

### Variable Reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:3000/api/v1` | Backend base URL; must be set for production |

Vite exposes `VITE_*` variables to client-side code via `import.meta.env`. Do not prefix sensitive values with `VITE_` — they will be embedded in the browser bundle.

---

## Production Checklist

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong random strings (min 32 chars)
- [ ] `MONGODB_URI` points to a real Atlas cluster
- [ ] `NODE_ENV=production` is set
- [ ] `VITE_API_URL` points to the deployed Railway backend
- [ ] No `.env` files are committed to source control
- [ ] Railway and Vercel environment variables are set in their respective dashboards

---

## Runtime Store Location

When `MONGODB_URI` is absent, the backend creates:

```
promptforge-server/data/runtime-store.json
```

This file is auto-generated and gitignored. Do not commit it.
