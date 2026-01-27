# Semantic Primitives

**TypeScript types that understand natural language.**

What if your types could parse "about a dozen" into `12`, validate that `150` is unreasonable for a human age, or classify customer messages into categories using plain English?

Semantic Primitives embeds LLM intelligence directly into TypeScript's type system—drop-in replacements for native types that understand context and meaning.

```typescript
// Parse natural language into values
await SemanticNumber.from("about a dozen")           // 12
await SemanticDate.from("next Monday")               // 2025-02-03
await SemanticBoolean.from("yeah I guess so")        // true, confidence: 0.7
await SemanticBoolean.from("hai", { locale: "ja" })  // true (Japanese)

// Classify and validate with plain English
await message.classify(['question', 'complaint', 'feedback', 'request'])
// { category: 'question', confidence: 0.95 }

await input.validate([
  "must be a valid email address",
  "must not contain profanity",
  "must be in English"
])

// Context-aware reasoning
await SemanticNumber.from(150).isReasonable("human age")
// { reasonable: false, explanation: "Human age rarely exceeds 120 years" }

// Filter and search collections with natural language
await products.semanticFilter("electronics under $50 with good reviews")
await feedback.semanticGroup("by sentiment")
// Map { "positive": [...], "negative": [...], "neutral": [...] }

// Same error, explained for different audiences
error.explain("end-user")    // "We couldn't connect. Check your internet."
error.explain("developer")   // "ECONNREFUSED on port 5432. PostgreSQL may not be running."
error.suggestFixes()         // [{ fix: "Ensure PostgreSQL service is running", confidence: 0.85 }]
```

---

## Why?

LLMs are getting smaller, faster, and cheaper. We're exploring what happens when you can afford to embed intelligence throughout your codebase—not just in a chat interface, but at the primitive level.

---

## Installation

```bash
bun add semantic-primitives
```

Or with npm:

```bash
npm install semantic-primitives
```

## Quick Setup

Set your preferred LLM provider:

```bash
# Google Gemini (default)
export GOOGLE_API_KEY=your-key

# OpenAI
export OPENAI_API_KEY=your-key
export LLM_PROVIDER=openai

# Anthropic
export ANTHROPIC_API_KEY=your-key
export LLM_PROVIDER=anthropic
```

---

## What's Included

### Primitives
`boolean` · `number` · `string` · `bigint` · `symbol` · `null` · `undefined` · `void`

### Structural Types
`array` · `object` · `map` · `set` · `record` · `tuple` · `promise`

### Specialized Types
`date` · `error` · `url` · `regexp` · `blob/file` · `streams` · `fetch` · `form-data` · `event-emitter`

Every type follows the same pattern: a `from()` factory, `valueOf()` to access the underlying value, and semantic methods that leverage LLM understanding.

---

## Examples

### SemanticBoolean

```typescript
import { SemanticBoolean } from 'semantic-primitives';

// Parse natural language responses
const answer = await SemanticBoolean.from("I suppose so");
answer.valueOf()        // true
answer.confidence()     // 0.75
answer.isUncertain()    // false

// Understand implications
await SemanticBoolean.fromImplication("The tests passed")  // true
await SemanticBoolean.fromImplication("We hit some errors") // false

// Compare strength of responses
const weak = await SemanticBoolean.from("I guess");
const strong = await SemanticBoolean.from("Absolutely!");
weak.compareStrength(strong)  // -0.6 (weaker)

// Extract conditions
const conditional = await SemanticBoolean.from("Yes, if the price is right");
conditional.isConditional()      // true
conditional.extractConditions()  // ["the price is right"]
```

### SemanticNumber

