---
sidebar_position: 8
---

# SemanticVoid

`SemanticVoid` provides semantic analysis for void-returning functions, including side effect detection, return value suggestions, and function signature analysis.

## Creating a SemanticVoid

```typescript
import { SemanticVoid } from 'semantic-primitives';

const voidType = SemanticVoid.from(undefined);
```

## Methods

### analyzeSideEffects

Analyze a function for side effects.

```typescript
const voidType = SemanticVoid.from(undefined);

function saveToDatabase(data: object) {
  database.insert(data);
}

const result = await voidType.analyzeSideEffects(saveToDatabase);
// {
//   hasSideEffects: true,
//   effects: [
//     { type: 'database_write', description: 'Inserts data into database' }
//   ],
//   confidence: 0.92
// }
```

```typescript
function logMessage(msg: string) {
  console.log(msg);
}

const result = await voidType.analyzeSideEffects(logMessage);
// {
//   hasSideEffects: true,
//   effects: [
//     { type: 'console_output', description: 'Writes to console' }
//   ],
//   confidence: 0.98
// }
```

### shouldReturnValue

Check if a void function should actually return a value.

```typescript
const voidType = SemanticVoid.from(undefined);

function validateAndSave(data: object) {
  if (!isValid(data)) return;
  database.insert(data);
}

const result = await voidType.shouldReturnValue(validateAndSave);
// {
//   shouldReturn: true,
//   suggestedType: 'boolean',
//   reason: 'Function validates data and should indicate success/failure'
// }
```

### validateUsage

Validate if void is appropriate for a function.

```typescript
const voidType = SemanticVoid.from(undefined);

function calculateSum(a: number, b: number) {
  const sum = a + b;
  // Forgot to return!
}

const result = await voidType.validateUsage(calculateSum, 'calculation function');
// {
//   valid: false,
//   issues: ['Function appears to calculate a value but does not return it'],
//   suggestions: ['Return the calculated sum']
// }
```

### checkErrorHandling

Verify error handling in void functions.

```typescript
const voidType = SemanticVoid.from(undefined);

function processFile(path: string) {
  const content = fs.readFileSync(path);
  transform(content);
}

const result = await voidType.checkErrorHandling(processFile);
// {
//   adequate: false,
//   issues: [
//     'File read operation may throw without handling',
//     'Transform operation errors not caught'
//   ],
//   suggestions: [
//     'Wrap in try-catch',
//     'Consider returning error status'
//   ]
// }
```

### suggestSignature

Suggest improvements to function signature.

```typescript
const voidType = SemanticVoid.from(undefined);

function handleClick(e) {
  element.classList.toggle('active');
  analytics.track('click');
}

const result = await voidType.suggestSignature(handleClick);
// {
//   currentSignature: '(e: any) => void',
//   suggestedSignature: '(e: MouseEvent) => void',
//   improvements: [
//     { type: 'parameter_type', suggestion: 'Use MouseEvent for click handlers' }
//   ]
// }
```

## Implemented Interfaces

- `Semantic<void>` - Base semantic interface
- `Explainable` - Human-readable explanations

## Examples

### Code Review Assistant

```typescript
async function reviewVoidFunction(fn: Function, context: string) {
  const voidType = SemanticVoid.from(undefined);

  const [sideEffects, shouldReturn, errorHandling, signature] = await Promise.all([
    voidType.analyzeSideEffects(fn),
    voidType.shouldReturnValue(fn),
    voidType.checkErrorHandling(fn),
    voidType.suggestSignature(fn)
  ]);

  const issues: string[] = [];

  if (shouldReturn.shouldReturn) {
    issues.push(`Consider returning ${shouldReturn.suggestedType}: ${shouldReturn.reason}`);
  }

  if (!errorHandling.adequate) {
    issues.push(...errorHandling.issues);
  }

  return {
    name: fn.name,
    context,
    hasSideEffects: sideEffects.hasSideEffects,
    sideEffects: sideEffects.effects,
    suggestedSignature: signature.suggestedSignature,
    issues,
    improvements: signature.improvements
  };
}
```

### API Design Validation

```typescript
async function validateApiHandlers(handlers: Record<string, Function>) {
  const voidType = SemanticVoid.from(undefined);
  const results: Record<string, object> = {};

  for (const [name, handler] of Object.entries(handlers)) {
    const validation = await voidType.validateUsage(handler, `API handler: ${name}`);

    if (!validation.valid) {
      results[name] = {
        valid: false,
        issues: validation.issues,
        suggestions: validation.suggestions
      };
    }
  }

  return results;
}

// Usage
const handlers = {
  createUser: async (data) => { await db.insert(data); },
  getUser: async (id) => { const user = await db.find(id); }, // Missing return
  deleteUser: async (id) => { await db.delete(id); }
};

await validateApiHandlers(handlers);
// {
//   getUser: {
//     valid: false,
//     issues: ['Function retrieves data but does not return it'],
//     suggestions: ['Return the retrieved user object']
//   }
// }
```

### Side Effect Documentation Generator

```typescript
async function generateSideEffectDocs(functions: Function[]) {
  const voidType = SemanticVoid.from(undefined);

  const docs = await Promise.all(
    functions.map(async (fn) => {
      const analysis = await voidType.analyzeSideEffects(fn);

      if (!analysis.hasSideEffects) {
        return null;
      }

      return {
        name: fn.name,
        sideEffects: analysis.effects.map(e => ({
          type: e.type,
          description: e.description
        }))
      };
    })
  );

  return docs.filter(Boolean);
}
```

### Test Generation Helper

```typescript
async function suggestVoidFunctionTests(fn: Function) {
  const voidType = SemanticVoid.from(undefined);

  const sideEffects = await voidType.analyzeSideEffects(fn);
  const errorHandling = await voidType.checkErrorHandling(fn);

  const testSuggestions: string[] = [];

  for (const effect of sideEffects.effects) {
    switch (effect.type) {
      case 'database_write':
        testSuggestions.push('Test that database is called with correct data');
        testSuggestions.push('Test database error handling');
        break;
      case 'console_output':
        testSuggestions.push('Test that correct message is logged');
        break;
      case 'dom_manipulation':
        testSuggestions.push('Test that DOM is updated correctly');
        break;
      case 'network_request':
        testSuggestions.push('Test network request parameters');
        testSuggestions.push('Test network error handling');
        break;
    }
  }

  if (!errorHandling.adequate) {
    testSuggestions.push('Test error scenarios');
  }

  return {
    function: fn.name,
    suggestedTests: testSuggestions
  };
}
```
