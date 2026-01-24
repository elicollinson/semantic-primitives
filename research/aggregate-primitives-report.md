# Aggregate Primitives Report

A comprehensive analysis of primitive types across programming languages and their equivalents in Node.js/JavaScript. This report serves as the foundation for designing LLM-enhanced semantic primitives.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Universal Primitive Categories](#universal-primitive-categories)
3. [Boolean Type](#boolean-type)
4. [Numeric Types](#numeric-types)
5. [String Type](#string-type)
6. [Null/None/Nil Type](#nullnonenil-type)
7. [Array/List Type](#arraylist-type)
8. [Key-Value Collections](#key-value-collections)
9. [Symbol/Identifier Type](#symbolidentifier-type)
10. [Node.js Interface Reference](#nodejs-interface-reference)
11. [Semantic Enhancement Opportunities](#semantic-enhancement-opportunities)

---

## Executive Summary

After analyzing primitives across 8 programming languages (JavaScript/Node.js, Python, Java, C#, Go, Rust, C/C++, Ruby), we identify **6 core primitive categories** that exist universally and have direct Node.js equivalents:

| Primitive Category | Node.js Type | Universal Presence |
|-------------------|--------------|-------------------|
| Boolean | `boolean` | All 8 languages |
| Integer/Number | `number`, `BigInt` | All 8 languages |
| Floating-Point | `number` | All 8 languages |
| String | `string` | All 8 languages |
| Null/None | `null`, `undefined` | All 8 languages |
| Array/List | `Array` | All 8 languages |
| Key-Value Map | `Object`, `Map` | All 8 languages |
| Symbol/Identifier | `Symbol` | 3 languages (JS, Ruby, Lisp-family) |

---

## Universal Primitive Categories

### Cross-Language Primitive Comparison Matrix

| Category | JavaScript | Python | Java | C# | Go | Rust | C/C++ | Ruby |
|----------|------------|--------|------|----|----|------|-------|------|
| Boolean | `boolean` | `bool` | `boolean` | `bool` | `bool` | `bool` | `bool` | `TrueClass`/`FalseClass` |
| Signed Int | `number`/`BigInt` | `int` | `byte`,`short`,`int`,`long` | `sbyte`,`short`,`int`,`long` | `int8`-`int64` | `i8`-`i128` | `char`,`short`,`int`,`long` | `Integer` |
| Unsigned Int | N/A | N/A | N/A | `byte`,`ushort`,`uint`,`ulong` | `uint8`-`uint64` | `u8`-`u128` | `unsigned` variants | N/A |
| Float | `number` | `float` | `float`,`double` | `float`,`double`,`decimal` | `float32`,`float64` | `f32`,`f64` | `float`,`double` | `Float` |
| String | `string` | `str` | `String` | `string` | `string` | `String`/`&str` | `std::string` | `String` |
| Null | `null`/`undefined` | `None` | `null` | `null` | `nil` | `Option<T>` | `nullptr`/`NULL` | `nil` |
| Array | `Array` | `list` | `[]`/`ArrayList` | `[]`/`List<T>` | `[]`/slice | `Vec<T>`/`[T;N]` | `[]`/`std::vector` | `Array` |
| Map | `Object`/`Map` | `dict` | `HashMap` | `Dictionary<K,V>` | `map` | `HashMap` | `std::map` | `Hash` |

---

## Boolean Type

### Definition
A boolean represents a logical value of `true` or `false`. This is the most universally consistent primitive across all languages.

### Cross-Language Nuances

#### Truthiness/Falsiness Rules

| Language | Falsy Values | Notes |
|----------|--------------|-------|
| **JavaScript** | `false`, `0`, `-0`, `""`, `null`, `undefined`, `NaN` | Most permissive; many values coerce to false |
| **Python** | `False`, `0`, `0.0`, `""`, `[]`, `{}`, `set()`, `None` | Empty collections are falsy |
| **Java** | Only `false` | Strict; no coercion in conditionals |
| **C#** | Only `false` | Strict; no coercion in conditionals |
| **Go** | Only `false` | Strict; must be explicitly `bool` |
| **Rust** | Only `false` | Strict; must be explicitly `bool` |
| **C/C++** | `0`, `0.0`, `nullptr`, `NULL` | C treats 0 as false |
| **Ruby** | Only `false`, `nil` | Most restrictive; `0` and `""` are truthy! |

#### Key Insight for Semantic Booleans
- JavaScript's permissive truthiness is both powerful and error-prone
- A semantic boolean could provide:
  - Explicit "fuzzy" truth values (maybe, probably, unlikely)
  - Confidence scores (0.0 to 1.0)
  - Natural language parsing ("yes", "yeah", "nope", "definitely")

### Node.js Boolean Interface

```typescript
// Primitive boolean
type boolean = true | false;

// Boolean wrapper object
interface Boolean {
  valueOf(): boolean;
  toString(): string;
}

// Global Boolean constructor
interface BooleanConstructor {
  new(value?: any): Boolean;
  (value?: any): boolean;  // Type coercion function
  readonly prototype: Boolean;
}
```

#### Methods and Operations
| Operation | Syntax | Description |
|-----------|--------|-------------|
| Logical AND | `a && b` | Short-circuit AND |
| Logical OR | `a \|\| b` | Short-circuit OR |
| Logical NOT | `!a` | Negation |
| Nullish coalescing | `a ?? b` | Returns `b` if `a` is `null`/`undefined` |
| Coercion | `Boolean(x)` | Convert any value to boolean |
| Double negation | `!!x` | Idiomatic coercion |

---

## Numeric Types

### Definition
Numeric types represent mathematical values. JavaScript uniquely combines integers and floating-point into a single `number` type, while most languages distinguish them.

### Cross-Language Nuances

#### Integer Representation Comparison

| Language | Integer Types | Arbitrary Precision | Default Int Size |
|----------|--------------|---------------------|------------------|
| **JavaScript** | `number` (53-bit safe), `BigInt` | Yes (BigInt) | 64-bit float (53-bit int precision) |
| **Python** | `int` | Yes (native) | Unlimited |
| **Java** | `byte`,`short`,`int`,`long` | Via `BigInteger` | 32-bit (`int`) |
| **C#** | `sbyte`-`long`, `byte`-`ulong` | Via `BigInteger` | 32-bit (`int`) |
| **Go** | `int8`-`int64`, `uint8`-`uint64` | Via `math/big` | Platform-dependent (`int`) |
| **Rust** | `i8`-`i128`, `u8`-`u128` | Via crate | Platform-dependent (`isize`) |
| **C/C++** | `char`-`long long` | Via library | Platform-dependent |
| **Ruby** | `Integer` | Yes (native) | Unlimited |

#### Floating-Point Comparison

| Language | Float Types | Precision | Decimal Type |
|----------|-------------|-----------|--------------|
| **JavaScript** | `number` | IEEE 754 double (64-bit) | None native |
| **Python** | `float` | IEEE 754 double (64-bit) | `decimal.Decimal` |
| **Java** | `float`, `double` | 32-bit, 64-bit | `BigDecimal` |
| **C#** | `float`, `double`, `decimal` | 32-bit, 64-bit, 128-bit | Native `decimal` |
| **Go** | `float32`, `float64` | 32-bit, 64-bit | Via library |
| **Rust** | `f32`, `f64` | 32-bit, 64-bit | Via crate |
| **C/C++** | `float`, `double`, `long double` | 32-bit, 64-bit, 80/128-bit | None |
| **Ruby** | `Float`, `Rational` | IEEE 754 double | `Rational` for exact |

#### Special Numeric Values

| Value | JavaScript | Exists In |
|-------|------------|-----------|
| Positive Infinity | `Infinity` | All (as float) |
| Negative Infinity | `-Infinity` | All (as float) |
| Not a Number | `NaN` | All (as float) |
| Negative Zero | `-0` | JS, Java, C#, Go, Rust, C++ |
| Epsilon | `Number.EPSILON` | All have epsilon concept |

#### Key Numeric Quirks by Language

**JavaScript:**
- `0.1 + 0.2 !== 0.3` (IEEE 754 precision)
- `NaN !== NaN` (only value not equal to itself)
- `typeof NaN === 'number'`
- `Number.MAX_SAFE_INTEGER = 2^53 - 1`

**Python:**
- `int` has unlimited precision natively
- `3 / 2 = 1.5` (true division), `3 // 2 = 1` (floor division)

**Java/C#:**
- Integer overflow wraps around (Java) or throws (C# checked context)
- Division by zero throws for integers, returns Infinity for floats

**Rust:**
- Integer overflow panics in debug, wraps in release
- Provides `checked_`, `wrapping_`, `saturating_`, `overflowing_` variants

### Node.js Number Interface

```typescript
// Primitive number
type number = /* IEEE 754 double-precision 64-bit */;

// Number wrapper object
interface Number {
  toExponential(fractionDigits?: number): string;
  toFixed(fractionDigits?: number): string;
  toLocaleString(locales?: string | string[], options?: Intl.NumberFormatOptions): string;
  toPrecision(precision?: number): string;
  toString(radix?: number): string;
  valueOf(): number;
}

// Number static properties and methods
interface NumberConstructor {
  new(value?: any): Number;
  (value?: any): number;
  readonly prototype: Number;

  // Constants
  readonly EPSILON: number;                    // 2.220446049250313e-16
  readonly MAX_SAFE_INTEGER: number;           // 9007199254740991 (2^53 - 1)
  readonly MAX_VALUE: number;                  // 1.7976931348623157e+308
  readonly MIN_SAFE_INTEGER: number;           // -9007199254740991
  readonly MIN_VALUE: number;                  // 5e-324
  readonly NaN: number;
  readonly NEGATIVE_INFINITY: number;
  readonly POSITIVE_INFINITY: number;

  // Methods
  isFinite(number: unknown): boolean;
  isInteger(number: unknown): boolean;
  isNaN(number: unknown): boolean;
  isSafeInteger(number: unknown): boolean;
  parseFloat(string: string): number;
  parseInt(string: string, radix?: number): number;
}
```

### Node.js BigInt Interface

```typescript
// Primitive BigInt
type bigint = /* arbitrary precision integer */;

// BigInt operations
interface BigIntConstructor {
  (value: bigint | boolean | number | string): bigint;
  asIntN(bits: number, int: bigint): bigint;
  asUintN(bits: number, int: bigint): bigint;
}
```

#### Math Object (for number operations)

```typescript
interface Math {
  // Constants
  readonly E: number;        // Euler's number (~2.718)
  readonly LN10: number;     // Natural log of 10
  readonly LN2: number;      // Natural log of 2
  readonly LOG10E: number;   // Base 10 log of E
  readonly LOG2E: number;    // Base 2 log of E
  readonly PI: number;       // Pi (~3.14159)
  readonly SQRT1_2: number;  // Square root of 1/2
  readonly SQRT2: number;    // Square root of 2

  // Methods
  abs(x: number): number;
  acos(x: number): number;
  acosh(x: number): number;
  asin(x: number): number;
  asinh(x: number): number;
  atan(x: number): number;
  atan2(y: number, x: number): number;
  atanh(x: number): number;
  cbrt(x: number): number;
  ceil(x: number): number;
  clz32(x: number): number;
  cos(x: number): number;
  cosh(x: number): number;
  exp(x: number): number;
  expm1(x: number): number;
  floor(x: number): number;
  fround(x: number): number;
  hypot(...values: number[]): number;
  imul(x: number, y: number): number;
  log(x: number): number;
  log10(x: number): number;
  log1p(x: number): number;
  log2(x: number): number;
  max(...values: number[]): number;
  min(...values: number[]): number;
  pow(x: number, y: number): number;
  random(): number;
  round(x: number): number;
  sign(x: number): number;
  sin(x: number): number;
  sinh(x: number): number;
  sqrt(x: number): number;
  tan(x: number): number;
  tanh(x: number): number;
  trunc(x: number): number;
}
```

---

## String Type

### Definition
A string is a sequence of characters representing text. Despite seeming simple, string handling varies significantly across languages due to encoding differences.

### Cross-Language Nuances

#### String Encoding Comparison

| Language | Internal Encoding | Immutable | Char Access Returns |
|----------|-------------------|-----------|---------------------|
| **JavaScript** | UTF-16 | Yes | UTF-16 code unit (may be half a surrogate pair) |
| **Python** | Flexible (ASCII/UCS-1/UCS-2/UCS-4) | Yes | Unicode code point (full character) |
| **Java** | UTF-16 | Yes | UTF-16 code unit |
| **C#** | UTF-16 | Yes | UTF-16 code unit |
| **Go** | UTF-8 | Yes | Byte (use `range` for runes) |
| **Rust** | UTF-8 | Yes (`String` is mutable, `&str` is not) | Byte (use `.chars()` for chars) |
| **C/C++** | Platform-dependent | Mutable | Byte |
| **Ruby** | Configurable per string | Mutable | Character (encoding-aware) |

#### String Length Semantics

```
String: "Hello 👋"

Language        len()   What it counts
JavaScript      8       UTF-16 code units (emoji = 2)
Python          7       Unicode code points
Java            8       UTF-16 code units
Go              10      Bytes (UTF-8: emoji = 4 bytes)
Rust            10      Bytes (.chars().count() = 7)
Ruby            7       Characters (grapheme clusters)
```

#### Key String Quirks

**JavaScript:**
- `'abc'[0]` returns `'a'` (UTF-16 code unit, not guaranteed to be a full character)
- `'👋'.length === 2` (surrogate pair counted as 2)
- Template literals: `` `Hello ${name}` ``
- No character type (single char is still a string)

**Python:**
- f-strings: `f"Hello {name}"`
- Raw strings: `r"no\escape"`
- True Unicode iteration

**Go:**
- `len("hello")` returns bytes, not characters
- `for i, r := range "hello"` iterates over runes
- Strings are read-only byte slices

**Rust:**
- `String` (owned, heap) vs `&str` (borrowed, slice)
- `.len()` returns bytes, `.chars().count()` returns characters
- Indexing by byte is explicit: `s.as_bytes()[0]`

### Node.js String Interface

```typescript
// Primitive string
type string = /* UTF-16 encoded immutable sequence */;

// String wrapper object
interface String {
  // Properties
  readonly length: number;

  // Character Access
  charAt(pos: number): string;
  charCodeAt(index: number): number;
  codePointAt(pos: number): number | undefined;

  // Search Methods
  indexOf(searchString: string, position?: number): number;
  lastIndexOf(searchString: string, position?: number): number;
  includes(searchString: string, position?: number): boolean;
  startsWith(searchString: string, position?: number): boolean;
  endsWith(searchString: string, endPosition?: number): boolean;
  search(regexp: string | RegExp): number;
  match(regexp: string | RegExp): RegExpMatchArray | null;
  matchAll(regexp: RegExp): IterableIterator<RegExpMatchArray>;

  // Extraction Methods
  slice(start?: number, end?: number): string;
  substring(start: number, end?: number): string;
  substr(from: number, length?: number): string;  // Deprecated

  // Transformation Methods
  toLowerCase(): string;
  toUpperCase(): string;
  toLocaleLowerCase(locales?: string | string[]): string;
  toLocaleUpperCase(locales?: string | string[]): string;
  trim(): string;
  trimStart(): string;
  trimEnd(): string;
  padStart(maxLength: number, fillString?: string): string;
  padEnd(maxLength: number, fillString?: string): string;
  repeat(count: number): string;
  replace(searchValue: string | RegExp, replaceValue: string): string;
  replaceAll(searchValue: string | RegExp, replaceValue: string): string;
  normalize(form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): string;

  // Split and Join
  split(separator: string | RegExp, limit?: number): string[];
  concat(...strings: string[]): string;

  // Comparison
  localeCompare(that: string, locales?: string | string[], options?: Intl.CollatorOptions): number;

  // Iteration (ES6+)
  [Symbol.iterator](): IterableIterator<string>;

  // Well-formed Unicode (ES2024)
  isWellFormed(): boolean;
  toWellFormed(): string;

  // Conversion
  toString(): string;
  valueOf(): string;

  // Deprecated HTML methods (avoid)
  anchor(name: string): string;
  big(): string;
  bold(): string;
  // ... etc
}

// String static methods
interface StringConstructor {
  new(value?: any): String;
  (value?: any): string;
  readonly prototype: String;

  fromCharCode(...codes: number[]): string;
  fromCodePoint(...codePoints: number[]): string;
  raw(template: TemplateStringsArray, ...substitutions: any[]): string;
}
```

---

## Null/None/Nil Type

### Definition
Represents the intentional absence of a value. JavaScript uniquely has both `null` and `undefined`, while most languages have only one such concept.

### Cross-Language Nuances

#### Null Representation Comparison

| Language | Null Type | Additional Absence Types | Type of null |
|----------|-----------|-------------------------|--------------|
| **JavaScript** | `null` | `undefined` | `"object"` (bug) |
| **Python** | `None` | N/A | `NoneType` |
| **Java** | `null` | N/A | No type (reference absence) |
| **C#** | `null` | `Nullable<T>`, `default` | No type (reference absence) |
| **Go** | `nil` | N/A | Typed nil (per type) |
| **Rust** | N/A | `Option<T>::None` | Part of enum |
| **C/C++** | `nullptr`/`NULL` | N/A | `std::nullptr_t` / `int` |
| **Ruby** | `nil` | N/A | `NilClass` |

#### JavaScript's null vs undefined

| Aspect | `null` | `undefined` |
|--------|--------|-------------|
| Meaning | Intentional absence | Uninitialized/missing |
| typeof | `"object"` (historic bug) | `"undefined"` |
| Default parameter value | No | Yes |
| Object missing property | No | Yes |
| Function with no return | No | Yes |
| JSON | Supported | Excluded |
| Equality | `null == undefined` is `true` | |
| Strict equality | `null === undefined` is `false` | |

#### Rust's Option<T> - A Better Model?

Rust's approach forces explicit handling of absence:

```rust
enum Option<T> {
    Some(T),
    None,
}

// Must handle both cases
match optional_value {
    Some(value) => use_value(value),
    None => handle_absence(),
}
```

This pattern could inform semantic primitives that enforce handling of absent values.

### Node.js Null/Undefined Interface

```typescript
// Null type
type null = null;  // Literal type

// Undefined type
type undefined = undefined;  // Literal type

// Type checking
typeof null;       // "object" (infamous bug, kept for compatibility)
typeof undefined;  // "undefined"

// Equality comparisons
null == undefined;   // true (loose equality)
null === undefined;  // false (strict equality)
null == 0;          // false
undefined == 0;     // false

// Nullish coalescing (ES2020)
const value = maybeNull ?? defaultValue;

// Optional chaining (ES2020)
const nested = obj?.prop?.subprop;

// Void operator
void expression;  // Always returns undefined
```

---

## Array/List Type

### Definition
An ordered collection of elements. All languages have this concept, though implementations vary in mutability, typing, and performance characteristics.

### Cross-Language Nuances

#### Array Characteristics Comparison

| Language | Type Name | Typed Elements | Fixed Size | Mutable | Negative Indexing |
|----------|-----------|---------------|------------|---------|-------------------|
| **JavaScript** | `Array` | No (heterogeneous) | No | Yes | No |
| **Python** | `list` | No (heterogeneous) | No | Yes | Yes |
| **Java** | `[]`, `ArrayList` | Yes | `[]` yes, `ArrayList` no | Yes | No |
| **C#** | `[]`, `List<T>` | Yes | `[]` yes, `List<T>` no | Yes | `^1` syntax (C# 8) |
| **Go** | `[]`, slice | Yes | `[]` yes, slice no | Yes | No |
| **Rust** | `[T;N]`, `Vec<T>` | Yes | `[T;N]` yes, `Vec` no | `Vec` yes | No |
| **C/C++** | `[]`, `std::vector` | Yes | `[]` yes, `vector` no | Yes | No |
| **Ruby** | `Array` | No (heterogeneous) | No | Yes | Yes |

#### Key Array Methods Comparison

| Operation | JavaScript | Python | Java (ArrayList) | Ruby |
|-----------|------------|--------|------------------|------|
| Add to end | `push()` | `append()` | `add()` | `push()` / `<<` |
| Remove from end | `pop()` | `pop()` | `remove(size-1)` | `pop()` |
| Add to start | `unshift()` | `insert(0, x)` | `add(0, x)` | `unshift()` |
| Remove from start | `shift()` | `pop(0)` | `remove(0)` | `shift()` |
| Find index | `indexOf()` | `index()` | `indexOf()` | `index()` |
| Filter | `filter()` | list comp / `filter()` | Stream API | `select()` |
| Map | `map()` | list comp / `map()` | Stream API | `map()` |
| Reduce | `reduce()` | `functools.reduce()` | Stream API | `reduce()` |
| Sort in place | `sort()` | `sort()` | `Collections.sort()` | `sort!()` |
| Sorted copy | `toSorted()` | `sorted()` | Stream API | `sort()` |
| Reverse | `reverse()` | `reverse()` | `Collections.reverse()` | `reverse!()` |
| Join | `join()` | `''.join()` | `String.join()` | `join()` |

#### JavaScript Array Quirks

- Arrays are objects with numeric keys
- `typeof [] === 'object'`
- Sparse arrays allowed (holes): `[1, , 3]`
- `length` is writable (truncates array)
- `Array.isArray()` needed for type checking
- Methods like `sort()` mutate in place (ES2023 added non-mutating versions)

### Node.js Array Interface

```typescript
interface Array<T> {
  // Properties
  length: number;

  // Element Access
  [n: number]: T;
  at(index: number): T | undefined;  // Supports negative indices

  // Mutating Methods
  push(...items: T[]): number;
  pop(): T | undefined;
  shift(): T | undefined;
  unshift(...items: T[]): number;
  splice(start: number, deleteCount?: number, ...items: T[]): T[];
  fill(value: T, start?: number, end?: number): this;
  copyWithin(target: number, start: number, end?: number): this;
  sort(compareFn?: (a: T, b: T) => number): this;
  reverse(): this;

  // Non-Mutating Methods (copies)
  concat(...items: (T | ConcatArray<T>)[]): T[];
  slice(start?: number, end?: number): T[];
  toSorted(compareFn?: (a: T, b: T) => number): T[];      // ES2023
  toReversed(): T[];                                       // ES2023
  toSpliced(start: number, deleteCount: number, ...items: T[]): T[];  // ES2023
  with(index: number, value: T): T[];                      // ES2023

  // Search Methods
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  includes(searchElement: T, fromIndex?: number): boolean;
  find(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined;
  findIndex(predicate: (value: T, index: number, obj: T[]) => boolean): number;
  findLast(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined;
  findLastIndex(predicate: (value: T, index: number, obj: T[]) => boolean): number;

  // Iteration Methods
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
  filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;

  // Testing Methods
  every(predicate: (value: T, index: number, array: T[]) => boolean): boolean;
  some(predicate: (value: T, index: number, array: T[]) => boolean): boolean;

  // Transformation
  flat<D extends number = 1>(depth?: D): FlatArray<T, D>[];
  flatMap<U>(callback: (value: T, index: number, array: T[]) => U | ReadonlyArray<U>): U[];
  join(separator?: string): string;

  // Iteration Protocol
  keys(): IterableIterator<number>;
  values(): IterableIterator<T>;
  entries(): IterableIterator<[number, T]>;
  [Symbol.iterator](): IterableIterator<T>;
}

// Array static methods
interface ArrayConstructor {
  new <T>(arrayLength: number): T[];
  new <T>(...items: T[]): T[];
  <T>(arrayLength: number): T[];
  <T>(...items: T[]): T[];

  isArray(arg: any): arg is any[];
  from<T>(arrayLike: ArrayLike<T>): T[];
  from<T, U>(arrayLike: ArrayLike<T>, mapfn: (v: T, k: number) => U): U[];
  of<T>(...items: T[]): T[];
}
```

---

## Key-Value Collections

### Definition
Collections that map keys to values. All languages provide this, though JavaScript uniquely has both `Object` and `Map`.

### Cross-Language Nuances

#### Map/Dict Comparison

| Language | Type Name | Key Types | Ordered | Key Uniqueness |
|----------|-----------|-----------|---------|----------------|
| **JavaScript** | `Object`, `Map` | `Object`: string/symbol; `Map`: any | `Map`: insertion order | By identity (`Map`) or string coercion (`Object`) |
| **Python** | `dict` | Hashable types | Insertion order (3.7+) | By hash + equality |
| **Java** | `HashMap`, `LinkedHashMap` | Objects with hashCode/equals | `LinkedHashMap`: insertion | By equals() |
| **C#** | `Dictionary<K,V>` | IEquatable types | No (use `OrderedDictionary`) | By Equals/GetHashCode |
| **Go** | `map` | Comparable types | No | By equality |
| **Rust** | `HashMap`, `BTreeMap` | Hash+Eq / Ord | `BTreeMap`: sorted | By Eq |
| **Ruby** | `Hash` | Any object | Insertion order | By eql?/hash |

#### JavaScript Object vs Map

| Feature | `Object` | `Map` |
|---------|----------|-------|
| Key types | String, Symbol only | Any value |
| Key order | Insertion order (mostly) | Insertion order (guaranteed) |
| Size | Manual count | `.size` property |
| Iteration | `for...in`, `Object.keys()` | `for...of`, `.forEach()` |
| Performance | Optimized for static shape | Optimized for frequent add/delete |
| Default keys | Has prototype chain | None |
| Serialization | JSON native | Must convert |

### Node.js Map Interface

```typescript
interface Map<K, V> {
  // Properties
  readonly size: number;

  // Methods
  clear(): void;
  delete(key: K): boolean;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): this;

  // Iteration
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void;
  keys(): IterableIterator<K>;
  values(): IterableIterator<V>;
  entries(): IterableIterator<[K, V]>;
  [Symbol.iterator](): IterableIterator<[K, V]>;
}

interface MapConstructor {
  new <K, V>(entries?: readonly (readonly [K, V])[] | null): Map<K, V>;
  readonly prototype: Map<any, any>;
}
```

### Node.js Set Interface

```typescript
interface Set<T> {
  readonly size: number;

  add(value: T): this;
  clear(): void;
  delete(value: T): boolean;
  has(value: T): boolean;

  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void): void;
  keys(): IterableIterator<T>;
  values(): IterableIterator<T>;
  entries(): IterableIterator<[T, T]>;
  [Symbol.iterator](): IterableIterator<T>;

  // ES2025 Set methods
  union(other: Set<T>): Set<T>;
  intersection(other: Set<T>): Set<T>;
  difference(other: Set<T>): Set<T>;
  symmetricDifference(other: Set<T>): Set<T>;
  isSubsetOf(other: Set<T>): boolean;
  isSupersetOf(other: Set<T>): boolean;
  isDisjointFrom(other: Set<T>): boolean;
}
```

---

## Symbol/Identifier Type

### Definition
Unique, immutable identifiers. This is less universal - only JavaScript and Ruby have first-class symbol types among mainstream languages.

### Cross-Language Nuances

| Language | Has Symbols | Use Case |
|----------|-------------|----------|
| **JavaScript** | Yes (`Symbol`) | Property keys, well-known behaviors |
| **Ruby** | Yes (`:symbol`) | Hash keys, method names, identifiers |
| **Lisp/Scheme** | Yes | First-class identifiers |
| **Erlang/Elixir** | Yes (atoms) | Pattern matching, keys |
| **Others** | No | Use strings or enums instead |

### Node.js Symbol Interface

```typescript
interface Symbol {
  readonly description: string | undefined;
  toString(): string;
  valueOf(): symbol;
  [Symbol.toPrimitive](hint: string): symbol;
}

interface SymbolConstructor {
  (description?: string | number): symbol;

  // Global symbol registry
  for(key: string): symbol;
  keyFor(sym: symbol): string | undefined;

  // Well-known symbols
  readonly asyncIterator: unique symbol;
  readonly hasInstance: unique symbol;
  readonly isConcatSpreadable: unique symbol;
  readonly iterator: unique symbol;
  readonly match: unique symbol;
  readonly matchAll: unique symbol;
  readonly replace: unique symbol;
  readonly search: unique symbol;
  readonly species: unique symbol;
  readonly split: unique symbol;
  readonly toPrimitive: unique symbol;
  readonly toStringTag: unique symbol;
  readonly unscopables: unique symbol;
}
```

---

## Node.js Interface Reference

### Complete Primitive Type Hierarchy

```
JavaScript Types
├── Primitive Types (immutable, passed by value)
│   ├── boolean
│   ├── number
│   ├── bigint
│   ├── string
│   ├── symbol
│   ├── undefined
│   └── null
│
└── Object Types (mutable, passed by reference)
    ├── Object
    ├── Array
    ├── Function
    ├── Date
    ├── RegExp
    ├── Error
    ├── Map
    ├── Set
    ├── WeakMap
    ├── WeakSet
    ├── ArrayBuffer
    ├── SharedArrayBuffer
    ├── DataView
    ├── TypedArrays
    │   ├── Int8Array
    │   ├── Uint8Array
    │   ├── Uint8ClampedArray
    │   ├── Int16Array
    │   ├── Uint16Array
    │   ├── Int32Array
    │   ├── Uint32Array
    │   ├── Float32Array
    │   ├── Float64Array
    │   ├── BigInt64Array
    │   └── BigUint64Array
    └── Node.js Specific
        └── Buffer
```

### Node.js-Specific Extensions

```typescript
// Buffer (Node.js binary data handling)
interface Buffer extends Uint8Array {
  // Creation
  static alloc(size: number, fill?: string | number | Buffer, encoding?: string): Buffer;
  static allocUnsafe(size: number): Buffer;
  static from(data: string | Buffer | ArrayBuffer | number[], encoding?: string): Buffer;
  static concat(list: Buffer[], totalLength?: number): Buffer;
  static isBuffer(obj: any): obj is Buffer;

  // Encoding/Decoding
  toString(encoding?: string, start?: number, end?: number): string;
  toJSON(): { type: 'Buffer'; data: number[] };

  // Reading
  readBigInt64BE(offset?: number): bigint;
  readBigInt64LE(offset?: number): bigint;
  readBigUInt64BE(offset?: number): bigint;
  readBigUInt64LE(offset?: number): bigint;
  readDoubleBE(offset?: number): number;
  readDoubleLE(offset?: number): number;
  readFloatBE(offset?: number): number;
  readFloatLE(offset?: number): number;
  readInt8(offset?: number): number;
  readInt16BE(offset?: number): number;
  readInt16LE(offset?: number): number;
  readInt32BE(offset?: number): number;
  readInt32LE(offset?: number): number;
  readUInt8(offset?: number): number;
  readUInt16BE(offset?: number): number;
  readUInt16LE(offset?: number): number;
  readUInt32BE(offset?: number): number;
  readUInt32LE(offset?: number): number;

  // Writing (corresponding write methods)
  // ... similar pattern for writes

  // Comparison
  compare(target: Buffer, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number;
  equals(otherBuffer: Buffer): boolean;

  // Search
  includes(value: string | number | Buffer, byteOffset?: number, encoding?: string): boolean;
  indexOf(value: string | number | Buffer, byteOffset?: number, encoding?: string): number;
  lastIndexOf(value: string | number | Buffer, byteOffset?: number, encoding?: string): number;
}
```

---

## Semantic Enhancement Opportunities

Based on this cross-language analysis, here are key opportunities for LLM-enhanced semantic primitives:

### 1. SemanticBoolean

**Enhancements beyond native boolean:**
- Fuzzy truth values with confidence scores (0.0-1.0)
- Natural language parsing: "yes", "yeah", "nope", "maybe", "definitely"
- Explanation capability: why is this true/false?
- Three-valued logic: true, false, unknown (like SQL NULL)
- Temporal booleans: was true, is true, will be true

```typescript
class SemanticBoolean {
  confidence: number;  // 0.0 to 1.0
  explanation?: string;

  static parse(input: string): SemanticBoolean;  // "yes" -> true
  probably(): boolean;  // confidence > 0.5
  definitely(): boolean;  // confidence > 0.9
}
```

### 2. SemanticNumber

**Enhancements beyond native number:**
- Unit awareness (meters, dollars, percentages)
- Precision tracking (significant figures)
- Range/uncertainty representation
- Natural language parsing: "about a hundred", "roughly 3.5 million"
- Automatic precision in arithmetic

```typescript
class SemanticNumber {
  value: number;
  unit?: string;
  precision?: number;
  uncertainty?: number;

  static parse(input: string): SemanticNumber;  // "about $50" -> {value: 50, unit: "USD", uncertainty: 10}
  format(locale?: string): string;  // Locale-aware formatting
}
```

### 3. SemanticString

**Enhancements beyond native string:**
- Semantic similarity comparison (not just exact match)
- Fuzzy matching with configurable threshold
- Intent extraction
- Entity recognition
- Automatic normalization (case, whitespace, Unicode)
- Language detection

```typescript
class SemanticString {
  value: string;
  language?: string;

  semanticEquals(other: string, threshold?: number): boolean;
  semanticContains(substring: string): boolean;
  extractEntities(): Entity[];
  getIntent(): Intent;
  normalize(): SemanticString;
}
```

### 4. SemanticArray

**Enhancements beyond native Array:**
- Semantic search within array
- Fuzzy filtering
- Intelligent sorting (semantic, not just lexicographic)
- Deduplication with semantic similarity
- Grouping by semantic categories

```typescript
class SemanticArray<T> extends Array<T> {
  semanticFind(query: string): T | undefined;
  semanticFilter(predicate: string): SemanticArray<T>;
  semanticSort(criteria: string): SemanticArray<T>;
  semanticGroupBy(criteria: string): Map<string, SemanticArray<T>>;
  semanticUnique(threshold?: number): SemanticArray<T>;
}
```

### 5. SemanticMap / SemanticObject

**Enhancements beyond native Object/Map:**
- Fuzzy key lookup
- Semantic key matching
- Schema inference and validation
- Natural language queries

```typescript
class SemanticMap<K, V> extends Map<K, V> {
  semanticGet(key: string): V | undefined;  // Fuzzy key matching
  semanticHas(key: string): boolean;
  query(naturalLanguage: string): V | undefined;
  inferSchema(): Schema;
}
```

### Cross-Cutting Concerns

All semantic primitives should support:

1. **Serialization**: JSON/binary serialization preserving semantic metadata
2. **Interoperability**: Easy conversion to/from native types
3. **Type Guards**: TypeScript type narrowing support
4. **Immutability Options**: Both mutable and immutable variants
5. **Async Operations**: Promise-based variants for LLM calls
6. **Caching**: Memoization of expensive semantic operations
7. **Configurability**: Adjustable thresholds and behaviors
8. **Explainability**: Ability to explain semantic decisions

---

## Conclusion

This analysis reveals that while all programming languages share core primitive concepts, their implementations differ significantly in:

1. **Type strictness**: Static vs. dynamic typing
2. **Null handling**: Single vs. multiple absence types
3. **Numeric precision**: Fixed vs. arbitrary precision
4. **String encoding**: UTF-8 vs. UTF-16 vs. configurable
5. **Collection mutability**: Mutable vs. immutable by default

JavaScript/Node.js occupies a unique position with its dynamic typing and permissive coercion rules. This flexibility, while sometimes error-prone, creates an ideal foundation for semantic primitives that can understand context and meaning rather than just raw values.

The semantic-primitives library can leverage this flexibility to create types that "understand" their values through LLM integration, while maintaining compatibility with the JavaScript ecosystem and TypeScript's type system.
