---
sidebar_position: 4
---

# SemanticMap

`SemanticMap<K, V>` wraps the native `Map` type with semantic key lookup, purpose inference, and intelligent key-value operations.

## Creating a SemanticMap

```typescript
import { SemanticMap } from 'semantic-primitives';

const map = SemanticMap.from(new Map([
  ['user_1', { name: 'John' }],
  ['user_2', { name: 'Jane' }]
]));

// From object
const fromObj = SemanticMap.from(new Map(Object.entries({
  config_timeout: 5000,
  config_retries: 3
})));
```

## Methods

### semanticallyEquals

Compare two maps by semantic meaning.

```typescript
const map1 = SemanticMap.from(new Map([
  ['firstName', 'John'],
  ['lastName', 'Doe']
]));

const map2 = SemanticMap.from(new Map([
  ['first_name', 'John'],
  ['last_name', 'Doe']
]));

const result = await map1.semanticallyEquals(map2);
// {
//   equivalent: true,
//   confidence: 0.93,
//   mappings: { 'firstName': 'first_name', 'lastName': 'last_name' }
// }
```

### semanticGet

Find values by semantic key description.

```typescript
const config = SemanticMap.from(new Map([
  ['db_connection_timeout', 5000],
  ['api_rate_limit', 100],
  ['cache_ttl_seconds', 3600]
]));

const timeout = await config.semanticGet("database timeout setting");
// { value: 5000, key: 'db_connection_timeout', confidence: 0.95 }

const caching = await config.semanticGet("how long to cache");
// { value: 3600, key: 'cache_ttl_seconds', confidence: 0.91 }
```

### findKey

Find keys matching criteria.

```typescript
const translations = SemanticMap.from(new Map([
  ['greeting_en', 'Hello'],
  ['greeting_es', 'Hola'],
  ['farewell_en', 'Goodbye'],
  ['farewell_es', 'Adiós']
]));

const spanishKeys = await translations.findKey("Spanish translations");
// ['greeting_es', 'farewell_es']
```

### findValue

Find values matching criteria.

```typescript
const settings = SemanticMap.from(new Map([
  ['timeout', 5000],
  ['retries', 3],
  ['debug', true],
  ['logLevel', 'info']
]));

const numeric = await settings.findValue("numeric configuration values");
// [5000, 3]
```

### validate

Validate map entries against rules.

```typescript
const userRoles = SemanticMap.from(new Map([
  ['admin_user', 'superadmin'],
  ['regular_user', 'viewer'],
  ['test', 'unknown_role']
]));

const result = await userRoles.validate([
  "keys should follow user naming convention",
  "values should be valid role names"
]);
// {
//   valid: false,
//   issues: [
//     "Key 'test' doesn't follow naming convention",
//     "Value 'unknown_role' is not a recognized role"
//   ]
// }
```

### suggestMissingKeys

Get recommendations for missing keys.

```typescript
const dbConfig = SemanticMap.from(new Map([
  ['host', 'localhost'],
  ['port', 5432]
]));

const suggestions = await dbConfig.suggestMissingKeys();
// [
//   { key: 'database', reason: 'Database name is typically required' },
//   { key: 'username', reason: 'Authentication usually needs username' },
//   { key: 'password', reason: 'Authentication usually needs password' }
// ]
```

### inferPurpose

Detect the purpose of the map.

```typescript
const data = SemanticMap.from(new Map([
  ['en', 'Hello'],
  ['es', 'Hola'],
  ['fr', 'Bonjour'],
  ['de', 'Hallo']
]));

const purpose = await data.inferPurpose();
// {
//   purpose: 'internationalization',
//   category: 'translation',
//   subcategory: 'greeting_localization',
//   confidence: 0.96
// }
```

## Implemented Interfaces

- `Semantic<Map<K, V>>` - Base semantic interface
- `Comparable` - Semantic comparison
- `SemanticKeyValueCollection` - Key-value operations
- `SemanticAccessible` - Semantic access
- `PurposeInferable` - Purpose detection

## Examples

### Configuration Management

```typescript
async function loadConfig(rawConfig: Map<string, unknown>) {
  const config = SemanticMap.from(rawConfig);

  // Validate configuration
  const validation = await config.validate([
    "must have database connection settings",
    "must have valid timeout values",
    "sensitive values should be environment variables"
  ]);

  if (!validation.valid) {
    throw new Error(`Invalid config: ${validation.issues.join(', ')}`);
  }

  // Check for missing recommended settings
  const missing = await config.suggestMissingKeys();
  if (missing.length > 0) {
    console.warn('Missing recommended settings:', missing);
  }

  return config.valueOf();
}
```

### Localization Lookup

```typescript
async function getTranslation(
  translations: Map<string, string>,
  key: string,
  fallbackLocale: string = 'en'
) {
  const map = SemanticMap.from(translations);

  // Try semantic lookup first
  const result = await map.semanticGet(key);

  if (result.confidence > 0.9) {
    return result.value;
  }

  // Fall back to default locale
  const fallback = await map.semanticGet(`${key} in ${fallbackLocale}`);
  return fallback.value;
}
```

### Feature Flag System

```typescript
async function evaluateFeatureFlags(
  flags: Map<string, boolean>,
  context: string
) {
  const map = SemanticMap.from(flags);

  // Find relevant flags for context
  const relevantFlags = await map.findKey(context);

  const results: Record<string, boolean> = {};
  for (const key of relevantFlags) {
    results[key] = flags.get(key) ?? false;
  }

  return results;
}

// Usage
const flags = new Map([
  ['feature_new_checkout', true],
  ['feature_dark_mode', false],
  ['feature_beta_api', true],
  ['experiment_pricing', false]
]);

await evaluateFeatureFlags(flags, "checkout related features");
// { 'feature_new_checkout': true }
```

### Cache Key Analysis

```typescript
async function analyzeCacheStructure(cache: Map<string, unknown>) {
  const map = SemanticMap.from(cache);

  const purpose = await map.inferPurpose();
  const validation = await map.validate([
    "keys should follow consistent naming pattern",
    "keys should include cache invalidation hints"
  ]);

  return {
    purpose: purpose.purpose,
    keyPattern: purpose.subcategory,
    issues: validation.issues,
    suggestions: await map.suggestMissingKeys()
  };
}
```
