# Logging & Monitoring

---

## Current Logging (Backend)

### LoggingInterceptor

`src/common/interceptors/logging.interceptor.ts` — applied globally in `app.module.ts`.

Logs on every request:

```
[LoggingInterceptor] GET /api/v1/models 200 42ms
[LoggingInterceptor] POST /api/v1/chat/message 200 135ms
[LoggingInterceptor] POST /api/v1/auth/login 401 12ms
```

Fields: `method`, `path`, `statusCode`, `duration (ms)`

### GlobalExceptionFilter

`src/common/filters/global-exception.filter.ts` — logs all exceptions:

```
[ExceptionFilter] 500 Internal Server Error — Error: Session not found
  at SessionsService.findById (sessions.service.ts:45)
```

Unhandled errors log the full stack trace in development.

### NestJS Built-in Logger

NestJS uses its own `Logger` internally for:
- Module initialization
- Route registration
- App bootstrap completion

To use in a service:

```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log('Processing session merge');
this.logger.warn('Session nearing expiry');
this.logger.error('Failed to persist runtime store', err.stack);
```

---

## Current Logging (Frontend)

No structured logging. Errors are caught in Zustand store actions and surfaced in the UI. Browser console.error is used in development only.

---

## Gaps & Recommendations

### Backend

| Gap | Recommendation |
|---|---|
| No request ID / correlation ID | Add `uuid` middleware to attach `X-Request-ID` header; include in log lines |
| No structured JSON logs | Replace text logs with `winston` or `pino` for log aggregation (Railway supports both) |
| No external log sink | Send logs to Logtail, Datadog, or Railway's built-in log viewer |
| No performance metrics | Add response time histogram; use Prometheus + `@willsoto/nestjs-prometheus` |
| No uptime alerting | Configure Railway health check on `GET /api/v1/health`; set alert threshold |

### Frontend

| Gap | Recommendation |
|---|---|
| No error tracking | Integrate Sentry (`@sentry/react`) to capture unhandled errors and React render errors |
| No analytics | Add PostHog or Mixpanel to track feature usage (prompt generation, model selection) |
| No performance tracing | Use `web-vitals` to report LCP, FID, CLS to an analytics endpoint |

---

## Adding Sentry (Frontend)

```bash
cd promptforge-client
npm install @sentry/react
```

In `main.jsx`:

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

Wrap `<App />` with `Sentry.ErrorBoundary` for automatic error capture.

---

## Adding Structured Logging (Backend)

```bash
cd promptforge-server
npm install winston nest-winston
```

Configure in `app.module.ts`:

```typescript
WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
}),
```

---

## Health Check Endpoint

```
GET /api/v1/health
→ { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

Use this for:
- Railway health check (uptime monitoring + automatic restart on failure)
- Vercel rewrite proxy health
- Custom uptime monitoring (UptimeRobot, BetterUptime)

---

## Token Usage Monitoring

Token stats are tracked per session and user via the Tokens module:

```
GET /api/v1/tokens/session/:sessionId
GET /api/v1/tokens/user/:userId
```

These can feed a dashboard for:
- Monitoring simulated usage (currently) or real API cost (when LLM is integrated)
- Identifying high-usage sessions
- Per-agent cost breakdown
