---
sidebar_position: 3
---

# SemanticObject

`SemanticObject<T>` wraps native objects with intelligent field access, schema inference, validation, merging, and sensitive data detection.

## Creating a SemanticObject

```typescript
import { SemanticObject } from 'semantic-primitives';

const user = SemanticObject.from({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// With type parameter
interface User {
  name: string;
  email: string;
  age: number;
}

const typedUser = SemanticObject.from<User>(userData);
```

## Methods

### semanticallyEquals

Compare two objects by semantic meaning.

```typescript
const obj1 = SemanticObject.from({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john@example.com'
});

const obj2 = SemanticObject.from({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});

const result = await obj1.semanticallyEquals(obj2);
// {
//   equivalent: true,
//   confidence: 0.94,
//   mappings: {
//     'firstName': 'first_name',
//     'lastName': 'last_name',
//     'emailAddress': 'email'
//   }
// }
```

### semanticGet

Access fields by semantic meaning, not exact key name.

```typescript
const profile = SemanticObject.from({
  fullName: 'John Doe',
  emailAddress: 'john@example.com',
  phoneNumber: '555-1234',
  dateOfBirth: '1990-01-15'
});

const email = await profile.semanticGet("contact email");
// { value: 'john@example.com', path: 'emailAddress', confidence: 0.96 }

const dob = await profile.semanticGet("birthday");
// { value: '1990-01-15', path: 'dateOfBirth', confidence: 0.92 }
```

### validate

Validate object against semantic rules.

```typescript
const user = SemanticObject.from({
  name: 'J',
  email: 'not-an-email',
  age: -5
});

const result = await user.validate([
  "name should be at least 2 characters",
  "email must be valid",
  "age must be positive"
]);
// {
//   valid: false,
//   issues: [
//     'name is too short (1 character)',
//     'email is not a valid email format',
//     'age is negative'
//   ]
// }
```

### inferSchema

Automatically detect the object's schema.

```typescript
const data = SemanticObject.from({
  id: 12345,
  name: 'Product Name',
  price: 29.99,
  inStock: true,
  tags: ['electronics', 'gadgets'],
  metadata: { sku: 'ABC123' }
});

const schema = await data.inferSchema();
// {
//   type: 'object',
//   properties: {
//     id: { type: 'number', format: 'integer', purpose: 'identifier' },
//     name: { type: 'string', purpose: 'display_name' },
//     price: { type: 'number', format: 'currency' },
//     inStock: { type: 'boolean', purpose: 'availability_flag' },
//     tags: { type: 'array', items: { type: 'string' }, purpose: 'categorization' },
//     metadata: { type: 'object', purpose: 'additional_data' }
//   },
//   confidence: 0.95
// }
```

### transformKeys

Convert key naming conventions.

```typescript
const snakeCase = SemanticObject.from({
  first_name: 'John',
  last_name: 'Doe',
  email_address: 'john@example.com'
});

const camelCase = await snakeCase.transformKeys('camelCase');
// { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' }

const pascalCase = await snakeCase.transformKeys('PascalCase');
// { FirstName: 'John', LastName: 'Doe', EmailAddress: 'john@example.com' }
```

### semanticMerge

Intelligently merge two objects with conflict resolution.

```typescript
const obj1 = SemanticObject.from({
  name: 'John',
  email: 'john@old.com',
  phone: '555-1234'
});

const obj2 = SemanticObject.from({
  fullName: 'John Doe',
  emailAddress: 'john@new.com',
  address: '123 Main St'
});

const merged = await obj1.semanticMerge(obj2, {
  conflictResolution: 'preferNewer',
  mapSimilarKeys: true
});
// {
//   name: 'John Doe',
//   email: 'john@new.com',
//   phone: '555-1234',
//   address: '123 Main St'
// }
```

**Options:**
- `conflictResolution: 'preferFirst' | 'preferSecond' | 'preferNewer' | 'manual'`
- `mapSimilarKeys: boolean` - Map semantically similar keys

### pick

Select specific fields semantically.

