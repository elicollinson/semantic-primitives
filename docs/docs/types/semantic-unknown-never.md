---
sidebar_position: 15
---

# SemanticUnknown & SemanticNever

`SemanticUnknown` and `SemanticNever` provide intelligent handling for TypeScript's special types, offering type inference, validation, and exhaustiveness checking.

## SemanticUnknown

Wraps `unknown` values with type inference and validation capabilities.

### Creating a SemanticUnknown

```typescript
import { SemanticUnknown } from 'semantic-primitives';

const data = SemanticUnknown.from(someUnknownValue);

// From API response
const apiData = SemanticUnknown.from(await response.json());
```

### Methods

#### inferType

Infer the type of an unknown value.

```typescript
const data = SemanticUnknown.from({ name: 'John', age: 30 });

const type = await data.inferType();
// {
//   type: 'object',
//   shape: '{ name: string; age: number }',
//   confidence: 0.95,
//   possibleTypes: ['User', 'Person', 'Profile']
// }

const data2 = SemanticUnknown.from('2024-01-15');
const type2 = await data2.inferType();
// {
//   type: 'string',
//   format: 'date (ISO 8601)',
//   confidence: 0.92,
//   coercibleTo: ['Date']
// }
```

#### suggestTypes

Get multiple type suggestions with confidence.

```typescript
const data = SemanticUnknown.from([1, 2, 3, 4, 5]);

const suggestions = await data.suggestTypes();
// [
//   { type: 'number[]', confidence: 0.99 },
//   { type: 'Array<number>', confidence: 0.99 },
//   { type: 'tuple [number, number, number, number, number]', confidence: 0.85 }
// ]
```

#### validateShape

Validate against an expected shape.

```typescript
const data = SemanticUnknown.from({
  name: 'John',
  email: 'john@example.com'
});

const validation = await data.validateShape('{ name: string; age: number }');
// {
//   matches: false,
//   missingFields: ['age'],
//   extraFields: ['email'],
//   confidence: 0.90
// }

const validation2 = await data.validateShape('{ name: string; email: string }');
// { matches: true, missingFields: [], extraFields: [], confidence: 0.99 }
```

#### generateTypeGuard

Generate a TypeScript type guard function.

```typescript
const data = SemanticUnknown.from({ id: 1, name: 'Product' });

const guard = await data.generateTypeGuard();
// {
//   typeName: 'Product',
//   code: `
// interface Product {
//   id: number;
//   name: string;
// }
//
// function isProduct(value: unknown): value is Product {
//   return (
//     typeof value === 'object' &&
//     value !== null &&
//     typeof (value as any).id === 'number' &&
//     typeof (value as any).name === 'string'
//   );
// }
// `
// }
```

#### matches

Check if value matches a type.

```typescript
const data = SemanticUnknown.from(['apple', 'banana']);

await data.matches('string[]');  // { matches: true, confidence: 0.99 }
await data.matches('number[]');  // { matches: false, confidence: 0.99 }
await data.matches('array');     // { matches: true, confidence: 1.0 }
```

#### narrowTo

Narrow the value to a specific type.

```typescript
const data = SemanticUnknown.from('42');

const narrowed = await data.narrowTo('number');
// {
//   success: true,
//   value: 42,
//   transformation: 'parsed string to number'
// }

const data2 = SemanticUnknown.from('not a number');
const narrowed2 = await data2.narrowTo('number');
// {
//   success: false,
//   reason: 'String cannot be parsed as valid number'
// }
```

## SemanticNever

Handles `never` type scenarios including exhaustiveness checking and unreachable code detection.

### Methods

#### isExhaustive

Check if a switch/handler covers all cases.

```typescript
type Status = 'pending' | 'active' | 'completed';

function handleStatus(status: Status) {
  switch (status) {
    case 'pending': return 'Waiting';
    case 'active': return 'In Progress';
    // Missing 'completed' case
  }
}

const result = await SemanticNever.isExhaustive(handleStatus);
// {
//   exhaustive: false,
//   missingCases: ['completed'],
//   suggestion: "Add case for 'completed'"
// }
```

#### explainUnreachability

Explain why code is unreachable.

```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value * 2;
  }
  // This point should be unreachable
  const unreachable = value; // value is 'never' here
}

