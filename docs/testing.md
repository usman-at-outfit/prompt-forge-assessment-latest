# Testing

---

## Current State

The backend has a test setup bootstrapped via NestJS defaults (Jest). The frontend has no test configuration at this time.

```bash
# Run backend tests
cd promptforge-server && npm run test

# Run with coverage
cd promptforge-server && npm run test:cov

# Watch mode
cd promptforge-server && npm run test:watch
```

---

## Backend Test Setup

NestJS projects scaffold with Jest + `@nestjs/testing`. Test files follow the pattern `*.spec.ts`.

### Running a Module Test

```typescript
// Example: auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        // ... other providers
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash password on register', async () => {
    const result = await service.register({ name: 'Alice', email: 'a@b.com', password: '12345678', confirmPassword: '12345678' });
    expect(result.user.email).toBe('a@b.com');
  });
});
```

---

## Recommended Testing Strategy

### Backend Priority Areas

| Area | Test Type | Why |
|---|---|---|
| `AuthService` | Unit | Password hashing, token generation, validation |
| `SessionsService` | Unit | Guest/auth creation, merge logic, expiry |
| `PromptsService` | Unit | Template interpolation, token estimation |
| `ModelsService` | Unit | Recommendation algorithm, filter logic |
| `RuntimeStoreService` | Unit | Persistence, corruption recovery |
| Auth endpoints | E2E | Full register/login/refresh/logout cycle |
| Chat endpoint | E2E | Message creation + file extraction |

### Frontend Priority Areas

| Area | Test Type | Tooling |
|---|---|---|
| `authStore` actions | Unit | Vitest + msw |
| `useSession` hook | Unit | Vitest + @testing-library/react |
| `ChatWindow` rendering | Component | @testing-library/react |
| `AuthGuard` redirect | Component | @testing-library/react + React Router |
| Login flow (E2E) | E2E | Playwright |

---

## Suggested Tooling

### Backend
- **Jest** (already configured via NestJS)
- **Supertest** for HTTP-level E2E tests
- **mongodb-memory-server** for Mongoose integration tests without a real database

### Frontend
- **Vitest** (compatible with Vite; drop-in Jest replacement)
- **@testing-library/react** for component tests
- **msw** (Mock Service Worker) for API mocking
- **Playwright** for full E2E flows

---

## Test Coverage Gaps

The following critical paths have no test coverage:

1. Session merge on guest → auth login
2. Token refresh + retry on 401
3. Prompt template interpolation with edge-case answers
4. Runtime store corruption recovery
5. File extraction (PDF, DOCX) in `ChatFileExtractor`
6. Model recommendation scoring algorithm

These should be the first areas covered when adding tests.

---

## Setting Up Frontend Tests (Vitest)

```bash
cd promptforge-client
npm install -D vitest @testing-library/react @testing-library/user-event jsdom msw
```

Add to `vite.config.js`:

```js
export default defineConfig({
  // ...
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
```

Add test script to `package.json`:

```json
"scripts": {
  "test": "vitest"
}
```
