# Never Type - LLM-Enhanced Semantic Primitives Brainstorm

## Overview

The `never` type represents the bottom type in TypeScript - a type with no values that indicates unreachable code, impossible states, or functions that never return. This is perhaps the most philosophically interesting type for LLM enhancement because it deals with **absence**, **impossibility**, and **logical reasoning** about code paths.

---

## 1. Semantic Equivalence - LLM Reasoning About Never

### Core Concept
An LLM can reason about semantic equivalence of `never` scenarios - understanding when two pieces of code are equivalently unreachable or when a type should logically be `never`.

### Ideas

#### 1.1 Unreachability Equivalence
```typescript
import { semantic } from 'semantic-primitives';

// Are these two functions semantically equivalent in their unreachability?
function throwsA(): never {
  throw new Error("A");
}

function throwsB(): never {
  throw new Error("B");
}

await semantic.never.areEquivalent(throwsA, throwsB);
// LLM Response: {
//   equivalent: true,
//   reasoning: "Both functions guarantee non-termination via throwing.
//               The specific error messages differ but the never-returning
//               behavior is semantically equivalent.",
//   subtleties: ["Error messages differ", "Stack traces will differ"]
// }
```

#### 1.2 Semantic Bottom Type Detection
```typescript
// Detect if a type is semantically equivalent to never
type ComplexUnion = string & number; // This is never

await semantic.never.isSemanticNever(`string & number`);
// LLM Response: {
//   isNever: true,
//   reasoning: "The intersection of string and number has no possible values
//               because no value can simultaneously be both a string and a number.",
//   confidence: 1.0
// }

// More complex case
type WeirdType = { x: string } & { x: number };
await semantic.never.isSemanticNever(`{ x: string } & { x: number }`);
// LLM Response: {
//   isNever: true,
//   reasoning: "While the outer object types could theoretically intersect,
//               the 'x' property cannot be both string and number, making
//               this type uninhabitable.",
//   confidence: 0.95
// }
```

#### 1.3 Exhaustiveness Semantic Equivalence
```typescript
// Are two switch statements semantically equivalent in exhaustiveness?
const switch1 = `
  switch(status) {
    case 'pending': return 1;
    case 'active': return 2;
    case 'complete': return 3;
  }
`;

const switch2 = `
  switch(status) {
    case 'pending': return 1;
    case 'active':
    case 'complete': return 2;
  }
`;

await semantic.never.exhaustivenessEquivalent(switch1, switch2,
  "type Status = 'pending' | 'active' | 'complete'"
);
// LLM Response: {
//   equivalent: true, // Both are exhaustive
//   semanticallyIdentical: false, // Different return values
//   reasoning: "Both switches cover all cases of the Status union,
//               ensuring no never-typed fall-through, but they produce
//               different results for 'active' and 'complete' cases."
// }
```

#### 1.4 Logical Impossibility Detection
```typescript
// Detect logically impossible conditions that should result in never
const condition = `
  if (typeof x === 'string' && typeof x === 'number') {
    // What type is x here?
  }
`;

await semantic.never.detectImpossibleBranch(condition);
// LLM Response: {
//   isImpossible: true,
//   innerType: "never",
//   reasoning: "A value cannot simultaneously satisfy both typeof checks.
//               This branch can never execute, making x of type never within it.",
//   suggestion: "This code is dead and should be removed or the logic reviewed."
// }
```

#### 1.5 Domain-Aware Never Detection
```typescript
// Understanding domain-specific impossibilities
const businessLogic = `
  if (user.age < 0 && user.isVerifiedAdult) {
    processUser(user);
  }
`;

await semantic.never.detectDomainImpossibility(businessLogic, {
  domainContext: "User management system where age must be non-negative"
});
// LLM Response: {
//   isImpossible: true,
//   reasoning: "In the user domain, age cannot be negative, and a verified
//               adult must have age >= 18. The condition age < 0 AND
//               isVerifiedAdult is a domain-level contradiction.",
//   typeImplication: "user should be typed as never in this branch"
// }
```

---

## 2. Semantic Validation - Validating Never Usage

### Core Concept
LLMs can validate whether `never` is correctly used in code - verifying true unreachability, correct exhaustiveness assertions, and proper error handling.

### Ideas

#### 2.1 Unreachability Validation
```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

// Validate if a never assertion is correct
await semantic.never.validate(
  `assertNever(status)`,
  { status: "type Status = 'a' | 'b' | 'c'" },
  { coveredCases: ['a', 'b'] }  // Missing 'c'!
);
// LLM Response: {
//   valid: false,
//   reachable: true,
//   missingCases: ['c'],
//   explanation: "The assertNever call is reachable because case 'c'
//                 is not handled. This will throw at runtime if status is 'c'.",
//   severity: "error",
//   fix: "Add a case for 'c' before the assertNever call"
// }
```

#### 2.2 Function Return Validation
```typescript
// Validate that a function truly never returns
const fnCode = `
function infiniteLoop(): never {
  while (true) {
    if (Math.random() > 0.9999) break; // Oops!
  }
}
`;

await semantic.never.validateNeverReturns(fnCode);
// LLM Response: {
//   valid: false,
//   canReturn: true,
//   returnPath: "The while loop can exit via the break statement when
//                Math.random() > 0.9999, causing implicit undefined return",
//   fix: "Remove the break statement or change return type to void"
// }
```

#### 2.3 Type Guard Never Validation
```typescript
// Validate type narrowing leads to never
const narrowingCode = `
function process(x: string | number) {
  if (typeof x === 'string') {
    return x.toUpperCase();
  }
  if (typeof x === 'number') {
    return x.toFixed(2);
  }
  // Is x never here?
  console.log(x);
}
`;

await semantic.never.validateNarrowsToNever(narrowingCode, 'x', 'after all if statements');
// LLM Response: {
//   valid: true,
//   isNever: true,
//   reasoning: "After checking for string and number, all members of the
//               union 'string | number' are eliminated, leaving x as never.",
//   warning: "The console.log(x) line is dead code and will never execute."
// }
```

#### 2.4 Conditional Type Never Validation
```typescript
// Validate conditional type distributions
type ExtractString<T> = T extends string ? T : never;
type Result = ExtractString<string | number | boolean>;

await semantic.never.validateConditionalType(
  `T extends string ? T : never`,
  { T: 'string | number | boolean' }
);
// LLM Response: {
//   resultType: "string",
//   neverBranches: ["number extends string -> never", "boolean extends string -> never"],
//   explanation: "The conditional type distributes over the union:
//                 - string extends string ? string : never = string
//                 - number extends string ? number : never = never
//                 - boolean extends string ? boolean : never = never
//                 Union of results: string | never | never = string"
// }
```

#### 2.5 Exception Path Validation
```typescript
// Validate that all paths either return or throw
const fnCode = `
function processOrder(order: Order): ProcessedOrder {
  if (!order.items.length) {
    throw new EmptyOrderError();
  }
  if (order.status === 'cancelled') {
    // Forgot to throw or return!
    console.log('Order was cancelled');
  }
  return process(order);
}
`;

await semantic.never.validateAllPathsTerminate(fnCode);
// LLM Response: {
//   valid: false,
//   incompletePath: "order.status === 'cancelled' branch",
//   issue: "Branch logs but doesn't return or throw, falling through to
//           process(order) which may be incorrect for cancelled orders",
//   suggestion: "Add 'throw new CancelledOrderError()' or 'return null'
//                in the cancelled branch"
// }
```

