---
sidebar_position: 1
---

# Shared Types

These types are used across multiple semantic wrappers for consistent result handling.

## Result Types

### SemanticEqualsResult

Base result for semantic comparison.

```typescript
interface SemanticEqualsResult {
  equivalent: boolean;  // Are the values semantically equal?
  confidence: number;   // 0-1 confidence score
}
```

### SemanticEqualsResultWithReason

Extended comparison result with explanation.

```typescript
interface SemanticEqualsResultWithReason extends SemanticEqualsResult {
  reason?: string;  // Why they are/aren't equivalent
  note?: string;    // Additional context
}
```

### SemanticEqualsResultWithMappings

Comparison result for collections with field/key mappings.

```typescript
interface SemanticEqualsResultWithMappings extends SemanticEqualsResult {
  mappings?: Record<string, string>;  // How fields/keys correspond
}
```

## Classification Types

### ClassifyResult

Result from classification operations.

```typescript
interface ClassifyResult {
  category: string;       // Primary category
  subcategory?: string;   // Optional subcategory
  confidence: number;     // 0-1 confidence score
}
```

### InferTypeResult

Result from type inference.

```typescript
interface InferTypeResult {
  type: string;           // Inferred type
  confidence: number;     // 0-1 confidence score
}
```

### InferPurposeResult

Result from purpose inference.

```typescript
interface InferPurposeResult {
  purpose: string;        // Inferred purpose
  category?: string;      // Category of purpose
  subcategory?: string;   // Subcategory
  confidence: number;     // 0-1 confidence score
}
```

### InferSchemaResult

Result from schema inference.

```typescript
interface InferSchemaResult {
  type: string;
  properties?: Record<string, {
    type: string;
    format?: string;
    purpose?: string;
  }>;
  confidence: number;
}
```

## Validation Types

### ValidateResult

Base validation result.

```typescript
interface ValidateResult {
  valid: boolean;    // Does it pass validation?
  issues: string[];  // List of validation failures
}
```

### ValidateResultWithWarnings

Validation with warnings.

```typescript
interface ValidateResultWithWarnings extends ValidateResult {
  warnings: string[];  // Non-critical issues
}
```

### ReasonableResult

Result from reasonableness checking.

```typescript
interface ReasonableResult {
  reasonable: boolean;    // Is the value reasonable?
  explanation?: string;   // Why or why not
  reason?: string;        // Alias for explanation
}
```

### AppropriateResult

Result from appropriateness checking.

```typescript
interface AppropriateResult {
  appropriate: boolean;  // Is it appropriate for context?
  reason: string;        // Explanation
}
```

## Suggestion Types

### Suggestion

Generic suggestion with reason.

```typescript
interface Suggestion {
  suggestion?: string;  // The suggested value/action
  reason: string;       // Why this is suggested
}
```

### MissingSuggestion

Suggestion for missing fields/keys.

```typescript
interface MissingSuggestion {
  field?: string;    // For objects
  key?: string;      // For maps/records
  property?: string; // General
  reason: string;    // Why it's needed
}
```

### ImprovementSuggestion

Suggestion for improvements.

```typescript
interface ImprovementSuggestion {
  improvement: string;  // What to improve
  reason: string;       // Why
  example?: string;     // Example of improved version
}
```

### RelatedSuggestion

Suggestion for related items.

```typescript
interface RelatedSuggestion {
  value?: string;   // Related value
  url?: string;     // Related URL
  pattern?: string; // Related pattern
  reason: string;   // Why it's related
}
```

## Safety & Detection Types

### SafetyResult

Result from safety assessment.

```typescript
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SafetyResult {
  safe: boolean;           // Is it safe?
  severity: SeverityLevel; // Severity if unsafe
  issues: string[];        // Safety issues found
}
```

### SensitiveResult

Result from sensitive data detection.

```typescript
interface SensitiveResult {
  hasSensitive: boolean;  // Contains sensitive data?
  types: string[];        // Types of sensitive data
  locations?: Array<{
    type: string;
    position: number;
  }>;
}
```

### DetectPatternResult

Result from pattern detection.

```typescript
interface DetectPatternResult {
  patterns: string[];   // Detected patterns
  confidence: number;   // 0-1 confidence score
}
```

## Error & Recovery Types

### RootCauseResult

Result from root cause analysis.

```typescript
interface RootCauseResult {
  cause: string;        // The root cause
  confidence: number;   // 0-1 confidence
}
```

### SuggestedFix

Suggested fix for an error.

```typescript
interface SuggestedFix {
  fix: string;           // The fix
  explanation: string;   // How it helps
  steps?: string[];      // Step-by-step instructions
}
```

### RecoveryStrategy

Strategy for recovering from errors.

```typescript
interface RecoveryStrategy {
  strategy: string;       // Strategy name
  steps: string[];        // Recovery steps
  timeEstimate?: string;  // Estimated time
}
```

### ResourceSuggestion

Link to helpful resources.

```typescript
interface ResourceSuggestion {
  type: 'documentation' | 'stackoverflow' | 'tutorial' | 'article';
  url: string;
  title: string;
}
```

## Search Types

### SearchResult

Result from semantic search.

```typescript
interface SearchResult<T> {
  item: T;        // The matched item
  score: number;  // Relevance score (0-1)
}
```

### SemanticGetResult

Result from semantic field access.

```typescript
interface SemanticGetResult {
  value: unknown;       // The value found
  path?: string;        // Path/key to the value
  key?: string;         // For maps
  confidence: number;   // 0-1 confidence
}
```

## Usage Examples

### Using Result Types

```typescript
import { SemanticString, SemanticEqualsResult } from 'semantic-primitives';

async function compare(a: string, b: string): Promise<SemanticEqualsResult> {
  const str1 = SemanticString.from(a);
  const str2 = SemanticString.from(b);
  return str1.semanticallyEquals(str2);
}

const result = await compare("Hello", "Hi there");
if (result.equivalent && result.confidence > 0.8) {
  console.log("Strings are semantically equal");
}
```

### Using Validation Types

```typescript
import { SemanticObject, ValidateResult } from 'semantic-primitives';

async function validateUser(data: object): Promise<ValidateResult> {
  const obj = SemanticObject.from(data);
  return obj.validate([
    "must have name field",
    "email must be valid",
    "age must be positive"
  ]);
}

const result = await validateUser({ name: "John", email: "invalid" });
if (!result.valid) {
  console.error("Validation failed:", result.issues);
}
```

### Using Safety Types

```typescript
import { SemanticString, SensitiveResult } from 'semantic-primitives';

async function checkSensitive(text: string): Promise<SensitiveResult> {
  const str = SemanticString.from(text);
  return str.containsSensitive();
}

const result = await checkSensitive("My SSN is 123-45-6789");
if (result.hasSensitive) {
  console.warn("Contains sensitive data:", result.types);
}
```
