---
sidebar_position: 1
---

# Types Overview

Semantic Types provide AI-powered wrappers for JavaScript's structural and reference types, enabling intelligent operations on complex data structures.

## Available Types

| Type | Wrapper | Key Features |
|------|---------|--------------|
| `Array` | `SemanticArray<T>` | Semantic filtering, sorting, search, grouping |
| `Object` | `SemanticObject<T>` | Schema inference, field access, merging |
| `Map` | `SemanticMap<K,V>` | Semantic key lookup, purpose inference |
| `Set` | `SemanticSet<T>` | Theme detection, semantic membership |
| `Record` | `SemanticRecord<K,V>` | Key validation, grouping |
| `Date` | `SemanticDate` | Natural language parsing, period checking |
| `Error` | `SemanticError` | Root cause analysis, fix suggestions |
| `Promise` | `SemanticPromise<T>` | Retry logic, operation inference |
| `URL` | `SemanticURL` | Classification, validation |
| `Request/Response` | `SemanticFetch` | Security validation, intent detection |
| `RegExp` | `SemanticRegExp` | Pattern explanation, test generation |
| `Tuple` | `SemanticTuple` | Position meaning inference |
| `Function` | `SemanticCallable` | Signature inference, test generation |
| `unknown/never` | `SemanticUnknown/Never` | Type inference, exhaustiveness checking |

## Common Patterns

### Factory Pattern

All semantic types use a consistent `from()` factory method:

```typescript
// Sync creation
const arr = SemanticArray.from([1, 2, 3]);
const obj = SemanticObject.from({ name: "John" });

// Async creation (when parsing is needed)
const date = await SemanticDate.from("next Friday");
const url = await SemanticURL.from("github.com/user/repo");
```

### Accessing Raw Values

```typescript
const arr = SemanticArray.from([1, 2, 3]);
console.log(arr.valueOf()); // [1, 2, 3]

const date = await SemanticDate.from("tomorrow");
console.log(date.valueOf()); // Date object
```

### Generic Type Support

Most types support TypeScript generics:

```typescript
const numbers = SemanticArray.from<number>([1, 2, 3]);
const users = SemanticArray.from<User>(userList);

const config = SemanticObject.from<Config>(configData);
const lookup = SemanticMap.from<string, User>(userMap);
```

## Collection Types

### SemanticArray

```typescript
const items = SemanticArray.from(['apple', 'banana', 'cherry']);

// Natural language filtering
const fruits = await items.semanticFilter("red fruits");

// Semantic search
const results = await items.semanticSearch("tropical");

// Pattern detection
const patterns = await items.detectPatterns();
```

### SemanticObject

```typescript
const user = SemanticObject.from({
  name: "John Doe",
  email: "john@example.com"
});

// Semantic field access
const contact = await user.semanticGet("contact information");

// Schema inference
const schema = await user.inferSchema();
```

### SemanticMap & SemanticSet

```typescript
const cache = SemanticMap.from(new Map([['user_1', data]]));
const found = await cache.semanticGet("first user");

const tags = SemanticSet.from(new Set(['javascript', 'typescript']));
const hasProgramming = await tags.semanticHas("programming language");
```

## Date & Time

### SemanticDate

```typescript
// Natural language parsing
const date = await SemanticDate.from("next Monday at 3pm");
const deadline = await SemanticDate.from("end of Q2");

// Period checking
const isHoliday = await date.isInPeriod("Christmas season");

// Meaning inference
const meaning = await date.inferMeaning(); // "deadline", "appointment", etc.
```

## Error Handling

### SemanticError

```typescript
const error = SemanticError.from(new Error("Connection refused"));

// Root cause analysis
const cause = await error.inferRootCause();

// Fix suggestions
const fixes = await error.suggestFixes();

// Severity classification
const severity = await error.getSeverity();
```

## Async Operations

### SemanticPromise

```typescript
const promise = SemanticPromise.from(fetchData());

// Semantic timeout
const withTimeout = await promise.timeout(5000, "Data fetch timed out");

// Retry logic
const shouldRetry = await promise.shouldRetry();

// Operation inference
const operation = await promise.inferOperation();
```

## Network Types

### SemanticURL

```typescript
const url = await SemanticURL.from("https://api.example.com/users");

// Classification
const type = await url.classify(); // "api_endpoint"

// Validation
const valid = await url.validateFor("REST API endpoint");
```

### SemanticFetch (Request/Response/Headers)

```typescript
const request = SemanticRequest.from(new Request(url));

// Intent detection
const intent = await request.detectIntent();

// Security validation
const security = await request.validateSecurity();
```

## Pattern Matching

### SemanticRegExp

```typescript
const pattern = await SemanticRegExp.from("email addresses");

// Explanation
const explanation = pattern.testWithExplanation("test@example.com");

// Test case generation
const testCases = await pattern.generateTestCases();

// Simplification
const simpler = await pattern.simplify();
```

## Type Safety

### SemanticUnknown

```typescript
const data = SemanticUnknown.from(unknownValue);

// Type inference
const inferred = await data.inferType();

// Type guard generation
const guard = await data.generateTypeGuard();

// Shape validation
const valid = await data.validateShape("{ name: string, age: number }");
```

### SemanticNever

```typescript
// Exhaustiveness checking
const isExhaustive = await SemanticNever.isExhaustive(switchHandler);

// Dead code detection
const isDead = await SemanticNever.isDeadCode(codeBlock);
```

## Quick Reference

### Comparison

All types support `semanticallyEquals`:

```typescript
const result = await type1.semanticallyEquals(type2);
// { equivalent: boolean, confidence: number }
```

### Validation

Many types support `validate`:

```typescript
const result = await type.validate(rules);
// { valid: boolean, issues: string[] }
```

### Summary

Collection types support `summarize`:

```typescript
const summary = await collection.summarize();
// Human-readable summary string
```