#### 2.6 Semantic Reachability Validation with Context
```typescript
// Validate with business context
const code = `
function calculateDiscount(customer: Customer): number {
  if (customer.tier === 'gold') return 0.2;
  if (customer.tier === 'silver') return 0.1;
  if (customer.tier === 'bronze') return 0.05;

  // assertNever case - but is this actually unreachable?
  throw new Error('Unknown tier');
}
`;

await semantic.never.validateWithContext(code, {
  businessContext: "We recently added a 'platinum' tier to the database",
  typeDefinition: "type Tier = 'gold' | 'silver' | 'bronze' | 'platinum'"
});
// LLM Response: {
//   valid: false,
//   reachable: true,
//   reason: "The 'platinum' tier from the updated type definition is not
//            handled, making the throw statement reachable.",
//   businessImpact: "Platinum customers will hit the error path",
//   priority: "high"
// }
```

---

## 3. Never Analysis - Explaining Unreachability

### Core Concept
LLMs can provide detailed, human-readable explanations of why code is unreachable or why a type resolves to `never`.

### Ideas

#### 3.1 Control Flow Analysis Explanation
```typescript
const code = `
function example(x: string | null) {
  if (x === null) {
    return;
  }
  if (typeof x === 'string') {
    console.log(x.length);
  } else {
    // What happens here?
    x.toUpperCase(); // Error?
  }
}
`;

await semantic.never.explainUnreachability(code, { line: 9 });
// LLM Response: {
//   unreachable: true,
//   explanation: `
//     Line 9 is unreachable due to the following type narrowing sequence:
//
//     1. Parameter x starts as: string | null
//     2. After line 2-4 (null check + early return): x is string
//     3. After line 5 (typeof string check): x is still string in the if branch
//     4. In the else branch at line 8: x would need to be (string | null) - string - null
//        This equals never, as all possibilities are exhausted.
//
//     The else branch is dead code because:
//     - null was eliminated by the early return
//     - string is captured by the typeof check
//     - No other types exist in the original union
//   `,
//   visualFlow: `
//     x: string | null
//           │
//           ▼
//     ┌─ null? ─┐
//     │ yes     │ no
//     ▼         ▼
//   return    x: string
//                  │
//                  ▼
//            ┌─ string? ─┐
//            │ yes       │ no (impossible!)
//            ▼           ▼
//          x: string   x: never
//   `
// }
```

#### 3.2 Type Algebra Explanation
```typescript
type Mystery = (string | number) & (boolean | string) & (number | boolean);

await semantic.never.explainTypeResolution(`(string | number) & (boolean | string) & (number | boolean)`);
// LLM Response: {
//   resultType: "never",
//   stepByStep: `
//     Let's solve this intersection step by step:
//
//     Step 1: (string | number) & (boolean | string)
//     Using distribution:
//       = (string & boolean) | (string & string) | (number & boolean) | (number & string)
//       = never | string | never | never
//       = string
//
//     Step 2: string & (number | boolean)
//     Using distribution:
//       = (string & number) | (string & boolean)
//       = never | never
//       = never
//
//     Therefore: (string | number) & (boolean | string) & (number | boolean) = never
//   `,
//   intuition: "There's no single type that can simultaneously be in all three unions.
//               String is eliminated by (number | boolean), number by (boolean | string),
//               and boolean by (string | number)."
// }
```

#### 3.3 Recursive Type Never Analysis
```typescript
type InfiniteNesting<T> = { value: InfiniteNesting<T> };
type Attempt = InfiniteNesting<string>['value']['value']['value'];

await semantic.never.analyzeRecursiveType(`InfiniteNesting<string>['value']['value']['value']`);
// LLM Response: {
//   isNever: false,
//   actualType: "InfiniteNesting<string>",
//   explanation: "This is a recursive type that infinitely nests. Each ['value']
//                 access returns the same InfiniteNesting<string> type. While
//                 it's impossible to construct a concrete value of this type
//                 (infinite recursion), the TYPE itself is not never - it's
//                 a valid (though uninhabitable) structural type.",
//   inhabitability: {
//     isInhabitable: false,
//     reason: "Would require infinite memory to construct"
//   }
// }
```

#### 3.4 Exception Flow Analysis
```typescript
const code = `
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (e) {
      if (i === retries - 1) throw e;
    }
  }
  // Is this reachable?
}
`;

await semantic.never.analyzeExceptionFlow(code);
// LLM Response: {
//   unreachableAfterLoop: false, // This is actually reachable!
//   explanation: `
//     The code after the for loop IS reachable despite appearing exhaustive.
//
//     Scenario: If fetch() succeeds on any attempt, we return. If it fails
//     on all attempts, we throw on the last iteration. BUT there's a subtle bug:
//
//     If retries = 0 (passed explicitly), the loop body never executes,
//     and we fall through to the end of the function.
//
//     Even with retries = 3 (default), consider: What if fetch() succeeds
//     but returns a Response that is then somehow lost? Actually no, return
//     guarantees exit...
//
//     Wait, I need to reconsider: The loop will always either:
//     1. Return (on success)
//     2. Continue (on failure, not last retry)
//     3. Throw (on failure, last retry)
//
//     If retries > 0, all paths exit. If retries <= 0, loop never runs.
//     The function needs a default return or throw after the loop for
//     the retries <= 0 case.
//   `,
//   fix: "Add 'throw new Error(\"No retries configured\")' after the loop"
// }
```

#### 3.5 Mapped Type Never Explanation
```typescript
type RemoveNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K]
};

type Original = { a: string; b: never; c: number; d: never };
type Filtered = RemoveNever<Original>;

await semantic.never.explainMappedType(
  `{ [K in keyof T as T[K] extends never ? never : K]: T[K] }`,
  { T: '{ a: string; b: never; c: number; d: never }' }
);
// LLM Response: {
//   resultType: "{ a: string; c: number }",
//   explanation: `
//     This mapped type uses key remapping to filter out never-valued properties:
//
//     For each key K in Original:
//     - 'a': string extends never? No -> key remains 'a', value is string
//     - 'b': never extends never? Yes -> key becomes never (removed!)
//     - 'c': number extends never? No -> key remains 'c', value is number
//     - 'd': never extends never? Yes -> key becomes never (removed!)
//
//     When a key is remapped to never, it's removed from the resulting type.
//     This is TypeScript's key remapping feature using 'as'.
//   `,
//   neverBehavior: "Keys remapped to never are omitted from the output type"
// }
```

#### 3.6 Discriminated Union Analysis
```typescript
type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string }
  | { type: 'scroll'; delta: number };

const handler = `
function handleEvent(event: Event) {
  switch (event.type) {
    case 'click': return \`Clicked at \${event.x}, \${event.y}\`;
    case 'keypress': return \`Pressed \${event.key}\`;
  }
}
`;

