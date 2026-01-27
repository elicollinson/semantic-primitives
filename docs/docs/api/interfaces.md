---
sidebar_position: 2
---

# Interfaces

Semantic Primitives uses a composable interface pattern. Each semantic type implements one or more capability interfaces.

## Base Interfaces

### Semantic\<T\>

The foundation interface for all semantic types.

```typescript
interface Semantic<T> {
  valueOf(): T;  // Returns the underlying value
}
```

**Implemented by:** All semantic types

### SemanticFactory\<T, TInput\>

Factory pattern for creating semantic instances.

```typescript
interface SemanticFactory<T, TInput = unknown> {
  from(input: TInput, context?: string | Record<string, unknown>, client?: LLMClient): T;
}
```

**Implemented by:** All semantic types (as static method)

## Comparison Interfaces

### Comparable\<T, TResult\>

Enables semantic comparison between values.

```typescript
interface Comparable<T, TResult = SemanticEqualsResult> {
  semanticallyEquals(other: T, options?: Record<string, unknown>): Promise<TResult>;
}
```

**Implemented by:** All types except `SemanticVoid`

**Example:**
```typescript
const str1 = SemanticString.from("Hello");
const result = await str1.semanticallyEquals(SemanticString.from("Hi"));
// { equivalent: true, confidence: 0.85 }
```

## Explanation Interfaces

### Explainable

Provides human-readable explanations.

```typescript
interface Explainable {
  explain(context?: string): string | Promise<string>;
}
```

**Implemented by:** SemanticNull, SemanticUndefined, SemanticVoid, SemanticError, SemanticPromise, SemanticCallable, SemanticURL

### Describable

Extends Explainable with context-aware descriptions.

```typescript
interface Describable extends Explainable {
  describe(context?: string): string | Promise<string>;
}
```

**Implemented by:** SemanticNumber, SemanticBigInt, SemanticDate, SemanticSymbol

## Validation Interfaces

### Validatable\<TResult\>

Enables rule-based validation.

```typescript
interface Validatable<TResult = ValidateResult> {
  validate(rules: string[]): TResult | Promise<TResult>;
}
```

**Implemented by:** SemanticString, SemanticSymbol, SemanticArray, SemanticObject, SemanticMap, SemanticSet, SemanticRecord, SemanticPromise

**Example:**
```typescript
const email = SemanticString.from("test@example.com");
const result = await email.validate(["must be valid email format"]);
// { valid: true, issues: [] }
```

### ContextValidatable

Validates reasonableness within a context.

```typescript
interface ContextValidatable {
  isReasonable(context: string): Promise<ReasonableResult>;
}
```

**Implemented by:** SemanticNumber, SemanticBigInt, SemanticDate

**Example:**
```typescript
const age = SemanticNumber.from(150);
const result = await age.isReasonable("human age");
// { reasonable: false, explanation: "Exceeds maximum human lifespan" }
```

## Classification Interfaces

### Classifiable

Enables category classification.

```typescript
interface Classifiable {
  classify(categories: string[], context?: string): Promise<ClassifyResult>;
}
```

**Implemented by:** SemanticString, SemanticBoolean, SemanticSymbol, SemanticNull, SemanticUndefined

**Example:**
```typescript
const text = SemanticString.from("I want a refund");
const result = await text.classify(["complaint", "question", "feedback"]);
// { category: "complaint", confidence: 0.95 }
```

## Type Inference Interfaces

### TypeInferable

Infers the semantic type of values.

```typescript
interface TypeInferable {
  inferType(): InferTypeResult | Promise<InferTypeResult>;
}
```

**Implemented by:** SemanticArray, SemanticSet, SemanticObject, SemanticUnknown, SemanticRegExp

### PurposeInferable

Infers the purpose of data structures.

```typescript
interface PurposeInferable {
  inferPurpose(): InferPurposeResult | Promise<InferPurposeResult>;
}
```

**Implemented by:** SemanticMap, SemanticRecord, SemanticFormData, SemanticURL

### SchemaInferable

Infers schema from data.

```typescript
interface SchemaInferable {
  inferSchema(): InferSchemaResult | Promise<InferSchemaResult>;
}
```

**Implemented by:** SemanticObject, SemanticArray, SemanticStreams