```typescript
const full = SemanticObject.from({
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  createdAt: '2024-01-01'
});

const public = await full.pick(["user identification", "contact info"]);
// { id: 1, name: 'John', email: 'john@example.com' }
```

### suggestMissingFields

Get recommendations for missing fields.

```typescript
const partialUser = SemanticObject.from({
  name: 'John',
  email: 'john@example.com'
});

const suggestions = await partialUser.suggestMissingFields();
// [
//   { field: 'phone', reason: 'Contact information often includes phone' },
//   { field: 'address', reason: 'User profiles typically have address' },
//   { field: 'createdAt', reason: 'Records usually track creation time' }
// ]
```

### isSensitive

Detect sensitive data in the object.

```typescript
const data = SemanticObject.from({
  name: 'John Doe',
  ssn: '123-45-6789',
  creditCard: '4111-1111-1111-1111',
  email: 'john@example.com'
});

const result = await data.isSensitive();
// {
//   hasSensitive: true,
//   fields: [
//     { key: 'ssn', type: 'social_security_number', severity: 'high' },
//     { key: 'creditCard', type: 'credit_card_number', severity: 'high' }
//   ]
// }
```

### summarize

Get a human-readable summary.

```typescript
const config = SemanticObject.from({
  database: { host: 'localhost', port: 5432 },
  cache: { enabled: true, ttl: 3600 },
  logging: { level: 'info', format: 'json' }
});

const summary = await config.summarize();
// "Configuration object with database connection (localhost:5432), caching enabled with 1-hour TTL, and JSON logging at info level"
```

## Implemented Interfaces

- `Semantic<T>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Rule-based validation
- `Summarizable` - Content summarization
- `TypeInferable` - Type detection
- `SchemaInferable` - Schema inference
- `SensitivityDetectable` - PII detection
- `SemanticAccessible` - Semantic field access
- `SemanticMergeable` - Intelligent merging

## Examples

### API Response Transformation

```typescript
async function transformApiResponse(response: unknown) {
  const obj = SemanticObject.from(response as object);

  // Transform to consistent naming
  const camelCased = await obj.transformKeys('camelCase');

  // Validate structure
  const validation = await camelCased.validate([
    "must have id field",
    "must have created timestamp",
    "status must be valid enum"
  ]);

  if (!validation.valid) {
    throw new Error(`Invalid response: ${validation.issues.join(', ')}`);
  }

  return camelCased.valueOf();
}
```

### Data Migration

```typescript
async function migrateUserSchema(oldUser: object) {
  const old = SemanticObject.from(oldUser);
  const newTemplate = SemanticObject.from({
    userId: null,
    fullName: null,
    contactEmail: null,
    phoneNumber: null
  });

  // Merge with field mapping
  const migrated = await newTemplate.semanticMerge(old, {
    mapSimilarKeys: true,
    conflictResolution: 'preferSecond'
  });

  return migrated.valueOf();
}
```

### Security Audit

```typescript
async function auditObjectSecurity(data: object) {
  const obj = SemanticObject.from(data);

  const sensitive = await obj.isSensitive();
  const schema = await obj.inferSchema();

  const issues: string[] = [];

  if (sensitive.hasSensitive) {
    for (const field of sensitive.fields) {
      issues.push(`Sensitive ${field.type} found in field '${field.key}'`);
    }
  }

  return {
    hasSensitiveData: sensitive.hasSensitive,
    sensitiveFields: sensitive.fields,
    schema,
    issues
  };
}
```

### Form Auto-Population

```typescript
async function autoPopulateForm(partialData: object, formFields: string[]) {
  const data = SemanticObject.from(partialData);

  const populated: Record<string, unknown> = {};

  for (const field of formFields) {
    const result = await data.semanticGet(field);
    if (result.confidence > 0.8) {
      populated[field] = result.value;
    }
  }

  const missing = await data.suggestMissingFields();

  return {
    populated,
    suggestions: missing.filter(s =>
      formFields.some(f => f.toLowerCase().includes(s.field.toLowerCase()))
    )
  };
}
```
