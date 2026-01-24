# Semantic Boolean Primitive

## Overview

The `SemanticBoolean` type extends the native JavaScript boolean with LLM-powered semantic understanding. Unlike traditional booleans that only understand `true`/`false`, semantic booleans can interpret natural language, handle ambiguity, express confidence, and bridge the gap between human communication and binary logic.

---

## 1. Semantic Equivalence

### Core Concept
Traditional boolean comparison is exact: `true === true`. Semantic equivalence asks: "Do these two expressions mean the same boolean value?"

### Ideas

#### 1.1 Natural Language Equivalence Detection
```typescript
const affirm1 = SemanticBoolean.from("yes");
const affirm2 = SemanticBoolean.from("absolutely");
const affirm3 = SemanticBoolean.from("you bet");

affirm1.semanticallyEquals(affirm2); // { equivalent: true, confidence: 0.95 }
affirm1.semanticallyEquals(affirm3); // { equivalent: true, confidence: 0.88 }
```

#### 1.2 Cross-Cultural Yes/No Detection
```typescript
// Recognizes affirmatives across languages and cultures
SemanticBoolean.from("hai", { locale: "ja" });      // true (Japanese yes)
SemanticBoolean.from("oui", { locale: "fr" });      // true (French yes)
SemanticBoolean.from("da", { locale: "ru" });       // true (Russian yes)
SemanticBoolean.from("sí", { locale: "es" });       // true (Spanish yes)
SemanticBoolean.from("네", { locale: "ko" });       // true (Korean yes)

// Auto-detect language
SemanticBoolean.from("jawohl", { autoDetectLocale: true }); // true (German emphatic yes)
```

#### 1.3 Contextual Equivalence
```typescript
// Same word, different meanings based on context
const context1 = { domain: "medicine", question: "Is the patient stable?" };
const context2 = { domain: "software", question: "Is the build stable?" };

SemanticBoolean.from("stable", context1);  // Interprets medical stability
SemanticBoolean.from("stable", context2);  // Interprets software stability
```

#### 1.4 Implied Boolean Detection
```typescript
// Statements that imply true/false without saying it directly
SemanticBoolean.fromImplication("The feature is working as expected"); // true
SemanticBoolean.fromImplication("There are no issues to report"); // true
SemanticBoolean.fromImplication("We encountered several problems"); // false
SemanticBoolean.fromImplication("The system crashed during testing"); // false
```

#### 1.5 Negation-Aware Equivalence
```typescript
const a = SemanticBoolean.from("not bad");      // true (litotes)
const b = SemanticBoolean.from("good");          // true
const c = SemanticBoolean.from("not good");      // false

a.semanticallyEquals(b); // { equivalent: true, confidence: 0.75 }
a.semanticallyEquals(c); // { equivalent: false, confidence: 0.90 }
```

#### 1.6 Strength-Aware Comparison
```typescript
// Understanding degrees of affirmation
const weak = SemanticBoolean.from("I guess so");
const strong = SemanticBoolean.from("Absolutely!");
const medium = SemanticBoolean.from("Yes");

weak.compareStrength(strong);   // -0.6 (weak is less emphatic)
medium.compareStrength(strong); // -0.3
strong.compareStrength(strong); // 0.0
```
a
---

## 4. Semantic Type Guards

### Core Concept
Rich type guard functions that understand intent, sentiment, and nuance beyond simple true/false.

### Ideas

#### 4.1 Affirmation Detection
```typescript
const response = SemanticBoolean.from(userInput);

if (response.isAffirmative()) {
  // Handles: yes, yeah, yep, sure, absolutely, of course, definitely,
  // correct, right, affirmative, agreed, indeed, certainly, uh-huh
}

if (response.isStronglyAffirmative()) {
  // Handles: absolutely, definitely, certainly, 100%, without a doubt
}

if (response.isWeaklyAffirmative()) {
  // Handles: I guess, I suppose, sure, okay, fine, if you say so
}
```

#### 4.2 Negation Detection
```typescript
if (response.isNegative()) {
  // Handles: no, nope, nah, never, negative, not at all, absolutely not
}

if (response.isStronglyNegative()) {
  // Handles: absolutely not, never, no way, not a chance, hell no
}

if (response.isPoliteNegative()) {
  // Handles: I'd rather not, perhaps another time, I'll pass, no thank you
}
```

#### 4.3 Uncertainty Detection
```typescript
if (response.isUncertain()) {
  // Handles: maybe, perhaps, possibly, I'm not sure, it depends,
  // I don't know, hard to say, could be, might be
}

if (response.needsClarification()) {
  // When the response is too ambiguous to interpret
}

response.uncertaintyType();
// Returns: "lack_of_knowledge" | "conditional" | "hedging" | "truly_ambiguous"
```

#### 4.4 Conditional Response Detection
```typescript
if (response.isConditional()) {
  const conditions = response.extractConditions();
  // conditions: ["if the price is right", "assuming availability"]
}

if (response.isContingent()) {
  // "Yes, but only if..." or "No, unless..."
}
```

#### 4.5 Sentiment-Aware Guards
```typescript
if (response.isReluctantYes()) {
  // "I guess so", "Fine", "If I have to", "Whatever"
  // Value is true but sentiment is negative
}

if (response.isEnthusiasticYes()) {
  // "Absolutely!", "Yes please!", "I'd love to!", "Count me in!"
}

if (response.isApologeticNo()) {
  // "I'm sorry, but no", "Unfortunately not", "I wish I could but..."
}
```
