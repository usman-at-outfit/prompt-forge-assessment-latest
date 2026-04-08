# Performance

---

## Frontend

### Virtualization

Long lists (model marketplace, token stats) use **React Window** (`react-window`) for windowed rendering. Only visible rows are mounted in the DOM — essential when displaying all 27+ models or large token stat lists.

```jsx
// ModelGrid.jsx pattern
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={models.length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => <ModelCard model={models[index]} style={style} />}
</FixedSizeList>
```

### Code Splitting

Vite automatically splits code by route. Each page (`LandingPage`, `HubPage`, etc.) is a separate chunk. No manual `React.lazy()` / `Suspense` is currently configured, but Vite's default behavior provides route-level splitting.

Recommendation: Add explicit `React.lazy()` for heavy page components to ensure chunk boundaries are correct after refactors.

### Animation Budget

Framer Motion is used throughout. Keep animations to:
- `duration: 0.2–0.3s` for transitions
- `opacity`, `y`, `scale` transforms (GPU-accelerated)
- Avoid animating `width`, `height`, or `top/left` (triggers layout)

### Storage Access

`usePersist` and `useSession` read from `localStorage` / `sessionStorage` synchronously on mount. If storage objects grow large (e.g. thousands of chat messages), this will block the main thread.

Mitigation: The chat store TTL of 4 hours limits accumulation. Consider capping `chatHistory` at the most recent N messages client-side.

### Bundle Size Concerns

| Library | Approximate Size | Notes |
|---|---|---|
| Framer Motion | ~60 KB gzip | Import only used motion components |
| React Window | ~4 KB gzip | Already tree-shakeable |
| Lucide React | ~1 KB per icon | Import individual icons, not the full library |
| TailwindCSS | PurgeCSS removes unused | Verify `content` glob in `tailwind.config.js` covers all source files |

---

## Backend

### Response Time

`LoggingInterceptor` records duration per request. Typical expected ranges:

| Endpoint | Expected Duration |
|---|---|
| `GET /health` | < 5ms |
| `GET /models` | < 50ms (from runtime store) |
| `POST /chat/message` | < 200ms (simulated) |
| `POST /prompts/generate` | < 100ms (template interpolation) |
| `POST /auth/login` | 50–150ms (bcryptjs compare) |

bcryptjs compare is intentionally slow (that's the point). Do not reduce salt rounds below 10.

### Runtime Store Performance

The JSON fallback store loads the entire file into memory on startup and writes the full object on every mutation. This is fine for development but will not scale:

- **Read performance**: O(1) from in-memory cache — fast
- **Write performance**: Full JSON serialization + disk write — slow for high concurrency
- **Memory**: Entire dataset in one object — problematic at scale

For production with significant traffic, use MongoDB (which the app already supports) or Redis for session caching.

### Session Cleanup

`SessionsService` runs a cron job every hour to delete expired sessions. This prevents unbounded growth in the sessions collection.

```typescript
@Cron(CronExpression.EVERY_HOUR)
async cleanupExpiredSessions() { ... }
```

In the runtime store, expired sessions are also checked on access.

### Database Indexes

When using MongoDB, ensure these indexes are created (the seed script should handle this):

| Collection | Index | Reason |
|---|---|---|
| `sessions` | `sessionId` (unique) | All session lookups |
| `sessions` | `expiresAt` | TTL and cleanup queries |
| `users` | `email` (unique) | Login lookup |
| `models` | `modelId` (unique) | Model detail queries |
| `tokenstats` | `sessionId` | Token queries |

---

## Scalability Concerns

1. **Single-instance runtime store** — Cannot run multiple backend instances with the JSON fallback (no shared state). MongoDB solves this.

2. **No caching layer** — Model list and template data are static. Cache with Redis or in-memory LRU cache to avoid redundant DB reads.

3. **No streaming** — Chat responses are fully buffered before sending. For large LLM outputs (when integrated), implement SSE streaming to improve perceived latency.

4. **No CDN for static assets** — Vercel handles this automatically for the frontend. Backend static assets (if any) should be served via a CDN, not the NestJS process.

5. **No pagination on all endpoints** — Token stats and agent lists are returned in full. Add cursor-based or offset pagination to all list endpoints before user data grows large.