await semantic.never.analyzeDiscriminatedUnion(handler, { eventType: 'Event' });
// LLM Response: {
//   exhaustive: false,
//   discriminant: "type",
//   allCases: ["click", "keypress", "scroll"],
//   handledCases: ["click", "keypress"],
//   missingCases: ["scroll"],
//   afterSwitch: {
//     type: "{ type: 'scroll'; delta: number }",
//     isNever: false
//   },
//   recommendation: `
//     Add a case for 'scroll' or add exhaustiveness check:
//
//     default:
//       const _exhaustive: never = event;
//       throw new Error(\`Unhandled event: \${event.type}\`);
//   `
// }
```

---

## 4. Semantic Type Guards - LLM-Powered Analysis Functions

### Core Concept
Provide type guard-like functions that use LLM analysis to determine properties about `never` and unreachability.

### Ideas

#### 4.1 isExhaustive - Check Exhaustiveness
```typescript
// Check if a switch/if-chain is exhaustive
const result = await semantic.never.isExhaustive(`
  switch (direction) {
    case 'north': return move(0, 1);
    case 'south': return move(0, -1);
    case 'east': return move(1, 0);
    case 'west': return move(-1, 0);
  }
`, {
  discriminantType: "'north' | 'south' | 'east' | 'west'"
});

// Result: {
//   exhaustive: true,
//   coverage: 1.0,
//   missingCases: []
// }
```

#### 4.2 isDeadCode - Detect Unreachable Code
```typescript
const result = await semantic.never.isDeadCode(`
  function process(value: string) {
    if (typeof value !== 'string') {
      console.log('Not a string'); // Is this dead?
      return null;
    }
    return value.trim();
  }
`);

// Result: {
//   hasDeadCode: true,
//   deadSegments: [{
//     lines: [3, 4],
//     code: "console.log('Not a string'); return null;",
//     reason: "typeof check is always false for parameter typed as string"
//   }]
// }
```

#### 4.3 shouldBeReachable - Intent Detection
```typescript
// Detect if code LOOKS like it should be reachable but isn't
const result = await semantic.never.shouldBeReachable(`
  function getDiscount(tier: 'basic' | 'premium') {
    if (tier === 'basic') return 0.1;
    if (tier === 'premium') return 0.2;
    if (tier === 'enterprise') return 0.3; // Suspicious!
    return 0;
  }
`);

// Result: {
//   suspiciousCode: [{
//     line: 5,
//     code: "if (tier === 'enterprise') return 0.3;",
//     analysis: {
//       isReachable: false,
//       looksIntentional: true,
//       reasoning: "The string 'enterprise' suggests a valid business tier
//                   that may be missing from the type definition",
//       suggestion: "Consider adding 'enterprise' to the tier union type"
//     }
//   }]
// }
```

#### 4.4 isBottomType - Check for Never Equivalence
```typescript
// Check if a complex type is equivalent to never
const result = await semantic.never.isBottomType(`
  type Impossible = string & number & { foo: boolean }
`);

// Result: {
//   isBottom: true,
//   equivalentToNever: true,
//   reason: "string & number is already never; intersection with object is still never"
// }
```

#### 4.5 hasNeverBranch - Analyze Conditional Paths
```typescript
const result = await semantic.never.hasNeverBranch(`
  type ProcessResult<T> = T extends string
    ? { text: T }
    : T extends number
      ? { value: T }
      : never;
`);

// Result: {
//   hasNeverBranch: true,
//   neverCondition: "T is not string and not number",
//   coveredTypes: ["string", "number"],
//   neverTriggeredBy: ["boolean", "object", "null", "undefined", "symbol", "bigint"]
// }
```

#### 4.6 canProduceNever - Runtime Risk Assessment
```typescript
// Check if a function could produce a never-typed value at runtime
const result = await semantic.never.canProduceNever(`
  function assertStatus(status: Status): asserts status is 'active' {
    if (status !== 'active') {
      throw new Error('Must be active');
    }
  }

  // After calling this, other Status values become never
`);

// Result: {
//   canProduceNever: true,
//   mechanism: "assertion function narrows type",
//   riskScenarios: [
//     "If called with status='pending', throws at runtime",
//     "After call, status type is narrowed - other union members become never"
//   ],
//   safetyScore: 0.7
// }
```

#### 4.7 isTypeHole - Detect Type-Level Impossibilities
```typescript
// Detect if there's a "type hole" - impossible state the type system can't catch
const result = await semantic.never.isTypeHole(`
  const arr: string[] = [];
  const first: string = arr[0]; // Type says string, but it's undefined!
`);

// Result: {
//   isTypeHole: true,
//   location: "arr[0]",
//   declaredType: "string",
//   actualPossibleType: "string | undefined",
//   explanation: "Array index access in TypeScript doesn't account for
//                 out-of-bounds access. The runtime value could be undefined
//                 even though the type says string.",
//   recommendation: "Enable noUncheckedIndexedAccess in tsconfig"
// }
```

#### 4.8 wouldNeverTerminate - Infinite Loop Detection
```typescript
const result = await semantic.never.wouldNeverTerminate(`
  function process(items: string[]) {
    let i = 0;
    while (i < items.length) {
      console.log(items[i]);
      // Forgot i++!
    }
  }
`);

// Result: {
//   mightNotTerminate: true,
//   scenario: "If items.length > 0, loop never exits",
//   missingCode: "Loop variable 'i' is never incremented",
//   confidence: 0.95,
//   fix: "Add 'i++' at end of loop body"
// }
```

---

## 5. Semantic Operations - Novel Never Operations

### Core Concept
Provide semantic operations that leverage LLMs to perform sophisticated analysis and transformations related to `never`.

### Ideas

#### 5.1 never.explainUnreachability()
```typescript
const explanation = await semantic.never.explainUnreachability(`
  function impossible(x: string & number) {
    return x.toString(); // Why can't we reach this?
  }
`, {
  audience: 'junior-developer',
  includeExamples: true
});

// Result: `
// This code is unreachable because the parameter type 'string & number' is impossible.
//
// Think of it this way:
// - A string is text like "hello" or "123"
// - A number is a numeric value like 42 or 3.14
// - 'string & number' means "something that is BOTH a string AND a number at the same time"
//
// In TypeScript, nothing can be both! So this type is called 'never' - it has no values.
//
// Example of why this is impossible:
//   const x: string = "hello";  // This is a string
//   const y: number = 42;       // This is a number
//   const z: string & number = ???  // What could go here? Nothing!
//
// Since no value can ever be passed to this function, the code inside can never run.
// `
```

#### 5.2 never.findCause()
```typescript
const cause = await semantic.never.findCause(`
  type EventHandler<T> = T extends { type: string }
    ? (event: T) => void
    : never;

  type MyHandler = EventHandler<string>; // Why is this never?
`);

// Result: {
//   cause: "type parameter constraint not met",
//   trace: [
//     "EventHandler<string> instantiated",
//     "T = string",
//     "Checking: string extends { type: string }?",
//     "Result: false - string is a primitive, not an object with 'type' property",
//     "Taking else branch: never"
//   ],
//   wouldWork: "EventHandler<{ type: 'click' }> -> (event: { type: 'click' }) => void"
// }
```

#### 5.3 never.suggestFix()
```typescript
const fix = await semantic.never.suggestFix(`
  function handleResponse(resp: 'success' | 'error' | 'pending') {
    if (resp === 'success') return true;
    if (resp === 'error') return false;
    // TypeScript says resp is 'pending' but we want exhaustive check
  }
`, { wantExhaustive: true });