```typescript
import { SemanticNumber } from 'semantic-primitives';

// Parse various formats
await SemanticNumber.from("twenty-five")     // 25
await SemanticNumber.from("2.5k")            // 2500
await SemanticNumber.from("$1,234.56")       // 1234.56

// Contextual validation
await SemanticNumber.from(-5).isReasonable("quantity of items")
// { reasonable: false, explanation: "Quantity cannot be negative" }

// Unit inference and conversion
await SemanticNumber.from(72).inferUnit("body temperature")
// { unit: "fahrenheit", confidence: 0.85 }

await SemanticNumber.from(100).convert("celsius", "fahrenheit")
// SemanticNumber(37.78)

// Human-friendly descriptions
await SemanticNumber.from(86400).describe("seconds")
// "one day (86,400 seconds)"
```

### SemanticArray

```typescript
import { SemanticArray } from 'semantic-primitives';

const products = SemanticArray.from([...]);

// Natural language filtering
await products.semanticFilter("items under $50 with good reviews")

// Semantic grouping
await feedback.semanticGroup("by sentiment")
// Map { "positive": [...], "negative": [...], "neutral": [...] }

// Intelligent search
await articles.semanticSearch("machine learning tutorials for beginners")
// [{ item: {...}, relevance: 0.92 }, ...]

// Pattern detection
await salesData.detectPatterns()
// { patterns: ["weekly cycle", "increasing trend"], anomalies: [...] }

// Summarization
await transactions.summarize()
// "150 transactions totaling $12,450. Mostly food & dining (45%). Peak on weekends."

// Remove semantic duplicates
await phrases.semanticUnique()
// Removes "buy now" if "purchase immediately" exists
```

### SemanticError

```typescript
import { SemanticError } from 'semantic-primitives';

const error = SemanticError.from(caughtError);

// Classify errors
await error.classify()
// { category: "network", subcategory: "timeout", severity: "recoverable", retryable: true }

// Audience-appropriate explanations
await error.explain("end-user")
// "We couldn't connect to the server. Please check your internet connection."

await error.explain("developer")
// "ECONNREFUSED on port 5432. The PostgreSQL server may not be running."

// Get fix suggestions
await error.suggestFixes()
// [{ fix: "Ensure PostgreSQL service is running", confidence: 0.85 }]

// Recovery strategies
await error.recoveryStrategy()
// { strategy: "retry", maxAttempts: 3, backoff: "exponential" }
```

### SemanticString

```typescript
import { SemanticString } from 'semantic-primitives';

const text = SemanticString.from("The movie was fantastic!");

// Classification
await text.classify(['positive', 'negative', 'neutral'])
// { category: 'positive', confidence: 0.95 }

// Semantic comparison
const other = SemanticString.from("The film was great!");
await text.semanticallyEquals(other)
// { equivalent: true, confidence: 0.9 }

// Validation with natural language rules
await text.validate([
  "must be professional",
  "must not contain profanity"
])
```

---

## Configuration

### Environment Variables

```bash
# Provider selection (google, openai, anthropic)
LLM_PROVIDER=google

# API Keys
GOOGLE_API_KEY=your-key
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# Model overrides
GOOGLE_MODEL=gemini-2.0-flash-lite
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Defaults
LLM_MAX_TOKENS=1024
LLM_TEMPERATURE=0.7
```

### Programmatic Configuration

```typescript
import { LLMClient } from 'semantic-primitives';

const client = new LLMClient({
  provider: 'anthropic',
  apiKeys: {
    anthropic: 'sk-ant-...',
  },
});

// Override per-request
const response = await client.complete({
  prompt: 'Hello!',
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.5,
});
```

---

## Supported Providers

| Provider | Default Model | Status |
|----------|---------------|--------|
| Google | gemini-2.0-flash-lite | ✓ Supported |
| OpenAI | gpt-4o-mini | ✓ Supported |
| Anthropic | claude-sonnet-4-20250514 | ✓ Supported |

---

## Status

**Alpha** — APIs may change. Feedback welcome.

We're particularly interested in hearing which operations feel genuinely useful versus gimmicky, and what's missing.

---

## License

Apache-2.0