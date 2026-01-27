---
sidebar_position: 6
---

# SemanticRecord

`SemanticRecord<K, V>` wraps TypeScript's `Record` type with semantic key lookup, validation, filtering, and grouping capabilities.

## Creating a SemanticRecord

```typescript
import { SemanticRecord } from 'semantic-primitives';

const users = SemanticRecord.from<string, User>({
  'user_1': { name: 'John', role: 'admin' },
  'user_2': { name: 'Jane', role: 'editor' }
});

const config = SemanticRecord.from({
  timeout: 5000,
  retries: 3,
  debug: false
});
```

## Methods

### semanticallyEquals

Compare two records by semantic meaning.

```typescript
const rec1 = SemanticRecord.from({
  firstName: 'John',
  lastName: 'Doe'
});

const rec2 = SemanticRecord.from({
  first_name: 'John',
  last_name: 'Doe'
});

const result = await rec1.semanticallyEquals(rec2);
// { equivalent: true, confidence: 0.94, mappings: {...} }
```

### semanticGet

Find values by semantic key description.

```typescript
const settings = SemanticRecord.from({
  connectionTimeoutMs: 5000,
  maxRetryAttempts: 3,
  enableDebugMode: false
});

const timeout = await settings.semanticGet("timeout setting");
// { value: 5000, key: 'connectionTimeoutMs', confidence: 0.93 }
```

### validateKeys

Validate key naming conventions.

```typescript
const record = SemanticRecord.from({
  user_name: 'John',
  UserAge: 30,
  'email-address': 'john@example.com'
});

const result = await record.validateKeys([
  "should use consistent naming convention",
  "should be camelCase"
]);
// {
//   valid: false,
//   issues: [
//     "Keys use mixed conventions: snake_case, PascalCase, kebab-case",
//     "'user_name' should be 'userName'",
//     "'UserAge' should be 'userAge'"
//   ]
// }
```

### validateValues

Validate record values against rules.

```typescript
const userRecord = SemanticRecord.from({
  admin: { name: 'Admin', permissions: ['all'] },
  guest: { name: '', permissions: [] }
});

const result = await userRecord.validateValues([
  "all entries should have non-empty names",
  "all entries should have at least one permission"
]);
// {
//   valid: false,
//   issues: [
//     "Entry 'guest' has empty name",
//     "Entry 'guest' has no permissions"
//   ]
// }
```

### inferPurpose

Detect the purpose of the record.

```typescript
const data = SemanticRecord.from({
  'en-US': 'Hello',
  'es-ES': 'Hola',
  'fr-FR': 'Bonjour'
});

const purpose = await data.inferPurpose();
// {
//   purpose: 'localization',
//   category: 'translations',
//   confidence: 0.97
// }
```

### semanticFilter

Filter entries using natural language criteria.

```typescript
const products = SemanticRecord.from({
  laptop_1: { name: 'MacBook Pro', price: 2499, category: 'electronics' },
  phone_1: { name: 'iPhone', price: 999, category: 'electronics' },
  chair_1: { name: 'Office Chair', price: 299, category: 'furniture' }
});

const electronics = await products.semanticFilter("electronic devices");
// { laptop_1: {...}, phone_1: {...} }
```

### suggestMissingKeys

Get recommendations for missing keys.

```typescript
const apiConfig = SemanticRecord.from({
  baseUrl: 'https://api.example.com',
  timeout: 5000
});

const suggestions = await apiConfig.suggestMissingKeys();
// [
//   { key: 'apiKey', reason: 'API configurations typically require authentication' },
//   { key: 'retries', reason: 'Retry logic is common for API calls' }
// ]
```

### groupBy

Group entries by semantic criteria.

```typescript
const tasks = SemanticRecord.from({
  task_1: { title: 'Fix bug', priority: 'high' },
  task_2: { title: 'Add feature', priority: 'medium' },
  task_3: { title: 'Update docs', priority: 'low' },
  task_4: { title: 'Security patch', priority: 'critical' }
});

const grouped = await tasks.groupBy("priority level");
// {
//   critical: { task_4: {...} },
//   high: { task_1: {...} },
//   medium: { task_2: {...} },
//   low: { task_3: {...} }
// }
```

## Implemented Interfaces

- `Semantic<Record<K, V>>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Rule-based validation
- `PurposeInferable` - Purpose detection
- `SemanticFilterable` - Natural language filtering

## Examples

### Configuration Validation

```typescript
async function validateConfig(config: Record<string, unknown>) {
  const record = SemanticRecord.from(config);

  // Validate key naming
  const keyValidation = await record.validateKeys([
    "should use camelCase",
    "should be descriptive"
  ]);

  // Check for missing settings
  const missing = await record.suggestMissingKeys();

  // Infer config purpose
  const purpose = await record.inferPurpose();

  return {
    valid: keyValidation.valid,
    keyIssues: keyValidation.issues,
    missingSuggestions: missing,
    configType: purpose.purpose
  };
}
```

### User Permissions Management

```typescript
async function filterUsersByAccess(
  users: Record<string, User>,
  accessLevel: string
) {
  const record = SemanticRecord.from(users);

  const filtered = await record.semanticFilter(`users with ${accessLevel} access`);

  return filtered.valueOf();
}

// Usage
const users = {
  admin_1: { name: 'Admin', role: 'superadmin' },
  editor_1: { name: 'Editor', role: 'content_editor' },
  viewer_1: { name: 'Viewer', role: 'readonly' }
};

await filterUsersByAccess(users, "administrative");
// { admin_1: { name: 'Admin', role: 'superadmin' } }
```

### Data Transformation Pipeline

```typescript
async function transformRecord(
  input: Record<string, unknown>,
  targetConvention: string
) {
  const record = SemanticRecord.from(input);

  // Validate current structure
  const validation = await record.validateKeys(["should be valid identifiers"]);

  if (!validation.valid) {
    console.warn('Input has key issues:', validation.issues);
  }

  // Purpose detection for context
  const purpose = await record.inferPurpose();

  return {
    original: input,
    purpose: purpose.purpose,
    validation
  };
}
```

### API Response Grouping

```typescript
async function groupApiResults(
  results: Record<string, ApiResult>,
  groupingCriteria: string
) {
  const record = SemanticRecord.from(results);

  const grouped = await record.groupBy(groupingCriteria);

  return Object.entries(grouped).map(([group, items]) => ({
    group,
    count: Object.keys(items).length,
    items
  }));
}

// Usage
const results = {
  req_1: { status: 200, duration: 100 },
  req_2: { status: 500, duration: 50 },
  req_3: { status: 200, duration: 200 },
  req_4: { status: 404, duration: 30 }
};

await groupApiResults(results, "HTTP status category");
// [
//   { group: 'Success', count: 2, items: {...} },
//   { group: 'Server Error', count: 1, items: {...} },
//   { group: 'Client Error', count: 1, items: {...} }
// ]
```
