# PromptForge Workspace

## Purpose

PromptForge is a two-app workspace for an AI discovery and prompt-building platform:

- `promptforge-client`: React + Vite frontend
- `promptforge-server`: NestJS backend

The product centers on six major user areas:

- Landing / marketing entry
- Chat Hub
- Marketplace
- Agents
- Discover
- Auth + session persistence

## Repo Layout

- `.claude/`: Claude-facing project notes
- `promptforge-client/`: frontend app
- `promptforge-server/`: backend app

## Working Priorities

When editing this repo, prefer protecting these flows first:

1. Session init and persistence
2. Register / login / logout
3. Hub messaging and model switching
4. Prompt builder generation and handoff into chat
5. Marketplace card -> drawer -> action flow
6. Agents and Discover route-specific UX

## Commands

### Frontend

- Dev: `cd promptforge-client && npm run dev`
- Build: `cd promptforge-client && npm run build`
- Preview: `cd promptforge-client && npm run preview`

### Backend

- Dev: `cd promptforge-server && npm run start:dev`
- Build: `cd promptforge-server && npm run build`
- Seed: `cd promptforge-server && npm run seed`
- Tests: `cd promptforge-server && npm run test`

## Persistence Notes

Frontend uses Zustand plus storage-backed hydration:

- Auth session: `localStorage` via `pf_auth`
- Guest session: `sessionStorage` via `pf_guest`
- Chat/prompt/token stores use dynamic keys based on user id or guest session id

Backend can run in two modes:

- Mongo mode when a valid `MONGODB_URI` is present
- Runtime fallback mode via the local runtime store when Mongo is not configured

## Local Environment Caveat

This machine has previously shown:

- `EPERM: operation not permitted, lstat 'C:\Users\Usman Iftekhar'`

If that exact Node/Vite/Nest error appears during build or dev tooling, treat it as an environment issue first before assuming the app code is broken.

## Editing Guidance

- Keep frontend and backend contracts aligned.
- Do not assume a UI state bug is only visual; persisted store hydration may be involved.
- For route-specific redesign requests, confine changes to the requested route when possible.
- Preserve current light theme and shared color system unless the request explicitly says otherwise.
- Avoid committing runtime output, local env files, or generated artifacts.