// Result: {
//   issue: "Missing case for 'pending'",
//   suggestions: [
//     {
//       description: "Add explicit pending case",
//       code: `if (resp === 'pending') return null;`
//     },
//     {
//       description: "Add exhaustiveness assertion",
//       code: `const _exhaustive: never = resp;\nthrow new Error(\`Unexpected: \${resp}\`);`
//     },
//     {
//       description: "Use switch with default",
//       code: `switch (resp) {\n  case 'success': return true;\n  case 'error': return false;\n  case 'pending': return null;\n}`
//     }
//   ],
//   recommended: 0,
//   reasoning: "Explicit case handling is clearer than exhaustiveness assertions"
// }
```

#### 5.4 never.traceNarrowing()
```typescript
const trace = await semantic.never.traceNarrowing(`
  function process(x: string | number | boolean) {
    if (typeof x === 'string') {
      console.log('string');
    } else if (typeof x === 'number') {
      console.log('number');
    } else if (typeof x === 'boolean') {
      console.log('boolean');
    } else {
      // What is x here?
    }
  }
`);

// Result: {
//   finalType: "never",
//   narrowingSteps: [
//     { after: "typeof x === 'string'", remaining: "number | boolean", eliminated: "string" },
//     { after: "typeof x === 'number'", remaining: "boolean", eliminated: "number" },
//     { after: "typeof x === 'boolean'", remaining: "never", eliminated: "boolean" }
//   ],
//   visualization: `
//     string | number | boolean
//              │
//     ─────────┼───────────── typeof === 'string'?
//              │ no
//              ▼
//       number | boolean
//              │
//     ─────────┼───────────── typeof === 'number'?
//              │ no
//              ▼
//          boolean
//              │
//     ─────────┼───────────── typeof === 'boolean'?
//              │ no
//              ▼
//           never
//   `
// }
```

#### 5.5 never.generateExhaustiveSwitch()
```typescript
const generated = await semantic.never.generateExhaustiveSwitch(
  `type Status = 'draft' | 'review' | 'approved' | 'published' | 'archived'`,
  {
    discriminant: 'status',
    returnType: 'string',
    includeAssertNever: true
  }
);

// Result: `
// function getStatusLabel(status: Status): string {
//   switch (status) {
//     case 'draft':
//       return 'Draft';
//     case 'review':
//       return 'Under Review';
//     case 'approved':
//       return 'Approved';
//     case 'published':
//       return 'Published';
//     case 'archived':
//       return 'Archived';
//     default:
//       const _exhaustive: never = status;
//       throw new Error(\`Unhandled status: \${status}\`);
//   }
// }
// `
```

#### 5.6 never.detectPhantomTypes()
```typescript
// Find types that exist in code but can never have values
const phantoms = await semantic.never.detectPhantomTypes(`
  interface Brand<T> {
    readonly __brand: T;
  }

  type UserId = string & Brand<'user'>;
  type PostId = string & Brand<'post'>;

  // How do you actually create these?
`);

// Result: {
//   phantomTypes: [
//     {
//       name: "Brand<T>",
//       issue: "Interface with readonly property can't be naturally constructed
//               with a string (strings don't have __brand property)",
//       solution: "Use type assertion: 'abc' as UserId",
//       purpose: "This is intentional - it's the branded/nominal type pattern"
//     }
//   ],
//   assessment: "These are intentionally uninhabitable types for type safety,
//                not bugs. Values must be explicitly cast to these types."
// }
```

#### 5.7 never.findNeverPaths()
```typescript
// Find all code paths that lead to never
const neverPaths = await semantic.never.findNeverPaths(`
  function complexLogic(input: Input): Output {
    if (input.type === 'a') {
      if (input.subtype === 'a1') return outputA1(input);
      if (input.subtype === 'a2') return outputA2(input);
      throw new Error('Unknown a subtype');
    }
    if (input.type === 'b') {
      return outputB(input);
    }
    throw new Error('Unknown type');
  }
`);

// Result: {
//   neverPaths: [
//     {
//       path: "input.type === 'a' && input.subtype !== 'a1' && input.subtype !== 'a2'",
//       terminates: "throw new Error('Unknown a subtype')",
//       isIntentional: true,
//       inputType: "Should be never if subtype union is complete"
//     },
//     {
//       path: "input.type !== 'a' && input.type !== 'b'",
//       terminates: "throw new Error('Unknown type')",
//       isIntentional: true,
//       inputType: "Should be never if type union is complete"
//     }
//   ],
//   normalPaths: [
//     "input.type === 'a' && input.subtype === 'a1' -> outputA1",
//     "input.type === 'a' && input.subtype === 'a2' -> outputA2",
//     "input.type === 'b' -> outputB"
//   ]
// }
```

#### 5.8 never.simulateExecution()
```typescript
// Simulate what happens when never-returning code is (theoretically) reached
const simulation = await semantic.never.simulateExecution(`
  function assertNever(x: never): never {
    throw new Error(\`Unexpected value: \${JSON.stringify(x)}\`);
  }

  // If we somehow passed {type: 'unknown'} at runtime...
`, {
  simulatedValue: { type: 'unknown' }
});

// Result: {
//   wouldThrow: true,
//   errorMessage: "Unexpected value: {\"type\":\"unknown\"}",
//   stackTrace: "Error: Unexpected value: {\"type\":\"unknown\"}\n    at assertNever",
//   runtimeBehavior: "The function would throw at runtime, crashing if uncaught",
//   howThisHappens: [
//     "Type assertion bypassing TypeScript: value as never",
//     "Any type flowing through: value as any as never",
//     "JSON parsing without validation",
//     "External data from API/database"
//   ]
// }
```

#### 5.9 never.generateTypeGuard()
```typescript
// Generate a type guard that narrows to never
const guard = await semantic.never.generateTypeGuard(
  `type State = 'loading' | 'success' | 'error'`,
  { excludeAll: true }
);

// Result: `
// function isValidState(value: unknown): value is State {
//   return value === 'loading' || value === 'success' || value === 'error';
// }
//
// function assertState(value: unknown): asserts value is State {
//   if (!isValidState(value)) {
//     // After this, value would be 'never' in the calling code's perspective
//     throw new TypeError(\`Invalid state: \${value}\`);
//   }
// }
//
// // Usage to narrow to never:
// function narrowToNever(state: State) {
//   if (state === 'loading') return;
//   if (state === 'success') return;
//   if (state === 'error') return;
//
//   // TypeScript knows: state is now 'never'
//   const exhaustive: never = state;
// }
// `
```

#### 5.10 never.explainContravariance()
```typescript
// Explain never's special role in contravariant positions
const explanation = await semantic.never.explainContravariance(`
  type Func<T> = (arg: T) => void;

  // Why does this work?
  const neverFunc: Func<never> = (x) => {};
  const stringFunc: Func<string> = neverFunc; // Assignable!
`);