## Collection Interfaces

### SemanticFilterable\<T\>

Enables natural language filtering.

```typescript
interface SemanticFilterable<T> {
  semanticFilter(criteria: string): Promise<T>;
}
```

**Implemented by:** SemanticArray, SemanticMap, SemanticSet, SemanticRecord

### SemanticSortable\<T\>

Enables semantic sorting.

```typescript
interface SemanticSortable<T> {
  semanticSort(criteria: string): Promise<T>;
}
```

**Implemented by:** SemanticArray

### SemanticSearchable\<T\>

Enables semantic search.

```typescript
interface SemanticSearchable<T> {
  semanticSearch(query: string, options?: { limit?: number; threshold?: number }): Promise<SearchResult<T>[]>;
}
```

**Implemented by:** SemanticArray, SemanticObject, SemanticMap, SemanticSet

### SemanticAccessible

Enables semantic field/key access.

```typescript
interface SemanticAccessible {
  semanticGet(path: string): Promise<SemanticGetResult>;
}
```

**Implemented by:** SemanticObject, SemanticMap, SemanticRecord

### SemanticMergeable\<T\>

Enables intelligent merging.

```typescript
interface SemanticMergeable<T> {
  semanticMerge(other: T, options?: { conflictResolution?: string }): Promise<T>;
}
```

**Implemented by:** SemanticObject, SemanticMap, SemanticArray

## Safety Interfaces

### SafetyAssessable

Assesses safety of values.

```typescript
interface SafetyAssessable {
  checkSafety(): Promise<SafetyResult>;
}
```

**Implemented by:** SemanticBlob, SemanticFile, SemanticCallable, SemanticRequest

### SensitivityDetectable

Detects sensitive/PII data.

```typescript
interface SensitivityDetectable {
  containsSensitive(): Promise<SensitiveResult>;
}
```

**Implemented by:** SemanticString, SemanticObject, SemanticFile, SemanticFormData

## Pattern Interfaces

### PatternDetectable

Detects patterns in data.

```typescript
interface PatternDetectable {
  detectPatterns(): Promise<DetectPatternResult>;
}
```

**Implemented by:** SemanticArray, SemanticTuple, SemanticStreams, SemanticString

## Summarization Interface

### Summarizable

Generates human-readable summaries.

```typescript
interface Summarizable {
  summarize(options?: { maxLength?: number }): Promise<string>;
}
```

**Implemented by:** SemanticString, SemanticArray, SemanticObject, SemanticSet

## Unit Conversion Interface

### UnitConvertible\<T\>

Enables unit conversion and inference.

```typescript
interface UnitConvertible<T> {
  convert(toUnit: string, fromUnit?: string): Promise<T>;
  inferUnit(context: string): Promise<InferUnitResult>;
}
```

**Implemented by:** SemanticNumber, SemanticBigInt

## Absence Interfaces

### SemanticAbsence

Handles null/undefined values.

```typescript
interface SemanticAbsence {
  suggestDefault(context: string): Promise<Suggestion>;
  isAppropriate(context: string): Promise<AppropriateResult>;
}
```

**Implemented by:** SemanticNull, SemanticUndefined

## Test Generation Interface

### TestGeneratable

Generates test cases.

```typescript
interface TestGeneratable {
  generateTests(): Promise<GeneratedTestCase[]>;
}
```

**Implemented by:** SemanticCallable, SemanticRegExp

## Interface Composition

Semantic types compose multiple interfaces:

```typescript
// SemanticString implements:
// - Semantic<string>
// - Comparable
// - Validatable
// - Classifiable
// - Summarizable
// - SensitivityDetectable

// SemanticArray<T> implements:
// - Semantic<T[]>
// - Comparable
// - Validatable
// - SemanticFilterable
// - SemanticSortable
// - SemanticSearchable
// - PatternDetectable
// - Summarizable
```

## Type Guards

Check if a value implements an interface:

```typescript
import {
  isSemantic,
  isComparable,
  isExplainable,
  isValidatable
} from 'semantic-primitives';

const str = SemanticString.from("Hello");

if (isComparable(str)) {
  await str.semanticallyEquals(other);
}

if (isValidatable(str)) {
  await str.validate(rules);
}
```
