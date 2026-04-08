# API Integration

**Base URL:** `http://localhost:3000/api/v1` (dev) / configured via `VITE_API_URL` (prod)  
**Format:** JSON (application/json) or multipart/form-data for file uploads  
**Auth:** `Authorization: Bearer {accessToken}` on protected routes

---

## Response Envelope

All responses are wrapped by `TransformInterceptor`:

```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Errors from `GlobalExceptionFilter`:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Auth Endpoints

### POST `/auth/register`
```json
// Request
{ "name": "Alice", "email": "alice@example.com", "password": "secret123", "confirmPassword": "secret123" }

// Response
{ "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "user" }, "sessionId": "...", "accessToken": "...", "refreshToken": "..." }
```

### POST `/auth/login`
```json
// Request
{ "email": "alice@example.com", "password": "secret123" }

// Response
{ "user": { ... }, "sessionId": "...", "accessToken": "...", "refreshToken": "..." }
```

### POST `/auth/refresh`
```json
// Request (body or cookie)
{ "refreshToken": "..." }

// Response
{ "accessToken": "..." }
```

### POST `/auth/logout`
Headers: `Authorization: Bearer {token}`  
Response: `{ "success": true }`

### POST `/auth/guest`
```json
// Response
{ "sessionId": "guest_abc123", "guestToken": "..." }
```

### GET `/auth/me`
Headers: `Authorization: Bearer {token}`
```json
// Response
{ "user": { "id": "...", "name": "Alice", "email": "...", "role": "user", "preferences": { ... } } }
```

---

## Chat Endpoints

### POST `/chat/message`
```json
// JSON (no files)
{ "content": "Hello", "modelId": "gpt-4o", "sessionId": "...", "userId": "..." }

// Response
{
  "message": {
    "role": "assistant",
    "content": "...",
    "modelId": "gpt-4o",
    "tokens": 42,
    "timestamp": "..."
  }
}
```

With files: send as `multipart/form-data` with field `files[]`. Max 20 files, 150 MB total.

### POST `/chat/switch-model`
```json
// Request
{ "newModelId": "claude-opus-4", "sessionId": "..." }

// Response
{ "success": true, "model": "claude-opus-4" }
```

### GET `/chat/history?sessionId={id}`
```json
{
  "messages": [ { "role": "user", "content": "...", "modelId": "...", "tokens": 10, "timestamp": "..." } ],
  "activeModel": "gpt-4o",
  "modelHistory": ["gpt-4o", "claude-opus-4"]
}
```

### DELETE `/chat/history?sessionId={id}`
Response: `{ "success": true }`

---

## Prompts Endpoints

### POST `/prompts/generate`
```json
// Request
{
  "answers": { "useCase": "write_content", "audience": "beginner", "experience": "intermediate", "followUp": "blog posts" },
  "sessionId": "...",
  "userId": "..."
}

// Response
{
  "promptText": "You are an expert content writer...",
  "templateUsed": "content-writer-v1",
  "estimatedTokens": 128,
  "suggestedModels": ["gpt-4o", "claude-sonnet-4"],
  "promptId": "..."
}
```

### POST `/prompts/regenerate`
```json
// Request
{ "promptId": "...", "sessionId": "...", "userId": "...", "promptText": "Optional custom text", "answers": { ... } }

// Response
{ "promptText": "...", "estimatedTokens": 130, "promptId": "..." }
```

### PUT `/prompts/:promptId`
```json
// Request
{ "sessionId": "...", "promptText": "Updated text", "userId": "..." }

// Response
{ "promptId": "...", "promptText": "...", "estimatedTokens": 120, "suggestedModels": [...], "templateUsed": "..." }
```

### GET `/prompts/history?sessionId={id}`
```json
[
  {
    "promptText": "...",
    "modelRecommendations": ["gpt-4o"],
    "answers": { ... },
    "createdAt": "..."
  }
]
```

### DELETE `/prompts/:promptId?sessionId={id}`
Response: `{ "success": true }`

---

## Models Endpoints

### GET `/models`
Query params: `page`, `limit`, `category`, `lab`, `maxPrice`, `minRating`, `license`, `search`

```json
{
  "items": [ { "modelId": "gpt-4o", "name": "GPT-4o", "lab": "OpenAI", ... } ],
  "meta": { "page": 1, "limit": 24, "total": 27, "totalPages": 2 }
}
```

### GET `/models/:modelId`
Returns full model object plus `howToUseContent`:
```json
{
  "modelId": "gpt-4o",
  "name": "GPT-4o",
  "lab": "OpenAI",
  "contextWindow": 128000,
  "inputPricePer1M": 2.50,
  "outputPricePer1M": 10.00,
  "rating": 4.7,
  "howToUseContent": {
    "steps": ["Step 1...", "Step 2..."],
    "starterCode": "import openai...",
    "proTip": "...",
    "inputTypes": ["text", "images"],
    "outputTypes": ["text"]
  }
}
```

### POST `/models/recommend`
```json
// Request
{ "useCase": "code", "audience": "developer", "experience": "advanced", "sessionId": "..." }

// Response
{
  "recommendations": [
    { "model": { ... }, "score": 0.92, "reason": "Best for code generation tasks" }
  ]
}
```

### GET `/models/compare?ids=gpt-4o,claude-sonnet-4`
Returns array of full model objects for side-by-side comparison.

---

## Agents Endpoints

### GET `/agents/templates`
Returns array of `AgentTemplate` objects with `id`, `name`, `description`, `icon`, `systemPrompt`, `defaultModel`, etc.

### POST `/agents`
```json
// Request
{
  "sessionId": "...",
  "userId": "...",
  "name": "Research Bot",
  "modelId": "gpt-4o",
  "systemPrompt": "You are a research assistant...",
  "tone": "professional",
  "audience": "academics",
  "tools": ["web-search"],
  "memoryType": "none",
  "deployTarget": "api-endpoint"
}

// Response: full Agent object
```

### POST `/agents/:id/respond`
```json
// Request
{ "message": "What is quantum entanglement?" }

// Response
{ "agent": { ... }, "message": { "role": "assistant", "content": "..." } }
```

---

## Token Endpoints

### GET `/tokens/session/:sessionId`
```json
{
  "stats": [ { "agentName": "...", "actionType": "chat", "inputTokens": 50, "outputTokens": 80, ... } ],
  "totalTokens": 130,
  "totalCost": 0.0013,
  "byAgent": { "Research Bot": { "tokens": 130, "cost": 0.0013 } }
}
```

---

## Discover Endpoints

### GET `/discover/filters`
Returns available topic filters as string array.

### GET `/discover/feed?filter=ai-tools`
Returns array of `DiscoverItem` objects.

---

## Health

### GET `/health`
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Error Codes

| Status | Meaning |
|---|---|
| 400 | Validation error (bad request body) |
| 401 | Missing or invalid JWT |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Internal server error |

---

## External Integrations

Currently **none** — all AI responses are simulated. When integrating a real LLM:

- Chat: POST to OpenAI `/chat/completions` or Anthropic `/messages` from `ChatService.generateResponse()`
- Agents: POST to the same endpoint using the agent's `systemPrompt` as the system message
- Tokens: Use the actual `usage` field from the API response instead of `text.length / 4`