// Result: {
//   explanation: `
//     This works because of contravariance in function parameters:
//
//     Func<never> can be assigned to Func<string> because:
//     - A function that accepts 'never' can accept ANY type (vacuously true)
//     - Since no value is of type 'never', the function can never be called
//       with a valid argument, so it's "safe" to assign to any other Func<T>
//
//     Think of it this way:
//     - Func<never> promises to handle 'never' (which nothing satisfies)
//     - Func<string> needs to handle 'string' (which many things satisfy)
//     - Since Func<never> handles the "impossible", it trivially handles anything
//
//     This is the opposite of covariance (return types), where:
//     - never is assignable TO everything (as a return type)
//     - but nothing is assignable TO never (as a parameter)
//   `,
//   practicalUse: "Useful for function composition and type manipulation"
// }
```

---

## 6. Exhaustiveness Checking - LLM-Powered Analysis

### Core Concept
Sophisticated LLM-powered exhaustiveness analysis that goes beyond simple switch statements.

### Ideas

#### 6.1 Deep Exhaustiveness Analysis
```typescript
const analysis = await semantic.never.analyzeExhaustiveness(`
  type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'rectangle'; width: number; height: number }
    | { kind: 'triangle'; base: number; height: number };

  function area(shape: Shape): number {
    if (shape.kind === 'circle') {
      return Math.PI * shape.radius ** 2;
    }
    if (shape.kind === 'rectangle') {
      return shape.width * shape.height;
    }
    // Missing triangle!
    return 0;
  }
`);

// Result: {
//   exhaustive: false,
//   discriminant: "kind",
//   coverage: {
//     handled: ["circle", "rectangle"],
//     missing: ["triangle"],
//     percentage: 0.67
//   },
//   implicitBranch: {
//     type: "{ kind: 'triangle'; base: number; height: number }",
//     currentBehavior: "Falls through to 'return 0'",
//     correctImplementation: "return (shape.base * shape.height) / 2;"
//   },
//   autoFix: `
//     if (shape.kind === 'triangle') {
//       return (shape.base * shape.height) / 2;
//     }
//   `
// }
```

#### 6.2 Nested Exhaustiveness
```typescript
const nested = await semantic.never.analyzeNestedExhaustiveness(`
  type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
  type ApiResponse = Result<User, 'not_found' | 'unauthorized' | 'server_error'>;

  function handleResponse(resp: ApiResponse) {
    if (resp.ok) {
      return resp.value;
    } else {
      if (resp.error === 'not_found') return null;
      if (resp.error === 'unauthorized') throw new AuthError();
      // Missing server_error!
    }
  }
`);

// Result: {
//   exhaustive: false,
//   levels: [
//     { discriminant: "ok", handled: [true, false], exhaustive: true },
//     {
//       discriminant: "error",
//       context: "when ok === false",
//       handled: ["not_found", "unauthorized"],
//       missing: ["server_error"],
//       exhaustive: false
//     }
//   ],
//   suggestion: "Add case for 'server_error' in the else branch"
// }
```

#### 6.3 Pattern Match Exhaustiveness
```typescript
// Analyze destructuring pattern exhaustiveness
const patterns = await semantic.never.analyzePatternExhaustiveness(`
  type Point = { x: number } | { y: number } | { x: number; y: number };

  function describePoint(p: Point): string {
    if ('x' in p && 'y' in p) return 'both';
    if ('x' in p) return 'x only';
    if ('y' in p) return 'y only';
    return 'neither'; // Is this reachable?
  }
`);

// Result: {
//   exhaustive: true,
//   patternAnalysis: [
//     { pattern: "'x' in p && 'y' in p", matches: "{ x: number; y: number }" },
//     { pattern: "'x' in p", matches: "{ x: number }" },
//     { pattern: "'y' in p", matches: "{ y: number }" }
//   ],
//   deadCode: {
//     hasDeadCode: true,
//     location: "return 'neither'",
//     reason: "All union members have either 'x' or 'y' or both"
//   }
// }
```

#### 6.4 Async Exhaustiveness
```typescript
// Analyze exhaustiveness across async operations
const asyncAnalysis = await semantic.never.analyzeAsyncExhaustiveness(`
  type FetchState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

  function FetchComponent({ state }: { state: FetchState<User> }) {
    switch (state.status) {
      case 'idle': return <Button>Start</Button>;
      case 'loading': return <Spinner />;
      case 'success': return <UserCard user={state.data} />;
      // Missing error case!
    }
  }
`);

// Result: {
//   exhaustive: false,
//   uiImplication: "Error state will render nothing (undefined)",
//   userExperience: "Users will see blank screen on API errors",
//   missingCase: {
//     status: 'error',
//     suggestedRender: "return <ErrorMessage error={state.error} />;"
//   }
// }
```

#### 6.5 Boolean Combination Exhaustiveness
```typescript
// Analyze exhaustiveness of boolean flag combinations
const booleans = await semantic.never.analyzeBooleanExhaustiveness(`
  interface Config {
    enableA: boolean;
    enableB: boolean;
    enableC: boolean;
  }

  function getMode(config: Config): string {
    if (config.enableA && config.enableB) return 'AB';
    if (config.enableA && config.enableC) return 'AC';
    if (config.enableB && config.enableC) return 'BC';
    if (config.enableA) return 'A';
    return 'default';
  }
`);

// Result: {
//   totalCombinations: 8, // 2^3
//   analyzed: [
//     { enableA: true, enableB: true, enableC: true, result: 'AB', note: 'C ignored' },
//     { enableA: true, enableB: true, enableC: false, result: 'AB' },
//     { enableA: true, enableB: false, enableC: true, result: 'AC' },
//     { enableA: true, enableB: false, enableC: false, result: 'A' },
//     { enableA: false, enableB: true, enableC: true, result: 'BC' },
//     { enableA: false, enableB: true, enableC: false, result: 'default' },
//     { enableA: false, enableB: false, enableC: true, result: 'default' },
//     { enableA: false, enableB: false, enableC: false, result: 'default' }
//   ],
//   uncoveredSpecifically: [
//     "enableB only (gets 'default', intentional?)",
//     "enableC only (gets 'default', intentional?)"
//   ],
//   possibleBug: "enableA && enableB && enableC returns 'AB', ignoring enableC"
// }
```

#### 6.6 Version-Aware Exhaustiveness
```typescript
// Check exhaustiveness against changing type definitions
const versionCheck = await semantic.never.checkVersionExhaustiveness(`
  // v1.0 types
  type Status_v1 = 'pending' | 'active' | 'complete';

  // v2.0 types (added 'cancelled')
  type Status_v2 = 'pending' | 'active' | 'complete' | 'cancelled';

  // Existing handler (written for v1)
  function handleStatus(status: Status_v2) {
    switch (status) {
      case 'pending': return 'Waiting...';
      case 'active': return 'In progress';
      case 'complete': return 'Done!';
    }
  }
`);

// Result: {
//   wasExhaustiveForV1: true,
//   exhaustiveForV2: false,
//   breakingChange: {
//     added: ["cancelled"],
//     impact: "Handler will return undefined for 'cancelled' status"
//   },
//   migrationGuide: `
//     Add case for new 'cancelled' status:
//     case 'cancelled': return 'Cancelled';
//   `
// }
```

---

## 7. Edge Cases & Challenges

### Core Concept
Handle the tricky edge cases where `never` behavior is subtle or counterintuitive.

### Ideas

#### 7.1 Conditional Type Distribution
```typescript
await semantic.never.explainEdgeCase(`
  type ToArray<T> = T extends any ? T[] : never;

  type Test1 = ToArray<string | number>;  // string[] | number[]
  type Test2 = ToArray<never>;            // never (not never[])
`);

