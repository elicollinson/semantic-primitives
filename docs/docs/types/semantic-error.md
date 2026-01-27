---
sidebar_position: 8
---

# SemanticError

`SemanticError` wraps native JavaScript errors with intelligent analysis, root cause detection, fix suggestions, and severity classification.

## Creating a SemanticError

```typescript
import { SemanticError } from 'semantic-primitives';

const error = SemanticError.from(new Error("Connection refused"));

// From caught error
try {
  await fetch('https://api.example.com');
} catch (e) {
  const semantic = SemanticError.from(e as Error);
}
```

## Methods

### semanticallyEquals

Compare errors by meaning.

```typescript
const err1 = SemanticError.from(new Error("Connection timed out"));
const err2 = SemanticError.from(new Error("Request timeout exceeded"));

const result = await err1.semanticallyEquals(err2);
// { equivalent: true, confidence: 0.91 }
```

### explain

Get a human-readable explanation.

```typescript
const error = SemanticError.from(new Error("ECONNREFUSED 127.0.0.1:5432"));

const explanation = await error.explain();
// "The database connection was refused. This typically means the database server
//  is not running or is not accepting connections on port 5432."
```

### classify

Categorize the error type.

```typescript
const error = SemanticError.from(new Error("Invalid JSON: unexpected token"));

const result = await error.classify();
// {
//   category: 'parse_error',
//   subcategory: 'json_syntax',
//   confidence: 0.96
// }
```

### inferRootCause

Analyze the likely root cause.

```typescript
const error = SemanticError.from(
  new Error("Cannot read property 'map' of undefined")
);

const cause = await error.inferRootCause();
// {
//   cause: "Attempting to call array method on undefined value",
//   likelySources: [
//     "API response returned null/undefined instead of array",
//     "Variable not initialized before use",
//     "Async data not yet loaded"
//   ],
//   confidence: 0.89
// }
```

### suggestFixes

Get recommended fixes.

```typescript
const error = SemanticError.from(
  new Error("Module not found: 'lodash'")
);

const fixes = await error.suggestFixes();
// [
//   {
//     fix: "Install the missing package",
//     explanation: "The lodash package is not installed",
//     steps: ["npm install lodash", "or: yarn add lodash"]
//   },
//   {
//     fix: "Check the import path",
//     explanation: "Verify the module name is spelled correctly",
//     steps: ["Check package.json for the correct package name"]
//   }
// ]
```

### matchesPattern

Check if error matches a known pattern.

```typescript
const error = SemanticError.from(new Error("401 Unauthorized"));

const isAuthError = await error.matchesPattern("authentication failure");
// true

const isNetworkError = await error.matchesPattern("network connectivity");
// false
```

### getResources

Get links to helpful resources.

```typescript
const error = SemanticError.from(
  new Error("CORS policy blocked the request")
);

const resources = await error.getResources();
// [
//   { type: 'documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', title: 'MDN CORS Guide' },
//   { type: 'stackoverflow', url: '...', title: 'How to fix CORS errors' }
// ]
```

### shouldReport

Determine if error should be reported/logged.

```typescript
const error = SemanticError.from(new Error("User cancelled operation"));

const result = await error.shouldReport();
// {
//   shouldReport: false,
//   reason: "User-initiated cancellation is expected behavior"
// }

const criticalError = SemanticError.from(new Error("Database corruption detected"));
const result2 = await criticalError.shouldReport();
// {
//   shouldReport: true,
//   reason: "Data integrity issue requires immediate attention",
//   priority: 'critical'
// }
```

### getRecoveryStrategy

Get suggested recovery approach.

```typescript
const error = SemanticError.from(new Error("Rate limit exceeded"));

const strategy = await error.getRecoveryStrategy();
// {
//   strategy: 'exponential_backoff',
//   steps: [
//     'Wait for the retry-after header duration',
//     'Implement exponential backoff starting at 1 second',
//     'Maximum retry attempts: 3'
//   ],
//   timeEstimate: '5-30 seconds'
// }
```

### getSeverity

Classify error severity.

```typescript
const error = SemanticError.from(new Error("Failed to save user preferences"));

const severity = await error.getSeverity();
// {
//   level: 'medium',
//   impact: 'User experience degraded but core functionality intact',
//   requiresImmediate: false
// }
```

## Implemented Interfaces

- `Comparable` - Semantic comparison
- `Explainable` - Human-readable explanations
- `Classifiable` - Category classification
- `SemanticErrorType` - Error-specific operations

## Examples

### Global Error Handler

```typescript
async function handleError(error: Error) {
  const semantic = SemanticError.from(error);

  const [classification, severity, shouldReport] = await Promise.all([
    semantic.classify(),
    semantic.getSeverity(),
    semantic.shouldReport()
  ]);

  // Log based on severity
  if (severity.level === 'critical') {
    console.error('CRITICAL:', await semantic.explain());
    alertOncall(error);
  } else if (shouldReport.shouldReport) {
    console.error(await semantic.explain());
  }

  // Get recovery strategy
  const recovery = await semantic.getRecoveryStrategy();

  return {
    category: classification.category,
    severity: severity.level,
    explanation: await semantic.explain(),
    recovery
  };
}
```

### Error Documentation Generator

```typescript
async function documentError(error: Error) {
  const semantic = SemanticError.from(error);

  const [
    explanation,
    classification,
    rootCause,
    fixes,
    resources
  ] = await Promise.all([
    semantic.explain(),
    semantic.classify(),
    semantic.inferRootCause(),
    semantic.suggestFixes(),
    semantic.getResources()
  ]);

  return `
## Error: ${error.message}

### Category
${classification.category} > ${classification.subcategory}

### Explanation
${explanation}

### Root Cause
${rootCause.cause}

Likely sources:
${rootCause.likelySources.map(s => `- ${s}`).join('\n')}

### Suggested Fixes
${fixes.map(f => `
#### ${f.fix}
${f.explanation}

Steps:
${f.steps.map(s => `1. ${s}`).join('\n')}
`).join('\n')}

### Resources
${resources.map(r => `- [${r.title}](${r.url})`).join('\n')}
  `;
}
```

### Intelligent Retry Logic

```typescript
async function withSemanticRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      const semantic = SemanticError.from(lastError);

      const shouldRetry = await semantic.shouldRetry?.() ?? { shouldRetry: false };

      if (!shouldRetry.shouldRetry) {
        throw lastError;
      }

      const recovery = await semantic.getRecoveryStrategy();

      if (recovery.strategy === 'exponential_backoff') {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

### Error Aggregation

```typescript
async function categorizeErrors(errors: Error[]) {
  const categories: Record<string, Error[]> = {};

  for (const error of errors) {
    const semantic = SemanticError.from(error);
    const classification = await semantic.classify();

    const key = `${classification.category}:${classification.subcategory}`;
    if (!categories[key]) {
      categories[key] = [];
    }
    categories[key].push(error);
  }

  return Object.entries(categories).map(([key, errs]) => ({
    category: key,
    count: errs.length,
    sample: errs[0].message
  }));
}
```
