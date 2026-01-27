---
sidebar_position: 2
---

# SemanticString

`SemanticString` wraps the native `string` type with powerful semantic understanding capabilities including comparison, classification, validation, summarization, and more.

## Creating a SemanticString

```typescript
import { SemanticString } from 'semantic-primitives';

const str = SemanticString.from("Hello, world!");

// With custom LLM client
import { LLMClient } from 'semantic-primitives';
const client = new LLMClient({ provider: 'openai' });
const str = SemanticString.from("Hello", client);
```

## Methods

### semanticallyEquals

Compare two strings by meaning, not just characters.

```typescript
const str1 = SemanticString.from("The movie was fantastic!");
const str2 = SemanticString.from("The film was great!");

const result = await str1.semanticallyEquals(str2);
// {
//   equivalent: true,
//   confidence: 0.92,
//   reason: "Both express positive sentiment about a movie/film"
// }
```

**Options:**
- `strict?: boolean` - Require exact semantic match (default: false)
- `context?: string` - Additional context for comparison

### classify

Classify text into predefined categories.

```typescript
const message = SemanticString.from("I want to return this broken item");

const result = await message.classify([
  'question',
  'complaint',
  'feedback',
  'request'
]);
// {
//   category: 'complaint',
//   subcategory: 'product defect',
//   confidence: 0.94
// }
```

**Parameters:**
- `categories: string[]` - List of possible categories
- `context?: string` - Additional context for classification

### extract

Extract named entities from text.

```typescript
const text = SemanticString.from(
  "Contact John at john@example.com or 555-1234 before March 15th"
);

const result = await text.extract(['email', 'phone', 'date', 'name']);
// {
//   entities: [
//     { type: 'name', value: 'John', position: 8 },
//     { type: 'email', value: 'john@example.com', position: 16 },
//     { type: 'phone', value: '555-1234', position: 36 },
//     { type: 'date', value: 'March 15th', position: 52 }
//   ]
// }
```

### validate

Validate text against semantic rules.

```typescript
const email = SemanticString.from("user@example.com");

const result = await email.validate([
  "must be a valid email format",
  "must not be a disposable email domain",
  "domain must exist"
]);
// {
//   valid: true,
//   issues: []
// }
```

### detectIntent

Detect the purpose or intent of the text.

```typescript
const message = SemanticString.from("What time does the store close?");

const result = await message.detectIntent();
// {
//   intent: 'question',
//   action: 'get_store_hours',
//   confidence: 0.96
// }
```

### detectLanguage

Identify the language of the text.

```typescript
const text = SemanticString.from("Bonjour, comment allez-vous?");

const result = await text.detectLanguage();
// {
//   language: 'French',
//   code: 'fr',
//   confidence: 0.99
// }
```

### containsSensitive

Detect personally identifiable information (PII) and sensitive data.

```typescript
const text = SemanticString.from(
  "My SSN is 123-45-6789 and my credit card is 4111-1111-1111-1111"
);

const result = await text.containsSensitive();
// {
//   hasSensitive: true,
//   types: ['ssn', 'credit_card'],
//   locations: [
//     { type: 'ssn', position: 10 },
//     { type: 'credit_card', position: 38 }
//   ]
// }
```

### similarity

Calculate semantic similarity score between two strings.

```typescript
const str1 = SemanticString.from("machine learning algorithms");
const str2 = SemanticString.from("AI and neural networks");

const score = await str1.similarity(str2);
// 0.78
```

### summarize

Summarize text while preserving meaning.

```typescript
const article = SemanticString.from(`
  Artificial intelligence has transformed numerous industries...
  [long text]
`);

const summary = await article.summarize(100); // max 100 characters
// "AI has revolutionized industries by automating tasks and enabling data-driven decisions."
```

### suggestCorrections

Get spelling, grammar, and style corrections.

```typescript
const text = SemanticString.from("Their going to the store tommorow");

const result = await text.suggestCorrections();
// {
//   corrections: [
//     { original: "Their", suggested: "They're", type: "grammar" },
//     { original: "tommorow", suggested: "tomorrow", type: "spelling" }
//   ]
// }
```

## Implemented Interfaces

- `Semantic<string>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Rule-based validation
- `Classifiable` - Category classification
- `Summarizable` - Text summarization
- `SensitivityDetectable` - PII detection

## Examples

### Customer Support Classification

```typescript
async function routeTicket(message: string) {
  const text = SemanticString.from(message);

  const classification = await text.classify([
    'billing',
    'technical',
    'shipping',
    'account',
    'general'
  ]);

  const intent = await text.detectIntent();
  const hasPII = await text.containsSensitive();

  return {
    department: classification.category,
    intent: intent.intent,
    requiresSecureHandling: hasPII.hasSensitive
  };
}
```

### Content Moderation

```typescript
async function moderateContent(content: string) {
  const text = SemanticString.from(content);

  const validation = await text.validate([
    "must not contain hate speech",
    "must not contain explicit content",
    "must not contain personal attacks"
  ]);

  const sensitive = await text.containsSensitive();

  return {
    approved: validation.valid && !sensitive.hasSensitive,
    issues: [...validation.issues, ...sensitive.types]
  };
}
```

### Document Processing

```typescript
async function processDocument(content: string) {
  const doc = SemanticString.from(content);

  const [summary, language, entities] = await Promise.all([
    doc.summarize(200),
    doc.detectLanguage(),
    doc.extract(['date', 'money', 'organization', 'person'])
  ]);

  return { summary, language, entities };
}
```