// Result: {
//   edgeCase: "never in distributive conditional types",
//   explanation: `
//     When never is used as the type argument in a distributive conditional type:
//     - Distribution happens over union members
//     - never is the "empty union" (zero members)
//     - Distributing over zero members yields never
//
//     ToArray<never> = never extends any ? never[] : never
//     But distribution means: "for each member of never, apply the type"
//     Since never has no members, the result is never (not never[]).
//
//     This is similar to how sum([]) = 0 and product([]) = 1:
//     The empty case has a special identity result.
//   `
// }
```

#### 7.2 Never in Unions
```typescript
await semantic.never.explainEdgeCase(`
  type Test = string | never | number; // = string | number
`);

// Result: {
//   edgeCase: "never disappears from unions",
//   explanation: `
//     'never' is the identity element for unions:
//     - string | never = string
//     - T | never = T
//
//     This makes sense because:
//     - Union represents "one of these types"
//     - never has no values, so "string OR never" = "string OR nothing" = string
//
//     It's like adding zero: x + 0 = x
//   `
// }
```

#### 7.3 Never in Intersections
```typescript
await semantic.never.explainEdgeCase(`
  type Test = string & never; // = never
`);

// Result: {
//   edgeCase: "never absorbs intersections",
//   explanation: `
//     'never' is the absorbing element for intersections:
//     - string & never = never
//     - T & never = never
//
//     This makes sense because:
//     - Intersection represents "all of these types"
//     - A value must satisfy BOTH string AND never
//     - Since no value is never, no value can satisfy both
//
//     It's like multiplying by zero: x * 0 = 0
//   `
// }
```

#### 7.4 Function Return Never vs Throwing
```typescript
await semantic.never.explainEdgeCase(`
  function throws(): never {
    throw new Error('!');
  }

  function loops(): never {
    while (true) {}
  }

  async function asyncThrows(): Promise<never> {
    throw new Error('!');
  }

  // Are these all the same?
`);

// Result: {
//   edgeCase: "never-returning functions",
//   variants: [
//     {
//       name: "Synchronous throw",
//       returns: "never",
//       behavior: "Immediately throws, stack unwinds"
//     },
//     {
//       name: "Infinite loop",
//       returns: "never",
//       behavior: "Never completes, blocks thread"
//     },
//     {
//       name: "Async throw",
//       returns: "Promise<never>",
//       behavior: "Returns a Promise that rejects. Caller receives Promise,
//                  but awaiting yields never (rejection)."
//     }
//   ],
//   subtlety: "Promise<never> is NOT never - it's a valid Promise object.
//              Only the resolved value (which can't exist) is never."
// }
```

#### 7.5 Mapped Types and Never Keys
```typescript
await semantic.never.explainEdgeCase(`
  type Example = {
    [K in 'a' | 'b' as K extends 'a' ? never : K]: string
  };
  // Result: { b: string }
`);

// Result: {
//   edgeCase: "Key remapping to never",
//   explanation: `
//     When a key is remapped to 'never' using 'as', it's excluded:
//
//     For K = 'a': K extends 'a' ? never : K = never (key removed)
//     For K = 'b': K extends 'b' ? never : K = 'b' (key kept)
//
//     Result: { b: string }
//
//     This is how you filter object types by key characteristics.
//   `
// }
```

#### 7.6 Never Assignment Paradox
```typescript
await semantic.never.explainEdgeCase(`
  function example() {
    const x: never = 1 as never; // Compiles!
    console.log(x); // Runs!
  }
`);

// Result: {
//   edgeCase: "Forcing never values with type assertions",
//   explanation: `
//     Type assertions (as) bypass TypeScript's type checking.
//     '1 as never' tells TypeScript "trust me, this is never."
//
//     At runtime, x is just 1 - JavaScript doesn't know about never.
//
//     This is dangerous because:
//     - Code after never assignments is "supposed" to be unreachable
//     - TypeScript may optimize or warn based on this assumption
//     - You've created a type-level lie
//
//     Legitimate uses are rare (testing, edge cases in generic code).
//   `,
//   warning: "Avoid 'as never' unless you truly understand the implications"
// }
```

#### 7.7 Never in Generics
```typescript
await semantic.never.explainEdgeCase(`
  function identity<T>(x: T): T {
    return x;
  }

  // What happens here?
  const result = identity<never>(undefined as never);
`);

// Result: {
//   edgeCase: "never as generic type argument",
//   explanation: `
//     When T = never:
//     - identity<never> has signature (x: never) => never
//     - The function can never be called normally (no never values exist)
//     - Using 'undefined as never' is a type lie to force the call
//
//     The result type is 'never', but at runtime it's undefined.
//
//     Practical impact:
//     - Never-parameterized functions are effectively uncallable
//     - This can be useful for "impossible" API designs
//   `
// }
```

#### 7.8 Infer and Never
```typescript
await semantic.never.explainEdgeCase(`
  type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

  type Test = GetReturnType<string>; // never
`);

// Result: {
//   edgeCase: "infer fallback to never",
//   explanation: `
//     GetReturnType<string>:
//     - Does string extend (...args: any[]) => infer R? No!
//     - String is not a function
//     - Takes the else branch: never
//
//     This pattern uses never as "not applicable" or "invalid input".
//     When you try to extract a return type from a non-function, you get never.
//
//     Alternative design with error message:
//     type GetReturnType<T> = T extends (...args: any[]) => infer R
//       ? R
//       : { error: 'T is not a function' };
//   `
// }
```

---

## 8. Wild Ideas - Creative LLM-Powered Never Analysis

### Core Concept
Push the boundaries with creative, experimental applications of LLM reasoning about `never`.

### Ideas

#### 8.1 Temporal Never Analysis
```typescript
// Analyze how types become never over time in async flows
const temporal = await semantic.never.analyzeTemporalNever(`
  type SessionState =
    | { status: 'active'; token: string; expiresAt: Date }
    | { status: 'expired' }
    | { status: 'revoked' };

  async function useSession(session: SessionState) {
    if (session.status !== 'active') return null;

    // session.status is 'active' here
    await someAsyncOperation();

    // Is session.status still definitely 'active'?
    // (Temporal type narrowing problem!)
    return session.token;
  }
`);

// Result: {
//   temporalIssue: true,
//   explanation: `
//     After await, the type narrowing of session.status may be stale!
//
//     In real systems:
//     - Session could expire during someAsyncOperation()
//     - Another process could revoke the session
//     - The narrowing from line 5 may be temporally invalid at line 9
//
//     TypeScript can't model time-based invalidation of type narrowings.
//   `,
//   recommendation: "Re-check session validity after async operations",
//   saferPattern: `
//     async function useSession(session: SessionState) {
//       if (session.status !== 'active') return null;
//       await someAsyncOperation();
//
//       // Re-validate after async gap
//       const currentSession = await refreshSession(session.token);
//       if (currentSession.status !== 'active') return null;
//
//       return currentSession.token;
//     }
//   `
// }
```

#### 8.2 Probabilistic Never
```typescript
// Estimate probability that code paths are reachable
const probabilistic = await semantic.never.probabilisticAnalysis(`
  function processUser(user: User | null) {
    if (!user) {
      // How often do we hit this?
      logNullUser();
      return;
    }

    if (user.role === 'admin' && user.department === 'sales') {
      // Is this combination ever actually used?
      handleAdminSales(user);
    }
  }
`, {
  domainContext: "E-commerce platform where admins are typically in 'tech' or 'support'",
  productionMetrics: { nullUserRate: 0.001, adminSalesCount: 0 }
});

