---
sidebar_position: 2
---

# Getting Started

This guide will help you install and configure Semantic Primitives in your project.

## Installation

Install Semantic Primitives using your preferred package manager:

```bash
# Using Bun (recommended)
bun add semantic-primitives

# Using npm
npm install semantic-primitives

# Using yarn
yarn add semantic-primitives

# Using pnpm
pnpm add semantic-primitives
```

## Setting Up an LLM Provider

Semantic Primitives requires an LLM provider for semantic operations. Choose one of the supported providers:

### Google Gemini (Default)

```bash
export GOOGLE_API_KEY=your-google-api-key
```

Get your API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).

### OpenAI

```bash
export OPENAI_API_KEY=your-openai-api-key
export LLM_PROVIDER=openai
```

Get your API key from the [OpenAI Platform](https://platform.openai.com/api-keys).

### Anthropic Claude

```bash
export ANTHROPIC_API_KEY=your-anthropic-api-key
export LLM_PROVIDER=anthropic
```

Get your API key from the [Anthropic Console](https://console.anthropic.com/).

## Basic Usage

### Importing Types

```typescript
// Import specific types
import { SemanticString, SemanticNumber, SemanticArray } from 'semantic-primitives';

// Or import everything
import * as sp from 'semantic-primitives';
```

### Creating Semantic Values

Most semantic types use a factory pattern with a `from()` method:

```typescript
import { SemanticString, SemanticNumber, SemanticDate } from 'semantic-primitives';

// Simple creation
const str = SemanticString.from("Hello, world!");

// Parse from natural language
const num = await SemanticNumber.from("twenty-five");
const date = await SemanticDate.from("next Monday");
```

### Accessing the Underlying Value

Every semantic type wraps a native value accessible via `valueOf()`:

```typescript
const str = SemanticString.from("Hello");
console.log(str.valueOf()); // "Hello"

const num = await SemanticNumber.from("42");
console.log(num.valueOf()); // 42
```

## Example: Text Classification

```typescript
import { SemanticString } from 'semantic-primitives';

async function classifyCustomerMessage(message: string) {
  const text = SemanticString.from(message);

  const result = await text.classify([
    'question',
    'complaint',
    'feedback',
    'request',
    'other'
  ]);

  console.log(`Category: ${result.category}`);
  console.log(`Confidence: ${result.confidence}`);

  return result;
}

// Example usage
await classifyCustomerMessage("When will my order arrive?");
// Category: question, Confidence: 0.95
```

## Example: Semantic Comparison

```typescript
import { SemanticString } from 'semantic-primitives';

async function areSimilar(text1: string, text2: string) {
  const str1 = SemanticString.from(text1);
  const str2 = SemanticString.from(text2);

  const result = await str1.semanticallyEquals(str2);

  return result.equivalent;
}

// Example usage
const similar = await areSimilar(
  "The movie was fantastic!",
  "The film was great!"
);
console.log(similar); // true
```

## Example: Data Validation

```typescript
import { SemanticString } from 'semantic-primitives';

async function validateUserInput(input: string) {
  const text = SemanticString.from(input);

  const result = await text.validate([
    "must be a valid email address",
    "must not contain profanity",
    "must be in English"
  ]);

  if (!result.valid) {
    console.log("Validation failed:", result.issues);
  }

  return result;
}
```

## Example: Working with Collections

```typescript
import { SemanticArray } from 'semantic-primitives';

async function filterProducts(products: string[]) {
  const arr = SemanticArray.from(products);

  // Filter using natural language
  const electronics = await arr.semanticFilter("electronic devices");

  // Sort semantically
  const sorted = await arr.semanticSort("by price from low to high");

  // Search semantically
  const results = await arr.semanticSearch("wireless headphones");

  return results;
}
```

## Using with TypeScript

Semantic Primitives is written in TypeScript and provides full type safety:

```typescript
import { SemanticArray, SemanticObject } from 'semantic-primitives';

// Generic type support
const numbers = SemanticArray.from<number>([1, 2, 3, 4, 5]);

interface User {
  name: string;
  email: string;
  age: number;
}

const user = SemanticObject.from<User>({
  name: "John Doe",
  email: "john@example.com",
  age: 30
});
```

## Next Steps

- Learn about [Configuration](/docs/configuration) options
- Explore [Primitive Types](/docs/primitives/overview)
- Explore [Structural Types](/docs/types/overview)
- Understand the [LLM Client](/docs/llm-client)
