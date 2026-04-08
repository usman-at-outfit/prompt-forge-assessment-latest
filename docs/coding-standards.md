# Coding Standards

Conventions observed in and recommended for this codebase.

---

## General

- **Language**: JavaScript (frontend), TypeScript (backend)
- **Style**: No enforced linter/formatter config currently — ESLint + Prettier are recommended additions
- **Comments**: Only where logic is non-obvious. Avoid restating what the code already says.
- **Naming**: Descriptive names over abbreviations. `sessionId` not `sid`. `isAuthenticated` not `auth`.

---

## Frontend (React)

### File & Component Naming

| Type | Convention | Example |
|---|---|---|
| Component file | PascalCase | `ModelCard.jsx` |
| Utility file | camelCase | `tokenCounter.js` |
| Store file | camelCase + `Store` suffix | `authStore.js` |
| Service file | camelCase + `Service` suffix | `authService.js` |
| Hook file | camelCase + `use` prefix | `useSession.js` |

### Components

- One component per file
- Props are destructured at the function signature
- Avoid inline object/array literals as props (causes unnecessary re-renders)
- Use `React.memo` only when profiling shows a real performance problem

```jsx
// Good
const ModelCard = ({ model, onSelect }) => { ... };

// Avoid
const ModelCard = (props) => {
  const { model, onSelect } = props;
  ...
};
```

### State & Side Effects

- Use Zustand stores for shared/cross-component state
- Use `useState` for local UI state (open/closed, hover, form field values before submission)
- Keep `useEffect` dependencies accurate — no empty deps arrays unless truly mount-only
- Side effects that need cleanup (timers, subscriptions) must return a cleanup function

### Zustand Stores

- Always use selector pattern: `const user = useAuthStore(s => s.user)`
- Do not subscribe to entire store state — it causes re-renders on every store mutation
- Actions that call the API should set `isLoading`, catch errors into `error`, and reset in `finally`

### Services

- Services only make HTTP calls and return data — no business logic
- Error handling is the caller's responsibility (store action)
- Never import a store inside a service — services are stateless

### CSS / Styling

- TailwindCSS utility classes only — no inline `style={}` except for dynamic values that Tailwind cannot express
- Use Tailwind `@layer components` for shared repeated patterns if needed
- Dark mode: the app defaults to dark theme; use `dark:` variants where applicable

---

## Backend (NestJS / TypeScript)

### File Structure

NestJS module convention: one folder per module, each containing `controller`, `service`, `module`, `dto/`, and `schemas/`.

| File type | Convention |
|---|---|
| Controller | `feature.controller.ts` |
| Service | `feature.service.ts` |
| Module | `feature.module.ts` |
| DTO | `create-feature.dto.ts`, `update-feature.dto.ts` |
| Schema | `feature.schema.ts` |
| Guard | `feature.guard.ts` |
| Decorator | `feature.decorator.ts` |

### DTOs

- Use `class-validator` decorators on all DTOs
- DTOs define the contract for request bodies — keep them strict
- Use `@IsOptional()` only when a field is genuinely optional, not to silence validation

```typescript
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Services

- Services contain all business logic
- Controllers only receive requests, call services, and return responses
- Throw NestJS `HttpException` subclasses (`NotFoundException`, `UnauthorizedException`, etc.) from services — not plain `Error`

### Error Handling

```typescript
// Good — NestJS exception
throw new NotFoundException(`Session ${sessionId} not found`);

// Avoid — plain Error reaches GlobalExceptionFilter as 500
throw new Error('Session not found');
```

### Async / Await

- All async operations use `async/await`, not `.then()/.catch()` chains
- Always `await` Mongoose queries — do not return pending promises unintentionally

### TypeScript

- Enable `strict` mode (already in `tsconfig.json`)
- Avoid `any` — use `unknown` + type guards, or define an interface
- Use `readonly` on DTO properties that should not be mutated after construction

---

## Git Conventions

- **Branch names**: `feature/short-description`, `fix/issue-description`
- **Commit messages**: Imperative mood, present tense — `Add session merge logic`, not `Added session merge logic`
- **Do not commit**:
  - `.env` files
  - `data/runtime-store.json`
  - `dist/` directories
  - `node_modules/`

---

## What to Add

1. **ESLint** — `@typescript-eslint/recommended` for backend; `eslint-plugin-react-hooks` for frontend
2. **Prettier** — consistent formatting, especially around trailing commas and quote style
3. **Husky + lint-staged** — enforce linting before commits
4. **TypeScript on frontend** — migrate `.jsx` to `.tsx` for full type coverage
