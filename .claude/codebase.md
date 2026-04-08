# PromptForge Codebase Map

## Frontend

Location: `promptforge-client`

Stack:

- React 19
- Vite
- React Router
- Zustand
- Framer Motion
- Axios

### Frontend Entry

- `src/App.jsx`: app shell, route table, auth guards, store persistence hooks

### Main Routes

- `/`: `src/pages/LandingPage.jsx`
- `/login`: `src/pages/LoginPage.jsx`
- `/register`: `src/pages/RegisterPage.jsx`
- `/hub`: `src/pages/HubPage.jsx`
- `/marketplace`: `src/pages/MarketplacePage.jsx`
- `/agents`: `src/pages/AgentsPage.jsx`
- `/discover`: `src/pages/DiscoverPage.jsx`
- `/discover/discuss`: `src/pages/DiscoverDiscussPage.jsx`
- `/settings`: `src/pages/SettingsPage.jsx`

### Key Frontend Folders

- `src/components/`: UI and route-specific building blocks
- `src/hooks/`: session and persistence logic
- `src/pages/`: route screens
- `src/services/`: API clients
- `src/store/`: Zustand state
- `src/data/`: frontend fallback/static content
- `src/assets/`: client-provided visual assets
- `src/utils/`: shared helpers

### Important Stores

- `authStore.js`: auth state, guest session init, logout, token refresh
- `chatStore.js`: hub messaging, model switching, attachments, pending handoff state
- `promptStore.js`: prompt-builder conversational flow and generated prompt state
- `modelStore.js`: model list, filters, selections, recommendations
- `tokenStore.js`: token usage stats
- `languageStore.js`: locale selection

### Important Hooks

- `useSession.js`: bootstraps auth/guest session on app load
- `usePersist.js`: hydrates Zustand stores into the correct storage bucket

### Frontend Route Notes

- `Agents` is auth-only
- `Hub`, `Marketplace`, and `Discover` allow guest access
- Landing feature cards can hand off into Hub guided flows

## Backend

Location: `promptforge-server`

Stack:

- NestJS 11
- JWT auth
- Optional MongoDB via Mongoose
- Local runtime fallback store when Mongo is not configured

### Backend Entry

- `src/app.module.ts`: module graph and conditional Mongo wiring
- `src/main.ts`: app bootstrap, CORS, pipes, filters, global prefix

### Main Modules

- `auth/`: register, login, logout, me, guest session init
- `users/`: user records
- `sessions/`: session persistence and merge behavior
- `models/`: model list/detail/recommendation data
- `prompts/`: prompt generation, history, regenerate/edit/delete
- `chat/`: message handling, model switching, uploads, extraction
- `tokens/`: token usage stats
- `agents/`: templates and saved agent CRUD
- `discover/`: research feed and discuss flow data
- `runtime/`: local fallback persistence layer
- `database/`: seed logic
- `data/`: backend-side seeded/fallback datasets
- `types/`: local type declarations for packages without built-in typings

### Backend Runtime Behavior

- If `MONGODB_URI` is valid, Mongoose is enabled
- Otherwise, the app falls back to runtime storage
- Runtime storage writes local state and should not be committed

## Frontend <-> Backend Contract Areas

### Auth / Session

- Frontend auth/session hooks expect guest and logged-in flows to both work
- Logout should clear persisted client state and not leave auth residue behind

### Hub

- Chat composer supports text, file uploads, images, voice, video capture, and screen capture
- Backend extracts file text where possible and combines chunked processing into one response

### Prompt Builder

- Builder state is conversational and can hand off into chat
- Generated prompts should support run, edit, regenerate, delete, and reset flows

### Marketplace

- Card data should come from backend model payloads
- Clicking a card opens a drawer; "How to Use" is backed by backend content

### Agents

- Agents tab is auth-gated
- Templates, saved agents, and create/update/delete flows should use API-backed data

### Discover

- Discover route uses a redesigned research feed plus a follow-up discussion flow
- It should visually match the current light theme and framed layout used elsewhere

## Current Practical Debugging Heuristics

- White screens after navigation are often caused by stale Zustand action references during HMR or bad route-state assumptions.
- If a route works only before refresh, inspect storage hydration and one-time handoff state first.
- If backend boot fails before serving requests, inspect runtime-store JSON corruption or missing third-party typings/import signatures before assuming business logic is broken.
