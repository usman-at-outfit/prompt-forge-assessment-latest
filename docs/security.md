# Security

---

## Current Protections

### Authentication

- **JWT access tokens** are short-lived (15 min), reducing the window for token theft
- **Refresh tokens** are hashed with bcryptjs before storage — a leaked database does not expose usable tokens
- **Password hashing**: bcryptjs with default salt rounds (10)
- `passwordHash` field has `select: false` — never returned in API responses
- `@Public()` decorator is the only way to bypass `JwtAuthGuard`; the guard is applied globally

### Input Validation

NestJS `ValidationPipe` is configured with:
- `whitelist: true` — strips unexpected fields from request bodies
- `forbidNonWhitelisted: true` — rejects requests with unknown fields
- DTOs use `class-validator` decorators for type and constraint enforcement

This prevents mass assignment attacks (sending extra fields to alter protected properties).

### File Upload Constraints

- Max 20 files per request
- Max 150 MB total per request
- File content is extracted (text only) — binary content is never executed
- Unsupported file types receive a warning, not an error; content is not processed

### CORS

Configured in `main.ts`. Only allowed origins can make cross-origin requests. Must be updated for each new deployment environment.

### Environment Separation

- `.env` files are gitignored and not committed
- Runtime store JSON (`data/runtime-store.json`) is gitignored
- Secrets are loaded via environment variables, not hardcoded (except for development defaults)

---

## Known Vulnerabilities & Gaps

### Critical (Fix Before Production)

| Risk | Location | Recommendation |
|---|---|---|
| No rate limiting on auth endpoints | `auth.controller.ts` | Add `@nestjs/throttler` — login/register endpoints are brute-force targets |
| Default JWT secrets are public | `auth.module.ts` defaults | Enforce non-default secrets via config validation (`@nestjs/config` + Joi/Zod schema) |
| No account lockout on failed logins | `auth.service.ts` | Implement progressive delay or lockout after N failures |
| CORS `origin` may be too permissive | `main.ts` | Verify only production domains are whitelisted |

### High

| Risk | Location | Recommendation |
|---|---|---|
| No input sanitization for chat content | `chat.service.ts` | If content is ever rendered as HTML, sanitize with DOMPurify (frontend) |
| File upload with no virus scan | `chat.controller.ts` | Add ClamAV or cloud-based AV scanning before processing |
| No HTTPS enforcement | `main.ts` | Handled at the platform level (Railway/Vercel), but verify redirects are active |
| No token rotation on refresh | `auth.service.ts` | Refresh token reuse (replay attack) — implement one-time use refresh tokens |

### Medium

| Risk | Location | Recommendation |
|---|---|---|
| No CSRF protection | API | For cookie-based auth, add CSRF tokens. For Bearer-header-only auth, risk is low |
| No request size limit (except file upload) | `main.ts` | Add `app.use(bodyParser.json({ limit: '1mb' }))` |
| Session expiry not enforced on every request | `sessions.service.ts` | Validate `expiresAt` on every session lookup, not just in the cron |
| Agent simulation accepts arbitrary system prompts | `agents.service.ts` | When real LLM is integrated, sanitize system prompt to prevent prompt injection |

---

## Security Headers

Currently not explicitly set. When deploying to production, add:

```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

Recommended headers Helmet provides:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

---

## Dependency Security

Run periodically:

```bash
# Backend
cd promptforge-server && npm audit

# Frontend
cd promptforge-client && npm audit
```

Use `npm audit fix` for non-breaking patches. Review breaking changes manually.

---

## Sensitive Data in Logs

`LoggingInterceptor` logs request paths and response codes. Ensure:
- Request bodies are not logged (they may contain passwords)
- Authorization headers are not logged
- The current interceptor only logs `method`, `path`, `status`, and `duration` — this is safe
