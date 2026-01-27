---
sidebar_position: 14
---

# SemanticCallable

`SemanticCallable` and `SemanticConstructable` wrap functions and constructors with intelligent analysis, signature inference, test generation, and documentation capabilities.

## SemanticCallable

### Creating a SemanticCallable

```typescript
import { SemanticCallable } from 'semantic-primitives';

function add(a: number, b: number): number {
  return a + b;
}

const callable = SemanticCallable.from(add);

// With arrow functions
const callable2 = SemanticCallable.from((x: string) => x.toUpperCase());
```

### Methods

#### semanticallyEquals

Compare functions by behavior and purpose.

```typescript
const add1 = SemanticCallable.from((a: number, b: number) => a + b);
const add2 = SemanticCallable.from(function sum(x: number, y: number) { return x + y; });

const result = await add1.semanticallyEquals(add2);
// { equivalent: true, confidence: 0.95, note: "Both perform addition of two numbers" }
```

#### explain

Get a human-readable explanation of the function.

```typescript
function processUser(user: { name: string; age: number }) {
  if (user.age < 18) throw new Error('Must be adult');
  return { ...user, verified: true };
}

const callable = SemanticCallable.from(processUser);
const explanation = await callable.explain();
// "This function processes a user object by verifying they are 18 or older,
//  then returns the user with a 'verified' flag set to true."
```

#### inferSignature

Infer the function's TypeScript signature.

```typescript
function mystery(x, y, callback) {
  const result = x * y;
  callback(result);
}

const callable = SemanticCallable.from(mystery);
const signature = await callable.inferSignature();
// {
//   parameters: [
//     { name: 'x', type: 'number', required: true },
//     { name: 'y', type: 'number', required: true },
//     { name: 'callback', type: '(result: number) => void', required: true }
//   ],
//   returnType: 'void',
//   isAsync: false
// }
```

#### generateTypeDefinition

Generate TypeScript type definition.

```typescript
function fetchUser(id) {
  return fetch(`/users/${id}`).then(r => r.json());
}

const callable = SemanticCallable.from(fetchUser);
const typeDef = await callable.generateTypeDefinition();
// "function fetchUser(id: string | number): Promise<User>"
```

#### validateArgs

Validate arguments before calling.

```typescript
function divide(a: number, b: number) {
  return a / b;
}

const callable = SemanticCallable.from(divide);
const validation = await callable.validateArgs([10, 0]);
// {
//   valid: false,
//   issues: ['Second argument (divisor) is 0, which would cause division by zero']
// }
```

#### generateTests

Generate test cases for the function.

```typescript
function isEven(n: number): boolean {
  return n % 2 === 0;
}

const callable = SemanticCallable.from(isEven);
const tests = await callable.generateTests();
// [
//   { input: [0], expected: true, description: 'zero is even' },
//   { input: [2], expected: true, description: 'positive even number' },
//   { input: [3], expected: false, description: 'odd number' },
//   { input: [-2], expected: true, description: 'negative even number' },
//   { input: [-3], expected: false, description: 'negative odd number' }
// ]
```

#### suggestWrapper

Suggest improvements or wrappers.

```typescript
function fetchData(url) {
  return fetch(url).then(r => r.json());
}

const callable = SemanticCallable.from(fetchData);
const suggestion = await callable.suggestWrapper();
// {
//   suggestion: 'Add error handling and retry logic',
//   code: `
// async function fetchDataWithRetry(url, maxRetries = 3) {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       const response = await fetch(url);
//       if (!response.ok) throw new Error('HTTP error');
//       return await response.json();
//     } catch (e) {
//       if (i === maxRetries - 1) throw e;
//       await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
//     }
//   }
// }`
// }
```

#### detectIssues

Find potential issues in the function.

```typescript
function processArray(arr) {
  return arr.map(x => x.value).filter(x => x > 0);
}

const callable = SemanticCallable.from(processArray);
const issues = await callable.detectIssues();
// [
//   { issue: 'No null/undefined check on input array', severity: 'medium' },
//   { issue: 'No handling for items without "value" property', severity: 'medium' },
//   { issue: 'Missing TypeScript types', severity: 'low' }
// ]
```

#### isSafeToCall

Check if the function is safe to call.

```typescript
function riskyOperation(path) {
  return require('fs').unlinkSync(path);
}

const callable = SemanticCallable.from(riskyOperation);
const safety = await callable.isSafeToCall();
// {
//   safe: false,
//   risks: ['Performs file deletion', 'Synchronous I/O operation'],
//   severity: 'high'
// }
```

## SemanticConstructable

### Creating a SemanticConstructable

```typescript
import { SemanticConstructable } from 'semantic-primitives';

class User {
  constructor(public name: string, public age: number) {}
}

const constructable = SemanticConstructable.from(User);
```

### Methods

#### inferInstanceShape

Detect the shape of created instances.

```typescript
class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
    this.id = Math.random().toString(36);
  }
}

const constructable = SemanticConstructable.from(Product);
const shape = await constructable.inferInstanceShape();
// {
//   properties: {
//     name: { type: 'string', source: 'constructor_param' },
//     price: { type: 'number', source: 'constructor_param' },
//     id: { type: 'string', source: 'generated' }
//   },
//   methods: []
// }
```

#### createValidated

Create an instance with validation.

```typescript
const constructable = SemanticConstructable.from(User);

const result = await constructable.createValidated(['John', -5]);
// {
//   success: false,
//   issues: ['Age cannot be negative'],
//   instance: null
// }

const result2 = await constructable.createValidated(['John', 30]);
// { success: true, issues: [], instance: User { name: 'John', age: 30 } }
```

#### generateConstructorDocs

Generate documentation for the constructor.

```typescript
const constructable = SemanticConstructable.from(User);
const docs = await constructable.generateConstructorDocs();
// `
// /**
//  * Creates a new User instance
//  * @param name - The user's name
//  * @param age - The user's age (must be positive)
//  * @returns A new User instance
//  * @example
//  * const user = new User('John', 30);
//  */
// `
```

## Examples

### Function Documentation Generator

```typescript
async function documentFunction(fn: Function) {
  const callable = SemanticCallable.from(fn);

  const [explanation, signature, tests] = await Promise.all([
    callable.explain(),
    callable.inferSignature(),
    callable.generateTests()
  ]);

  return {
    name: fn.name,
    description: explanation,
    signature: await callable.generateTypeDefinition(),
    parameters: signature.parameters,
    tests: tests.slice(0, 5)
  };
}
```

### Code Review Assistant

```typescript
async function reviewFunction(fn: Function) {
  const callable = SemanticCallable.from(fn);

  const [issues, safety, wrapper] = await Promise.all([
    callable.detectIssues(),
    callable.isSafeToCall(),
    callable.suggestWrapper()
  ]);

  return {
    function: fn.name,
    issues,
    safetyAssessment: safety,
    suggestedImprovement: wrapper.suggestion,
    improvedCode: wrapper.code
  };
}
```

### Test Generation Pipeline

```typescript
async function generateTestSuite(functions: Function[]) {
  const tests = await Promise.all(
    functions.map(async (fn) => {
      const callable = SemanticCallable.from(fn);
      const testCases = await callable.generateTests();
      const signature = await callable.inferSignature();

      return {
        functionName: fn.name,
        signature: await callable.generateTypeDefinition(),
        tests: testCases
      };
    })
  );

  return tests;
}
```
