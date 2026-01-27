---
sidebar_position: 7
---

# SemanticNull & SemanticUndefined

`SemanticNull` and `SemanticUndefined` wrap the absence values `null` and `undefined` with semantic understanding of their context, appropriateness, and default value suggestions.

## Creating Instances

```typescript
import { SemanticNull, SemanticUndefined } from 'semantic-primitives';

const nullVal = SemanticNull.from(null);
const undefinedVal = SemanticUndefined.from(undefined);
```

## Methods

Both types share the same interface for handling absence values.

### classify

Classify the type of absence this value represents.

```typescript
const nullVal = SemanticNull.from(null);

const result = await nullVal.classify();
// {
//   category: 'intentional_absence',
//   subcategory: 'explicit_empty',
//   confidence: 0.85
// }
```

Common categories:
- `initialization` - Value not yet set
- `error` - Absence due to error
- `optional` - Intentionally missing optional value
- `empty` - Explicitly empty
- `undefined_behavior` - Uninitialized or missing

### semanticallyEquals

Compare two absence values semantically.

```typescript
const nullVal = SemanticNull.from(null);
const undefinedVal = SemanticUndefined.from(undefined);

const result = await nullVal.semanticallyEquals(undefinedVal);
// {
//   equivalent: true,
//   confidence: 0.75,
//   note: "Both represent absence but with different semantics"
// }
```

### suggestDefault

Get a suggested default value for the context.

```typescript
const nullVal = SemanticNull.from(null);

const result = await nullVal.suggestDefault("user age field");
// {
//   suggestion: "0",
//   reason: "Age should default to 0 or require explicit input"
// }

const result2 = await nullVal.suggestDefault("optional email preferences");
// {
//   suggestion: "empty object {}",
//   reason: "Optional preferences should default to empty configuration"
// }
```

### isAppropriate

Check if the absence is appropriate for the context.

```typescript
const nullVal = SemanticNull.from(null);

const result = await nullVal.isAppropriate("required user ID");
// {
//   appropriate: false,
//   reason: "User ID is required and should not be null"
// }

const result2 = await nullVal.isAppropriate("optional middle name");
// {
//   appropriate: true,
//   reason: "Middle name is optional and can be null"
// }
```

### explain

Get a human-readable explanation of the absence.

```typescript
const undefinedVal = SemanticUndefined.from(undefined);

const explanation = await undefinedVal.explain();
// "This undefined value indicates an uninitialized or missing property"
```

## Implemented Interfaces

- `Semantic<null | undefined>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Explainable` - Human-readable explanations
- `SemanticAbsence` - Absence-specific methods

## Differences Between Null and Undefined

| Aspect | `null` | `undefined` |
|--------|--------|-------------|
| Intent | Explicit absence | Missing/uninitialized |
| JSON | Serializes as `null` | Omitted from JSON |
| Default params | Doesn't trigger default | Triggers default |
| `typeof` | `"object"` | `"undefined"` |

```typescript
// Understanding the semantic difference
const nullAnalysis = await SemanticNull.from(null).classify();
// { category: 'explicit_absence', ... }

const undefinedAnalysis = await SemanticUndefined.from(undefined).classify();
// { category: 'uninitialized', ... }
```

## Examples

### Form Field Validation

```typescript
async function validateField(
  fieldName: string,
  value: unknown,
  required: boolean
) {
  if (value === null) {
    const nullVal = SemanticNull.from(null);
    const appropriate = await nullVal.isAppropriate(
      required ? `required field: ${fieldName}` : `optional field: ${fieldName}`
    );

    if (!appropriate.appropriate) {
      const suggestion = await nullVal.suggestDefault(fieldName);
      return {
        valid: false,
        error: appropriate.reason,
        suggestedDefault: suggestion.suggestion
      };
    }
  }

  if (value === undefined) {
    const undefinedVal = SemanticUndefined.from(undefined);
    const appropriate = await undefinedVal.isAppropriate(
      `${fieldName} field`
    );

    if (!appropriate.appropriate) {
      return {
        valid: false,
        error: `${fieldName} should be explicitly set, not undefined`
      };
    }
  }

  return { valid: true };
}
```

### API Response Handling

```typescript
async function handleApiField(
  fieldName: string,
  value: unknown,
  context: string
) {
  if (value === null || value === undefined) {
    const absence = value === null
      ? SemanticNull.from(null)
      : SemanticUndefined.from(undefined);

    const classification = await absence.classify();
    const suggestion = await absence.suggestDefault(context);
    const explanation = await absence.explain();

    return {
      field: fieldName,
      status: 'absent',
      absenceType: classification.category,
      suggestedDefault: suggestion.suggestion,
      explanation
    };
  }

  return {
    field: fieldName,
    status: 'present',
    value
  };
}
```

### Database Record Initialization

```typescript
async function initializeRecord(schema: Record<string, string>) {
  const defaults: Record<string, unknown> = {};

  for (const [field, type] of Object.entries(schema)) {
    const nullVal = SemanticNull.from(null);
    const suggestion = await nullVal.suggestDefault(`${field} (${type})`);

    defaults[field] = parseDefault(suggestion.suggestion, type);
  }

  return defaults;
}

function parseDefault(suggestion: string, type: string): unknown {
  switch (type) {
    case 'number': return Number(suggestion) || 0;
    case 'string': return suggestion === 'empty string' ? '' : suggestion;
    case 'boolean': return suggestion === 'true';
    case 'array': return [];
    case 'object': return {};
    default: return null;
  }
}
```

### Error Recovery Patterns

```typescript
async function recoverFromNull<T>(
  value: T | null,
  context: string
): Promise<{ value: T | null; recovered: boolean; reason?: string }> {
  if (value !== null) {
    return { value, recovered: false };
  }

  const nullVal = SemanticNull.from(null);
  const appropriate = await nullVal.isAppropriate(context);

  if (appropriate.appropriate) {
    return { value: null, recovered: false, reason: appropriate.reason };
  }

  const suggestion = await nullVal.suggestDefault(context);
  console.warn(`Null recovery: ${suggestion.reason}`);

  // In real code, you'd parse the suggestion into type T
  return {
    value: null, // Would be parsed suggestion
    recovered: true,
    reason: suggestion.reason
  };
}
```
