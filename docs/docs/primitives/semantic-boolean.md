---
sidebar_position: 4
---

# SemanticBoolean

`SemanticBoolean` wraps the native `boolean` type with the ability to parse boolean values from natural language text, including ambiguous or fuzzy inputs.

## Creating a SemanticBoolean

```typescript
import { SemanticBoolean } from 'semantic-primitives';

// From a boolean
const bool = SemanticBoolean.from(true);

// From text (async)
const yes = await SemanticBoolean.from("yes");
const no = await SemanticBoolean.from("nope");
const maybe = await SemanticBoolean.from("I guess so");
```

## Natural Language Parsing

SemanticBoolean can interpret various expressions as boolean values:

```typescript
// Affirmative expressions → true
await SemanticBoolean.from("yes");           // true
await SemanticBoolean.from("yeah");          // true
await SemanticBoolean.from("yep");           // true
await SemanticBoolean.from("sure");          // true
await SemanticBoolean.from("absolutely");    // true
await SemanticBoolean.from("of course");     // true
await SemanticBoolean.from("definitely");    // true
await SemanticBoolean.from("I agree");       // true
await SemanticBoolean.from("that's right"); // true

// Negative expressions → false
await SemanticBoolean.from("no");            // false
await SemanticBoolean.from("nope");          // false
await SemanticBoolean.from("nah");           // false
await SemanticBoolean.from("never");         // false
await SemanticBoolean.from("not really");    // false
await SemanticBoolean.from("I disagree");    // false
await SemanticBoolean.from("that's wrong"); // false

// Ambiguous expressions (with confidence)
await SemanticBoolean.from("maybe");         // Result with lower confidence
await SemanticBoolean.from("I suppose");     // Result with moderate confidence
await SemanticBoolean.from("probably");      // Result with moderate confidence
```

## Methods

### from (static)

Parse a boolean from various inputs.

```typescript
const result = await SemanticBoolean.from("yes please", {
  context: "confirmation dialog"
});
// SemanticBoolean with value true and confidence 0.98
```

**Options:**
- `context?: string` - Context to help interpret ambiguous input
- `strict?: boolean` - Require high confidence parsing

### semanticallyEquals

Compare two boolean values semantically.

```typescript
const bool1 = await SemanticBoolean.from("yes");
const bool2 = await SemanticBoolean.from("affirmative");

const result = await bool1.semanticallyEquals(bool2);
// { equivalent: true, confidence: 0.99 }
```

### classify

Categorize the boolean context.

```typescript
const response = await SemanticBoolean.from("I'd prefer not to");

const result = await response.classify();
// {
//   category: 'refusal',
//   subcategory: 'polite_decline',
//   confidence: 0.91
// }
```

### valueOf

Get the underlying boolean value.

```typescript
const bool = await SemanticBoolean.from("sure thing");
console.log(bool.valueOf()); // true
```

## Implemented Interfaces

- `Semantic<boolean>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Classifiable` - Context classification

## Examples

### User Consent Processing

```typescript
async function processConsent(userInput: string) {
  const consent = await SemanticBoolean.from(userInput, {
    context: "terms and conditions acceptance"
  });

  return {
    accepted: consent.valueOf(),
    needsConfirmation: consent.confidence < 0.9
  };
}

await processConsent("yeah, I accept");
// { accepted: true, needsConfirmation: false }

await processConsent("I guess that's fine");
// { accepted: true, needsConfirmation: true }
```

### Survey Response Processing

```typescript
async function processSurveyResponse(question: string, answer: string) {
  const response = await SemanticBoolean.from(answer, {
    context: `Survey question: ${question}`
  });

  const classification = await response.classify();

  return {
    question,
    answer: response.valueOf(),
    sentiment: classification.category,
    confidence: response.confidence
  };
}

await processSurveyResponse(
  "Would you recommend our service?",
  "Absolutely!"
);
// {
//   question: "Would you recommend our service?",
//   answer: true,
//   sentiment: "enthusiastic_positive",
//   confidence: 0.99
// }
```

### Form Validation

```typescript
async function validateBooleanField(
  fieldName: string,
  value: string,
  required: boolean
) {
  if (!value && required) {
    return { valid: false, error: `${fieldName} is required` };
  }

  try {
    const bool = await SemanticBoolean.from(value);

    if (bool.confidence < 0.7) {
      return {
        valid: false,
        error: `Please provide a clearer yes/no response for ${fieldName}`
      };
    }

    return { valid: true, value: bool.valueOf() };
  } catch {
    return { valid: false, error: `Could not interpret ${fieldName} as yes/no` };
  }
}
```

### Chatbot Intent Understanding

```typescript
async function understandUserIntent(message: string, question: string) {
  const response = await SemanticBoolean.from(message, {
    context: `Bot asked: "${question}"`
  });

  const classification = await response.classify();

  switch (classification.category) {
    case 'enthusiastic_positive':
      return { intent: 'strong_yes', proceed: true };
    case 'reluctant_positive':
      return { intent: 'weak_yes', proceed: true, needsReassurance: true };
    case 'polite_decline':
      return { intent: 'no', proceed: false, offerAlternative: true };
    case 'firm_negative':
      return { intent: 'strong_no', proceed: false };
    default:
      return { intent: 'unclear', askAgain: true };
  }
}
```
