---
sidebar_position: 3
---

# SemanticNumber

`SemanticNumber` wraps the native `number` type with intelligent parsing from natural language, unit conversion, context validation, and descriptive capabilities.

## Creating a SemanticNumber

```typescript
import { SemanticNumber } from 'semantic-primitives';

// From a number
const num = SemanticNumber.from(42);

// From natural language (async)
const num = await SemanticNumber.from("twenty-five");
const price = await SemanticNumber.from("$1,234.56");
const quantity = await SemanticNumber.from("2.5k");
const percentage = await SemanticNumber.from("fifty percent");
```

## Natural Language Parsing

SemanticNumber can parse numbers from various formats:

```typescript
// Written numbers
await SemanticNumber.from("twenty-five");           // 25
await SemanticNumber.from("one hundred and fifty"); // 150
await SemanticNumber.from("two million");           // 2000000

// Formatted numbers
await SemanticNumber.from("$1,234.56");            // 1234.56
await SemanticNumber.from("1.5k");                 // 1500
await SemanticNumber.from("2.5M");                 // 2500000

// Percentages
await SemanticNumber.from("50%");                  // 0.5 (or 50, context-dependent)
await SemanticNumber.from("twenty percent");       // 0.2

// With context for disambiguation
await SemanticNumber.from("a dozen", "quantity");  // 12
await SemanticNumber.from("a score", "count");     // 20
```

## Methods

### semanticallyEquals

Compare numbers with context-aware tolerance.

```typescript
const num1 = SemanticNumber.from(99.9);
const num2 = SemanticNumber.from(100);

const result = await num1.semanticallyEquals(num2, {
  tolerance: 0.01,  // 1% tolerance
  context: "temperature measurement"
});
// { equivalent: true, confidence: 0.95 }
```

**Options:**
- `tolerance?: number` - Acceptable difference (percentage or absolute)
- `context?: string` - Context for comparison

### isReasonable

Validate if a number is reasonable for a given context.

```typescript
const age = SemanticNumber.from(150);
const result = await age.isReasonable("human age in years");
// {
//   reasonable: false,
//   explanation: "150 years exceeds the maximum recorded human lifespan"
// }

const temp = SemanticNumber.from(72);
const result2 = await temp.isReasonable("room temperature in Fahrenheit");
// {
//   reasonable: true,
//   explanation: "72°F is a comfortable room temperature"
// }
```

### inferUnit

Infer the likely unit for a number based on context.

```typescript
const num = SemanticNumber.from(98.6);

const result = await num.inferUnit("body temperature");
// {
//   unit: "fahrenheit",
//   confidence: 0.92,
//   alternatives: ["celsius"]
// }

const distance = SemanticNumber.from(5);
const result2 = await distance.inferUnit("distance to the store");
// {
//   unit: "miles",
//   confidence: 0.85,
//   alternatives: ["kilometers", "blocks"]
// }
```

### convert

Convert between units.

```typescript
const celsius = SemanticNumber.from(100);

const fahrenheit = await celsius.convert("fahrenheit", "celsius");
console.log(fahrenheit.valueOf()); // 212

const km = SemanticNumber.from(10);
const miles = await km.convert("miles", "kilometers");
console.log(miles.valueOf()); // 6.21371
```

**Parameters:**
- `toUnit: string` - Target unit
- `fromUnit?: string` - Source unit (optional, can be inferred)

### describe

Get a human-readable description of the number.

```typescript
const num = SemanticNumber.from(1500000);

const description = await num.describe("company valuation");
// "1.5 million dollars, indicating a small startup or seed-stage company"

const distance = SemanticNumber.from(384400);
const desc2 = await distance.describe("distance in kilometers");
// "Approximately the distance from Earth to the Moon"
```

## Implemented Interfaces

- `Semantic<number>` - Base semantic interface
- `Comparable` - Semantic comparison
- `ContextValidatable` - Context-aware validation
- `UnitConvertible` - Unit conversion
- `Describable` - Human-readable descriptions

## Examples

### Form Validation

```typescript
async function validateUserAge(input: string) {
  const age = await SemanticNumber.from(input, "age in years");

  const reasonable = await age.isReasonable("user registration age");

  if (!reasonable.reasonable) {
    throw new Error(reasonable.explanation);
  }

  return age.valueOf();
}

await validateUserAge("twenty-five"); // 25
await validateUserAge("five hundred"); // Error: Age exceeds reasonable limit
```

### Financial Calculations

```typescript
async function parseAmount(input: string) {
  const amount = await SemanticNumber.from(input, "monetary amount");

  return {
    value: amount.valueOf(),
    description: await amount.describe("financial transaction")
  };
}

await parseAmount("$2.5k");
// { value: 2500, description: "A moderate transaction amount..." }
```

### Measurement Conversion

```typescript
async function convertMeasurement(
  value: number,
  context: string,
  targetUnit: string
) {
  const num = SemanticNumber.from(value);

  // Infer source unit from context
  const inferred = await num.inferUnit(context);

  // Convert to target unit
  const converted = await num.convert(targetUnit, inferred.unit);

  return {
    original: { value, unit: inferred.unit },
    converted: { value: converted.valueOf(), unit: targetUnit }
  };
}

await convertMeasurement(100, "boiling water temperature", "fahrenheit");
// { original: { value: 100, unit: "celsius" }, converted: { value: 212, unit: "fahrenheit" } }
```

### Data Validation Pipeline

```typescript
async function validateMetric(name: string, value: string, context: string) {
  const num = await SemanticNumber.from(value, context);

  const [reasonable, unit] = await Promise.all([
    num.isReasonable(context),
    num.inferUnit(context)
  ]);

  return {
    name,
    value: num.valueOf(),
    unit: unit.unit,
    valid: reasonable.reasonable,
    message: reasonable.explanation
  };
}

await validateMetric("heart_rate", "seventy-two", "resting heart rate BPM");
// {
//   name: "heart_rate",
//   value: 72,
//   unit: "bpm",
//   valid: true,
//   message: "72 BPM is within the normal resting heart rate range"
// }
```
