# Folder Structure

---

## Root

```
prompt-forge-assessment/
├── .claude/                    # Claude AI workspace context (not user docs)
│   ├── cowork.md               # Collaboration guide for Claude sessions
│   ├── codebase.md             # Module map and debugging heuristics
│   └── workspace.md            # Project overview, commands, guardrails
├── docs/                       # Developer documentation (you are here)
├── promptforge-client/         # React + Vite frontend
├── promptforge-server/         # NestJS backend
├── .gitignore
└── .gitattributes
```

---

## Frontend (`promptforge-client/`)

```
promptforge-client/
├── public/                     # Static assets served as-is
├── src/
│   ├── App.jsx                 # Route table, auth guards, store hydration
│   ├── main.jsx                # React entry point
│   ├── assets/                 # Images, fonts, SVGs
│   ├── components/
│   │   ├── auth/               # AuthGuard, LoginForm, RegisterForm, AuthQuotePanel
│   │   ├── chat/               # ChatWindow, MessageBubble, ModelSelector, TokenBadge, GuidedAgentFlow
│   │   ├── models/             # ModelGrid, ModelCard, ModelDrawer, CompareModal
│   │   ├── prompts/            # PromptBuilderFlow, PromptCard, StepCard
│   │   ├── agents/             # AgentBuilderFlow, AgentTemplateCard, ActionComposer
│   │   ├── stats/              # TokenStatsPanel, AgentActivityLog
│   │   ├── layout/             # Navbar, PageWrapper, Sidebar
│   │   └── ui/                 # Button, Input, Card, Modal, Badge, Toast, Skeleton, TypewriterText
│   ├── data/
│   │   ├── models.json         # Client-side model fallback
│   │   ├── templates.json      # Prompt templates
│   │   ├── agent-templates.json
│   │   ├── fallbackData.js     # Offline mode defaults
│   │   ├── discoverFeed.js     # Static research feed
│   │   └── i18n.js             # Internationalisation strings
│   ├── hooks/
│   │   ├── useSession.js       # Session bootstrap on app load
│   │   └── usePersist.js       # Zustand ↔ browser storage sync
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── HubPage.jsx
│   │   ├── MarketplacePage.jsx
│   │   ├── AgentsPage.jsx
│   │   ├── DiscoverPage.jsx
│   │   ├── DiscoverDiscussPage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/
│   │   ├── api.js              # Axios instance + interceptors
│   │   ├── authService.js
│   │   ├── sessionService.js
│   │   ├── promptService.js
│   │   ├── modelService.js
│   │   ├── agentsService.js
│   │   ├── tokenManager.js
│   │   └── discoverService.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── chatStore.js
│   │   ├── promptStore.js
│   │   ├── modelStore.js
│   │   ├── tokenStore.js
│   │   └── languageStore.js
│   └── utils/
│       ├── tokenCounter.js
│       ├── sessionId.js
│       └── mediaInput.js
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── vercel.json                 # Vercel SPA routing config
```

---

## Backend (`promptforge-server/`)

```
promptforge-server/
├── src/
│   ├── main.ts                 # App bootstrap
│   ├── app.module.ts           # Module graph
│   ├── health.controller.ts    # GET /health
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/                # RegisterDto, LoginDto, RefreshDto
│   │   ├── guards/             # JwtAuthGuard, OptionalJwtGuard
│   │   └── strategies/         # JwtStrategy, LocalStrategy
│   ├── users/
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── schemas/user.schema.ts
│   ├── sessions/
│   │   ├── sessions.service.ts
│   │   ├── sessions.module.ts
│   │   └── schemas/session.schema.ts
│   ├── chat/
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.module.ts
│   │   ├── chat-file-extractor.ts
│   │   └── schemas/message.schema.ts
│   ├── prompts/
│   │   ├── prompts.controller.ts
│   │   ├── prompts.service.ts
│   │   ├── prompts.module.ts
│   │   └── schemas/prompt-template.schema.ts
│   ├── models/
│   │   ├── models.controller.ts
│   │   ├── models.service.ts
│   │   ├── models.module.ts
│   │   └── schemas/model.schema.ts
│   ├── agents/
│   │   ├── agents.controller.ts
│   │   ├── agents.service.ts
│   │   ├── agents.module.ts
│   │   └── schemas/agent.schema.ts
│   ├── tokens/
│   │   ├── tokens.controller.ts
│   │   ├── tokens.service.ts
│   │   ├── tokens.module.ts
│   │   └── schemas/token-stat.schema.ts
│   ├── discover/
│   │   ├── discover.controller.ts
│   │   ├── discover.service.ts
│   │   └── discover.module.ts
│   ├── runtime/
│   │   ├── runtime-store.service.ts   # JSON fallback persistence
│   │   └── runtime.module.ts
│   ├── database/
│   │   └── seed.ts                    # Seeds models, templates, agents
│   ├── data/
│   │   ├── models.seed.ts
│   │   ├── prompt-templates.seed.ts
│   │   └── agent-templates.seed.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts
│   │       └── transform.interceptor.ts
│   └── types/                         # Local type declarations for untyped packages
├── data/
│   └── runtime-store.json             # Auto-generated; gitignored
├── dist/                              # Compiled output; gitignored
├── package.json
├── tsconfig.json
└── railway.toml                       # Railway deployment config
```

---

## `.claude/` (Claude AI Context)

These files are consumed by the Claude Code assistant during sessions. They are not user documentation.

| File | Purpose |
|---|---|
| `cowork.md` | Quick-start guide for Claude sessions |
| `codebase.md` | Module map, routes, stores, integration contract |
| `workspace.md` | Repo overview, commands, persistence notes, local environment caveats |

These live at the repo root so Claude picks them up automatically via the `.claude/` convention.