// Result: {
//   branches: [
//     {
//       condition: "!user",
//       staticType: "reachable",
//       estimatedFrequency: "0.1% (1 in 1000)",
//       assessment: "Low but non-zero, keep handling"
//     },
//     {
//       condition: "user.role === 'admin' && user.department === 'sales'",
//       staticType: "reachable",
//       estimatedFrequency: "~0% (0 occurrences in production)",
//       assessment: "Effectively dead code. Consider if this combination is even valid."
//     }
//   ],
//   recommendation: "Consider making admin+sales a type-level impossibility if invalid"
// }
```

#### 8.3 Never Archaeology
```typescript
// Analyze code history to find when never-assertions broke
const archaeology = await semantic.never.analyzeHistory(`
  // Current code with runtime error
  function handleEvent(event: Event) {
    switch (event.type) {
      case 'click': return handleClick(event);
      case 'hover': return handleHover(event);
      default:
        const _never: never = event; // Runtime error in production!
        throw new Error('Unexpected event type');
    }
  }
`, {
  gitHistory: true,
  recentCommits: 50
});

// Result: {
//   brokenSince: "commit abc123 (3 days ago)",
//   breakingChange: "Added 'drag' to Event type union without updating handler",
//   author: "developer@example.com",
//   suggestedFix: `
//     case 'drag': return handleDrag(event);
//   `,
//   preventionStrategy: "Add exhaustiveness test that runs on type changes"
// }
```

#### 8.4 Impossible State Machine Analysis
```typescript
// Analyze state machines for impossible states
const stateMachine = await semantic.never.analyzeStateMachine(`
  type State = 'idle' | 'loading' | 'success' | 'error';
  type Event = 'fetch' | 'resolve' | 'reject' | 'reset';

  function transition(state: State, event: Event): State {
    if (state === 'idle' && event === 'fetch') return 'loading';
    if (state === 'loading' && event === 'resolve') return 'success';
    if (state === 'loading' && event === 'reject') return 'error';
    if (event === 'reset') return 'idle';
    return state; // No transition
  }
`);

// Result: {
//   states: ['idle', 'loading', 'success', 'error'],
//   events: ['fetch', 'resolve', 'reject', 'reset'],
//   transitionMatrix: `
//     State\\Event | fetch    | resolve  | reject  | reset
//     ------------|----------|----------|---------|-------
//     idle        | loading  | idle     | idle    | idle
//     loading     | loading  | success  | error   | idle
//     success     | success  | success  | success | idle
//     error       | error    | error    | error   | idle
//   `,
//   unreachableTransitions: [
//     "success + fetch (could this ever happen?)",
//     "error + resolve (makes no semantic sense)"
//   ],
//   impossibleStates: [],
//   issues: [
//     "Can fetch while already loading (no debounce)",
//     "Can't refetch after success (no retry path)"
//   ],
//   typeImprovements: `
//     // Make invalid transitions unrepresentable
//     type ValidTransition =
//       | { from: 'idle'; event: 'fetch' }
//       | { from: 'loading'; event: 'resolve' | 'reject' }
//       | { from: State; event: 'reset' };
//   `
// }
```

#### 8.5 AI-Powered Dead Code Elimination
```typescript
// Use LLM to identify semantically dead code
const deadCode = await semantic.never.findSemanticDeadCode(`
  function calculateShipping(weight: number, destination: Country): number {
    if (weight <= 0) {
      // Dead: weight validated as positive earlier
      return 0;
    }

    if (destination === 'US') {
      return weight * 1.5;
    }

    if (destination === 'CA') {
      return weight * 2.0;
    }

    // Seemingly unreachable for Country = 'US' | 'CA'
    // But what if Country enum changes?
    return weight * 5.0;
  }
`, {
  projectContext: "Shipping service for US and Canada only",
  relatedValidation: "weight is validated positive in calling code"
});

// Result: {
//   deadSegments: [
//     {
//       lines: [3, 5],
//       code: "if (weight <= 0) { return 0; }",
//       reason: "Weight is validated positive before this function is called",
//       confidence: 0.85,
//       recommendation: "Remove or convert to assertion for safety"
//     }
//   ],
//   suspiciouslyDeadSegments: [
//     {
//       lines: [15],
//       code: "return weight * 5.0;",
//       reason: "If Country is only 'US' | 'CA', this is unreachable",
//       confidence: 0.7,
//       recommendation: "Add exhaustiveness check or verify Country type"
//     }
//   ]
// }
```

#### 8.6 Never as Documentation Generator
```typescript
// Generate documentation from never-based type constraints
const docs = await semantic.never.generateConstraintDocs(`
  type ValidAge = number & { __brand: 'ValidAge' };

  function createValidAge(n: number): ValidAge | never {
    if (n < 0 || n > 150) {
      throw new RangeError('Age must be 0-150');
    }
    return n as ValidAge;
  }

  type NonEmptyString = string & { __brand: 'NonEmpty' };

  function createNonEmptyString(s: string): NonEmptyString | never {
    if (s.trim().length === 0) {
      throw new Error('String must not be empty');
    }
    return s as NonEmptyString;
  }
`);

// Result: `
// # Type Constraints Documentation
//
// ## ValidAge
// A branded number type representing a valid age value.
//
// ### Constraints
// - Must be a number
// - Must be >= 0
// - Must be <= 150
//
// ### Invalid Inputs (throw/never)
// - Negative numbers
// - Numbers > 150
// - NaN, Infinity
//
// ### Creation
// \`\`\`typescript
// const age: ValidAge = createValidAge(25); // OK
// const bad: ValidAge = createValidAge(-1); // Throws RangeError
// \`\`\`
//
// ## NonEmptyString
// A branded string type representing a non-empty string.
//
// ### Constraints
// - Must be a string
// - Must have at least one non-whitespace character
//
// ### Invalid Inputs (throw/never)
// - Empty string ""
// - Whitespace-only string "   "
//
// `
```

#### 8.7 Contract-Based Never Inference
```typescript
// Infer never types from contracts/assertions
const contracts = await semantic.never.inferFromContracts(`
  /**
   * @param age - Must be positive integer
   * @throws {RangeError} If age is negative or non-integer
   */
  function processAge(age: number): void {
    if (age < 0) throw new RangeError('Negative age');
    if (!Number.isInteger(age)) throw new RangeError('Non-integer age');

    // What type is age here?
    console.log(age);
  }
`);

