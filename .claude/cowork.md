# Cowork Guide

Start with these files:

- `workspace.md`: repo-level working notes, commands, and guardrails
- `codebase.md`: frontend/backend structure, routes, stores, modules, and integration map

This workspace contains two apps:

- `promptforge-client`: React + Vite frontend
- `promptforge-server`: NestJS backend

Core expectations:

- Keep frontend and backend contracts in sync.
- Prefer fixing broken flows end to end instead of patching only one side.
- Treat auth, guest session, hub, prompt builder, marketplace, agents, and discover flows as critical paths.
- Avoid committing local runtime data, build output, or secrets.
- When a UI issue depends on persisted Zustand state, check storage hydration before changing component logic.

Useful commands:

- Frontend dev: `cd promptforge-client && npm run dev`
- Frontend build: `cd promptforge-client && npm run build`
- Backend dev: `cd promptforge-server && npm run start:dev`
- Backend build: `cd promptforge-server && npm run build`
- Backend seed: `cd promptforge-server && npm run seed`

Known local note:

- This machine has previously shown a Node `EPERM` issue while resolving `C:\Users\Usman Iftekhar`. If a build fails with that exact error, treat it as an environment issue first, not automatically as an app code failure.
