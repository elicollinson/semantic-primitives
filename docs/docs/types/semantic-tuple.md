---
sidebar_position: 13
---

# SemanticTuple

`SemanticTuple` wraps fixed-length arrays (tuples) with positional meaning inference, relationship validation, and semantic conversion.

## Creating a SemanticTuple

```typescript
import { SemanticTuple } from 'semantic-primitives';

// Coordinate tuple
const point = SemanticTuple.from([10, 20]);

// RGB color tuple
const color = SemanticTuple.from([255, 128, 0]);

// Mixed type tuple
const record = SemanticTuple.from(['John', 30, true]);
```

## Methods

### semanticallyEquals

Compare tuples with positional mapping.

```typescript
const tuple1 = SemanticTuple.from([100, 200]);
const tuple2 = SemanticTuple.from([200, 100]);

const result = await tuple1.semanticallyEquals(tuple2, {
  orderMatters: true
});
// { equivalent: false, confidence: 1.0 }

const result2 = await tuple1.semanticallyEquals(tuple2, {
  orderMatters: false
});
// { equivalent: true, confidence: 0.95, note: "Same values, different positions" }
```

### inferPositionalMeaning

Infer the meaning of each position.

```typescript
const coordinates = SemanticTuple.from([40.7128, -74.0060]);

const meaning = await coordinates.inferPositionalMeaning();
// {
//   positions: [
//     { index: 0, meaning: 'latitude', type: 'number', range: '-90 to 90' },
//     { index: 1, meaning: 'longitude', type: 'number', range: '-180 to 180' }
//   ],
//   overallMeaning: 'geographic coordinates',
//   confidence: 0.96
// }

const rgb = SemanticTuple.from([255, 128, 64]);
const rgbMeaning = await rgb.inferPositionalMeaning();
// {
//   positions: [
//     { index: 0, meaning: 'red', type: 'number', range: '0-255' },
//     { index: 1, meaning: 'green', type: 'number', range: '0-255' },
//     { index: 2, meaning: 'blue', type: 'number', range: '0-255' }
//   ],
//   overallMeaning: 'RGB color',
//   confidence: 0.94
// }
```

### validateRelationship

Validate relationships between elements.

```typescript
const range = SemanticTuple.from([10, 5]);

const result = await range.validateRelationship();
// {
//   valid: false,
//   issues: ['First element (min) is greater than second element (max)'],
//   expectedRelationship: 'min <= max'
// }

const dateRange = SemanticTuple.from(['2024-01-01', '2024-12-31']);
const result2 = await dateRange.validateRelationship();
// {
//   valid: true,
//   relationship: 'date range from start to end'
// }
```

### toObject

Convert tuple to a labeled object.

```typescript
const point = SemanticTuple.from([100, 200, 50]);

const obj = await point.toObject();
// { x: 100, y: 200, z: 50 }

const color = SemanticTuple.from([255, 128, 0, 0.5]);
const colorObj = await color.toObject();
// { red: 255, green: 128, blue: 0, alpha: 0.5 }
```

### getByLabel

Access elements by semantic label.

```typescript
const coords = SemanticTuple.from([40.7128, -74.0060]);

const lat = await coords.getByLabel("latitude");
// { value: 40.7128, index: 0, confidence: 0.97 }

const lon = await coords.getByLabel("x coordinate");
// { value: -74.0060, index: 1, confidence: 0.82 }
```

### detectPattern

Detect patterns in tuple structure.

```typescript
const sequence = SemanticTuple.from([1, 2, 4, 8, 16]);

const pattern = await sequence.detectPattern();
// {
//   pattern: 'geometric sequence',
//   formula: 'a[n] = 2^n',
//   nextValue: 32,
//   confidence: 0.99
// }
```

### validateStructure

Validate the tuple against expected structure.

```typescript
const data = SemanticTuple.from(['John', 'thirty', true]);

const validation = await data.validateStructure([
  { type: 'string', description: 'name' },
  { type: 'number', description: 'age' },
  { type: 'boolean', description: 'active' }
]);
// {
//   valid: false,
//   issues: ['Position 1: expected number but got string "thirty"']
// }
```

## Implemented Interfaces

- `Semantic<unknown[]>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Structure validation
- `PatternDetectable` - Pattern detection

## Examples

### Coordinate System Handler

```typescript
async function handleCoordinates(coords: [number, number]) {
  const tuple = SemanticTuple.from(coords);

  const meaning = await tuple.inferPositionalMeaning();
  const obj = await tuple.toObject();

  if (meaning.overallMeaning === 'geographic coordinates') {
    return {
      type: 'geo',
      latitude: obj.latitude || obj.x,
      longitude: obj.longitude || obj.y
    };
  }

  return {
    type: 'cartesian',
    x: obj.x,
    y: obj.y
  };
}
```

### Color Converter

```typescript
async function analyzeColor(rgb: [number, number, number]) {
  const tuple = SemanticTuple.from(rgb);

  const obj = await tuple.toObject();
  const validation = await tuple.validateStructure([
    { type: 'number', description: 'red (0-255)' },
    { type: 'number', description: 'green (0-255)' },
    { type: 'number', description: 'blue (0-255)' }
  ]);

  if (!validation.valid) {
    throw new Error(validation.issues.join(', '));
  }

  return {
    rgb: { r: obj.red, g: obj.green, b: obj.blue },
    hex: `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`,
    valid: validation.valid
  };
}
```

### Range Validation

```typescript
async function validateRange(range: [unknown, unknown], context: string) {
  const tuple = SemanticTuple.from(range);

  const [meaning, relationship] = await Promise.all([
    tuple.inferPositionalMeaning(),
    tuple.validateRelationship()
  ]);

  return {
    type: meaning.overallMeaning,
    start: await tuple.getByLabel('start'),
    end: await tuple.getByLabel('end'),
    valid: relationship.valid,
    issues: relationship.issues
  };
}

// Usage
await validateRange([0, 100], 'percentage range');
await validateRange(['2024-01-01', '2024-12-31'], 'date range');
```

### Data Pipeline Tuple Handler

```typescript
async function processTuple(data: unknown[]) {
  const tuple = SemanticTuple.from(data);

  const meaning = await tuple.inferPositionalMeaning();
  const pattern = await tuple.detectPattern();

  if (pattern.pattern) {
    return {
      type: 'sequence',
      pattern: pattern.pattern,
      nextValue: pattern.nextValue
    };
  }

  const obj = await tuple.toObject();
  return {
    type: meaning.overallMeaning,
    asObject: obj,
    positions: meaning.positions
  };
}
```
