---
sidebar_position: 1
---

# Primitives Overview

Semantic Primitives provides wrappers for all JavaScript primitive types, enhancing them with AI-powered semantic understanding.

## What Are Semantic Primitives?

JavaScript has seven primitive types:
- `string`
- `number`
- `boolean`
- `bigint`
- `symbol`
- `null`
- `undefined`

Plus `void` for function return types.

Semantic Primitives wraps each of these with intelligent capabilities:

| Primitive | Semantic Wrapper | Key Features |
|-----------|-----------------|--------------|
| `string` | `SemanticString` | Comparison, classification, validation, summarization |
| `number` | `SemanticNumber` | Natural language parsing, unit conversion, context validation |
| `boolean` | `SemanticBoolean` | Fuzzy parsing from text ("yes", "nope", "maybe") |
| `bigint` | `SemanticBigInt` | Domain inference, formatting, scaling |
| `symbol` | `SemanticSymbol` | Classification, alternative suggestions |
| `null` | `SemanticNull` | Absence type classification, default suggestions |
| `undefined` | `SemanticUndefined` | Absence type classification, appropriateness checking |
| `void` | `SemanticVoid` | Side effect analysis, function signature suggestions |

## Common Interfaces

All semantic primitives implement the base `Semantic<T>` interface:

```typescript
interface Semantic<T> {
  valueOf(): T;  // Returns the underlying primitive value
}
```

Most primitives also implement `Comparable`:

```typescript
interface Comparable<T, TResult = SemanticEqualsResult> {
  semanticallyEquals(other: T, options?: object): Promise<TResult>;
}
```

## Factory Pattern

All semantic primitives follow a consistent creation pattern:

```typescript
// Synchronous creation (when no parsing needed)
const str = SemanticString.from("Hello");
const bool = SemanticBoolean.from(true);

// Async creation (when AI parsing is needed)
const num = await SemanticNumber.from("twenty-five");
const date = await SemanticDate.from("next Friday");
```

## Accessing Raw Values

```typescript
const str = SemanticString.from("Hello");
console.log(str.valueOf()); // "Hello"

const num = await SemanticNumber.from("42");
console.log(num.valueOf()); // 42
console.log(typeof num.valueOf()); // "number"
```

## Quick Reference

### SemanticString
```typescript
const str = SemanticString.from("Hello world");
await str.semanticallyEquals(other);  // Semantic comparison
await str.classify(categories);        // Classification
await str.validate(rules);             // Validation
await str.summarize(maxLength);        // Summarization
await str.detectIntent();              // Intent detection
```

### SemanticNumber
```typescript
const num = await SemanticNumber.from("$1,234.56");
await num.isReasonable(context);       // Context validation
await num.inferUnit(context);          // Unit inference
await num.convert(toUnit, fromUnit);   // Unit conversion
await num.describe(context);           // Human description
```

### SemanticBoolean
```typescript
const bool = await SemanticBoolean.from("yes please");
bool.valueOf();                        // true
await bool.semanticallyEquals(other);  // Semantic comparison
```

### SemanticBigInt
```typescript
const big = SemanticBigInt.from(12345678901234567890n);
await big.inferDomain(context);        // Domain detection
big.format({ style: 'scientific' });   // Formatting
big.scale(1000);                       // Scaling
```

### SemanticSymbol
```typescript
const sym = SemanticSymbol.from(Symbol('myKey'));
await sym.classify();                  // Classification
await sym.suggestAlternative(context); // Alternatives
```

### SemanticNull / SemanticUndefined
```typescript
const nullVal = SemanticNull.from(null);
await nullVal.suggestDefault(context); // Default suggestions
await nullVal.isAppropriate(context);  // Appropriateness check
await nullVal.explain();               // Explanation
```

### SemanticVoid
```typescript
const voidType = SemanticVoid.from(undefined);
await voidType.analyzeSideEffects(fn); // Side effect analysis
await voidType.suggestSignature(fn);   // Signature suggestions
```