// Result: {
//   inferredNarrowing: {
//     parameter: "age",
//     inputType: "number",
//     afterValidation: "number & { /* positive integer */ }",
//     neverCases: ["negative numbers", "non-integers", "NaN", "Infinity"]
//   },
//   suggestedType: `
//     type PositiveInteger = number & { __brand: 'PositiveInteger' };
//
//     function processAge(age: PositiveInteger): void {
//       // No runtime checks needed - type guarantees validity
//       console.log(age);
//     }
//   `,
//   contractToType: "Convert JSDoc @throws into never-based type constraints"
// }
```

#### 8.8 Cross-Service Never Analysis
```typescript
// Analyze never states across microservice boundaries
const crossService = await semantic.never.analyzeCrossServiceNever(`
  // Order Service
  type OrderState = 'pending' | 'paid' | 'shipped' | 'delivered';

  // Payment Service
  type PaymentState = 'pending' | 'completed' | 'failed' | 'refunded';

  // Can we have order='shipped' with payment='pending'?
`, {
  constraints: [
    "Order can only be 'shipped' after payment='completed'",
    "If payment='failed', order must be 'pending'"
  ]
});

// Result: {
//   impossibleCombinations: [
//     {
//       combination: { order: 'shipped', payment: 'pending' },
//       reason: "Order cannot ship without completed payment",
//       shouldBeNever: true
//     },
//     {
//       combination: { order: 'shipped', payment: 'failed' },
//       reason: "Shipping requires successful payment",
//       shouldBeNever: true
//     },
//     {
//       combination: { order: 'delivered', payment: 'refunded' },
//       reason: "Semantically odd - delivered but refunded",
//       shouldBeNever: "possibly - depends on business rules"
//     }
//   ],
//   suggestedInvariantType: `
//     type ValidOrderPaymentState =
//       | { order: 'pending'; payment: 'pending' | 'failed' }
//       | { order: 'paid'; payment: 'completed' }
//       | { order: 'shipped'; payment: 'completed' }
//       | { order: 'delivered'; payment: 'completed' | 'refunded' };
//   `
// }
```

#### 8.9 Natural Language Never Queries
```typescript
// Query about never using natural language
const query = await semantic.never.ask(`
  Can a user ever have role='admin' and permissions=[] in our system?
`, {
  codebase: './src',
  types: ['User', 'Role', 'Permission']
});

// Result: {
//   answer: "No, this should be impossible",
//   reasoning: `
//     Based on analysis of your codebase:
//
//     1. User type definition requires permissions to be Permission[]
//     2. Role 'admin' is only assignable via grantAdminRole()
//     3. grantAdminRole() always adds ['read', 'write', 'delete', 'admin']
//     4. There's no way to clear permissions for admin users
//
//     Therefore, User & { role: 'admin', permissions: [] } is semantically never.
//   `,
//   typeImprovement: `
//     type AdminUser = User & {
//       role: 'admin';
//       permissions: [Permission, ...Permission[]]; // Non-empty array
//     };
//   `,
//   caveat: "This assumes no direct database manipulation"
// }
```

#### 8.10 Chaos Engineering with Never
```typescript
// Generate tests that try to reach "never" code paths
const chaosTests = await semantic.never.generateChaosTests(`
  function processOrder(order: ValidOrder): ProcessedOrder {
    // ValidOrder should guarantee all validations pass
    if (!order.items.length) {
      throw new Error('No items'); // Should be unreachable!
    }
    // ... rest of processing
  }
`);

// Result: `
// // Chaos tests to verify "never" paths are truly unreachable
//
// describe('processOrder never-path chaos tests', () => {
//   it('should be impossible to create ValidOrder with no items', () => {
//     // Try various ways to bypass validation
//     expect(() => createValidOrder({ items: [] })).toThrow();
//     expect(() => createValidOrder({ items: null as any })).toThrow();
//     expect(() => JSON.parse('{"items":[]}') as ValidOrder).not.toSatisfy(isValidOrder);
//   });
//
//   it('should never reach the no-items branch with valid input', () => {
//     const spy = jest.spyOn(console, 'error');
//
//     // Property-based test: any ValidOrder should not throw "No items"
//     fc.assert(fc.property(validOrderArbitrary, (order) => {
//       expect(() => processOrder(order)).not.toThrow('No items');
//     }));
//   });
//
//   it('should detect if type assertion bypasses validation', () => {
//     // This SHOULD fail if our types are sound
//     const malicious = { items: [] } as ValidOrder;
//     expect(() => processOrder(malicious)).toThrow('No items');
//     // ^^^ If this passes, our "never" path is reachable via type assertions
//   });
// });
// `
```

#### 8.11 Never-Based API Design Suggestions
```typescript
// Suggest API designs that make invalid states unrepresentable (never)
const apiSuggestions = await semantic.never.suggestNeverBasedDesign(`
  interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    verificationToken?: string;
  }

  // Problem: verificationToken exists when emailVerified is false
  // but the type doesn't enforce this
`);

// Result: {
//   currentIssues: [
//     "verificationToken can exist when emailVerified=true (wasteful)",
//     "verificationToken can be undefined when emailVerified=false (bug)",
//     "Type doesn't enforce the invariant"
//   ],
//   neverBasedDesign: `
//     type User =
//       | {
//           id: string;
//           email: string;
//           emailVerified: false;
//           verificationToken: string; // Required when unverified
//         }
//       | {
//           id: string;
//           email: string;
//           emailVerified: true;
//           verificationToken?: never; // Cannot exist when verified
//         };
//
//     // Now these are type errors:
//     const bad1: User = {
//       id: '1', email: 'a@b.c',
//       emailVerified: true,
//       verificationToken: 'abc' // Error! never
//     };
//
//     const bad2: User = {
//       id: '1', email: 'a@b.c',
//       emailVerified: false
//       // Error! missing verificationToken
//     };
//   `,
//   benefit: "Invalid states are now unrepresentable at the type level"
// }
```

#### 8.12 Interactive Never Debugger
```typescript
// Interactive session to debug why something is never
const debug = await semantic.never.interactiveDebug(`
  type Result = MyComplexType<InputA, InputB, InputC>;
  // Result is 'never' but I don't know why!
`);

// Interactive session:
// LLM: "Let me trace through MyComplexType step by step.
//       First, what is MyComplexType defined as?"
//
// User provides definition
//
// LLM: "I see. MyComplexType uses a conditional:
//       T extends X ? A : B
//
//       Let's check: does InputA extend X?
//       Looking at your types...
//
//       InputA = { foo: string }
//       X = { foo: number }
//
//       { foo: string } does not extend { foo: number }
//       So we take branch B.
//
//       B is another conditional...
//       [continues tracing]
//
//       Final result: never
//
//       Root cause: InputA.foo is string but expected number.
//
//       Would you like me to suggest a fix?"
```

---

## Summary

The `never` type is a powerful concept that represents impossibility, unreachability, and the bottom of the type hierarchy. LLM enhancement can provide:

1. **Deep Reasoning**: Understanding why code is unreachable through complex type algebra
2. **Semantic Validation**: Verifying that never-assertions are correct
3. **Human Explanations**: Making complex type narrowing understandable
4. **Exhaustiveness Analysis**: Going beyond simple switch checks to complex patterns
5. **Code Quality**: Finding dead code, suggesting improvements
6. **Novel Operations**: Temporal analysis, chaos testing, cross-service invariants

The key insight is that `never` is fundamentally about **logical reasoning** - exactly what LLMs excel at. By combining TypeScript's static type system with LLM reasoning, we can provide developers with unprecedented insight into the unreachable corners of their code.
