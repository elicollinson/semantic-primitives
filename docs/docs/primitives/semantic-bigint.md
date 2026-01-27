---
sidebar_position: 5
---

# SemanticBigInt

`SemanticBigInt` wraps the native `bigint` type with intelligent formatting, domain inference, and scaling capabilities for working with very large numbers.

## Creating a SemanticBigInt

```typescript
import { SemanticBigInt } from 'semantic-primitives';

// From a bigint literal
const big = SemanticBigInt.from(12345678901234567890n);

// From a number (converted to bigint)
const big2 = SemanticBigInt.from(123456789);
```

## Methods

### format

Format the bigint with different styles.

```typescript
const num = SemanticBigInt.from(12345678901234567890n);

// Scientific notation
num.format({ style: 'scientific' });
// "1.234567890123456789e19"

// Binary
num.format({ style: 'binary' });
// "1010101101..."

// Hexadecimal
num.format({ style: 'hex' });
// "0xAB54A98CEB1F0AD2"

// With thousand separators
num.format({ style: 'grouped', locale: 'en-US' });
// "12,345,678,901,234,567,890"
```

**Options:**
- `style: 'decimal' | 'scientific' | 'binary' | 'hex' | 'grouped'`
- `locale?: string` - Locale for grouped formatting

### scale

Scale the number to different magnitudes.

```typescript
const num = SemanticBigInt.from(1000000000000n);

const scaled = num.scale(1000);
// SemanticBigInt with value 1000000000n (divided by 1000)

const bytes = SemanticBigInt.from(1099511627776n); // 1 TB in bytes
const gigabytes = bytes.scale(1073741824); // Convert to GB
console.log(gigabytes.valueOf()); // 1024n
```

### inferDomain

Infer the likely domain for this number based on its characteristics.

```typescript
const hash = SemanticBigInt.from(
  0xABCDEF1234567890ABCDEF1234567890n
);

const result = await hash.inferDomain("user-provided value");
// {
//   domain: "cryptography",
//   subdomain: "hash_value",
//   confidence: 0.89
// }

const distance = SemanticBigInt.from(149597870700000n);
const result2 = await distance.inferDomain("measurement in meters");
// {
//   domain: "astronomy",
//   subdomain: "astronomical_distance",
//   confidence: 0.92
// }
```

### isReasonable

Validate if the bigint is reasonable for a given context.

```typescript
const num = SemanticBigInt.from(10000000000000000000000n);

const result = await num.isReasonable("database row ID");
// {
//   reasonable: false,
//   explanation: "Value exceeds typical database ID ranges by many orders of magnitude"
// }

const result2 = await num.isReasonable("national debt in cents");
// {
//   reasonable: true,
//   explanation: "Value is within the range of national debt figures"
// }
```

### semanticallyEquals

Compare two bigints semantically.

```typescript
const num1 = SemanticBigInt.from(1000000000000n);
const num2 = SemanticBigInt.from(999999999999n);

const result = await num1.semanticallyEquals(num2, {
  context: "approximate comparison",
  tolerance: 0.001
});
// { equivalent: true, confidence: 0.95 }
```

## Implemented Interfaces

- `Semantic<bigint>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Describable` - Human-readable descriptions
- `ContextValidatable` - Context-aware validation

## Examples

### Cryptographic Applications

```typescript
async function analyzeKey(keyValue: bigint) {
  const key = SemanticBigInt.from(keyValue);

  const domain = await key.inferDomain("encryption key");
  const formatted = key.format({ style: 'hex' });

  return {
    hexValue: formatted,
    domain: domain.domain,
    bitLength: keyValue.toString(2).length,
    isValidKeySize: [128, 256, 512, 1024, 2048, 4096].includes(
      keyValue.toString(2).length
    )
  };
}
```

### Financial Calculations with Precision

```typescript
function calculateCompoundInterest(
  principal: bigint,
  ratePercent: number,
  years: number
): SemanticBigInt {
  // Using bigint for precision in cents
  const rateBasis = BigInt(Math.round(ratePercent * 10000)); // Rate in basis points
  const basisDivisor = 1000000n;

  let amount = principal;
  for (let i = 0; i < years; i++) {
    amount = amount + (amount * rateBasis) / basisDivisor;
  }

  return SemanticBigInt.from(amount);
}

const result = calculateCompoundInterest(100000000n, 5.5, 10); // $1M in cents, 5.5%, 10 years
console.log(result.format({ style: 'grouped' }));
```

### Data Size Formatting

```typescript
function formatDataSize(bytes: bigint) {
  const size = SemanticBigInt.from(bytes);

  const units = [
    { name: 'PB', divisor: 1125899906842624n },
    { name: 'TB', divisor: 1099511627776n },
    { name: 'GB', divisor: 1073741824n },
    { name: 'MB', divisor: 1048576n },
    { name: 'KB', divisor: 1024n },
    { name: 'B', divisor: 1n }
  ];

  for (const unit of units) {
    if (bytes >= unit.divisor) {
      const scaled = size.scale(Number(unit.divisor));
      return `${scaled.valueOf()} ${unit.name}`;
    }
  }

  return `${bytes} B`;
}

formatDataSize(5497558138880n); // "5 TB"
```

### Astronomical Calculations

```typescript
async function analyzeAstronomicalDistance(meters: bigint) {
  const distance = SemanticBigInt.from(meters);

  const domain = await distance.inferDomain("distance in meters");
  const reasonable = await distance.isReasonable("astronomical measurement");

  // Convert to astronomical units (AU)
  const AU = 149597870700n;
  const inAU = meters / AU;

  // Convert to light-years
  const lightYear = 9460730472580800n;
  const inLightYears = meters / lightYear;

  return {
    meters: distance.format({ style: 'scientific' }),
    au: Number(inAU),
    lightYears: Number(inLightYears),
    domain: domain.subdomain,
    reasonable: reasonable.reasonable
  };
}

await analyzeAstronomicalDistance(40208000000000000n); // ~4.25 light years (to Alpha Centauri)
```
