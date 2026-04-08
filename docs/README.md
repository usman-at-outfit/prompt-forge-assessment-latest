# PromptForge Documentation

Technical documentation for the PromptForge platform.

---

## Index

### Start Here

| File | Description |
|---|---|
| [analyze.md](analyze.md) | Project purpose, architecture overview, tech stack, key features, and improvement opportunities |
| [skills.md](skills.md) | Skills and knowledge required to work on this project |
| [folder-structure.md](folder-structure.md) | Full directory tree with explanations |

### Architecture

| File | Description |
|---|---|
| [frontend.md](frontend.md) | React app structure, routing, services, components, hooks, patterns |
| [backend.md](backend.md) | NestJS modules, controllers, services, persistence modes |
| [api-integration.md](api-integration.md) | All endpoints, request/response formats, error codes |
| [db-schema.md](db-schema.md) | MongoDB collections, field definitions, indexes, runtime fallback |

### Specific Domains

| File | Description |
|---|---|
| [auth.md](auth.md) | Authentication flows (register, login, guest, token refresh, session merge) |
| [state-management.md](state-management.md) | Zustand stores, persistence strategy, access patterns |
| [error-handling.md](error-handling.md) | Backend exception filter, frontend Axios interceptor, per-store error patterns |

### Operations

| File | Description |
|---|---|
| [deployment.md](deployment.md) | Vercel (frontend), Railway (backend), MongoDB Atlas setup |
| [environment.md](environment.md) | All environment variables with defaults and security notes |
| [testing.md](testing.md) | Current test setup, recommended strategy, tooling |
| [logging-monitoring.md](logging-monitoring.md) | Current logging, gaps, Sentry/Winston integration guides |

### Quality & Maintainability

| File | Description |
|---|---|
| [performance.md](performance.md) | Virtualization, caching, scalability concerns |
| [security.md](security.md) | Current protections, known vulnerabilities, recommendations |
| [coding-standards.md](coding-standards.md) | Naming conventions, component patterns, TypeScript practices |

---

## Claude AI Context

The `.claude/` folder at the repo root contains Claude Code assistant context files:

- `.claude/workspace.md` — repo overview, commands, guardrails
- `.claude/codebase.md` — module map, routes, stores, debugging heuristics
- `.claude/cowork.md` — quick-start for Claude sessions

These are separate from developer documentation and are consumed by the AI assistant during coding sessions.
