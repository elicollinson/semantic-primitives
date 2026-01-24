# JavaScript/Node.js Primitive Types - Comprehensive Reference

This document provides a thorough technical reference for JavaScript primitive types and key built-in objects, intended as a foundation for creating LLM-enhanced semantic versions of these primitives.

---

## Table of Contents

1. [Overview of JavaScript Types](#overview-of-javascript-types)
2. [String](#string)
3. [Number](#number)
4. [BigInt](#bigint)
5. [Boolean](#boolean)
6. [Null](#null)
7. [Undefined](#undefined)
8. [Symbol](#symbol)
9. [Object](#object)
10. [Array](#array)
11. [TypedArrays](#typedarrays)
12. [Node.js Buffer](#nodejs-buffer)
13. [Type Coercion Rules](#type-coercion-rules)
14. [Node.js vs Browser Differences](#nodejs-vs-browser-differences)

---

## Overview of JavaScript Types

JavaScript has **7 primitive types** and **1 reference type**:

### Primitive Types (Immutable, passed by value)
| Type | typeof result | Example |
|------|---------------|---------|
| string | `"string"` | `"hello"` |
| number | `"number"` | `42`, `3.14`, `NaN`, `Infinity` |
| bigint | `"bigint"` | `9007199254740993n` |
| boolean | `"boolean"` | `true`, `false` |
| undefined | `"undefined"` | `undefined` |
| symbol | `"symbol"` | `Symbol("id")` |
| null | `"object"` (bug) | `null` |

### Reference Type (Mutable, passed by reference)
| Type | typeof result | Example |
|------|---------------|---------|
| object | `"object"` | `{}`, `[]`, `new Date()` |
| function | `"function"` | `function() {}` |

```javascript
// Type checking
typeof "hello"      // "string"
typeof 42           // "number"
typeof 42n          // "bigint"
typeof true         // "boolean"
typeof undefined    // "undefined"
typeof Symbol()     // "symbol"
typeof null         // "object" (historical bug, never fixed)
typeof {}           // "object"
typeof []           // "object"
typeof function(){} // "function"
```

---

## String

### Type Name and Syntax

```javascript
// Primitive string literals
const str1 = 'single quotes';
const str2 = "double quotes";
const str3 = `template literal with ${expression}`;

// String constructor (creates wrapper object)
const strObj = new String("hello");  // typeof === "object"

// String function (coerces to primitive)
const strPrim = String(123);  // typeof === "string"
```

### Memory Representation and Size

- Strings are **immutable sequences of UTF-16 code units**
- Each character occupies **2 bytes** (16 bits) in memory
- Characters outside the Basic Multilingual Plane (BMP) use **surrogate pairs** (4 bytes)
- String length is measured in **code units**, not characters

```javascript
"hello".length;        // 5
"\u{1F600}".length;    // 2 (emoji uses surrogate pair)
"cafe\u0301".length;   // 5 (e + combining accent = 2 code units)

// Actual character count
[..."hello"].length;           // 5
[..."\u{1F600}"].length;       // 1
```

### Built-in Methods and Properties

#### Properties
```javascript
str.length          // Number of UTF-16 code units
```

#### Static Methods
```javascript
String.fromCharCode(65, 66, 67)           // "ABC"
String.fromCodePoint(0x1F600)             // emoji
String.raw`Hello\nWorld`                  // "Hello\\nWorld" (escapes not processed)
```

#### Instance Methods - Search and Match
```javascript
str.charAt(index)                    // Character at index (or "")
str.charCodeAt(index)                // UTF-16 code unit (or NaN)
str.codePointAt(index)               // Full Unicode code point
str.at(index)                        // Like charAt, supports negative indices (ES2022)

str.indexOf(searchValue, fromIndex)  // First occurrence index (or -1)
str.lastIndexOf(searchValue, fromIndex)
str.includes(searchString, position) // Boolean
str.startsWith(searchString, position)
str.endsWith(searchString, length)

str.search(regexp)                   // Index of first match (or -1)
str.match(regexp)                    // Array of matches or null
str.matchAll(regexp)                 // Iterator of all matches (regexp must have /g)
```

#### Instance Methods - Transformation
```javascript
str.toLowerCase()                    // Locale-independent
str.toUpperCase()
str.toLocaleLowerCase(locale)        // Locale-aware
str.toLocaleUpperCase(locale)

str.trim()                           // Remove whitespace both ends
str.trimStart() / str.trimLeft()     // Remove leading whitespace
str.trimEnd() / str.trimRight()      // Remove trailing whitespace

str.padStart(targetLength, padString)
str.padEnd(targetLength, padString)

str.repeat(count)                    // Repeat string n times

str.replace(pattern, replacement)    // Replace first match
str.replaceAll(pattern, replacement) // Replace all matches (ES2021)

str.normalize(form)                  // Unicode normalization (NFC, NFD, NFKC, NFKD)
```

#### Instance Methods - Extraction
```javascript
str.slice(beginIndex, endIndex)      // Extract portion (supports negative indices)
str.substring(indexStart, indexEnd)  // Like slice but swaps if start > end
str.substr(start, length)            // DEPRECATED - use slice

str.split(separator, limit)          // Split into array
```

#### Instance Methods - Concatenation and Conversion
```javascript
str.concat(str2, str3, ...)          // Concatenate (prefer + or template literals)
str.toString()                       // Return primitive string
str.valueOf()                        // Return primitive string

str.localeCompare(compareString, locales, options)  // Locale-aware comparison
```

### Type Coercion Rules

```javascript
// To String
String(123)           // "123"
String(true)          // "true"
String(false)         // "false"
String(null)          // "null"
String(undefined)     // "undefined"
String(Symbol("x"))   // "Symbol(x)"
String({})            // "[object Object]"
String([1, 2, 3])     // "1,2,3"

// Implicit coercion (via + with string)
"" + 42               // "42"
"" + null             // "null"
"" + undefined        // "undefined"

// Template literals call toString()
`${123}`              // "123"
`${{}}`               // "[object Object]"
```

### Edge Cases and Quirks

```javascript
// Empty string is falsy
Boolean("")           // false
Boolean("0")          // true (non-empty string)
Boolean(" ")          // true (whitespace is non-empty)

// String comparison is lexicographic by code unit
"10" > "9"            // false ("1" < "9")
"10" > 9              // true (coerced to numbers)

// Strings are immutable
let s = "hello";
s[0] = "H";           // Silent failure in non-strict mode
console.log(s);       // "hello" (unchanged)

// Unicode edge cases
"cafe\u0301" === "caf\u00e9"  // false (different representations)
"cafe\u0301".normalize() === "caf\u00e9".normalize()  // true

// Surrogate pair handling
"\uD83D\uDE00" === "\u{1F600}"  // true
"\uD83D\uDE00".length           // 2
[..."\uD83D\uDE00"].length      // 1

// String object vs primitive
const prim = "hello";
const obj = new String("hello");
typeof prim           // "string"
typeof obj            // "object"
prim == obj           // true (coercion)
prim === obj          // false (different types)
```

### Wrapper Object (String)

```javascript
// Auto-boxing: primitives temporarily wrapped when calling methods
"hello".toUpperCase();  // Works - temp wrapper created

// Explicit wrapper object
const strObj = new String("hello");
strObj instanceof String  // true
"hello" instanceof String // false

// Wrapper adds overhead, rarely needed
strObj.customProp = "value";  // Works (object)
"hello".customProp = "value"; // Silent failure (primitive)
```

---

## Number

### Type Name and Syntax

```javascript
// Literal syntax
const int = 42;
const float = 3.14159;
const negative = -273.15;
const exponential = 6.022e23;

// Different bases
const binary = 0b1010;        // 10
const octal = 0o755;          // 493
const hex = 0xFF;             // 255

// Special values
const inf = Infinity;
const negInf = -Infinity;
const notANumber = NaN;

// Numeric separators (ES2021)
const billion = 1_000_000_000;
const bytes = 0xFF_FF_FF_FF;
```

### Memory Representation and Size

- All numbers are **64-bit IEEE 754 double-precision floating-point**
- 1 sign bit + 11 exponent bits + 52 mantissa bits = 64 bits (8 bytes)
- Safe integer range: -(2^53 - 1) to (2^53 - 1)
- Maximum value: ~1.7976931348623157e+308
- Minimum positive value: ~5e-324

```javascript
Number.MAX_VALUE              // 1.7976931348623157e+308
Number.MIN_VALUE              // 5e-324 (smallest positive)
Number.MAX_SAFE_INTEGER       // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER       // -9007199254740991
Number.POSITIVE_INFINITY      // Infinity
Number.NEGATIVE_INFINITY      // -Infinity
Number.NaN                    // NaN
Number.EPSILON                // 2.220446049250313e-16
```

### Built-in Methods and Properties

#### Static Methods
```javascript
Number.isFinite(value)            // true if finite number (not Infinity, -Infinity, NaN)
Number.isInteger(value)           // true if integer
Number.isNaN(value)               // true if NaN (strict, unlike global isNaN)
Number.isSafeInteger(value)       // true if safe integer
Number.parseFloat(string)         // Parse float from string
Number.parseInt(string, radix)    // Parse integer from string
```

#### Instance Methods
```javascript
num.toExponential(fractionDigits) // "1.23e+2"
num.toFixed(digits)               // "123.46" (fixed decimal places)
num.toPrecision(precision)        // Significant digits
num.toString(radix)               // Convert to string in given base
num.valueOf()                     // Primitive value
num.toLocaleString(locales, options)  // Locale-formatted string
```

### Type Coercion Rules

```javascript
// To Number
Number("42")          // 42
Number("3.14")        // 3.14
Number("")            // 0
Number("  ")          // 0
Number("42abc")       // NaN
Number(true)          // 1
Number(false)         // 0
Number(null)          // 0
Number(undefined)     // NaN
Number([])            // 0 (empty array)
Number([42])          // 42 (single element)
Number([1, 2])        // NaN (multiple elements)
Number({})            // NaN

// Implicit coercion
+"42"                 // 42 (unary plus)
"42" - 0              // 42
"42" * 1              // 42
"42" / 1              // 42
```

### Common Operations and Operators

```javascript
// Arithmetic
5 + 3                 // 8
5 - 3                 // 2
5 * 3                 // 15
5 / 3                 // 1.6666666666666667
5 % 3                 // 2 (remainder)
5 ** 3                // 125 (exponentiation)

// Increment/Decrement
let x = 5;
x++                   // 5 (post-increment, returns old value)
++x                   // 7 (pre-increment, returns new value)
x--                   // 7 (post-decrement)
--x                   // 5 (pre-decrement)

// Comparison
5 > 3                 // true
5 >= 3                // true
5 < 3                 // false
5 <= 3                // false

// Bitwise (converts to 32-bit integer)
5 & 3                 // 1 (AND)
5 | 3                 // 7 (OR)
5 ^ 3                 // 6 (XOR)
~5                    // -6 (NOT)
5 << 1                // 10 (left shift)
5 >> 1                // 2 (signed right shift)
-5 >>> 1              // 2147483645 (unsigned right shift)
```

### Edge Cases and Quirks

```javascript
// Floating-point precision
0.1 + 0.2             // 0.30000000000000004
0.1 + 0.2 === 0.3     // false
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON  // true

// NaN quirks
NaN === NaN           // false (NaN is not equal to anything)
Number.isNaN(NaN)     // true (use this)
isNaN("hello")        // true (coerces to NaN first - legacy)
Number.isNaN("hello") // false (strict check)
Object.is(NaN, NaN)   // true

// Negative zero
-0 === 0              // true
Object.is(-0, 0)      // false
1 / 0                 // Infinity
1 / -0                // -Infinity

// Infinity arithmetic
Infinity + 1          // Infinity
Infinity - Infinity   // NaN
Infinity * 0          // NaN
1 / Infinity          // 0
Infinity / Infinity   // NaN

// Integer precision loss
9007199254740992 === 9007199254740993  // true (beyond safe integer)
9007199254740992 + 1  // 9007199254740992 (no change)

// Octal gotcha (legacy)
parseInt("08")        // 8 (ES5+), was 0 in older engines
parseInt("08", 10)    // 8 (always specify radix)

// Bitwise truncation
(2.9 | 0)             // 2 (truncates to integer)
(1e20 | 0)            // 1661992960 (overflow - only 32 bits)
```

### Wrapper Object (Number)

```javascript
const numObj = new Number(42);
typeof numObj         // "object"
numObj.valueOf()      // 42

// Auto-boxing
(42).toFixed(2)       // "42.00" - works

// Object vs primitive
new Number(0) == false    // true (coercion)
new Number(0) === false   // false
Boolean(new Number(0))    // true (objects are truthy!)
```

---

## BigInt

### Type Name and Syntax

```javascript
// Literal syntax (suffix n)
const big = 9007199254740993n;
const negBig = -123456789012345678901234567890n;

// Constructor (no new keyword)
const fromInt = BigInt(42);
const fromString = BigInt("9007199254740993");

// Hex, octal, binary
const hexBig = 0x1fffffffffffffn;
const octBig = 0o777n;
const binBig = 0b1111n;
```

### Memory Representation and Size

- **Arbitrary precision** integers (no fixed size)
- Memory grows as needed to store the value
- Cannot represent fractions (integers only)
- Cannot be used with Math methods

### Built-in Methods and Properties

```javascript
// Static methods
BigInt.asIntN(bits, bigint)     // Clamp to signed integer of width
BigInt.asUintN(bits, bigint)    // Clamp to unsigned integer of width

// Instance methods
bigint.toString(radix)          // Convert to string
bigint.valueOf()                // Primitive value
bigint.toLocaleString()         // Locale-formatted string

// Examples
BigInt.asIntN(8, 255n)          // -1n (signed 8-bit)
BigInt.asUintN(8, 255n)         // 255n (unsigned 8-bit)
BigInt.asIntN(8, 256n)          // 0n (overflow)
```

### Type Coercion Rules

```javascript
// Explicit conversion
BigInt(42)                      // 42n
BigInt("123")                   // 123n
BigInt(true)                    // 1n
BigInt(false)                   // 0n
BigInt(3.14)                    // RangeError (must be integer)
BigInt(null)                    // TypeError
BigInt(undefined)               // TypeError

// Cannot implicitly coerce to Number
42n + 1                         // TypeError
Number(42n)                     // 42 (explicit conversion)

// String concatenation works
"value: " + 42n                 // "value: 42"
```

### Common Operations and Operators

```javascript
// Arithmetic (only with other BigInts)
10n + 3n              // 13n
10n - 3n              // 7n
10n * 3n              // 30n
10n / 3n              // 3n (truncates, not rounds)
10n % 3n              // 1n
10n ** 3n             // 1000n

// Comparison (can mix with numbers)
10n > 5               // true
10n === 10            // false (different types)
10n == 10             // true (coercion)

// Bitwise
10n & 3n              // 2n
10n | 3n              // 11n
10n ^ 3n              // 9n
~10n                  // -11n
10n << 3n             // 80n
10n >> 3n             // 1n

// Unary
-10n                  // -10n
+10n                  // TypeError (cannot use unary +)
```

### Edge Cases and Quirks

```javascript
// No implicit Number conversion
Math.max(1n, 2n)              // TypeError
Math.sqrt(4n)                 // TypeError

// Division truncates toward zero
5n / 2n                       // 2n (not 2.5)
-5n / 2n                      // -2n (truncates toward zero)

// Cannot use with JSON
JSON.stringify({ value: 42n }) // TypeError
JSON.stringify({ value: 42n }, (k, v) =>
  typeof v === 'bigint' ? v.toString() : v)  // Works

// Sort comparison gotcha
[3n, 1n, 2n].sort()           // [1n, 2n, 3n] (string comparison, happens to work)
[10n, 2n].sort()              // [10n, 2n] (wrong! "10" < "2")
[10n, 2n].sort((a, b) => a < b ? -1 : a > b ? 1 : 0)  // [2n, 10n]

// typeof
typeof 42n                    // "bigint"
```

---

## Boolean

### Type Name and Syntax

```javascript
// Literals
const t = true;
const f = false;

// Constructor (creates wrapper object)
const boolObj = new Boolean(false);

// Function (coerces to primitive)
const boolPrim = Boolean(1);  // true
```

### Memory Representation and Size

- Logically 1 bit, but typically stored as **1 byte** or more due to alignment
- In V8, small integers (including booleans) use tagged pointers (SMI)
- `true` and `false` are singleton values (same memory reference)

### Built-in Methods and Properties

```javascript
// Instance methods (inherited from Boolean.prototype)
bool.toString()               // "true" or "false"
bool.valueOf()                // true or false
```

### Type Coercion Rules

#### Falsy Values (convert to false)
```javascript
Boolean(false)        // false
Boolean(0)            // false
Boolean(-0)           // false
Boolean(0n)           // false
Boolean("")           // false
Boolean(null)         // false
Boolean(undefined)    // false
Boolean(NaN)          // false
```

#### Truthy Values (everything else converts to true)
```javascript
Boolean(true)         // true
Boolean(1)            // true
Boolean(-1)           // true
Boolean("0")          // true (non-empty string!)
Boolean("false")      // true (non-empty string!)
Boolean([])           // true (empty array is truthy!)
Boolean({})           // true (empty object is truthy!)
Boolean(function(){}) // true
Boolean(new Boolean(false))  // true (object is truthy!)
```

### Common Operations and Operators

```javascript
// Logical operators
true && false         // false
true || false         // true
!true                 // false

// Short-circuit evaluation
false && expensive()  // false (expensive not called)
true || expensive()   // true (expensive not called)

// Nullish coalescing (ES2020)
null ?? "default"     // "default"
undefined ?? "default" // "default"
0 ?? "default"        // 0 (unlike ||)
"" ?? "default"       // "" (unlike ||)

// Optional chaining (ES2020)
obj?.prop?.method?.()

// Comparison
true === true         // true
true == 1             // true (coercion)
false == 0            // true (coercion)
false == ""           // true (coercion)
```

### Edge Cases and Quirks

```javascript
// Boolean object is always truthy!
const boolObj = new Boolean(false);
if (boolObj) {
  console.log("runs!");  // This runs because objects are truthy
}

// Double negation for boolean conversion
!!1                   // true
!!0                   // false
!!"hello"             // true
!!""                  // false

// Comparison gotchas
true > false          // true (1 > 0)
true + true           // 2
false + false         // 0
true + "1"            // "true1" (string concatenation)

// JSON serialization
JSON.stringify(true)  // "true"
JSON.stringify(new Boolean(false))  // "false" (calls valueOf)
```

### Wrapper Object (Boolean)

```javascript
const boolObj = new Boolean(false);
typeof boolObj        // "object"
boolObj.valueOf()     // false
boolObj instanceof Boolean  // true
false instanceof Boolean    // false

// The infamous gotcha
if (new Boolean(false)) {
  // This ALWAYS executes because the object is truthy
}
```

---

## Null

### Type Name and Syntax

```javascript
// Only one value
const n = null;
```

### Memory Representation and Size

- Typically represented as a **null pointer** (0x0)
- In V8, uses a special tagged value called "the hole" or null constant
- Fixed size (pointer width: 4 or 8 bytes depending on architecture)

### Built-in Methods and Properties

`null` has no methods or properties. Accessing any property throws a TypeError.

```javascript
null.toString()       // TypeError: Cannot read properties of null
```

### Type Coercion Rules

```javascript
// typeof (famous bug)
typeof null           // "object" (historical mistake, never fixed)

// To boolean
Boolean(null)         // false

// To number
Number(null)          // 0

// To string
String(null)          // "null"

// Equality
null == undefined     // true (loose equality)
null === undefined    // false (strict equality)
null == null          // true
null == 0             // false (special case!)
null == false         // false (special case!)
```

### Edge Cases and Quirks

```javascript
// The typeof bug
typeof null === "object"  // true (historical bug from first JS implementation)

// Null checking patterns
x === null            // Only null
x == null             // null or undefined
x == undefined        // null or undefined

// Arithmetic
null + 1              // 1 (null coerces to 0)
null * 5              // 0

// Cannot add properties
null.foo = "bar"      // TypeError

// Object.prototype.toString
Object.prototype.toString.call(null)  // "[object Null]"

// JSON
JSON.stringify(null)  // "null"
JSON.parse("null")    // null
```

---

## Undefined

### Type Name and Syntax

```javascript
// The undefined value
let x;                // x is undefined
const u = undefined;  // explicit assignment

// void operator always returns undefined
void 0                // undefined
void "anything"       // undefined
```

### Memory Representation and Size

- In V8, uses a special singleton value
- Same memory cost as other primitives (tagged pointer)
- `undefined` is a property of the global object (but non-writable in ES5+)

### Built-in Methods and Properties

`undefined` has no methods or properties. Accessing any property throws a TypeError.

```javascript
undefined.toString()  // TypeError
```

### Type Coercion Rules

```javascript
// typeof
typeof undefined      // "undefined"

// To boolean
Boolean(undefined)    // false

// To number
Number(undefined)     // NaN (not 0!)

// To string
String(undefined)     // "undefined"

// Equality
undefined == null     // true
undefined === null    // false
undefined == undefined // true
```

### Edge Cases and Quirks

```javascript
// undefined vs void 0
// In older JS, undefined could be shadowed
(function() {
  var undefined = "oops";  // Worked in ES3
  console.log(undefined);  // "oops"
})();
// Use void 0 for guaranteed undefined (minifiers do this)

// Checking for undefined
typeof x === "undefined"  // Works even if x is not declared
x === undefined           // ReferenceError if x not declared

// Default parameters
function f(x = "default") {
  return x;
}
f(undefined)              // "default"
f(null)                   // null (only undefined triggers default)

// Object property access
const obj = {};
obj.missing               // undefined (not an error)
obj.missing.deeper        // TypeError (cannot read property of undefined)

// Array holes
const arr = [1, , 3];     // Sparse array with hole
arr[1]                    // undefined
1 in arr                  // false (hole, not undefined value)
arr[1] = undefined;
1 in arr                  // true (now has undefined value)

// JSON
JSON.stringify(undefined) // undefined (not valid JSON)
JSON.stringify({a: undefined})  // "{}" (undefined properties omitted)
JSON.stringify([undefined])     // "[null]" (becomes null in arrays)

// Function return
function f() {}
f()                       // undefined (implicit return)
```

---

## Symbol

### Type Name and Syntax

```javascript
// Create unique symbol
const sym1 = Symbol();
const sym2 = Symbol("description");  // Optional description

// Symbols are always unique
Symbol() === Symbol()         // false
Symbol("x") === Symbol("x")   // false

// Global symbol registry
const globalSym = Symbol.for("app.key");  // Create/retrieve from registry
Symbol.for("app.key") === globalSym       // true (same symbol)
Symbol.keyFor(globalSym)                  // "app.key"
```

### Memory Representation and Size

- Unique immutable identifier
- Description stored separately (for debugging)
- Typically 4-8 bytes for the symbol ID plus description string overhead

### Built-in Methods and Properties

```javascript
// Static methods
Symbol.for(key)              // Get/create global symbol
Symbol.keyFor(sym)           // Get key for global symbol (undefined for local)

// Instance properties
sym.description              // The description string (ES2019)

// Instance methods
sym.toString()               // "Symbol(description)"
sym.valueOf()                // Returns the symbol itself

// Cannot convert to string implicitly
"" + Symbol()                // TypeError
String(Symbol("x"))          // "Symbol(x)" (explicit is ok)
```

### Well-Known Symbols

```javascript
// Customize language behavior
Symbol.iterator           // Define iteration behavior
Symbol.asyncIterator      // Async iteration
Symbol.toStringTag        // Customize Object.prototype.toString
Symbol.toPrimitive        // Customize type coercion
Symbol.hasInstance        // Customize instanceof
Symbol.isConcatSpreadable // Customize Array.prototype.concat
Symbol.species            // Constructor for derived objects
Symbol.match              // String.prototype.match behavior
Symbol.matchAll           // String.prototype.matchAll behavior
Symbol.replace            // String.prototype.replace behavior
Symbol.search             // String.prototype.search behavior
Symbol.split              // String.prototype.split behavior
Symbol.unscopables        // Exclude from with binding

// Example: Custom iterator
const obj = {
  data: [1, 2, 3],
  [Symbol.iterator]() {
    let i = 0;
    return {
      next: () => i < this.data.length
        ? { value: this.data[i++], done: false }
        : { done: true }
    };
  }
};
[...obj]  // [1, 2, 3]

// Example: Custom toStringTag
const obj2 = {
  [Symbol.toStringTag]: "MyObject"
};
Object.prototype.toString.call(obj2)  // "[object MyObject]"
```

### Edge Cases and Quirks

```javascript
// Not enumerable by default
const obj = {
  [Symbol("hidden")]: "secret",
  visible: "public"
};
Object.keys(obj)                  // ["visible"]
Object.getOwnPropertyNames(obj)   // ["visible"]
Object.getOwnPropertySymbols(obj) // [Symbol(hidden)]
Reflect.ownKeys(obj)              // ["visible", Symbol(hidden)]
JSON.stringify(obj)               // '{"visible":"public"}' (symbols ignored)

// Cannot use 'new'
new Symbol()                      // TypeError

// Coercion
Number(Symbol())                  // TypeError
Boolean(Symbol())                 // true (symbols are truthy)

// Property access
const sym = Symbol("key");
const obj = { [sym]: "value" };
obj[sym]                          // "value"
obj.sym                           // undefined (different key!)
```

---

## Object

### Type Name and Syntax

```javascript
// Object literal
const obj = { key: "value", nested: { a: 1 } };

// Constructor
const obj2 = new Object();
const obj3 = Object.create(null);     // No prototype
const obj4 = Object.create(proto);    // Custom prototype

// Computed property names
const key = "dynamic";
const obj5 = { [key]: "value", ["key" + 1]: "value2" };

// Shorthand
const x = 1, y = 2;
const point = { x, y };               // { x: 1, y: 2 }

// Method shorthand
const obj6 = {
  method() { return this; },
  *generator() { yield 1; },
  async asyncMethod() { return await fetch(); }
};
```

### Memory Representation and Size

- Objects are stored in **heap memory**
- Properties can be stored:
  - **In-object** (fast properties, fixed layout)
  - **Out-of-object** (dictionary mode for dynamic objects)
- Hidden classes (V8) or shapes (SpiderMonkey) optimize property access
- Overhead: ~40-80 bytes minimum per object plus property storage

### Built-in Methods and Properties

#### Static Methods - Creation
```javascript
Object.create(proto, propertiesObject)
Object.assign(target, ...sources)           // Shallow copy
Object.fromEntries(iterable)                // Create from key-value pairs
```

#### Static Methods - Property Definition
```javascript
Object.defineProperty(obj, prop, descriptor)
Object.defineProperties(obj, props)
Object.getOwnPropertyDescriptor(obj, prop)
Object.getOwnPropertyDescriptors(obj)
```

#### Static Methods - Property Enumeration
```javascript
Object.keys(obj)                     // Own enumerable string keys
Object.values(obj)                   // Own enumerable values
Object.entries(obj)                  // Own enumerable [key, value] pairs
Object.getOwnPropertyNames(obj)      // All own string keys
Object.getOwnPropertySymbols(obj)    // All own symbol keys
Reflect.ownKeys(obj)                 // All own keys (strings + symbols)
```

#### Static Methods - Prototype
```javascript
Object.getPrototypeOf(obj)
Object.setPrototypeOf(obj, proto)    // Slow, avoid in hot code
```

#### Static Methods - Object State
```javascript
Object.freeze(obj)                   // Prevent all changes
Object.seal(obj)                     // Prevent add/delete, allow modify
Object.preventExtensions(obj)        // Prevent adding properties
Object.isFrozen(obj)
Object.isSealed(obj)
Object.isExtensible(obj)
```

#### Static Methods - Comparison
```javascript
Object.is(value1, value2)            // SameValue comparison
```

#### Instance Methods (from Object.prototype)
```javascript
obj.hasOwnProperty(prop)             // Check own property
obj.propertyIsEnumerable(prop)
obj.isPrototypeOf(obj2)
obj.toString()                       // "[object Object]"
obj.toLocaleString()
obj.valueOf()                        // Usually returns this
```

### Property Descriptors

```javascript
// Data descriptor
Object.defineProperty(obj, "prop", {
  value: 42,
  writable: true,       // Can change value
  enumerable: true,     // Shows in for...in
  configurable: true    // Can delete/reconfigure
});

// Accessor descriptor
Object.defineProperty(obj, "prop", {
  get() { return this._prop; },
  set(v) { this._prop = v; },
  enumerable: true,
  configurable: true
});

// Get descriptor
Object.getOwnPropertyDescriptor({ x: 1 }, "x");
// { value: 1, writable: true, enumerable: true, configurable: true }
```

### Edge Cases and Quirks

```javascript
// Object.create(null) has no prototype
const pure = Object.create(null);
pure.hasOwnProperty                   // undefined (no prototype methods)
"toString" in pure                    // false

// Property access on primitives works (auto-boxing)
"hello".length                        // 5
(42).toFixed(2)                       // "42.00"

// Computed property names
const obj = { ["a" + "b"]: 1 };       // { ab: 1 }

// Prototype chain
const parent = { inherited: true };
const child = Object.create(parent);
child.inherited                       // true
child.hasOwnProperty("inherited")     // false
"inherited" in child                  // true

// Object.is vs ===
Object.is(NaN, NaN)                   // true (=== is false)
Object.is(0, -0)                      // false (=== is true)

// Spread and Object.assign are shallow
const orig = { nested: { a: 1 } };
const copy = { ...orig };
copy.nested.a = 2;
orig.nested.a                         // 2 (same reference)

// Order of properties (ES2015+)
// 1. Integer indices in numeric order
// 2. String keys in creation order
// 3. Symbol keys in creation order
const obj = { 2: "a", b: "b", 1: "c", [Symbol("d")]: "d" };
Object.keys(obj)                      // ["1", "2", "b"]
```

---

## Array

### Type Name and Syntax

```javascript
// Literal
const arr = [1, 2, 3];
const sparse = [1, , 3];              // Sparse array with hole
const mixed = [1, "two", { three: 3 }];

// Constructor
const arr2 = new Array(3);            // [ , , ] (3 holes)
const arr3 = new Array(1, 2, 3);      // [1, 2, 3]
const arr4 = Array.of(3);             // [3] (avoids constructor ambiguity)

// Array.from
Array.from("hello")                   // ["h", "e", "l", "l", "o"]
Array.from({ length: 3 }, (_, i) => i) // [0, 1, 2]
Array.from(new Set([1, 2, 3]))        // [1, 2, 3]
```

### Memory Representation and Size

- Arrays are **exotic objects** with special `[[DefineOwnProperty]]`
- Elements stored in contiguous memory (when possible)
- V8 optimizations:
  - **PACKED_SMI_ELEMENTS**: Small integers only
  - **PACKED_DOUBLE_ELEMENTS**: Only numbers
  - **PACKED_ELEMENTS**: Mixed types
  - **HOLEY_***: Sparse arrays (holes)
- Transition: PACKED -> HOLEY is one-way (performance penalty)

### Built-in Methods and Properties

#### Properties
```javascript
arr.length              // Number of elements (writable!)
```

#### Static Methods
```javascript
Array.isArray(value)              // true if array
Array.from(arrayLike, mapFn, thisArg)
Array.of(...items)                // Create from arguments
```

#### Mutating Methods (modify original array)
```javascript
arr.push(...items)        // Add to end, return new length
arr.pop()                 // Remove from end, return removed
arr.unshift(...items)     // Add to beginning, return new length
arr.shift()               // Remove from beginning, return removed
arr.splice(start, deleteCount, ...items)  // Add/remove in middle
arr.reverse()             // Reverse in place
arr.sort(compareFn)       // Sort in place
arr.fill(value, start, end)
arr.copyWithin(target, start, end)
```

#### Non-mutating Methods (return new array/value)
```javascript
// Iteration
arr.forEach(callback, thisArg)
arr.map(callback, thisArg)
arr.filter(callback, thisArg)
arr.reduce(callback, initialValue)
arr.reduceRight(callback, initialValue)
arr.every(callback, thisArg)      // All pass test?
arr.some(callback, thisArg)       // Any pass test?
arr.find(callback, thisArg)       // First matching element
arr.findIndex(callback, thisArg)  // First matching index
arr.findLast(callback, thisArg)   // Last matching element (ES2023)
arr.findLastIndex(callback, thisArg)

// Search
arr.indexOf(searchElement, fromIndex)
arr.lastIndexOf(searchElement, fromIndex)
arr.includes(searchElement, fromIndex)

// Extraction
arr.slice(start, end)             // Extract portion
arr.concat(...items)              // Merge arrays
arr.flat(depth)                   // Flatten nested arrays
arr.flatMap(callback, thisArg)    // Map then flatten 1 level

// Conversion
arr.join(separator)               // To string
arr.toString()                    // To string (comma-separated)
arr.toLocaleString()
arr.keys()                        // Iterator of indices
arr.values()                      // Iterator of values
arr.entries()                     // Iterator of [index, value]

// ES2023 - Non-mutating versions
arr.toReversed()                  // New reversed array
arr.toSorted(compareFn)           // New sorted array
arr.toSpliced(start, deleteCount, ...items)
arr.with(index, value)            // New array with replaced element
```

### Edge Cases and Quirks

```javascript
// length is writable
const arr = [1, 2, 3, 4, 5];
arr.length = 3;
arr                               // [1, 2, 3] (truncated!)

// Sparse arrays
const sparse = [1, , 3];
sparse.length                     // 3
sparse[1]                         // undefined
1 in sparse                       // false (hole, not undefined)
sparse.map(x => x * 2)            // [2, empty, 6] (holes preserved)
sparse.forEach((x, i) => console.log(i))  // 0, 2 (holes skipped)

// Array-like objects
const arrayLike = { 0: "a", 1: "b", length: 2 };
Array.from(arrayLike)             // ["a", "b"]
Array.prototype.slice.call(arrayLike)  // ["a", "b"]

// sort() gotcha - default is string comparison
[10, 2, 1].sort()                 // [1, 10, 2] (wrong!)
[10, 2, 1].sort((a, b) => a - b)  // [1, 2, 10]

// Array constructor ambiguity
new Array(3)                      // [empty x 3]
new Array("3")                    // ["3"]
Array.of(3)                       // [3]

// Maximum length
const huge = [];
huge.length = 2**32 - 1;          // Maximum valid length
huge.length = 2**32;              // RangeError

// typeof array is "object"
typeof []                         // "object"
Array.isArray([])                 // true

// Negative indices don't work like Python
arr[-1]                           // undefined (not last element)
arr.at(-1)                        // Last element (ES2022)

// delete creates holes (don't use!)
const arr = [1, 2, 3];
delete arr[1];                    // Creates hole, length unchanged
arr                               // [1, empty, 3]
```

---

## TypedArrays

### Overview

TypedArrays provide a way to work with raw binary data in fixed-size, typed elements.

```javascript
// TypedArray types and their properties
// Type            | Bytes | Range                      | C Equivalent
// ----------------|-------|----------------------------|-------------
// Int8Array       | 1     | -128 to 127                | int8_t
// Uint8Array      | 1     | 0 to 255                   | uint8_t
// Uint8ClampedArray| 1    | 0 to 255 (clamped)         | -
// Int16Array      | 2     | -32768 to 32767            | int16_t
// Uint16Array     | 2     | 0 to 65535                 | uint16_t
// Int32Array      | 4     | -2^31 to 2^31-1            | int32_t
// Uint32Array     | 4     | 0 to 2^32-1                | uint32_t
// Float32Array    | 4     | +-3.4e38 (7 digits)        | float
// Float64Array    | 8     | +-1.8e308 (16 digits)      | double
// BigInt64Array   | 8     | -2^63 to 2^63-1            | int64_t
// BigUint64Array  | 8     | 0 to 2^64-1                | uint64_t
```

### Construction

```javascript
// From length
const arr = new Int32Array(10);           // 10 elements, zero-filled

// From array or iterable
const arr2 = new Float64Array([1.5, 2.5, 3.5]);

// From ArrayBuffer (shared memory view)
const buffer = new ArrayBuffer(16);       // 16 bytes
const int32View = new Int32Array(buffer); // 4 elements
const int16View = new Int16Array(buffer); // 8 elements

// With offset and length
const partial = new Int32Array(buffer, 4, 2);  // Start at byte 4, 2 elements
```

### ArrayBuffer

```javascript
// Raw binary data container
const buffer = new ArrayBuffer(16);
buffer.byteLength                         // 16

// Cannot directly access bytes - need a view
new Uint8Array(buffer)[0] = 255;

// Slice creates a copy
const slice = buffer.slice(0, 8);

// SharedArrayBuffer (for shared memory between workers)
const shared = new SharedArrayBuffer(16);
```

### DataView

```javascript
// More flexible byte-level access with explicit endianness
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);

// Read/write with explicit endianness
view.setInt32(0, 0x12345678, true);        // Little-endian
view.setInt32(4, 0x12345678, false);       // Big-endian (default)
view.getInt32(0, true);                    // Read little-endian
view.getFloat64(8, true);                  // Read as float64
```

### TypedArray Methods

```javascript
// Properties
arr.length                        // Number of elements
arr.byteLength                    // Size in bytes
arr.byteOffset                    // Offset into buffer
arr.buffer                        // Underlying ArrayBuffer
arr.BYTES_PER_ELEMENT             // Bytes per element

// Static
TypedArray.from(source, mapFn)
TypedArray.of(...elements)

// Most Array methods work
arr.set(array, offset)            // Copy array into typed array
arr.subarray(begin, end)          // View into same buffer (no copy!)
arr.slice(begin, end)             // Copy to new typed array
arr.copyWithin(target, start, end)
arr.fill(value, start, end)
arr.map(fn)                       // Returns same TypedArray type
arr.filter(fn)                    // Returns same TypedArray type
arr.reduce(fn, init)
arr.find(fn)
arr.findIndex(fn)
arr.every(fn)
arr.some(fn)
arr.indexOf(value)
arr.includes(value)
arr.join(sep)
arr.reverse()
arr.sort(fn)
arr.forEach(fn)
arr.entries()
arr.keys()
arr.values()
```

### Edge Cases and Quirks

```javascript
// Overflow behavior
const u8 = new Uint8Array(1);
u8[0] = 256;                      // Wraps to 0 (modulo)
u8[0] = -1;                       // Wraps to 255

// Uint8ClampedArray clamps instead
const clamped = new Uint8ClampedArray(1);
clamped[0] = 256;                 // 255 (clamped)
clamped[0] = -1;                  // 0 (clamped)

// subarray shares memory, slice copies
const orig = new Int32Array([1, 2, 3]);
const sub = orig.subarray(0, 2);
const copy = orig.slice(0, 2);
orig[0] = 99;
sub[0]                            // 99 (same buffer)
copy[0]                           // 1 (different buffer)

// Cannot store arbitrary values
const f64 = new Float64Array(1);
f64[0] = "hello";                 // NaN
f64[0] = undefined;               // NaN
f64[0] = null;                    // 0

// Alignment requirements
const buffer = new ArrayBuffer(5);
new Int32Array(buffer);           // RangeError (5 not divisible by 4)
new Int32Array(buffer, 1);        // RangeError (offset 1 not aligned)

// No holes - always initialized
const arr = new Int32Array(3);
arr[1]                            // 0 (not undefined)

// BigInt typed arrays
const big = new BigInt64Array(2);
big[0] = 1n;                      // Must use BigInt
big[0] = 1;                       // TypeError
```

---

## Node.js Buffer

### Overview

`Buffer` is Node.js's subclass of `Uint8Array` for handling binary data, especially in I/O operations.

```javascript
// Buffer is a Uint8Array subclass
Buffer.isBuffer(new Uint8Array())  // false
Buffer.isBuffer(Buffer.alloc(1))   // true
Buffer.prototype instanceof Uint8Array  // true
```

### Construction

```javascript
// Allocate - preferred methods
const buf1 = Buffer.alloc(10);              // 10 bytes, zero-filled
const buf2 = Buffer.alloc(10, 0xff);        // Fill with 0xff
const buf3 = Buffer.allocUnsafe(10);        // Uninitialized (faster, may contain old data)
const buf4 = Buffer.allocUnsafeSlow(10);    // Uninitialized, not from pool

// From data
const buf5 = Buffer.from([1, 2, 3]);        // From array
const buf6 = Buffer.from("hello");          // From string (UTF-8 default)
const buf7 = Buffer.from("hello", "utf16le"); // Specify encoding
const buf8 = Buffer.from(buf5);             // Copy buffer
const buf9 = Buffer.from(new ArrayBuffer(10)); // From ArrayBuffer

// DEPRECATED - do not use
// new Buffer() - security risk, use Buffer.from/alloc instead
```

### Encodings

```javascript
// Supported encodings
const encodings = [
  'utf8', 'utf-8',      // Multi-byte Unicode (default)
  'utf16le', 'ucs2',    // Little-endian UTF-16
  'latin1', 'binary',   // ISO-8859-1 (single byte)
  'ascii',              // 7-bit ASCII
  'base64',             // Base64 encoding
  'base64url',          // URL-safe Base64
  'hex'                 // Hexadecimal
];

// Encoding/decoding
const buf = Buffer.from("Hello", "utf8");
buf.toString("hex")           // "48656c6c6f"
buf.toString("base64")        // "SGVsbG8="
Buffer.from("48656c6c6f", "hex").toString()  // "Hello"
```

### Buffer Methods

```javascript
// Static methods
Buffer.alloc(size, fill, encoding)
Buffer.allocUnsafe(size)
Buffer.from(data, encoding)
Buffer.isBuffer(obj)
Buffer.isEncoding(encoding)
Buffer.byteLength(string, encoding)  // Byte length of string
Buffer.concat(list, totalLength)     // Concatenate buffers
Buffer.compare(buf1, buf2)           // Compare buffers

// Instance properties
buf.length                    // Number of bytes
buf.buffer                    // Underlying ArrayBuffer
buf.byteOffset               // Offset in ArrayBuffer

// Read/Write integers
buf.readInt8(offset)
buf.readUInt8(offset)
buf.readInt16LE(offset)       // Little-endian
buf.readInt16BE(offset)       // Big-endian
buf.readInt32LE(offset)
buf.readInt32BE(offset)
buf.readBigInt64LE(offset)
buf.readBigInt64BE(offset)
buf.readFloatLE(offset)
buf.readFloatBE(offset)
buf.readDoubleLE(offset)
buf.readDoubleBE(offset)

// Corresponding write methods
buf.writeInt8(value, offset)
buf.writeUInt8(value, offset)
buf.writeInt16LE(value, offset)
// ... etc.

// String operations
buf.toString(encoding, start, end)
buf.write(string, offset, length, encoding)

// Comparison and search
buf.equals(otherBuffer)
buf.compare(target, tStart, tEnd, sStart, sEnd)
buf.indexOf(value, byteOffset, encoding)
buf.lastIndexOf(value, byteOffset, encoding)
buf.includes(value, byteOffset, encoding)

// Copying and filling
buf.copy(target, tStart, sStart, sEnd)
buf.fill(value, offset, end, encoding)
buf.slice(start, end)         // Returns view (deprecated, use subarray)
buf.subarray(start, end)      // Returns view into same memory

// Iteration
buf.keys()                    // Iterator of indices
buf.values()                  // Iterator of bytes
buf.entries()                 // Iterator of [index, byte]

// Conversion
buf.toJSON()                  // { type: 'Buffer', data: [...] }
buf.swap16()                  // Swap byte order (16-bit)
buf.swap32()                  // Swap byte order (32-bit)
buf.swap64()                  // Swap byte order (64-bit)
```

### Buffer Pool

```javascript
// Node.js uses a pre-allocated pool for small buffers
// allocUnsafe uses this pool for performance
const small = Buffer.allocUnsafe(100);  // From pool
const large = Buffer.allocUnsafe(10000); // Direct allocation

// Pool size (default 8KB)
Buffer.poolSize                 // 8192

// allocUnsafeSlow bypasses the pool
const neverPooled = Buffer.allocUnsafeSlow(100);
```

### Edge Cases and Quirks

```javascript
// Security: allocUnsafe may contain sensitive data
const unsafe = Buffer.allocUnsafe(100);
// May contain previous memory contents - always fill or overwrite!

// slice() returns a view, not a copy
const orig = Buffer.from("hello");
const slice = orig.slice(0, 2);
slice[0] = 72;                    // Changes orig too!
orig.toString()                   // "Hello"

// subarray is the modern equivalent (same behavior)
const sub = orig.subarray(0, 2);

// String conversion with multi-byte characters
const emoji = Buffer.from("\u{1F600}");
emoji.length                      // 4 bytes (UTF-8)
emoji.toString()                  // Emoji character

// Partial multi-byte sequences
const partial = emoji.slice(0, 2);
partial.toString()                // "?" or replacement char (incomplete sequence)

// Buffer.from with string doesn't support arrays
Buffer.from("1,2,3")              // UTF-8 bytes of "1,2,3"
Buffer.from([1, 2, 3])            // Bytes 0x01, 0x02, 0x03

// TypedArray interop
const buf = Buffer.from([1, 2, 3, 4]);
const arr = new Uint32Array(buf.buffer, buf.byteOffset, buf.length / 4);
arr[0]                            // Depends on endianness

// JSON serialization
JSON.stringify(Buffer.from("hi"));
// '{"type":"Buffer","data":[104,105]}'

JSON.parse('{"type":"Buffer","data":[104,105]}', (k, v) => {
  return v?.type === 'Buffer' ? Buffer.from(v.data) : v;
});
// <Buffer 68 69>
```

---

## Type Coercion Rules

### Abstract Equality (==) Algorithm

```javascript
// Same type: use ===
5 == 5                    // true

// null == undefined (and vice versa)
null == undefined         // true
null == 0                 // false (special case)
undefined == 0            // false (special case)

// Number vs String: convert string to number
5 == "5"                  // true (Number("5") === 5)

// Boolean vs any: convert boolean to number first
true == 1                 // true
false == 0                // true
true == "1"               // true (1 == "1" -> 1 == 1)

// Object vs primitive: call ToPrimitive
[1] == 1                  // true ([1].valueOf() -> [1] -> "1" -> 1)
[1, 2] == "1,2"           // true
```

### ToPrimitive Algorithm

```javascript
// For numbers: try valueOf(), then toString()
// For strings: try toString(), then valueOf()

const obj = {
  valueOf() { return 42; },
  toString() { return "hello"; }
};

+obj                      // 42 (hint: number)
`${obj}`                  // "hello" (hint: string)
obj + ""                  // "42" (hint: default -> number)

// Custom with Symbol.toPrimitive
const custom = {
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return 42;
    if (hint === "string") return "hello";
    return true;  // default
  }
};
```

### ToNumber Conversion

```javascript
Number(undefined)         // NaN
Number(null)              // 0
Number(true)              // 1
Number(false)             // 0
Number("")                // 0
Number("  ")              // 0
Number("123")             // 123
Number("123abc")          // NaN
Number("0x10")            // 16
Number([])                // 0
Number([1])               // 1
Number([1, 2])            // NaN
Number({})                // NaN
Number(Symbol())          // TypeError
Number(123n)              // 123 (BigInt)
```

### ToBoolean Conversion

```javascript
// Falsy values (everything else is truthy)
Boolean(false)            // false
Boolean(0)                // false
Boolean(-0)               // false
Boolean(0n)               // false
Boolean("")               // false
Boolean(null)             // false
Boolean(undefined)        // false
Boolean(NaN)              // false

// Notable truthy values
Boolean("0")              // true
Boolean("false")          // true
Boolean([])               // true
Boolean({})               // true
Boolean(new Boolean(false))  // true
```

### ToString Conversion

```javascript
String(undefined)         // "undefined"
String(null)              // "null"
String(true)              // "true"
String(false)             // "false"
String(123)               // "123"
String(123n)              // "123"
String(Symbol("x"))       // "Symbol(x)"
String([1, 2, 3])         // "1,2,3"
String({})                // "[object Object]"
String({ toString() { return "custom"; } })  // "custom"
```

---

## Node.js vs Browser Differences

### Global Objects

```javascript
// Browser
window                    // Global object
document                  // DOM
localStorage              // Persistent storage
sessionStorage            // Session storage
fetch                     // HTTP requests (also in Node 18+)

// Node.js
global                    // Global object (deprecated, use globalThis)
globalThis                // Universal global (ES2020)
process                   // Process info, env vars, stdin/stdout
__dirname                 // Current module's directory (CommonJS)
__filename                // Current module's file path (CommonJS)
module                    // Current module (CommonJS)
exports                   // Module exports (CommonJS)
require                   // Module loader (CommonJS)
Buffer                    // Binary data
```

### Module Systems

```javascript
// CommonJS (Node.js traditional)
const fs = require('fs');
module.exports = { myFunc };
exports.myFunc = function() {};

// ES Modules (Browser and Node.js)
import fs from 'fs';
import { readFile } from 'fs';
import * as fs from 'fs';
export const myFunc = () => {};
export default myFunc;

// Node.js ESM specifics
import.meta.url           // file:// URL of current module
import.meta.resolve       // Resolve module specifier
// No __dirname/__filename in ESM - use:
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Timers

```javascript
// Both environments
setTimeout(fn, ms)
setInterval(fn, ms)
clearTimeout(id)
clearInterval(id)

// Node.js specific
setImmediate(fn)          // Run after I/O callbacks
clearImmediate(id)
process.nextTick(fn)      // Run before I/O callbacks (highest priority)

// Timer objects in Node.js have extra methods
const timer = setTimeout(() => {}, 1000);
timer.ref()               // Keep process alive (default)
timer.unref()             // Allow process to exit
timer.refresh()           // Reset timer
timer.hasRef()            // Check ref status
```

### Event Loop Differences

```javascript
// Node.js event loop phases:
// 1. timers: setTimeout, setInterval
// 2. pending callbacks: I/O callbacks deferred
// 3. idle, prepare: internal
// 4. poll: retrieve new I/O events
// 5. check: setImmediate callbacks
// 6. close callbacks: socket.on('close')

// process.nextTick runs between phases
// queueMicrotask/Promise runs after current phase

// Browser event loop:
// - Macrotasks: setTimeout, setInterval, I/O, UI rendering
// - Microtasks: Promises, MutationObserver
// - Rendering happens between macrotasks
```

### Streams

```javascript
// Node.js has built-in streams
const { Readable, Writable, Transform, Duplex } = require('stream');

// Browser has Web Streams API (also in Node.js 16+)
const readable = new ReadableStream({
  start(controller) {
    controller.enqueue('data');
    controller.close();
  }
});

// Node.js stream/web module for Web Streams
const { ReadableStream, WritableStream } = require('stream/web');
```

### Crypto

```javascript
// Node.js
const crypto = require('crypto');
crypto.randomBytes(16);
crypto.createHash('sha256').update('data').digest('hex');

// Browser (and Node.js)
crypto.getRandomValues(new Uint8Array(16));
await crypto.subtle.digest('SHA-256', data);

// Node.js also exposes Web Crypto API
const { webcrypto } = require('crypto');
webcrypto.subtle.digest('SHA-256', data);
```

### File System

```javascript
// Node.js only
const fs = require('fs');
const fsPromises = require('fs/promises');

fs.readFileSync('file.txt', 'utf8');
await fsPromises.readFile('file.txt', 'utf8');

// Browser - File System Access API (limited)
const handle = await window.showOpenFilePicker();
const file = await handle[0].getFile();
const text = await file.text();
```

### TextEncoder/TextDecoder

```javascript
// Available in both (Node.js and browsers)
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

encoder.encode('hello')           // Uint8Array
decoder.decode(uint8Array)        // string

// Node.js also has Buffer for encoding
Buffer.from('hello').toString('base64');
```

### Performance API

```javascript
// Both environments
performance.now()                  // High-resolution timestamp
performance.mark('start');
performance.mark('end');
performance.measure('duration', 'start', 'end');

// Node.js specific
const { performance, PerformanceObserver } = require('perf_hooks');
```

### URL API

```javascript
// Both environments (Node.js 10+)
const url = new URL('https://example.com/path?query=1');
url.hostname                      // "example.com"
url.searchParams.get('query')     // "1"

// Node.js legacy (still available)
const url = require('url');
url.parse('https://example.com/path');  // Deprecated, use URL class
```

### Console Differences

```javascript
// Both have basic console methods
console.log()
console.error()
console.warn()
console.info()
console.debug()
console.table()
console.time() / console.timeEnd()
console.group() / console.groupEnd()

// Node.js specific
console.Console                   // Custom console class
process.stdout.write()            // Raw output (no newline)

// Browser specific
console.dir(obj, { colors: true, depth: null })  // Works differently
```

---

## Summary: Semantic Primitive Opportunities

For creating LLM-enhanced semantic primitives, consider these enhancement opportunities:

### String Enhancements
- Fuzzy matching and similarity scoring
- Natural language parsing (dates, numbers, quantities)
- Semantic search and comparison
- Entity extraction (names, places, etc.)
- Sentiment analysis
- Language detection
- Smart casing (title case, sentence case with proper noun handling)

### Number Enhancements
- Unit awareness and conversion
- Uncertainty/range representation
- Scientific notation with significance
- Currency handling with exchange rates
- Natural language number parsing ("two million", "2.5k")
- Statistical operations with context

### Boolean Enhancements
- Fuzzy/probability-based truth values
- Confidence scores
- Multi-valued logic (true/false/unknown/contradictory)
- Natural language condition parsing

### Array Enhancements
- Semantic sorting (by meaning, not just value)
- Fuzzy search and filtering
- Smart deduplication (similar items)
- Natural language queries ("items over $100")
- Automatic categorization/grouping
- Statistical summaries with natural language

### Object Enhancements
- Schema validation with natural language rules
- Semantic property access ("get the user's name" -> obj.name or obj.username)
- Automatic serialization format detection
- Deep comparison with semantic equality
- Natural language property queries

This document serves as the foundation for understanding JavaScript's type system and identifying opportunities for semantic enhancement.
