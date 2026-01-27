---
sidebar_position: 11
---

# SemanticFetch

`SemanticRequest`, `SemanticResponse`, and `SemanticHeaders` provide intelligent wrappers for the Fetch API with intent detection, security validation, and contract verification.

## SemanticRequest

### Creating a SemanticRequest

```typescript
import { SemanticRequest } from 'semantic-primitives';

const request = SemanticRequest.from(new Request('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
}));
```

### Methods

#### semanticallyEquals

```typescript
const req1 = SemanticRequest.from(new Request('/api/users', { method: 'GET' }));
const req2 = SemanticRequest.from(new Request('/api/users/', { method: 'GET' }));

const result = await req1.semanticallyEquals(req2);
// { equivalent: true, confidence: 0.98 }
```

#### detectIntent

```typescript
const request = SemanticRequest.from(new Request('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
}));

const intent = await request.detectIntent();
// {
//   intent: 'create',
//   resource: 'user',
//   action: 'user_registration',
//   confidence: 0.94
// }
```

#### validateSecurity

```typescript
const request = SemanticRequest.from(new Request('http://api.example.com/login', {
  method: 'POST',
  body: JSON.stringify({ username: 'user', password: 'pass' })
}));

const security = await request.validateSecurity();
// {
//   secure: false,
//   issues: [
//     'Request uses HTTP instead of HTTPS',
//     'Sending credentials over insecure connection'
//   ],
//   severity: 'high'
// }
```

#### createFilter

```typescript
const request = SemanticRequest.from(new Request('/api/products?category=electronics'));

const filter = await request.createFilter();
// {
//   type: 'query_filter',
//   filters: { category: 'electronics' },
//   suggestedSQL: "WHERE category = 'electronics'"
// }
```

## SemanticResponse

### Creating a SemanticResponse

```typescript
import { SemanticResponse } from 'semantic-primitives';

const response = SemanticResponse.from(new Response(
  JSON.stringify({ users: [] }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
));
```

### Methods

#### analyze

```typescript
const response = SemanticResponse.from(await fetch('/api/users'));

const analysis = await response.analyze();
// {
//   status: 'success',
//   dataType: 'user_list',
//   isEmpty: false,
//   pagination: { hasMore: true, nextPage: 2 }
// }
```

#### interpretError

```typescript
const response = SemanticResponse.from(new Response(
  JSON.stringify({ error: 'Rate limit exceeded' }),
  { status: 429 }
));

const interpretation = await response.interpretError();
// {
//   errorType: 'rate_limit',
//   message: 'Too many requests',
//   retryAfter: 60,
//   suggestion: 'Implement exponential backoff'
// }
```

#### validateContract

```typescript
const response = SemanticResponse.from(await fetch('/api/users'));

const validation = await response.validateContract({
  expectedStatus: [200],
  requiredFields: ['id', 'name', 'email'],
  contentType: 'application/json'
});
// {
//   valid: true,
//   contractViolations: []
// }
```

## SemanticHeaders

### Creating SemanticHeaders

```typescript
import { SemanticHeaders } from 'semantic-primitives';

const headers = SemanticHeaders.from(new Headers({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token123',
  'X-Request-ID': 'abc-123'
}));
```

### Methods

#### semanticallyEquals

```typescript
const h1 = SemanticHeaders.from(new Headers({ 'content-type': 'application/json' }));
const h2 = SemanticHeaders.from(new Headers({ 'Content-Type': 'application/json' }));

const result = await h1.semanticallyEquals(h2);
// { equivalent: true, confidence: 1.0 }
```

#### validate

```typescript
const headers = SemanticHeaders.from(new Headers({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token'
}));

const validation = await headers.validate();
// {
//   valid: true,
//   issues: [],
//   warnings: ['Authorization header present - ensure token is not logged']
// }
```

#### suggestHeaders

```typescript
const headers = SemanticHeaders.from(new Headers({
  'Content-Type': 'application/json'
}));

const suggestions = await headers.suggestHeaders();
// [
//   { header: 'Accept', value: 'application/json', reason: 'Match content type' },
//   { header: 'Cache-Control', value: 'no-cache', reason: 'Prevent caching of API responses' }
// ]
```

#### getIssues

```typescript
const headers = SemanticHeaders.from(new Headers({
  'Access-Control-Allow-Origin': '*',
  'X-Powered-By': 'Express'
}));

const issues = await headers.getIssues();
// [
//   { header: 'Access-Control-Allow-Origin', issue: 'Wildcard CORS is insecure', severity: 'high' },
//   { header: 'X-Powered-By', issue: 'Reveals server technology', severity: 'medium' }
// ]
```

## Examples

### API Request Builder

```typescript
async function buildSecureRequest(
  url: string,
  method: string,
  data?: unknown
) {
  const request = SemanticRequest.from(new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  }));

  // Validate security
  const security = await request.validateSecurity();
  if (!security.secure) {
    throw new Error(`Security issues: ${security.issues.join(', ')}`);
  }

  // Detect intent for logging
  const intent = await request.detectIntent();
  console.log(`[${intent.action}] ${method} ${url}`);

  return request.valueOf();
}
```

### Response Handler

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  const semantic = SemanticResponse.from(response);

  if (!response.ok) {
    const error = await semantic.interpretError();
    throw new Error(`${error.errorType}: ${error.message}`);
  }

  const validation = await semantic.validateContract({
    expectedStatus: [200, 201],
    contentType: 'application/json'
  });

  if (!validation.valid) {
    console.warn('Contract violations:', validation.contractViolations);
  }

  return response.json();
}
```

### Security Middleware

```typescript
async function securityMiddleware(request: Request): Promise<Request> {
  const semantic = SemanticRequest.from(request);
  const headers = SemanticHeaders.from(request.headers);

  // Check request security
  const requestSecurity = await semantic.validateSecurity();
  if (requestSecurity.severity === 'high') {
    throw new Error('Request blocked due to security concerns');
  }

  // Check headers
  const headerIssues = await headers.getIssues();
  const criticalIssues = headerIssues.filter(i => i.severity === 'high');

  if (criticalIssues.length > 0) {
    throw new Error(`Header security issues: ${criticalIssues.map(i => i.issue).join(', ')}`);
  }

  return request;
}
```
