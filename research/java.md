# Java Primitive Types - Comprehensive Reference

This document provides an exhaustive reference for Java's primitive type system, wrapper classes, and related concepts relevant to semantic primitives.

## Table of Contents

1. [Overview of Java's Type System](#overview-of-javas-type-system)
2. [Integer Types](#integer-types)
   - [byte](#byte-8-bit-signed-integer)
   - [short](#short-16-bit-signed-integer)
   - [int](#int-32-bit-signed-integer)
   - [long](#long-64-bit-signed-integer)
3. [Floating-Point Types](#floating-point-types)
   - [float](#float-32-bit-ieee-754)
   - [double](#double-64-bit-ieee-754)
4. [Other Primitives](#other-primitives)
   - [boolean](#boolean)
   - [char](#char-16-bit-unicode)
5. [Wrapper Classes](#wrapper-classes)
6. [Autoboxing and Unboxing](#autoboxing-and-unboxing)
7. [Type Casting Rules](#type-casting-rules)
8. [String Type](#string-type)
9. [Arrays](#arrays)
10. [Arbitrary Precision: BigInteger and BigDecimal](#arbitrary-precision-biginteger-and-bigdecimal)
11. [Comparison with JavaScript](#comparison-with-javascript)

---

## Overview of Java's Type System

Java is a **statically-typed** language with a strict type system. All variables must be declared with a specific type at compile time. Java distinguishes between:

- **Primitive types**: 8 built-in types that are not objects
- **Reference types**: Objects, arrays, and interfaces

### The Eight Primitive Types

| Type    | Size    | Range                                                   | Default | Wrapper   |
|---------|---------|--------------------------------------------------------|---------|-----------|
| byte    | 8-bit   | -128 to 127                                            | 0       | Byte      |
| short   | 16-bit  | -32,768 to 32,767                                      | 0       | Short     |
| int     | 32-bit  | -2,147,483,648 to 2,147,483,647                        | 0       | Integer   |
| long    | 64-bit  | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807| 0L      | Long      |
| float   | 32-bit  | ~1.4E-45 to ~3.4E+38 (6-7 significant digits)          | 0.0f    | Float     |
| double  | 64-bit  | ~4.9E-324 to ~1.8E+308 (15-16 significant digits)      | 0.0d    | Double    |
| boolean | 1-bit*  | true or false                                          | false   | Boolean   |
| char    | 16-bit  | '\u0000' to '\uffff' (0 to 65,535)                     | '\u0000'| Character |

*Note: boolean size is JVM-dependent; typically 1 byte in arrays, may use int (4 bytes) for single values.

---

## Integer Types

### byte (8-bit signed integer)

The smallest integer type, useful for memory-sensitive applications and raw binary data.

#### Specifications

- **Size**: 8 bits (1 byte)
- **Range**: -128 to 127 (-2^7 to 2^7 - 1)
- **Default value**: 0
- **Wrapper class**: `java.lang.Byte`

#### Code Examples

```java
// Declaration and initialization
byte b1 = 100;
byte b2 = -50;
byte b3 = 0x7F;        // Hexadecimal (127)
byte b4 = 0b01111111;  // Binary literal (127)

// Constants
byte minValue = Byte.MIN_VALUE;  // -128
byte maxValue = Byte.MAX_VALUE;  // 127
int size = Byte.SIZE;            // 8 (bits)
int bytes = Byte.BYTES;          // 1

// Common operations
byte result = (byte) (b1 + b2);  // Cast required - arithmetic promotes to int
int compared = Byte.compare(b1, b2);
int unsigned = Byte.toUnsignedInt(b1);  // Treat as unsigned (0-255)

// Parsing
byte parsed = Byte.parseByte("100");
byte fromRadix = Byte.parseByte("64", 16);  // Parse hex
```

#### Overflow Behavior

```java
byte b = 127;
b++;  // Wraps to -128 (silent overflow)
```

---

### short (16-bit signed integer)

Rarely used in modern Java; primarily for memory optimization in large arrays.

#### Specifications

- **Size**: 16 bits (2 bytes)
- **Range**: -32,768 to 32,767 (-2^15 to 2^15 - 1)
- **Default value**: 0
- **Wrapper class**: `java.lang.Short`

#### Code Examples

```java
// Declaration
short s1 = 30000;
short s2 = -10000;

// Constants
short minValue = Short.MIN_VALUE;  // -32768
short maxValue = Short.MAX_VALUE;  // 32767
int size = Short.SIZE;             // 16 (bits)
int bytes = Short.BYTES;           // 2

// Operations (arithmetic promotes to int)
short result = (short) (s1 + s2);
int unsigned = Short.toUnsignedInt(s1);

// Byte order operations
short reversed = Short.reverseBytes(s1);
```

---

### int (32-bit signed integer)

The default integer type in Java and the most commonly used.

#### Specifications

- **Size**: 32 bits (4 bytes)
- **Range**: -2,147,483,648 to 2,147,483,647 (-2^31 to 2^31 - 1)
- **Default value**: 0
- **Wrapper class**: `java.lang.Integer`

#### Code Examples

```java
// Declaration with various literals
int decimal = 42;
int hex = 0x2A;           // Hexadecimal
int octal = 052;          // Octal
int binary = 0b101010;    // Binary (Java 7+)
int withSeparators = 1_000_000;  // Underscores for readability (Java 7+)

// Constants
int minValue = Integer.MIN_VALUE;  // -2147483648
int maxValue = Integer.MAX_VALUE;  // 2147483647
int size = Integer.SIZE;           // 32 (bits)
int bytes = Integer.BYTES;         // 4

// Arithmetic operations
int sum = 10 + 20;
int diff = 30 - 15;
int product = 5 * 6;
int quotient = 20 / 3;    // 6 (truncated)
int remainder = 20 % 3;   // 2

// Bitwise operations
int and = 0xFF & 0x0F;    // 0x0F
int or = 0xF0 | 0x0F;     // 0xFF
int xor = 0xFF ^ 0x0F;    // 0xF0
int not = ~0;             // -1 (all bits set)
int leftShift = 1 << 4;   // 16
int rightShift = 16 >> 2; // 4
int unsignedRight = -1 >>> 1;  // 2147483647

// Utility methods
int abs = Math.abs(-42);
int max = Math.max(10, 20);
int min = Math.min(10, 20);
int signum = Integer.signum(-42);        // -1
int bitCount = Integer.bitCount(0xFF);   // 8
int highestBit = Integer.highestOneBit(100);  // 64
int leadingZeros = Integer.numberOfLeadingZeros(1);   // 31
int trailingZeros = Integer.numberOfTrailingZeros(8); // 3
int rotateLeft = Integer.rotateLeft(1, 4);   // 16
int rotateRight = Integer.rotateRight(16, 4); // 1
int reversed = Integer.reverse(0x12345678);
int byteReversed = Integer.reverseBytes(0x12345678);

// Parsing and conversion
int parsed = Integer.parseInt("42");
int fromHex = Integer.parseInt("2A", 16);
int fromBinary = Integer.parseInt("101010", 2);
Integer decoded = Integer.decode("0x2A");  // Handles 0x, 0, # prefixes

// String conversion
String str = Integer.toString(42);
String hexStr = Integer.toHexString(42);     // "2a"
String binaryStr = Integer.toBinaryString(42); // "101010"
String octalStr = Integer.toOctalString(42);   // "52"

// Unsigned operations (Java 8+)
int unsignedDiv = Integer.divideUnsigned(-1, 2);  // Treats -1 as unsigned
int unsignedRem = Integer.remainderUnsigned(-1, 2);
int unsignedCompare = Integer.compareUnsigned(-1, 1);  // -1 > 1 as unsigned
long asUnsigned = Integer.toUnsignedLong(-1);  // 4294967295
```

#### Overflow Detection (Java 8+)

```java
// These throw ArithmeticException on overflow
int safeAdd = Math.addExact(Integer.MAX_VALUE, 1);      // throws!
int safeSub = Math.subtractExact(Integer.MIN_VALUE, 1); // throws!
int safeMul = Math.multiplyExact(Integer.MAX_VALUE, 2); // throws!
int safeInc = Math.incrementExact(Integer.MAX_VALUE);   // throws!
int safeDec = Math.decrementExact(Integer.MIN_VALUE);   // throws!
int safeNeg = Math.negateExact(Integer.MIN_VALUE);      // throws!
```

---

### long (64-bit signed integer)

For values exceeding int range; used for timestamps, file sizes, etc.

#### Specifications

- **Size**: 64 bits (8 bytes)
- **Range**: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 (-2^63 to 2^63 - 1)
- **Default value**: 0L
- **Wrapper class**: `java.lang.Long`

#### Code Examples

```java
// Declaration (L suffix required for literals > Integer.MAX_VALUE)
long l1 = 42L;
long l2 = 9_223_372_036_854_775_807L;
long l3 = 0xFFFFFFFFFFFFFFFFL;
long timestamp = System.currentTimeMillis();

// Constants
long minValue = Long.MIN_VALUE;  // -9223372036854775808
long maxValue = Long.MAX_VALUE;  // 9223372036854775807
int size = Long.SIZE;            // 64 (bits)
int bytes = Long.BYTES;          // 8

// All Integer methods have Long equivalents
int bitCount = Long.bitCount(0xFFL);
long parsed = Long.parseLong("9223372036854775807");
String hexStr = Long.toHexString(255L);

// Unsigned operations
long unsignedMax = Long.parseUnsignedLong("18446744073709551615");
int unsignedCompare = Long.compareUnsigned(-1L, 1L);
String unsignedStr = Long.toUnsignedString(-1L);  // "18446744073709551615"
```

---

## Floating-Point Types

Java uses IEEE 754 standard for floating-point arithmetic.

### float (32-bit IEEE 754)

Single-precision floating-point; rarely used due to precision limitations.

#### Specifications

- **Size**: 32 bits (4 bytes)
- **Format**: 1 sign bit, 8 exponent bits, 23 mantissa bits
- **Range**: ~1.4E-45 to ~3.4E+38
- **Precision**: ~6-7 significant decimal digits
- **Default value**: 0.0f
- **Wrapper class**: `java.lang.Float`

#### Code Examples

```java
// Declaration (f suffix required)
float f1 = 3.14f;
float f2 = 2.5e10f;      // Scientific notation
float f3 = 0x1.0p10f;    // Hex float literal (1024.0)

// Special values
float posInf = Float.POSITIVE_INFINITY;
float negInf = Float.NEGATIVE_INFINITY;
float nan = Float.NaN;
float maxValue = Float.MAX_VALUE;           // ~3.4028235E38
float minNormal = Float.MIN_NORMAL;         // ~1.17549435E-38
float minValue = Float.MIN_VALUE;           // ~1.4E-45 (smallest positive)

// Constants
int size = Float.SIZE;                      // 32
int bytes = Float.BYTES;                    // 4
int maxExponent = Float.MAX_EXPONENT;       // 127
int minExponent = Float.MIN_EXPONENT;       // -126

// Special value checks
boolean isNaN = Float.isNaN(nan);           // true
boolean isInf = Float.isInfinite(posInf);   // true
boolean isFinite = Float.isFinite(f1);      // true (Java 8+)

// Bit manipulation
int bits = Float.floatToIntBits(f1);        // IEEE 754 bit pattern
int rawBits = Float.floatToRawIntBits(nan); // Preserves NaN payload
float fromBits = Float.intBitsToFloat(bits);

// Comparison (handles NaN and -0.0 correctly)
int compared = Float.compare(f1, f2);

// Parsing
float parsed = Float.parseFloat("3.14");

// Math operations
float sum = f1 + f2;
float product = f1 * f2;
float sqrt = (float) Math.sqrt(f1);
float fma = Math.fma(f1, f2, f3);  // Fused multiply-add (Java 9+)
```

#### Precision Issues

```java
float f = 0.1f;
System.out.println(f);  // 0.1
System.out.println(f + f + f + f + f + f + f + f + f + f);  // 1.0000001 (not exactly 1.0)

// Never use == for float comparison
float a = 0.1f + 0.2f;
float b = 0.3f;
boolean wrong = (a == b);  // false!

// Use epsilon comparison
boolean correct = Math.abs(a - b) < 1e-6f;  // true
```

---

### double (64-bit IEEE 754)

Double-precision floating-point; the default for decimal numbers in Java.

#### Specifications

- **Size**: 64 bits (8 bytes)
- **Format**: 1 sign bit, 11 exponent bits, 52 mantissa bits
- **Range**: ~4.9E-324 to ~1.8E+308
- **Precision**: ~15-16 significant decimal digits
- **Default value**: 0.0d (or just 0.0)
- **Wrapper class**: `java.lang.Double`

#### Code Examples

```java
// Declaration (d suffix optional)
double d1 = 3.14159265358979;
double d2 = 3.14159265358979d;
double d3 = 2.5e100;
double d4 = 0x1.0p10;   // Hex float literal (1024.0)

// Special values
double posInf = Double.POSITIVE_INFINITY;
double negInf = Double.NEGATIVE_INFINITY;
double nan = Double.NaN;
double maxValue = Double.MAX_VALUE;         // ~1.7976931348623157E308
double minNormal = Double.MIN_NORMAL;       // ~2.2250738585072014E-308
double minValue = Double.MIN_VALUE;         // ~4.9E-324

// Bit manipulation
long bits = Double.doubleToLongBits(d1);
long rawBits = Double.doubleToRawLongBits(nan);
double fromBits = Double.longBitsToDouble(bits);

// Math operations (extensive in java.lang.Math)
double abs = Math.abs(-3.14);
double ceil = Math.ceil(3.14);              // 4.0
double floor = Math.floor(3.14);            // 3.0
double round = Math.round(3.14);            // 3 (returns long)
double rint = Math.rint(3.5);               // 4.0 (round to nearest even)
double sqrt = Math.sqrt(16.0);              // 4.0
double cbrt = Math.cbrt(27.0);              // 3.0
double pow = Math.pow(2.0, 10.0);           // 1024.0
double exp = Math.exp(1.0);                 // ~2.718281828
double log = Math.log(Math.E);              // 1.0
double log10 = Math.log10(100.0);           // 2.0
double log1p = Math.log1p(0.0);             // 0.0 (log(1+x), accurate for small x)
double expm1 = Math.expm1(0.0);             // 0.0 (exp(x)-1, accurate for small x)

// Trigonometric functions
double sin = Math.sin(Math.PI / 2);         // 1.0
double cos = Math.cos(0.0);                 // 1.0
double tan = Math.tan(Math.PI / 4);         // ~1.0
double asin = Math.asin(1.0);               // ~1.5707963 (PI/2)
double acos = Math.acos(0.0);               // ~1.5707963 (PI/2)
double atan = Math.atan(1.0);               // ~0.7853981 (PI/4)
double atan2 = Math.atan2(1.0, 1.0);        // ~0.7853981 (PI/4)

// Hyperbolic functions
double sinh = Math.sinh(1.0);
double cosh = Math.cosh(1.0);
double tanh = Math.tanh(1.0);

// Other functions
double hypot = Math.hypot(3.0, 4.0);        // 5.0 (sqrt(x^2 + y^2))
double copySign = Math.copySign(5.0, -1.0); // -5.0
double signum = Math.signum(-42.0);         // -1.0
double ulp = Math.ulp(1.0);                 // ~2.22E-16 (unit in last place)
double nextUp = Math.nextUp(1.0);           // ~1.0000000000000002
double nextDown = Math.nextDown(1.0);       // ~0.9999999999999999
double scalb = Math.scalb(1.0, 10);         // 1024.0 (1.0 * 2^10)
int exponent = Math.getExponent(1024.0);    // 10

// Constants
double pi = Math.PI;                        // 3.141592653589793
double e = Math.E;                          // 2.718281828459045
```

---

## Other Primitives

### boolean

Represents logical true/false values.

#### Specifications

- **Size**: JVM-dependent (typically 1 bit logically, 1 byte in arrays)
- **Values**: `true` or `false` only
- **Default value**: `false`
- **Wrapper class**: `java.lang.Boolean`

#### Code Examples

```java
// Declaration
boolean flag = true;
boolean check = false;

// Cannot use numeric values (unlike C/C++)
// boolean invalid = 1;  // COMPILE ERROR

// Logical operators
boolean and = true && false;        // false (short-circuit)
boolean or = true || false;         // true (short-circuit)
boolean not = !true;                // false
boolean bitwiseAnd = true & false;  // false (no short-circuit)
boolean bitwiseOr = true | false;   // true (no short-circuit)
boolean xor = true ^ false;         // true

// Comparison operators return boolean
boolean eq = (5 == 5);              // true
boolean neq = (5 != 3);             // true
boolean lt = (3 < 5);               // true
boolean gt = (5 > 3);               // true
boolean lte = (5 <= 5);             // true
boolean gte = (5 >= 3);             // true

// Boolean class methods
boolean parsed = Boolean.parseBoolean("true");   // true (case-insensitive)
boolean parsed2 = Boolean.parseBoolean("yes");   // false (only "true" works)
String str = Boolean.toString(true);             // "true"
int compared = Boolean.compare(true, false);     // 1
boolean logical = Boolean.logicalAnd(true, false); // false
boolean logicalOr = Boolean.logicalOr(true, false); // true
boolean logicalXor = Boolean.logicalXor(true, true); // false

// Wrapper
Boolean wrapper = Boolean.TRUE;
Boolean wrapper2 = Boolean.FALSE;
Boolean wrapper3 = Boolean.valueOf(true);  // Preferred over new Boolean()
```

#### Short-Circuit Evaluation

```java
// && and || short-circuit - right side not evaluated if result is determined
boolean result = false && expensiveMethod();  // expensiveMethod() NOT called
boolean result2 = true || expensiveMethod();  // expensiveMethod() NOT called

// & and | always evaluate both sides
boolean result3 = false & expensiveMethod();  // expensiveMethod() IS called
```

---

### char (16-bit Unicode)

Represents a single Unicode character using UTF-16 encoding.

#### Specifications

- **Size**: 16 bits (2 bytes)
- **Range**: '\u0000' to '\uffff' (0 to 65,535)
- **Encoding**: UTF-16 code unit
- **Default value**: '\u0000' (null character)
- **Wrapper class**: `java.lang.Character`

#### Code Examples

```java
// Declaration
char c1 = 'A';
char c2 = '\u0041';      // Unicode escape (A)
char c3 = 65;            // Numeric value (A)
char c4 = '\n';          // Escape sequence (newline)

// Escape sequences
char newline = '\n';
char tab = '\t';
char carriageReturn = '\r';
char backspace = '\b';
char formFeed = '\f';
char singleQuote = '\'';
char doubleQuote = '\"';
char backslash = '\\';

// Constants
char minValue = Character.MIN_VALUE;  // '\u0000'
char maxValue = Character.MAX_VALUE;  // '\uffff'
int size = Character.SIZE;            // 16
int bytes = Character.BYTES;          // 2

// Character classification
boolean isDigit = Character.isDigit('5');           // true
boolean isLetter = Character.isLetter('A');         // true
boolean isLetterOrDigit = Character.isLetterOrDigit('A'); // true
boolean isUpperCase = Character.isUpperCase('A');   // true
boolean isLowerCase = Character.isLowerCase('a');   // true
boolean isWhitespace = Character.isWhitespace(' '); // true
boolean isSpaceChar = Character.isSpaceChar(' ');   // true
boolean isAlphabetic = Character.isAlphabetic('A'); // true (Java 7+)

// Case conversion
char upper = Character.toUpperCase('a');            // 'A'
char lower = Character.toLowerCase('A');            // 'a'
char titleCase = Character.toTitleCase('a');        // 'A'

// Numeric value
int digit = Character.digit('F', 16);               // 15
int numericValue = Character.getNumericValue('5');  // 5
char forDigit = Character.forDigit(15, 16);         // 'f'

// Unicode categories
int type = Character.getType('A');                  // Character.UPPERCASE_LETTER
String name = Character.getName('A');               // "LATIN CAPITAL LETTER A"

// Comparison
int compared = Character.compare('A', 'B');         // -1

// Surrogate pairs (for characters outside BMP)
boolean isSurrogate = Character.isSurrogate('\uD800');       // true
boolean isHighSurrogate = Character.isHighSurrogate('\uD800'); // true
boolean isLowSurrogate = Character.isLowSurrogate('\uDC00');   // true

// Convert code point to char array (for supplementary characters)
int codePoint = 0x1F600;  // Emoji
char[] chars = Character.toChars(codePoint);  // Surrogate pair
int charCount = Character.charCount(codePoint); // 2
```

#### Supplementary Characters

```java
// Characters outside Basic Multilingual Plane (BMP) need surrogate pairs
String emoji = "\uD83D\uDE00";  // Grinning face emoji
int codePoint = emoji.codePointAt(0);  // 128512 (0x1F600)

// Iterate over code points (not chars) for full Unicode support
String text = "Hello \uD83D\uDE00";
text.codePoints().forEach(cp -> {
    System.out.println(Character.getName(cp));
});
```

---

## Wrapper Classes

Each primitive type has a corresponding immutable wrapper class in `java.lang`.

### Common Features

```java
// All wrappers are immutable
Integer i = 42;
// i.setValue(43);  // No such method - must create new object

// All wrappers implement Comparable
int compared = Integer.valueOf(42).compareTo(Integer.valueOf(43));

// All wrappers override equals(), hashCode(), toString()
Integer i1 = 42;
Integer i2 = 42;
boolean equal = i1.equals(i2);  // true (compares values)
int hash = i1.hashCode();       // 42
String str = i1.toString();     // "42"

// All wrappers have TYPE constant (primitive class)
Class<Integer> intClass = Integer.TYPE;  // int.class
Class<Double> doubleClass = Double.TYPE; // double.class

// All numeric wrappers extend Number
Number n = Integer.valueOf(42);
int intVal = n.intValue();
long longVal = n.longValue();
float floatVal = n.floatValue();
double doubleVal = n.doubleValue();
byte byteVal = n.byteValue();
short shortVal = n.shortValue();
```

### Caching

```java
// Integer caches values -128 to 127 by default
Integer i1 = Integer.valueOf(127);
Integer i2 = Integer.valueOf(127);
boolean same = (i1 == i2);  // true (same cached object)

Integer i3 = Integer.valueOf(128);
Integer i4 = Integer.valueOf(128);
boolean diff = (i3 == i4);  // false (different objects)

// Similarly: Byte, Short, Long cache -128 to 127
// Character caches 0 to 127
// Boolean caches TRUE and FALSE

// Cache range can be extended via JVM option:
// -XX:AutoBoxCacheMax=<size>
```

---

## Autoboxing and Unboxing

Java 5+ automatically converts between primitives and wrappers.

### Autoboxing (Primitive to Wrapper)

```java
// Compiler automatically converts
Integer i = 42;           // Compiles to: Integer.valueOf(42)
Double d = 3.14;          // Compiles to: Double.valueOf(3.14)
Boolean b = true;         // Compiles to: Boolean.valueOf(true)

// In method calls
List<Integer> list = new ArrayList<>();
list.add(42);             // Autoboxed to Integer

// In expressions
Integer sum = 10 + 20;    // Result autoboxed
```

### Unboxing (Wrapper to Primitive)

```java
// Compiler automatically converts
Integer wrapper = 42;
int primitive = wrapper;  // Compiles to: wrapper.intValue()

// In arithmetic
Integer a = 10;
Integer b = 20;
int sum = a + b;          // Both unboxed, then added

// In comparisons
Integer x = 100;
if (x > 50) { }           // x unboxed for comparison
```

### Pitfalls

```java
// NullPointerException on unboxing null
Integer i = null;
int j = i;  // NullPointerException!

// == compares references, not values (for non-cached values)
Integer a = 1000;
Integer b = 1000;
boolean wrong = (a == b);      // false (different objects)
boolean correct = a.equals(b); // true

// Performance overhead in loops
Long sum = 0L;
for (long i = 0; i < 1000000; i++) {
    sum += i;  // Creates ~1 million Long objects!
}

// Better:
long sum2 = 0L;
for (long i = 0; i < 1000000; i++) {
    sum2 += i;  // No object creation
}

// Comparing Integer to int uses unboxing
Integer a = null;
int b = 0;
if (a == b) { }  // NullPointerException! a is unboxed
```

---

## Type Casting Rules

### Widening Conversions (Implicit)

Safe conversions that never lose data:

```java
// Widening primitive conversions (automatic)
byte b = 100;
short s = b;     // byte -> short
int i = s;       // short -> int
long l = i;      // int -> long
float f = l;     // long -> float (may lose precision!)
double d = f;    // float -> double

// Full widening hierarchy:
// byte -> short -> int -> long -> float -> double
//         char --^
```

### Narrowing Conversions (Explicit)

May lose data; require explicit cast:

```java
// Narrowing primitive conversions (explicit cast required)
double d = 3.14159;
float f = (float) d;     // May lose precision
long l = (long) f;       // 3 (truncated)
int i = (int) l;         // May overflow
short s = (short) i;     // May overflow
byte b = (byte) s;       // May overflow

// Truncation behavior
int big = 130;
byte small = (byte) big;  // -126 (overflow wraps)

// float/double to int truncates toward zero
int fromPositive = (int) 3.9;   // 3
int fromNegative = (int) -3.9;  // -3
```

### Special Cases

```java
// char is unsigned, so byte/short to char needs explicit cast
byte b = 65;
char c = (char) b;  // 'A'

// char to byte/short needs explicit cast
char c = 'A';
byte b = (byte) c;  // 65

// boolean cannot be cast to/from any other type
// int i = (int) true;  // COMPILE ERROR
// boolean b = (boolean) 1;  // COMPILE ERROR
```

### Wrapper Conversions

```java
// Wrapper to different primitive requires unboxing + cast
Integer i = 42;
long l = i;           // Unbox to int, then widen to long
byte b = i.byteValue(); // Use wrapper method

// Different wrapper types don't auto-convert
Integer i = 42;
// Long l = i;  // COMPILE ERROR
Long l = (long) i;    // Unbox, widen, then autobox
Long l2 = i.longValue();  // Or use conversion method
```

---

## String Type

While not a primitive, String is fundamental to Java and often treated similarly.

### Specifications

- **Type**: Reference type (class)
- **Immutability**: Strings are immutable
- **Storage**: String pool for literal strings
- **Encoding**: Internal UTF-16 (compact strings in Java 9+)

### Creation

```java
// Literal (uses string pool)
String s1 = "Hello";
String s2 = "Hello";
boolean same = (s1 == s2);  // true (same pooled object)

// Constructor (new object)
String s3 = new String("Hello");
boolean diff = (s1 == s3);   // false (different objects)
boolean equal = s1.equals(s3); // true (same content)

// From other types
String fromChars = new String(new char[] {'H', 'e', 'l', 'l', 'o'});
String fromBytes = new String(new byte[] {72, 101, 108, 108, 111});
String fromBytesCharset = new String(bytes, StandardCharsets.UTF_8);
String fromCodePoints = new String(new int[] {72, 101, 108, 108, 111}, 0, 5);

// Interning
String s4 = new String("Hello").intern();
boolean interned = (s1 == s4);  // true (now uses pool)
```

### Common Operations

```java
String s = "Hello, World!";

// Length and access
int length = s.length();            // 13
char c = s.charAt(0);               // 'H'
int cp = s.codePointAt(0);          // 72
boolean empty = s.isEmpty();         // false
boolean blank = s.isBlank();         // false (Java 11+)

// Comparison
boolean equals = s.equals("Hello, World!");           // true
boolean equalsIC = s.equalsIgnoreCase("HELLO, WORLD!"); // true
int compared = s.compareTo("Hello, World!");          // 0
int comparedIC = s.compareToIgnoreCase("HELLO, WORLD!"); // 0
boolean startsWith = s.startsWith("Hello");           // true
boolean endsWith = s.endsWith("!");                   // true
boolean contains = s.contains("World");               // true

// Search
int index = s.indexOf('o');              // 4
int lastIndex = s.lastIndexOf('o');      // 8
int indexStr = s.indexOf("World");       // 7
int indexFrom = s.indexOf('o', 5);       // 8 (start from index 5)

// Extraction
String sub = s.substring(7);             // "World!"
String subRange = s.substring(7, 12);    // "World"
char[] chars = s.toCharArray();

// Transformation
String upper = s.toUpperCase();          // "HELLO, WORLD!"
String lower = s.toLowerCase();          // "hello, world!"
String trimmed = "  hello  ".trim();     // "hello"
String stripped = "  hello  ".strip();   // "hello" (Java 11+, Unicode-aware)
String replaced = s.replace('o', '0');   // "Hell0, W0rld!"
String replacedStr = s.replace("World", "Java"); // "Hello, Java!"
String replaceAll = s.replaceAll("\\s+", "_");   // Regex
String replaceFirst = s.replaceFirst("l", "L");

// Splitting and joining
String[] parts = "a,b,c".split(",");     // ["a", "b", "c"]
String joined = String.join("-", parts); // "a-b-c"

// Formatting
String formatted = String.format("Hello, %s!", "World");
String formatted2 = "Hello, %s!".formatted("World"); // Java 15+

// Concatenation
String concat = s.concat("!!");          // "Hello, World!!!"
String plus = s + "!!";                  // Same result (uses StringBuilder)

// Repeat (Java 11+)
String repeated = "ab".repeat(3);        // "ababab"

// Lines (Java 11+)
"a\nb\nc".lines().forEach(System.out::println);

// Indent (Java 12+)
String indented = "hello".indent(4);     // "    hello\n"

// Transform (Java 12+)
String transformed = "hello".transform(String::toUpperCase); // "HELLO"
```

### StringBuilder and StringBuffer

```java
// StringBuilder (not thread-safe, faster)
StringBuilder sb = new StringBuilder();
sb.append("Hello");
sb.append(", ");
sb.append("World");
sb.append("!");
String result = sb.toString();  // "Hello, World!"

// Capacity management
StringBuilder sb2 = new StringBuilder(100);  // Initial capacity
sb2.ensureCapacity(200);
int capacity = sb2.capacity();

// Modification
sb.insert(7, "Beautiful ");
sb.delete(7, 17);
sb.replace(0, 5, "Hi");
sb.reverse();
sb.setCharAt(0, 'h');

// StringBuffer (thread-safe, slower)
StringBuffer sbuf = new StringBuffer();
// Same methods as StringBuilder
```

### Text Blocks (Java 15+)

```java
String textBlock = """
    {
        "name": "John",
        "age": 30
    }
    """;
// Indentation automatically stripped
```

---

## Arrays

Arrays are fixed-size, ordered collections of elements.

### Declaration and Initialization

```java
// Declaration
int[] arr1;
int arr2[];  // C-style, discouraged

// Initialization
int[] arr3 = new int[5];           // Default values (0)
int[] arr4 = {1, 2, 3, 4, 5};      // Array literal
int[] arr5 = new int[] {1, 2, 3};  // Explicit creation

// Multi-dimensional
int[][] matrix = new int[3][4];
int[][] matrix2 = {{1, 2}, {3, 4}, {5, 6}};
int[][] jagged = new int[3][];     // Jagged array
jagged[0] = new int[2];
jagged[1] = new int[3];
jagged[2] = new int[4];
```

### Array Operations

```java
int[] arr = {1, 2, 3, 4, 5};

// Access
int first = arr[0];              // 1
int last = arr[arr.length - 1];  // 5

// Length (field, not method)
int len = arr.length;            // 5

// Iteration
for (int i = 0; i < arr.length; i++) {
    System.out.println(arr[i]);
}

for (int element : arr) {
    System.out.println(element);
}

// Arrays utility class
import java.util.Arrays;

Arrays.sort(arr);                // In-place sort
int index = Arrays.binarySearch(arr, 3);  // Requires sorted array
int[] copy = Arrays.copyOf(arr, 10);      // New array, padded with 0s
int[] range = Arrays.copyOfRange(arr, 1, 4);
Arrays.fill(arr, 0);             // Fill with value
boolean equals = Arrays.equals(arr, copy);
int hashCode = Arrays.hashCode(arr);
String str = Arrays.toString(arr);        // "[1, 2, 3, 4, 5]"
String deepStr = Arrays.deepToString(matrix);  // For multi-dimensional

// Parallel operations (Java 8+)
Arrays.parallelSort(arr);
Arrays.parallelSetAll(arr, i -> i * 2);

// Stream conversion
IntStream stream = Arrays.stream(arr);
Stream<Integer> boxed = Arrays.stream(arr).boxed();
```

### Array Covariance

```java
// Arrays are covariant (can be problematic)
Number[] numbers = new Integer[5];
numbers[0] = 3.14;  // Compiles but throws ArrayStoreException!

// Use generics for type safety
List<Number> list = new ArrayList<Integer>();  // COMPILE ERROR
List<? extends Number> list2 = new ArrayList<Integer>();  // OK, but read-only
```

---

## Arbitrary Precision: BigInteger and BigDecimal

For values exceeding primitive ranges or requiring exact decimal arithmetic.

### BigInteger

```java
import java.math.BigInteger;

// Creation
BigInteger bi1 = new BigInteger("123456789012345678901234567890");
BigInteger bi2 = BigInteger.valueOf(42L);
BigInteger bi3 = new BigInteger("1A", 16);  // From hex
BigInteger bi4 = new BigInteger(1, new byte[] {0x7F, (byte)0xFF});  // From bytes, positive

// Constants
BigInteger zero = BigInteger.ZERO;
BigInteger one = BigInteger.ONE;
BigInteger two = BigInteger.TWO;  // Java 9+
BigInteger ten = BigInteger.TEN;

// Arithmetic (all return new BigInteger)
BigInteger sum = bi1.add(bi2);
BigInteger diff = bi1.subtract(bi2);
BigInteger product = bi1.multiply(bi2);
BigInteger quotient = bi1.divide(bi2);
BigInteger remainder = bi1.remainder(bi2);
BigInteger[] divAndRem = bi1.divideAndRemainder(bi2);
BigInteger mod = bi1.mod(bi2);  // Always positive
BigInteger power = bi2.pow(100);
BigInteger negated = bi1.negate();
BigInteger absolute = bi1.abs();

// Bit operations
BigInteger and = bi1.and(bi2);
BigInteger or = bi1.or(bi2);
BigInteger xor = bi1.xor(bi2);
BigInteger not = bi1.not();
BigInteger shifted = bi1.shiftLeft(10);
BigInteger shiftedRight = bi1.shiftRight(10);
boolean testBit = bi1.testBit(5);
BigInteger setBit = bi1.setBit(100);
BigInteger clearBit = bi1.clearBit(5);
BigInteger flipBit = bi1.flipBit(5);
int bitLength = bi1.bitLength();
int bitCount = bi1.bitCount();

// Comparison
int compared = bi1.compareTo(bi2);
boolean equals = bi1.equals(bi2);
BigInteger max = bi1.max(bi2);
BigInteger min = bi1.min(bi2);
int signum = bi1.signum();  // -1, 0, or 1

// Conversion
int intVal = bi1.intValue();          // May lose data
int intExact = bi1.intValueExact();   // Throws if doesn't fit
long longVal = bi1.longValue();
long longExact = bi1.longValueExact();
byte[] bytes = bi1.toByteArray();
String str = bi1.toString();
String hex = bi1.toString(16);

// Number theory
BigInteger gcd = bi1.gcd(bi2);
BigInteger modInverse = bi2.modInverse(bi1);  // bi2^(-1) mod bi1
BigInteger modPow = bi2.modPow(BigInteger.TEN, bi1);  // bi2^10 mod bi1
boolean isProbablePrime = bi1.isProbablePrime(100);  // Miller-Rabin test
BigInteger nextPrime = bi1.nextProbablePrime();

// Random
BigInteger random = new BigInteger(100, new Random());  // 100 random bits
BigInteger randomPrime = BigInteger.probablePrime(100, new Random());
```

### BigDecimal

```java
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.math.MathContext;

// Creation
BigDecimal bd1 = new BigDecimal("123.456");
BigDecimal bd2 = BigDecimal.valueOf(3.14);  // From double (uses toString)
BigDecimal bd3 = new BigDecimal(BigInteger.TEN, 2);  // 0.10

// IMPORTANT: Avoid new BigDecimal(double) - imprecise!
BigDecimal bad = new BigDecimal(0.1);   // 0.1000000000000000055511151231257827021181583404541015625
BigDecimal good = new BigDecimal("0.1"); // 0.1

// Constants
BigDecimal zero = BigDecimal.ZERO;
BigDecimal one = BigDecimal.ONE;
BigDecimal ten = BigDecimal.TEN;

// Arithmetic
BigDecimal sum = bd1.add(bd2);
BigDecimal diff = bd1.subtract(bd2);
BigDecimal product = bd1.multiply(bd2);

// Division requires scale/rounding specification
BigDecimal quotient = bd1.divide(bd2, 10, RoundingMode.HALF_UP);
BigDecimal[] divAndRem = bd1.divideAndRemainder(bd2);
BigDecimal remainder = bd1.remainder(bd2);

// Rounding modes
RoundingMode.UP;         // Away from zero
RoundingMode.DOWN;       // Toward zero
RoundingMode.CEILING;    // Toward positive infinity
RoundingMode.FLOOR;      // Toward negative infinity
RoundingMode.HALF_UP;    // Toward nearest neighbor, .5 rounds up
RoundingMode.HALF_DOWN;  // Toward nearest neighbor, .5 rounds down
RoundingMode.HALF_EVEN;  // Toward nearest neighbor, .5 rounds to even (banker's rounding)
RoundingMode.UNNECESSARY; // Throws if rounding needed

// MathContext for precision control
MathContext mc = new MathContext(10, RoundingMode.HALF_UP);
BigDecimal result = bd1.divide(bd2, mc);

// Predefined contexts
MathContext unlimited = MathContext.UNLIMITED;
MathContext decimal32 = MathContext.DECIMAL32;   // 7 digits
MathContext decimal64 = MathContext.DECIMAL64;   // 16 digits
MathContext decimal128 = MathContext.DECIMAL128; // 34 digits

// Scale operations
int scale = bd1.scale();                  // Number of digits after decimal
int precision = bd1.precision();          // Total number of digits
BigDecimal scaled = bd1.setScale(2, RoundingMode.HALF_UP);
BigDecimal moved = bd1.movePointLeft(2);
BigDecimal moved2 = bd1.movePointRight(2);
BigDecimal stripped = bd1.stripTrailingZeros();

// Other operations
BigDecimal power = bd1.pow(2);
BigDecimal negated = bd1.negate();
BigDecimal absolute = bd1.abs();
BigDecimal sqrt = bd1.sqrt(mc);  // Java 9+

// Comparison
int compared = bd1.compareTo(bd2);
boolean equals = bd1.equals(bd2);  // Compares scale too!
// 2.0 and 2.00 are NOT equal via equals()
// Use compareTo() for numeric comparison
boolean numEqual = bd1.compareTo(bd2) == 0;

BigDecimal max = bd1.max(bd2);
BigDecimal min = bd1.min(bd2);
int signum = bd1.signum();

// Conversion
int intVal = bd1.intValue();
int intExact = bd1.intValueExact();
long longVal = bd1.longValue();
long longExact = bd1.longValueExact();
double doubleVal = bd1.doubleValue();
BigInteger bigInt = bd1.toBigInteger();
BigInteger bigIntExact = bd1.toBigIntegerExact();
String str = bd1.toString();
String plain = bd1.toPlainString();       // No exponent notation
String engineering = bd1.toEngineeringString();  // Exponent multiple of 3
```

### When to Use

```java
// Use BigDecimal for:
// - Financial calculations (money)
// - Any calculation where exact decimal representation is required
// - Scientific calculations requiring arbitrary precision

// Example: Financial calculation
BigDecimal price = new BigDecimal("19.99");
BigDecimal quantity = new BigDecimal("3");
BigDecimal taxRate = new BigDecimal("0.0825");

BigDecimal subtotal = price.multiply(quantity);
BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
BigDecimal total = subtotal.add(tax);

// Use BigInteger for:
// - Values exceeding Long.MAX_VALUE
// - Cryptographic calculations
// - Combinatorics with large numbers

// Example: Factorial
public static BigInteger factorial(int n) {
    BigInteger result = BigInteger.ONE;
    for (int i = 2; i <= n; i++) {
        result = result.multiply(BigInteger.valueOf(i));
    }
    return result;
}
// factorial(100) has 158 digits
```

---

## Comparison with JavaScript

### Type System Fundamentals

| Aspect | Java | JavaScript |
|--------|------|------------|
| Typing | Static, strong | Dynamic, weak |
| Declaration | Type must be declared | `let`, `const`, `var` |
| Compile-time checking | Yes | No (runtime only) |
| Type coercion | Minimal, explicit | Extensive, implicit |

### Numeric Types

```java
// Java: Multiple distinct numeric types
byte b = 127;      // 8-bit signed
short s = 32767;   // 16-bit signed
int i = 2147483647; // 32-bit signed
long l = 9223372036854775807L; // 64-bit signed
float f = 3.14f;   // 32-bit IEEE 754
double d = 3.14;   // 64-bit IEEE 754
```

```javascript
// JavaScript: Single Number type (+ BigInt)
let num = 42;         // All numbers are 64-bit IEEE 754 float
let big = 9007199254740993n; // BigInt (arbitrary precision integer)
```

### Implications for Semantic Primitives

| Consideration | Java Approach | JavaScript Approach |
|--------------|---------------|---------------------|
| Integer precision | Choose appropriate size (byte/short/int/long) | Limited to ~53 bits, or use BigInt |
| Decimal precision | Use BigDecimal | Floating-point only (use libraries) |
| Overflow | Silent wraparound (or use Math.*Exact) | Infinity or precision loss |
| Type safety | Compile-time enforcement | Runtime checking needed |
| Null handling | Primitives cannot be null | All values nullable (undefined) |

### Boolean Differences

```java
// Java: strict boolean
boolean flag = true;
// if (1) { }  // COMPILE ERROR - int is not boolean
// boolean b = 1;  // COMPILE ERROR
```

```javascript
// JavaScript: truthy/falsy
let flag = true;
if (1) { }  // Works - 1 is truthy
if ("hello") { }  // Works - non-empty string is truthy
// Falsy: false, 0, "", null, undefined, NaN
```

### String Handling

```java
// Java: String is immutable class
String s = "hello";
s.toUpperCase();  // Returns NEW string, s unchanged
String concat = s + " world";  // StringBuilder under hood
boolean equal = s.equals("hello");  // Content comparison
boolean same = (s == "hello");  // Reference comparison (pooled strings)
```

```javascript
// JavaScript: String primitive + String object
let s = "hello";
s.toUpperCase();  // Returns new string
let concat = s + " world";  // Simple concatenation
let equal = s === "hello";  // Value comparison (=== for strict)
```

### Type Conversion

```java
// Java: Explicit casting required for narrowing
double d = 3.14;
int i = (int) d;  // Must cast explicitly

// Widening is implicit
int i = 42;
double d = i;  // OK, implicit widening

// String conversion explicit
int num = 42;
String s = String.valueOf(num);  // or Integer.toString(num)
int parsed = Integer.parseInt("42");  // Can throw NumberFormatException
```

```javascript
// JavaScript: Implicit coercion everywhere
let d = 3.14;
let i = Math.floor(d);  // No casting concept

// Type coercion
"5" + 3;     // "53" (string concatenation)
"5" - 3;     // 2 (numeric subtraction)
"5" * "3";   // 15 (numeric multiplication)

// Parsing
parseInt("42");     // 42
parseInt("42abc");  // 42 (partial parse!)
Number("42");       // 42
Number("42abc");    // NaN
```

### Semantic Primitive Design Implications

When designing semantic primitives that work across Java and JavaScript:

1. **Integer Representation**
   - Java: Consider which integer type fits the domain (byte for ages, int for IDs, long for timestamps)
   - JavaScript: Be aware of Number.MAX_SAFE_INTEGER (2^53 - 1) limitations
   - Cross-language: Define explicit ranges and handle overflow explicitly

2. **Decimal Representation**
   - Java: Use BigDecimal for money and exact calculations
   - JavaScript: Consider string representation or integer cents
   - Cross-language: Define precision requirements explicitly

3. **Null/Undefined Handling**
   - Java: Primitives cannot be null; wrappers can
   - JavaScript: Both null and undefined exist
   - Cross-language: Define clear null semantics for each primitive

4. **Type Validation**
   - Java: Compiler enforces types; runtime checks for wrappers
   - JavaScript: All validation must be runtime
   - Cross-language: Design validation that works in both contexts

5. **Serialization**
   - Java: Well-defined binary representations
   - JavaScript: JSON is primary format (no binary integers, no BigDecimal)
   - Cross-language: Define canonical serialization format

### Example: Cross-Language Semantic Primitive

```java
// Java implementation
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(String amount, Currency currency) {
        this.amount = new BigDecimal(amount);
        this.currency = currency;
    }

    // Validates at construction time
    // Immutable
    // Type-safe operations
}
```

```javascript
// JavaScript implementation
class Money {
    #amount;  // String to preserve precision
    #currency;

    constructor(amount, currency) {
        // Runtime validation required
        if (typeof amount !== 'string' || !/^\d+\.\d{2}$/.test(amount)) {
            throw new TypeError('Invalid amount format');
        }
        this.#amount = amount;
        this.#currency = currency;
        Object.freeze(this);
    }

    // Must validate at runtime
    // Freeze for immutability
    // No native type safety
}
```

---

## Summary

Java's primitive type system provides:

1. **Memory efficiency**: Primitives avoid object overhead
2. **Performance**: Direct CPU operations on primitives
3. **Type safety**: Compile-time type checking prevents errors
4. **Predictable behavior**: Well-defined sizes, ranges, and conversions
5. **Rich ecosystem**: Wrapper classes, BigInteger/BigDecimal for special cases

For semantic primitives, Java's approach offers a model for:
- Explicit type boundaries and validation
- Immutable value types (via wrappers)
- Clear conversion and casting rules
- Arbitrary precision when needed

The contrast with JavaScript highlights the importance of:
- Explicit range and precision specification
- Runtime validation in dynamic languages
- Careful serialization format design
- Clear null/undefined semantics
