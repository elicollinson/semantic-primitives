---
sidebar_position: 1
slug: /
---

# Introduction

**Semantic Primitives** is a TypeScript library that wraps native JavaScript/TypeScript primitives and structural types with LLM-enhanced semantic understanding. It enables your types to understand context, meaning, and perform intelligent operations beyond simple data manipulation.

## Why Semantic Primitives?

Traditional programming works with raw data - strings are just characters, numbers are just digits. But in the real world, data has meaning:

- `"hello"` and `"hi"` mean the same thing
- `"twenty-five"` and `25` represent the same value
- `"next Friday"` is a meaningful date
- `["red", "crimson", "scarlet"]` are semantically similar

**Semantic Primitives** bridges this gap by giving your types AI-powered understanding.

## Key Features

### Semantic Comparison

Compare values by meaning, not just characters:

```typescript
import { SemanticString } from 'semantic-primitives';

const greeting1 = SemanticString.from("Hello, how are you?");
const greeting2 = SemanticString.from("Hi, how's it going?");

const result = await greeting1.semanticallyEquals(greeting2);
// { equivalent: true, confidence: 0.92 }
```

### Natural Language Parsing

Parse human input intelligently:

```typescript
import { SemanticNumber, SemanticDate } from 'semantic-primitives';

const num = await SemanticNumber.from("twenty-five thousand");
console.log(num.valueOf()); // 25000

const date = await SemanticDate.from("next Friday at 3pm");
console.log(date.valueOf()); // Date object for next Friday
```

### Intelligent Classification

Classify data into categories using meaning:

```typescript
const text = SemanticString.from("I need to return this broken item");
const result = await text.classify(['complaint', 'inquiry', 'feedback']);
// { category: 'complaint', confidence: 0.95 }
```

### Semantic Validation

Validate data against semantic rules:

```typescript
const email = SemanticString.from("user@example.com");
const result = await email.validate([
  "must be a valid email format",
  "must not be a disposable email domain"
]);
// { valid: true, issues: [] }
```

## Supported Types

### Primitives

- **SemanticString** - Intelligent text processing
- **SemanticNumber** - Natural language number parsing
- **SemanticBoolean** - Fuzzy boolean interpretation
- **SemanticBigInt** - Large number understanding
- **SemanticSymbol** - Symbol classification
- **SemanticNull/Undefined** - Absence value analysis
- **SemanticVoid** - Function side-effect analysis

### Structural Types

- **SemanticArray** - Collection operations with semantic understanding
- **SemanticObject** - Intelligent object manipulation
- **SemanticMap/Set/Record** - Key-value semantic operations
- **SemanticDate** - Natural language date parsing
- **SemanticError** - Intelligent error analysis
- **SemanticPromise** - Async operation understanding
- **SemanticURL** - URL classification and validation
- **SemanticRegExp** - Pattern explanation and generation
- And many more...

## LLM Providers

Semantic Primitives supports multiple AI providers:

- **Google Gemini** (default)
- **OpenAI GPT**
- **Anthropic Claude**

## Quick Start

```bash
# Install the package
bun add semantic-primitives

# Set up your API key
export GOOGLE_API_KEY=your-api-key-here
```

```typescript
import { SemanticString } from 'semantic-primitives';

const text = SemanticString.from("The quick brown fox");
const summary = await text.summarize(50);
console.log(summary);
```

Ready to get started? Check out the [Getting Started](/docs/getting-started) guide.
