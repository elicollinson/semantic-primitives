---
sidebar_position: 9
---

# SemanticPromise

`SemanticPromise<T>` wraps native Promises with intelligent timeout handling, retry logic, operation inference, and semantic error handling.

## Creating a SemanticPromise

```typescript
import { SemanticPromise } from 'semantic-primitives';

const promise = SemanticPromise.from(fetchUserData());
const apiCall = SemanticPromise.from(fetch('https://api.example.com'));
```

## Methods

### semanticallyEquals

Compare promise results semantically.

```typescript
const p1 = SemanticPromise.from(Promise.resolve({ status: 'ok' }));
const p2 = SemanticPromise.from(Promise.resolve({ status: 'success' }));

const result = await p1.semanticallyEquals(p2);
// { equivalent: true, confidence: 0.88 }
```

### timeout

Add semantic timeout with contextual error message.

```typescript
const promise = SemanticPromise.from(longRunningOperation());

const result = await promise.timeout(5000, "Data processing");
// If timeout: throws Error("Data processing timed out after 5000ms")
```

### catchSemantic

Handle errors with semantic understanding.

```typescript
const promise = SemanticPromise.from(apiCall());

const result = await promise.catchSemantic(async (error, semantic) => {
  const classification = await semantic.classify();

  if (classification.category === 'network_error') {
    return fallbackData;
  }

  if (classification.category === 'rate_limit') {
    await delay(1000);
    return retry();
  }

  throw error;
});
```

### shouldRetry

Determine if the failed promise should be retried.

```typescript
try {
  await apiCall();
} catch (e) {
  const promise = SemanticPromise.from(Promise.reject(e));
  const retry = await promise.shouldRetry();
  // {
  //   shouldRetry: true,
  //   reason: "Transient network error",
  //   suggestedDelay: 1000,
  //   maxRetries: 3
  // }
}
```

### transform

Transform the result with semantic understanding.

```typescript
const promise = SemanticPromise.from(fetchRawData());

const transformed = await promise.transform("extract user information");
// Automatically extracts and structures user data from raw response
```

### validate

Validate the promise result against rules.

```typescript
const promise = SemanticPromise.from(fetchUserData());

const result = await promise.validate([
  "result must have user id",
  "email must be valid format",
  "age must be positive number"
]);
// { valid: true, issues: [] }
```

### shouldUseFallback

Determine if fallback should be used.

```typescript
try {
  await primaryApiCall();
} catch (e) {
  const promise = SemanticPromise.from(Promise.reject(e));
  const fallback = await promise.shouldUseFallback();
  // {
  //   useFallback: true,
  //   reason: "Primary service unavailable",
  //   fallbackType: "cached_data"
  // }
}
```

### inferOperation

Detect what operation the promise represents.

```typescript
const promise = SemanticPromise.from(
  fetch('https://api.example.com/users', { method: 'POST', body: userData })
);

const operation = await promise.inferOperation();
// {
//   operation: 'create',
//   resource: 'user',
//   method: 'POST',
//   confidence: 0.95
// }
```

### createLoggingMessage

Generate an appropriate log message.

```typescript
const promise = SemanticPromise.from(databaseQuery());

const logMessage = await promise.createLoggingMessage();
// "Executing database query for user retrieval"
```

## Implemented Interfaces

- `Comparable` - Semantic comparison
- `Explainable` - Human-readable explanations

## Examples

### Resilient API Client

```typescript
async function resilientFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const promise = SemanticPromise.from(fetch(url, options));

  return promise
    .timeout(10000, `API call to ${url}`)
    .catchSemantic(async (error, semantic) => {
      const shouldRetry = await semantic.shouldRetry();

      if (shouldRetry.shouldRetry) {
        await delay(shouldRetry.suggestedDelay);
        return resilientFetch<T>(url, options);
      }

      const fallback = await semantic.shouldUseFallback();
      if (fallback.useFallback) {
        return getCachedData<T>(url);
      }

      throw error;
    })
    .then(response => response.json());
}
```

### Operation Logging

```typescript
async function loggedOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  const promise = SemanticPromise.from(operation());

  const operationType = await promise.inferOperation();
  const logMessage = await promise.createLoggingMessage();

  console.log(`[${operationType.operation}] ${logMessage}`);

  const startTime = Date.now();

  try {
    const result = await promise;
    console.log(`[SUCCESS] ${context} completed in ${Date.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error(`[FAILURE] ${context} failed after ${Date.now() - startTime}ms`);
    throw error;
  }
}
```

### Validated Data Fetching

```typescript
async function fetchValidatedUser(userId: string) {
  const promise = SemanticPromise.from(
    fetch(`/api/users/${userId}`).then(r => r.json())
  );

  const validation = await promise.validate([
    "must have id matching request",
    "must have valid email",
    "must have name field"
  ]);

  if (!validation.valid) {
    throw new Error(`Invalid user data: ${validation.issues.join(', ')}`);
  }

  return promise;
}
```

### Intelligent Retry Wrapper

```typescript
async function withIntelligentRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const promise = SemanticPromise.from(fn());
      return await promise.timeout(30000, context);
    } catch (error) {
      attempts++;

      const errorPromise = SemanticPromise.from(Promise.reject(error));
      const retryInfo = await errorPromise.shouldRetry();

      if (!retryInfo.shouldRetry || attempts >= maxAttempts) {
        throw error;
      }

      console.log(`Retry ${attempts}/${maxAttempts}: ${retryInfo.reason}`);
      await delay(retryInfo.suggestedDelay * attempts);
    }
  }

  throw new Error(`Max retries exceeded for: ${context}`);
}
```
