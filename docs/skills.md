# Skills Required

This document lists the skills and knowledge areas needed to understand, develop, and maintain PromptForge.

---

## Core Requirements

### Frontend

| Skill | Level | Where Used |
|---|---|---|
| React 19 (hooks, context) | Intermediate | All frontend components |
| React Router DOM v7 | Intermediate | `App.jsx`, route guards |
| Zustand | Intermediate | All 6 stores |
| Axios | Basic | `src/services/api.js` |
| TailwindCSS v4 | Intermediate | All component styling |
| Framer Motion | Basic | Page/component animations |
| Vite | Basic | Build tooling, env vars |
| JavaScript ES2022+ | Intermediate | All source files |

### Backend

| Skill | Level | Where Used |
|---|---|---|
| NestJS 11 | Intermediate | All backend modules |
| TypeScript | Intermediate | All `.ts` source files |
| JWT / Passport.js | Intermediate | `auth/` module |
| Mongoose / MongoDB | Basic–Intermediate | Schema definitions, optional mode |
| bcryptjs | Basic | Password hashing in `auth.service.ts` |
| NestJS Schedule | Basic | Session expiry cron in `sessions.service.ts` |
| Node.js (streams, fs) | Basic | `runtime-store.service.ts`, file extraction |

### Infrastructure & DevOps

| Skill | Level | Where Used |
|---|---|---|
| Vercel (frontend deploy) | Basic | `promptforge-client/vercel.json` |
| Railway (backend deploy) | Basic | `promptforge-server/railway.toml` |
| Environment variable management | Basic | `.env` files |
| Git | Basic | Source control |

---

## Useful But Not Required

- **PDF/DOCX parsing** — Understanding `pdf-parse` and `mammoth` helps debug file extraction issues
- **MongoDB Atlas** — For configuring the optional cloud database
- **REST API design** — Helps when extending endpoints or debugging contract mismatches
- **Mermaid diagrams** — Used in this documentation

---

## Onboarding Path

1. Read [analyze.md](analyze.md) for the big picture
2. Read [folder-structure.md](folder-structure.md) to orient in the codebase
3. Read [api-integration.md](api-integration.md) to understand the frontend ↔ backend contract
4. Read [auth.md](auth.md) before touching any session, login, or guard logic
5. Read [state-management.md](state-management.md) before touching any Zustand store
6. Run locally using the commands in [deployment.md](deployment.md)