const explanation = await SemanticNever.explainUnreachability(unreachable);
// {
//   reason: "All possible types (string, number) have been handled above",
//   suggestion: "This code is correctly unreachable - you may remove it or add an assertNever check"
// }
```

#### isDeadCode

Detect dead code paths.

```typescript
function example(x: number) {
  if (x > 0) {
    return 'positive';
  }
  if (x <= 0) {
    return 'non-positive';
  }
  console.log('This never runs'); // Dead code
}

const result = await SemanticNever.isDeadCode(
  "console.log('This never runs')",
  example
);
// {
//   isDead: true,
//   reason: "All numeric cases (x > 0 or x <= 0) are handled above",
//   lineNumber: 8
// }
```

#### suggestExhaustiveHandler

Generate an exhaustive switch statement.

```typescript
type Color = 'red' | 'green' | 'blue';

const suggestion = await SemanticNever.suggestExhaustiveHandler('Color');
// {
//   code: `
// function handleColor(color: Color): string {
//   switch (color) {
//     case 'red':
//       return /* handle red */;
//     case 'green':
//       return /* handle green */;
//     case 'blue':
//       return /* handle blue */;
//     default:
//       const _exhaustive: never = color;
//       throw new Error(\`Unhandled color: \${color}\`);
//   }
// }
// `
// }
```

#### analyzeIntersection

Analyze impossible type intersections.

```typescript
type Impossible = string & number; // Results in 'never'

const analysis = await SemanticNever.analyzeIntersection('string & number');
// {
//   resultType: 'never',
//   reason: "string and number have no common values",
//   suggestion: "This intersection is likely a type error - review the types being combined"
// }
```

## Examples

### Type-Safe Data Processing

```typescript
async function processUnknownData(data: unknown) {
  const semantic = SemanticUnknown.from(data);

  const type = await semantic.inferType();

  switch (type.type) {
    case 'string':
      return { type: 'text', value: data as string };
    case 'number':
      return { type: 'numeric', value: data as number };
    case 'object':
      const guard = await semantic.generateTypeGuard();
      return { type: 'structured', shape: type.shape, guard: guard.code };
    case 'array':
      return { type: 'collection', length: (data as any[]).length };
    default:
      return { type: 'unknown', raw: data };
  }
}
```

### API Response Validator

```typescript
async function validateApiResponse<T>(
  response: unknown,
  expectedShape: string
): Promise<T> {
  const semantic = SemanticUnknown.from(response);

  const validation = await semantic.validateShape(expectedShape);

  if (!validation.matches) {
    const suggestions = await semantic.suggestTypes();
    throw new Error(
      `Invalid response shape. Expected ${expectedShape}, ` +
      `got ${suggestions[0].type}. ` +
      `Missing: ${validation.missingFields.join(', ')}`
    );
  }

  return response as T;
}

// Usage
interface User {
  id: number;
  name: string;
  email: string;
}

const user = await validateApiResponse<User>(
  await fetch('/api/user').then(r => r.json()),
  '{ id: number; name: string; email: string }'
);
```

### Exhaustiveness Linter

```typescript
async function checkExhaustiveness(code: string, enumType: string) {
  // Parse the switch statement
  const handler = eval(`(${code})`);

  const result = await SemanticNever.isExhaustive(handler);

  if (!result.exhaustive) {
    const suggested = await SemanticNever.suggestExhaustiveHandler(enumType);

    return {
      valid: false,
      missing: result.missingCases,
      suggestedCode: suggested.code
    };
  }

  return { valid: true };
}
```

### Type Guard Generator

```typescript
async function generateTypeGuards(samples: unknown[]) {
  const guards = await Promise.all(
    samples.map(async (sample, i) => {
      const semantic = SemanticUnknown.from(sample);
      const guard = await semantic.generateTypeGuard();

      return {
        sampleIndex: i,
        inferredType: guard.typeName,
        guardFunction: guard.code
      };
    })
  );

  return guards;
}
```
