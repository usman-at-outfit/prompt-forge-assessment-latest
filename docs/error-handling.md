# Error Handling

---

## Backend

### Global Exception Filter

`src/common/filters/global-exception.filter.ts` catches all unhandled exceptions across the entire NestJS application.

**Output format:**

```json
{
  "statusCode": 400,
  "message": "email must be a valid email address",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Behavior by error type:**

| Error Type | Status Code | Notes |
|---|---|---|
| `HttpException` | From exception | Passes through NestJS HTTP exceptions |
| `ValidationError` (class-validator) | 400 | Triggered by `ValidationPipe` in `main.ts` |
| `UnauthorizedException` | 401 | From `JwtAuthGuard` |
| `ForbiddenException` | 403 | From role guards |
| `NotFoundException` | 404 | Thrown explicitly in services |
| Unhandled `Error` | 500 | Logged, generic message returned to client |

### Validation Pipe

Configured in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,         // Strip unknown fields
  forbidNonWhitelisted: true,
  transform: true,
}));
```

Validation errors from DTOs (using `class-validator` decorators) are caught and formatted by the global filter.

### Service-Level Error Patterns

Services throw NestJS built-in exceptions:

```typescript
// Common patterns in services
throw new NotFoundException('Session not found');
throw new UnauthorizedException('Invalid credentials');
throw new ConflictException('Email already in use');
throw new BadRequestException('Validation failed');
```

### Runtime Store Error Handling

`runtime-store.service.ts` handles JSON file corruption:
- Detects `SyntaxError` on load
- Creates a timestamped quarantine backup: `runtime-store.YYYYMMDD-HHmmss.corrupt.json`
- Resets to empty state and continues
- Logs a warning with the backup path

---

## Frontend

### Axios Interceptor (api.js)

**Response interceptor** handles HTTP errors globally:

```
401 received
  → attempt token refresh (POST /auth/refresh)
  → if refresh succeeds → retry original request
  → if refresh fails → call tokenManager.onFailure()
    → authStore.logout() → user redirected to /login

Other 4xx/5xx
  → error is re-thrown, handled per-call
```

### Per-Store Error Handling

Each Zustand store sets an `error` field on failure:

```js
// authStore pattern
try {
  set({ isLoading: true, error: null });
  const data = await authService.login(email, password);
  set({ user: data.user, ... });
} catch (err) {
  set({ error: err.response?.data?.message || 'Login failed' });
} finally {
  set({ isLoading: false });
}
```

Components read `error` from the store and display it in the UI:

```jsx
const error = useAuthStore(state => state.error);
// renders <p className="text-red-500">{error}</p>
```

### User-Facing Error Display

- **Forms** (login, register): Error shown below the submit button via store `error`
- **Chat**: Errors from failed messages shown as a system message in the chat window
- **Toast notifications**: Used for transient errors (model switch failure, file upload error)
- **Skeleton / fallback**: Loading states are shown via `Skeleton` component; failed fetches fall back to static data in `src/data/fallbackData.js`

### Offline / Fallback Mode

If the backend is unreachable:
- Model data falls back to `src/data/models.json`
- Prompt templates fall back to `src/data/templates.json`
- Chat shows a "service unavailable" message in the composer

---

## What's Missing (Gaps to Address)

1. **No retry logic** for non-auth API failures — failed chat messages and prompt generations are not retried
2. **No error boundary** at the React component tree level — an unhandled render error will white-screen the app
3. **No structured logging** on the frontend — errors are not sent to any observability service
4. **No alerting** on repeated 500 errors from the backend

Recommended additions:
- Add a React `ErrorBoundary` wrapper in `App.jsx` with a friendly fallback UI
- Integrate Sentry (or equivalent) for both frontend JS errors and backend exception tracking
