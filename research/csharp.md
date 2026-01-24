# C# Primitive and Value Types - Comprehensive Reference

This document provides a thorough technical reference for C# primitive types, value types, and related constructs, with comparisons to JavaScript for semantic primitive design considerations.

## Table of Contents

1. [Overview of C# Type System](#overview-of-c-type-system)
2. [Integral Types](#integral-types)
3. [Floating-Point Types](#floating-point-types)
4. [Boolean Type](#boolean-type)
5. [Character Type](#character-type)
6. [Nullable Value Types](#nullable-value-types)
7. [String Type](#string-type)
8. [Object Type](#object-type)
9. [Dynamic Type](#dynamic-type)
10. [Arrays and Collections](#arrays-and-collections)
11. [Span and Memory Types](#span-and-memory-types)
12. [Boxing and Unboxing](#boxing-and-unboxing)
13. [Comparison with JavaScript](#comparison-with-javascript)

---

## Overview of C# Type System

C# is a strongly-typed language built on the .NET Common Type System (CTS). All types derive from `System.Object`. The type system is divided into two main categories:

- **Value Types**: Stored directly on the stack (or inline in containing types), contain their data directly
- **Reference Types**: Stored on the heap, variables contain references to the data

### Common Type System (CTS) Hierarchy

```
System.Object
├── System.ValueType (abstract base for all value types)
│   ├── Primitive Types (sbyte, byte, short, ushort, int, uint, long, ulong, float, double, decimal, bool, char)
│   ├── System.Enum (base for all enums)
│   ├── System.Nullable<T> (nullable value types)
│   └── User-defined structs
└── Reference Types
    ├── System.String
    ├── System.Array
    ├── Classes
    └── Interfaces
```

---

## Integral Types

### Signed Integral Types

#### `sbyte` (System.SByte)

| Property | Value |
|----------|-------|
| Size | 8 bits (1 byte) |
| Range | -128 to 127 |
| Default Value | `0` |
| CTS Equivalent | `System.SByte` |

```csharp
// Declaration and initialization
sbyte a = -128;
sbyte b = 127;
sbyte c = default; // 0

// Parsing
sbyte parsed = sbyte.Parse("-50");
bool success = sbyte.TryParse("100", out sbyte result);

// Conversion
int toInt = a;                    // Implicit widening
sbyte fromInt = (sbyte)intValue;  // Explicit narrowing (may overflow)
sbyte converted = Convert.ToSByte(someValue);

// Constants
sbyte min = sbyte.MinValue;  // -128
sbyte max = sbyte.MaxValue;  // 127

// Common operations
sbyte abs = Math.Abs(a);
int sign = Math.Sign(a);
sbyte clamped = Math.Clamp(a, (sbyte)-50, (sbyte)50);
```

#### `short` (System.Int16)

| Property | Value |
|----------|-------|
| Size | 16 bits (2 bytes) |
| Range | -32,768 to 32,767 |
| Default Value | `0` |
| CTS Equivalent | `System.Int16` |

```csharp
// Declaration and initialization
short a = -32768;
short b = 32767;
short c = default; // 0

// Parsing with culture support
short parsed = short.Parse("-1000", CultureInfo.InvariantCulture);
bool success = short.TryParse("5000", NumberStyles.Integer, CultureInfo.CurrentCulture, out short result);

// Conversion
int toInt = a;                     // Implicit widening
short fromInt = (short)intValue;   // Explicit narrowing
short converted = Convert.ToInt16(someValue);

// Constants
short min = short.MinValue;  // -32768
short max = short.MaxValue;  // 32767

// Bitwise operations
short bitwiseAnd = (short)(a & b);
short bitwiseOr = (short)(a | b);
short bitwiseXor = (short)(a ^ b);
short complement = (short)~a;
short leftShift = (short)(a << 2);
short rightShift = (short)(a >> 2);
```

#### `int` (System.Int32)

| Property | Value |
|----------|-------|
| Size | 32 bits (4 bytes) |
| Range | -2,147,483,648 to 2,147,483,647 |
| Default Value | `0` |
| CTS Equivalent | `System.Int32` |

```csharp
// Declaration - most common integer type
int a = -2_147_483_648;  // Digit separators for readability
int b = 2_147_483_647;
int c = default;          // 0
int d = new int();        // 0

// Parsing with various number styles
int parsed = int.Parse("1000");
int hex = int.Parse("FF", NumberStyles.HexNumber);  // 255
int withSign = int.Parse("+100", NumberStyles.AllowLeadingSign);

bool success = int.TryParse("invalid", out int result);  // false, result = 0

// Conversion methods
int fromDouble = (int)3.14;           // Truncates: 3
int fromDoubleRound = (int)Math.Round(3.7);  // 4
int fromString = Convert.ToInt32("100");
int fromBool = Convert.ToInt32(true);  // 1

// Checked/unchecked arithmetic
checked
{
    int overflow = int.MaxValue + 1;  // Throws OverflowException
}
unchecked
{
    int overflow = int.MaxValue + 1;  // Wraps to int.MinValue
}

// Binary representation (C# 7.0+)
int binary = 0b1010_1010;  // 170

// Hexadecimal
int hex = 0xFF;  // 255

// Common mathematical operations
int abs = Math.Abs(-42);
int max = Math.Max(a, b);
int min = Math.Min(a, b);
int pow = (int)Math.Pow(2, 10);  // 1024
int sign = Math.Sign(-42);       // -1
int clamp = Math.Clamp(150, 0, 100);  // 100 (C# 8.0+)
(int quotient, int remainder) = Math.DivRem(17, 5);  // (3, 2)

// Bit manipulation
int popCount = BitOperations.PopCount((uint)a);     // Count set bits
int leadingZeros = BitOperations.LeadingZeroCount((uint)a);
int trailingZeros = BitOperations.TrailingZeroCount((uint)a);
bool isPow2 = BitOperations.IsPow2(a);
int log2 = BitOperations.Log2((uint)a);
int rotateLeft = BitOperations.RotateLeft((uint)a, 4);
int rotateRight = BitOperations.RotateRight((uint)a, 4);
```

#### `long` (System.Int64)

| Property | Value |
|----------|-------|
| Size | 64 bits (8 bytes) |
| Range | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| Default Value | `0L` |
| CTS Equivalent | `System.Int64` |

```csharp
// Declaration - suffix L recommended for clarity
long a = -9_223_372_036_854_775_808L;
long b = 9_223_372_036_854_775_807L;
long c = 100L;  // Explicit long literal
long d = 100;   // Implicit conversion from int

// Large number handling
long nanoseconds = 1_000_000_000_000L;
long fileSize = 10L * 1024 * 1024 * 1024;  // 10 GB in bytes

// Parsing
long parsed = long.Parse("9223372036854775807");
bool success = long.TryParse("invalid", out long result);

// Conversion
long fromInt = intValue;              // Implicit widening
int fromLong = (int)longValue;        // Explicit narrowing
long fromDateTime = DateTime.Now.Ticks;

// Timestamp operations
long unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
long unixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

// Stopwatch high-precision timing
long frequency = Stopwatch.Frequency;
long timestamp = Stopwatch.GetTimestamp();
```

### Unsigned Integral Types

#### `byte` (System.Byte)

| Property | Value |
|----------|-------|
| Size | 8 bits (1 byte) |
| Range | 0 to 255 |
| Default Value | `0` |
| CTS Equivalent | `System.Byte` |

```csharp
// Declaration
byte a = 0;
byte b = 255;
byte c = 0xFF;  // Hexadecimal

// Binary data handling
byte[] data = new byte[1024];
byte[] utf8Bytes = Encoding.UTF8.GetBytes("Hello");
string text = Encoding.UTF8.GetString(utf8Bytes);

// Parsing
byte parsed = byte.Parse("200");
byte hex = byte.Parse("FF", NumberStyles.HexNumber);

// Common byte operations
byte[] combined = new byte[array1.Length + array2.Length];
Buffer.BlockCopy(array1, 0, combined, 0, array1.Length);
Buffer.BlockCopy(array2, 0, combined, array1.Length, array2.Length);

// Bit manipulation
byte setBit = (byte)(b | (1 << 3));      // Set bit 3
byte clearBit = (byte)(b & ~(1 << 3));   // Clear bit 3
byte toggleBit = (byte)(b ^ (1 << 3));   // Toggle bit 3
bool isBitSet = (b & (1 << 3)) != 0;     // Check bit 3

// Stream operations
using FileStream fs = new FileStream("file.bin", FileMode.Open);
int bytesRead = fs.Read(data, 0, data.Length);
```

#### `ushort` (System.UInt16)

| Property | Value |
|----------|-------|
| Size | 16 bits (2 bytes) |
| Range | 0 to 65,535 |
| Default Value | `0` |
| CTS Equivalent | `System.UInt16` |

```csharp
// Declaration
ushort a = 0;
ushort b = 65535;
ushort port = 8080;  // Common use: port numbers

// Network byte order conversion
ushort networkOrder = (ushort)IPAddress.HostToNetworkOrder((short)port);
ushort hostOrder = (ushort)IPAddress.NetworkToHostOrder((short)networkOrder);

// Parsing
ushort parsed = ushort.Parse("50000");
bool success = ushort.TryParse("invalid", out ushort result);

// Unicode code points (BMP)
ushort codePoint = 0x0041;  // 'A'
char character = (char)codePoint;
```

#### `uint` (System.UInt32)

| Property | Value |
|----------|-------|
| Size | 32 bits (4 bytes) |
| Range | 0 to 4,294,967,295 |
| Default Value | `0U` |
| CTS Equivalent | `System.UInt32` |

```csharp
// Declaration - suffix U for unsigned
uint a = 0U;
uint b = 4_294_967_295U;
uint c = 0xFFFFFFFFU;

// Common uses
uint color = 0xFF00FF00;  // ARGB color (green with full alpha)
uint ipAddress = 0xC0A80001;  // 192.168.0.1

// Parsing
uint parsed = uint.Parse("4000000000");
bool success = uint.TryParse("invalid", out uint result);

// Conversion
uint fromInt = (uint)intValue;  // May throw in checked context if negative
int fromUint = (int)uintValue;  // May overflow

// Hash code operations (commonly uint)
uint hash = (uint)obj.GetHashCode();

// Bit operations (more natural with unsigned)
uint rotated = BitOperations.RotateLeft(a, 8);
uint reversed = BitOperations.ReverseEndianness(a);
```

#### `ulong` (System.UInt64)

| Property | Value |
|----------|-------|
| Size | 64 bits (8 bytes) |
| Range | 0 to 18,446,744,073,709,551,615 |
| Default Value | `0UL` |
| CTS Equivalent | `System.UInt64` |

```csharp
// Declaration - suffix UL for unsigned long
ulong a = 0UL;
ulong b = 18_446_744_073_709_551_615UL;

// Common uses
ulong fileSize = 1UL << 40;  // 1 TB
ulong hash64 = ComputeHash64(data);

// Parsing
ulong parsed = ulong.Parse("18446744073709551615");

// BigInteger interop for even larger numbers
BigInteger big = new BigInteger(ulongValue);
ulong back = (ulong)big;  // May throw if too large
```

### Native-Sized Integers (C# 9.0+)

#### `nint` (System.IntPtr as numeric)

| Property | Value |
|----------|-------|
| Size | Platform-dependent (32 or 64 bits) |
| Range | Platform-dependent |
| Default Value | `0` |
| CTS Equivalent | `System.IntPtr` |

```csharp
// Native-sized signed integer
nint ptr = 0;
nint size = sizeof(nint);  // 4 on 32-bit, 8 on 64-bit

// Useful for pointer arithmetic and interop
nint offset = index * sizeof(int);

// Range depends on platform
nint min = nint.MinValue;
nint max = nint.MaxValue;
```

#### `nuint` (System.UIntPtr as numeric)

| Property | Value |
|----------|-------|
| Size | Platform-dependent (32 or 64 bits) |
| Range | Platform-dependent (0 to max) |
| Default Value | `0` |
| CTS Equivalent | `System.UIntPtr` |

```csharp
// Native-sized unsigned integer
nuint size = (nuint)buffer.Length;
nuint alignment = 16;
nuint aligned = (address + alignment - 1) & ~(alignment - 1);
```

---

## Floating-Point Types

### `float` (System.Single)

| Property | Value |
|----------|-------|
| Size | 32 bits (4 bytes) |
| Range | +-1.5 x 10^-45 to +-3.4 x 10^38 |
| Precision | ~6-9 significant digits |
| Default Value | `0.0f` |
| CTS Equivalent | `System.Single` |
| IEEE Standard | IEEE 754 single-precision |

```csharp
// Declaration - suffix F required
float a = 3.14f;
float b = -2.5e10f;  // Scientific notation
float c = default;   // 0.0f

// Special values
float posInf = float.PositiveInfinity;
float negInf = float.NegativeInfinity;
float nan = float.NaN;
float epsilon = float.Epsilon;     // Smallest positive value
float minValue = float.MinValue;   // Most negative
float maxValue = float.MaxValue;   // Most positive

// Special value checks
bool isNaN = float.IsNaN(nan);
bool isInf = float.IsInfinity(posInf);
bool isPosInf = float.IsPositiveInfinity(posInf);
bool isNegInf = float.IsNegativeInfinity(negInf);
bool isFinite = float.IsFinite(a);
bool isNormal = float.IsNormal(a);
bool isSubnormal = float.IsSubnormal(float.Epsilon);
bool isNeg = float.IsNegative(-1.0f);

// Parsing
float parsed = float.Parse("3.14");
float parsed2 = float.Parse("3.14", CultureInfo.InvariantCulture);
bool success = float.TryParse("invalid", out float result);

// Conversion
float fromInt = intValue;           // Implicit (may lose precision)
int fromFloat = (int)floatValue;    // Explicit (truncates)
float fromDouble = (float)doubleValue;  // Explicit narrowing

// Mathematical operations
float sqrt = MathF.Sqrt(a);
float sin = MathF.Sin(a);
float cos = MathF.Cos(a);
float tan = MathF.Tan(a);
float log = MathF.Log(a);
float log10 = MathF.Log10(a);
float exp = MathF.Exp(a);
float pow = MathF.Pow(a, 2);
float abs = MathF.Abs(a);
float ceiling = MathF.Ceiling(a);
float floor = MathF.Floor(a);
float round = MathF.Round(a, 2, MidpointRounding.AwayFromZero);
float truncate = MathF.Truncate(a);
float min = MathF.Min(a, b);
float max = MathF.Max(a, b);
float clamp = Math.Clamp(a, 0f, 1f);

// Bit conversion
int bits = BitConverter.SingleToInt32Bits(a);
float fromBits = BitConverter.Int32BitsToSingle(bits);

// Constants
float pi = MathF.PI;
float e = MathF.E;
float tau = MathF.Tau;  // 2 * PI

// Comparison with tolerance (recommended for floats)
bool AreApproximatelyEqual(float a, float b, float tolerance = 1e-6f)
{
    return MathF.Abs(a - b) <= tolerance;
}
```

### `double` (System.Double)

| Property | Value |
|----------|-------|
| Size | 64 bits (8 bytes) |
| Range | +-5.0 x 10^-324 to +-1.7 x 10^308 |
| Precision | ~15-17 significant digits |
| Default Value | `0.0d` or `0.0` |
| CTS Equivalent | `System.Double` |
| IEEE Standard | IEEE 754 double-precision |

```csharp
// Declaration - default floating-point literal type
double a = 3.14159265358979;
double b = -2.5e100;  // Scientific notation
double c = 1.0;       // No suffix needed (default)
double d = 1d;        // Explicit suffix

// Special values
double posInf = double.PositiveInfinity;
double negInf = double.NegativeInfinity;
double nan = double.NaN;
double epsilon = double.Epsilon;
double minValue = double.MinValue;
double maxValue = double.MaxValue;

// Parsing
double parsed = double.Parse("3.14159265358979");
double parsed2 = double.Parse("1,234.56", new CultureInfo("en-US"));
bool success = double.TryParse("invalid", out double result);

// NaN behavior (important!)
bool nanEqual = double.NaN == double.NaN;  // false!
bool nanNotEqual = double.NaN != double.NaN;  // true!
bool isNaN = double.IsNaN(double.NaN);  // true - use this instead

// Mathematical operations (Math class uses double)
double sqrt = Math.Sqrt(a);
double sin = Math.Sin(a);
double cos = Math.Cos(a);
double tan = Math.Tan(a);
double asin = Math.Asin(a);
double acos = Math.Acos(a);
double atan = Math.Atan(a);
double atan2 = Math.Atan2(y, x);
double sinh = Math.Sinh(a);
double cosh = Math.Cosh(a);
double tanh = Math.Tanh(a);
double log = Math.Log(a);
double log10 = Math.Log10(a);
double log2 = Math.Log2(a);
double exp = Math.Exp(a);
double pow = Math.Pow(a, b);
double cbrt = Math.Cbrt(a);  // Cube root

// Rounding modes
double roundDefault = Math.Round(2.5);  // 2 (banker's rounding)
double roundAwayFromZero = Math.Round(2.5, MidpointRounding.AwayFromZero);  // 3
double roundToEven = Math.Round(2.5, MidpointRounding.ToEven);  // 2
double roundToZero = Math.Round(2.5, MidpointRounding.ToZero);  // 2
double roundToNegInf = Math.Round(2.5, MidpointRounding.ToNegativeInfinity);  // 2
double roundToPosInf = Math.Round(2.5, MidpointRounding.ToPositiveInfinity);  // 3

// IEEE 754 operations
double copySign = Math.CopySign(5, -1);  // -5
double scaledB = Math.ScaleB(1.5, 3);    // 1.5 * 2^3 = 12
int ilogb = Math.ILogB(8);               // 3 (integer log base 2)
double fusedMulAdd = Math.FusedMultiplyAdd(a, b, c);  // a*b + c with one rounding

// Bit conversion
long bits = BitConverter.DoubleToInt64Bits(a);
double fromBits = BitConverter.Int64BitsToDouble(bits);

// Constants
double pi = Math.PI;
double e = Math.E;
double tau = Math.Tau;
```

### `decimal` (System.Decimal)

| Property | Value |
|----------|-------|
| Size | 128 bits (16 bytes) |
| Range | +-1.0 x 10^-28 to +-7.9228 x 10^28 |
| Precision | 28-29 significant digits |
| Default Value | `0.0m` |
| CTS Equivalent | `System.Decimal` |

```csharp
// Declaration - suffix M required (M for Money)
decimal a = 123.456m;
decimal b = 0.0000000000000000000000000001m;
decimal c = 79228162514264337593543950335m;  // Max value

// Key characteristic: No binary floating-point errors!
decimal sum = 0.1m + 0.2m;  // Exactly 0.3m (unlike double!)

// Financial calculations (primary use case)
decimal price = 19.99m;
decimal quantity = 3m;
decimal subtotal = price * quantity;  // 59.97m exactly
decimal taxRate = 0.0825m;
decimal tax = Math.Round(subtotal * taxRate, 2);  // Proper rounding
decimal total = subtotal + tax;

// Special values (no infinity or NaN!)
decimal minValue = decimal.MinValue;
decimal maxValue = decimal.MaxValue;
decimal zero = decimal.Zero;
decimal one = decimal.One;
decimal minusOne = decimal.MinusOne;

// Parsing
decimal parsed = decimal.Parse("123.456");
decimal parsed2 = decimal.Parse("$1,234.56", NumberStyles.Currency, new CultureInfo("en-US"));
bool success = decimal.TryParse("invalid", out decimal result);

// Rounding (critical for financial)
decimal rounded = Math.Round(123.456m, 2);  // 123.46
decimal roundedBankers = Math.Round(2.5m, MidpointRounding.ToEven);  // 2
decimal roundedAwayFromZero = Math.Round(2.5m, MidpointRounding.AwayFromZero);  // 3
decimal truncated = Math.Truncate(123.456m);  // 123
decimal ceiling = Math.Ceiling(123.456m);  // 124
decimal floor = Math.Floor(123.456m);  // 123

// Division and remainder
decimal quotient = decimal.Divide(10m, 3m);  // 3.3333...
decimal remainder = decimal.Remainder(10m, 3m);  // 1

// Conversion (may lose precision or throw)
decimal fromDouble = (decimal)doubleValue;  // May throw OverflowException
double toDouble = (double)decimalValue;     // May lose precision
decimal fromInt = intValue;                  // Implicit, safe

// Internal representation
int[] bits = decimal.GetBits(a);
// bits[0-2]: 96-bit integer mantissa
// bits[3]: sign (bit 31) and scale (bits 16-23)

decimal reconstructed = new decimal(bits);

// Scale manipulation
decimal scaled = decimal.Round(a, 4);  // Force specific scale

// Comparison
int comparison = decimal.Compare(a, b);  // -1, 0, or 1

// No Math methods for decimal - use operators
decimal abs = Math.Abs(a);
decimal max = Math.Max(a, b);
decimal min = Math.Min(a, b);
decimal sign = Math.Sign(a);  // Returns int
```

### Half (System.Half) - C# 10.0+ / .NET 5+

| Property | Value |
|----------|-------|
| Size | 16 bits (2 bytes) |
| Range | +-6.5 x 10^-8 to +-6.5 x 10^4 |
| Precision | ~3-4 significant digits |
| Default Value | `0` |
| CTS Equivalent | `System.Half` |
| IEEE Standard | IEEE 754 half-precision |

```csharp
// Declaration (no literal suffix, must cast)
Half a = (Half)3.14;
Half b = Half.Parse("2.5");

// Special values
Half posInf = Half.PositiveInfinity;
Half negInf = Half.NegativeInfinity;
Half nan = Half.NaN;
Half epsilon = Half.Epsilon;
Half minValue = Half.MinValue;
Half maxValue = Half.MaxValue;

// Primary use: Memory-efficient storage, GPU interop
// Convert to float for calculations
float calc = (float)a + (float)b;
Half result = (Half)calc;

// Machine learning and graphics use cases
Half[] weights = new Half[1000000];  // Half the memory of float[]
```

---

## Boolean Type

### `bool` (System.Boolean)

| Property | Value |
|----------|-------|
| Size | 1 byte (8 bits in memory, 1 bit logical) |
| Values | `true` or `false` |
| Default Value | `false` |
| CTS Equivalent | `System.Boolean` |

```csharp
// Declaration
bool a = true;
bool b = false;
bool c = default;  // false

// String representations
string trueStr = true.ToString();   // "True"
string falseStr = false.ToString(); // "False"
string lower = true.ToString().ToLowerInvariant();  // "true"

// Parsing (case-insensitive)
bool parsed1 = bool.Parse("True");
bool parsed2 = bool.Parse("true");
bool parsed3 = bool.Parse("FALSE");
bool success = bool.TryParse("invalid", out bool result);  // false, result = false

// Logical operations
bool and = a && b;      // Short-circuit AND
bool or = a || b;       // Short-circuit OR
bool not = !a;          // Negation
bool bitwiseAnd = a & b;  // Non-short-circuit AND
bool bitwiseOr = a | b;   // Non-short-circuit OR
bool xor = a ^ b;         // Exclusive OR

// Comparison returns bool
bool equal = (x == y);
bool notEqual = (x != y);
bool less = (x < y);
bool greater = (x > y);
bool lessOrEqual = (x <= y);
bool greaterOrEqual = (x >= y);

// Conditional (ternary) operator
int result = condition ? valueIfTrue : valueIfFalse;

// Null-conditional operators
string? result = obj?.Property;
int length = str?.Length ?? 0;

// Pattern matching
bool isType = obj is string;
bool isPattern = value is > 0 and < 100;

// Boolean conversion (explicit only)
// C# does NOT allow implicit bool conversion like C/C++
// This is INVALID: if (intValue) { }
// Must be explicit: if (intValue != 0) { }

// Convert class for int conversion
int fromBool = Convert.ToInt32(true);   // 1
int fromBool2 = Convert.ToInt32(false); // 0
bool fromInt = Convert.ToBoolean(1);    // true
bool fromInt2 = Convert.ToBoolean(0);   // false
```

---

## Character Type

### `char` (System.Char)

| Property | Value |
|----------|-------|
| Size | 16 bits (2 bytes) |
| Range | U+0000 to U+FFFF (UTF-16 code unit) |
| Default Value | `'\0'` (null character) |
| CTS Equivalent | `System.Char` |

```csharp
// Declaration
char a = 'A';
char b = '\n';      // Escape sequence
char c = '\u0041';  // Unicode escape (A)
char d = '\x41';    // Hexadecimal escape (A)
char e = (char)65;  // From integer

// Escape sequences
char newline = '\n';
char tab = '\t';
char carriageReturn = '\r';
char backslash = '\\';
char singleQuote = '\'';
char doubleQuote = '\"';
char nullChar = '\0';
char alert = '\a';
char backspace = '\b';
char formFeed = '\f';
char verticalTab = '\v';

// Character classification methods
bool isDigit = char.IsDigit('5');           // true
bool isLetter = char.IsLetter('A');         // true
bool isLetterOrDigit = char.IsLetterOrDigit('A');  // true
bool isWhiteSpace = char.IsWhiteSpace(' '); // true
bool isUpper = char.IsUpper('A');           // true
bool isLower = char.IsLower('a');           // true
bool isPunctuation = char.IsPunctuation('.'); // true
bool isSymbol = char.IsSymbol('+');         // true
bool isControl = char.IsControl('\n');      // true
bool isSeparator = char.IsSeparator(' ');   // true
bool isNumber = char.IsNumber('5');         // true (includes other number forms)
bool isAscii = char.IsAscii('A');           // true (.NET 7+)
bool isAsciiDigit = char.IsAsciiDigit('5'); // true (.NET 7+)
bool isAsciiLetter = char.IsAsciiLetter('A'); // true (.NET 7+)

// Unicode categories
UnicodeCategory category = char.GetUnicodeCategory('A');  // UppercaseLetter
bool isHighSurrogate = char.IsHighSurrogate('\uD800');
bool isLowSurrogate = char.IsLowSurrogate('\uDC00');
bool isSurrogatePair = char.IsSurrogatePair('\uD800', '\uDC00');

// Case conversion
char upper = char.ToUpper('a');  // 'A'
char lower = char.ToLower('A');  // 'a'
char upperInvariant = char.ToUpperInvariant('a');
char lowerInvariant = char.ToLowerInvariant('A');

// Numeric value
double numericValue = char.GetNumericValue('5');  // 5.0
int digitValue = (int)char.GetNumericValue('5');  // 5

// Conversion
int codePoint = (int)'A';  // 65
char fromInt = (char)65;   // 'A'
string str = 'A'.ToString();  // "A"

// Parsing
char parsed = char.Parse("A");
bool success = char.TryParse("AB", out char result);  // false (must be single char)

// Surrogate pairs (for characters outside BMP)
string emoji = "😀";  // Actually 2 chars (surrogate pair)
bool isSurrogate = char.IsSurrogate(emoji[0]);  // true
int fullCodePoint = char.ConvertToUtf32(emoji, 0);  // 128512
string fromCodePoint = char.ConvertFromUtf32(128512);  // "😀"

// Rune type (C# 8.0+ / .NET Core 3.0+) for full Unicode scalar values
Rune rune = new Rune(128512);  // 😀 as single value
foreach (Rune r in "Hello 😀".EnumerateRunes())
{
    Console.WriteLine($"U+{r.Value:X4}");
}
```

---

## Nullable Value Types

### `Nullable<T>` and `T?` syntax

Nullable value types allow value types to represent undefined or missing values.

| Property | Value |
|----------|-------|
| Size | sizeof(T) + 1 byte (for HasValue flag) |
| Default Value | `null` (HasValue = false) |
| CTS Equivalent | `System.Nullable<T>` |

```csharp
// Declaration - both syntaxes are equivalent
int? a = null;
Nullable<int> b = null;
int? c = 42;

// Checking for value
bool hasValue = a.HasValue;  // false
bool isNull = a == null;     // true
bool isNotNull = a != null;  // false

// Accessing value
if (c.HasValue)
{
    int value = c.Value;  // Safe
}

// Null-coalescing operator
int d = a ?? 0;           // 0 (default when null)
int e = c ?? 0;           // 42

// Null-coalescing assignment (C# 8.0+)
a ??= 10;  // Assigns 10 only if a is null

// Null-conditional operator
int? length = str?.Length;  // null if str is null
int? first = array?[0];     // null if array is null

// GetValueOrDefault
int f = a.GetValueOrDefault();     // 0 (default of int)
int g = a.GetValueOrDefault(100);  // 100 (specified default)

// Conversion
int? fromInt = 42;          // Implicit conversion from T to T?
int toInt = (int)c;         // Explicit conversion (throws if null)
int safe = c ?? default;    // Safe conversion with default

// Nullable with other value types
double? nullableDouble = null;
bool? nullableBool = null;
DateTime? nullableDate = null;
Guid? nullableGuid = null;

// Three-valued boolean logic with bool?
bool? x = true;
bool? y = null;
bool? z = false;

bool? andResult = x & y;    // null (true AND null = null)
bool? orResult = x | y;     // true (true OR null = true)
bool? notResult = !y;       // null

// Lifted operators (automatic null propagation)
int? sum = a + c;      // null (null + 42 = null)
int? product = c * 2;  // 84
bool? greater = a > 0; // null

// Equality comparison
bool eq1 = (a == null);     // true
bool eq2 = (a == c);        // false
bool eq3 = (null == null);  // true (for nullable)

// Comparison
bool lt = (a < c);  // false (any comparison with null is false except ==)

// Pattern matching with nullable
if (c is int value)
{
    Console.WriteLine($"Has value: {value}");
}

if (a is null)
{
    Console.WriteLine("Is null");
}

// Switch expression with nullable
string result = c switch
{
    null => "No value",
    0 => "Zero",
    > 0 => "Positive",
    < 0 => "Negative"
};

// Boxing behavior
object boxed = c;  // Boxes to int, not Nullable<int>
object boxedNull = a;  // null reference

// Type checking
bool isNullableInt = c is int;  // true
Type type = c.GetType();  // System.Int32 (not Nullable<Int32>)

// Nullable reference types (C# 8.0+) - different concept!
#nullable enable
string? nullableString = null;  // Reference type that can be null
string nonNullString = "hello"; // Reference type that shouldn't be null
#nullable disable
```

---

## String Type

### `string` (System.String)

While technically a reference type, string behaves like a primitive in many ways due to its immutability and special compiler support.

| Property | Value |
|----------|-------|
| Size | 20 bytes + 2 bytes per character (approximate) |
| Mutability | Immutable |
| Default Value | `null` |
| CTS Equivalent | `System.String` |
| Encoding | UTF-16 internally |

```csharp
// Declaration
string a = "Hello, World!";
string b = "";           // Empty string
string c = string.Empty; // Preferred for empty string
string d = null;         // Null reference
string e = default;      // null

// String literals
string regular = "Hello\nWorld";  // Escape sequences processed
string verbatim = @"C:\Users\Name\Documents";  // Verbatim (no escapes except "")
string verbatimMultiline = @"Line 1
Line 2
Line 3";

// Raw string literals (C# 11+)
string raw = """
    This is a raw string literal.
    No escapes needed: \n \t
    Indentation is trimmed.
    """;

string rawWithQuotes = """"
    Can contain """ three quotes
    """";

// Interpolated strings
string name = "World";
string interpolated = $"Hello, {name}!";
string interpolatedVerbatim = $@"Path: C:\Users\{name}";
string interpolatedRaw = $"""
    Hello, {name}!
    """;

// Formatting
string formatted = string.Format("Value: {0:N2}", 1234.5);  // "Value: 1,234.50"
string padded = "42".PadLeft(5, '0');   // "00042"
string paddedRight = "42".PadRight(5);  // "42   "

// Composite formatting
int value = 42;
string composite = $"{value,10}";   // Right-aligned in 10 chars
string composite2 = $"{value,-10}"; // Left-aligned in 10 chars
string composite3 = $"{value:D5}";  // "00042" (decimal with 5 digits)
string composite4 = $"{value:X}";   // "2A" (hexadecimal)

// String comparison
bool equal = string.Equals(a, b);
bool equalIgnoreCase = string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
int comparison = string.Compare(a, b);
int comparisonOrdinal = string.Compare(a, b, StringComparison.Ordinal);

// Recommended comparison approach
bool match = a.Equals(b, StringComparison.Ordinal);  // Fastest, byte-by-byte
bool matchCaseInsensitive = a.Equals(b, StringComparison.OrdinalIgnoreCase);

// String operations
int length = a.Length;
char firstChar = a[0];
bool isEmpty = string.IsNullOrEmpty(a);
bool isWhitespace = string.IsNullOrWhiteSpace(a);

// Searching
int indexOf = a.IndexOf('o');
int lastIndexOf = a.LastIndexOf('o');
bool contains = a.Contains("World");
bool startsWith = a.StartsWith("Hello");
bool endsWith = a.EndsWith("!");

// Substring operations
string sub = a.Substring(0, 5);      // "Hello"
string sub2 = a[0..5];               // "Hello" (range operator)
string sub3 = a[7..];                // "World!"
string sub4 = a[^6..];               // "World!" (from end)

// Modification (returns new string)
string upper = a.ToUpper();
string lower = a.ToLower();
string trimmed = "  hello  ".Trim();
string trimStart = "  hello  ".TrimStart();
string trimEnd = "  hello  ".TrimEnd();
string replaced = a.Replace("World", "C#");
string removed = a.Remove(5);
string inserted = a.Insert(5, " Beautiful");

// Splitting and joining
string[] parts = "a,b,c".Split(',');
string[] parts2 = "a  b  c".Split(' ', StringSplitOptions.RemoveEmptyEntries);
string joined = string.Join(", ", parts);
string joined2 = string.Join(", ", new[] { "a", "b", "c" });

// String building (for efficient concatenation)
StringBuilder sb = new StringBuilder();
sb.Append("Hello");
sb.Append(' ');
sb.Append("World");
sb.AppendLine("!");
sb.Insert(0, ">>> ");
sb.Replace("World", "C#");
string result = sb.ToString();

// Span-based operations (efficient, no allocation)
ReadOnlySpan<char> span = a.AsSpan();
ReadOnlySpan<char> slice = a.AsSpan(0, 5);
bool spanEquals = span.SequenceEqual("Hello, World!");

// String interpolation handlers (C# 10+)
// More efficient when string might not be used
void LogIfEnabled(bool enabled, [InterpolatedStringHandlerArgument("enabled")] LogHandler handler)
{
    if (enabled)
        Console.WriteLine(handler.ToString());
}

// String interning
string interned = string.Intern(a);
string isInterned = string.IsInterned(a);

// Character enumeration
foreach (char ch in a)
{
    Console.WriteLine(ch);
}

// Rune enumeration (correct Unicode)
foreach (Rune rune in a.EnumerateRunes())
{
    Console.WriteLine($"U+{rune.Value:X4}");
}

// Encoding/decoding
byte[] utf8 = Encoding.UTF8.GetBytes(a);
string decoded = Encoding.UTF8.GetString(utf8);
byte[] utf16 = Encoding.Unicode.GetBytes(a);
byte[] ascii = Encoding.ASCII.GetBytes(a);

// Memory-efficient string creation
string fromSpan = new string(charSpan);
string fromArray = new string(charArray);
string fromPointer = new string(charPointer, 0, length);  // Unsafe

// Regular expressions
bool isMatch = Regex.IsMatch(a, @"\w+");
Match match = Regex.Match(a, @"(\w+)");
string regexReplaced = Regex.Replace(a, @"\s+", "_");

// Source-generated regex (C# 11+ / .NET 7+)
[GeneratedRegex(@"\w+")]
private static partial Regex WordRegex();
```

---

## Object Type

### `object` (System.Object)

The base type of all types in C#.

| Property | Value |
|----------|-------|
| Size | 8 bytes (reference) + object header + data |
| Default Value | `null` |
| CTS Equivalent | `System.Object` |

```csharp
// Declaration
object a = "Hello";
object b = 42;
object c = 3.14;
object d = new List<int>();
object e = null;
object f = default;  // null

// Universal methods (available on all objects)
string str = a.ToString();
int hashCode = a.GetHashCode();
Type type = a.GetType();
bool equals = a.Equals(b);
bool refEquals = object.ReferenceEquals(a, b);

// Type checking
bool isString = a is string;
bool isInt = b is int;

// Type casting
if (a is string s)
{
    Console.WriteLine(s.Length);
}

string s2 = a as string;  // null if not string
string s3 = (string)a;    // Throws InvalidCastException if not string

// Pattern matching
object value = GetValue();
switch (value)
{
    case null:
        Console.WriteLine("Null");
        break;
    case int i:
        Console.WriteLine($"Integer: {i}");
        break;
    case string s when s.Length > 0:
        Console.WriteLine($"Non-empty string: {s}");
        break;
    case double d:
        Console.WriteLine($"Double: {d}");
        break;
    default:
        Console.WriteLine($"Other: {value}");
        break;
}

// Property pattern matching
if (value is string { Length: > 5 } longString)
{
    Console.WriteLine($"Long string: {longString}");
}

// Type pattern with var
if (value is var v && v != null)
{
    Console.WriteLine($"Type: {v.GetType()}");
}

// GetType vs typeof
Type runtimeType = a.GetType();     // Runtime type of instance
Type compileType = typeof(string);  // Compile-time type reference

// Type comparison
bool isSameType = a.GetType() == typeof(string);
bool isAssignable = typeof(IEnumerable).IsAssignableFrom(a.GetType());

// MemberwiseClone (protected, for inheritance)
// Creates a shallow copy of the object

// Finalization (destructor)
// ~MyClass() { } // Called by GC before collection
```

---

## Dynamic Type

### `dynamic`

The dynamic type bypasses compile-time type checking. Operations are resolved at runtime.

| Property | Value |
|----------|-------|
| Size | Same as object (8 bytes reference) |
| Type Checking | Runtime only |
| Default Value | `null` |
| CTS Equivalent | `System.Object` (with DLR support) |

```csharp
// Declaration
dynamic a = "Hello";
dynamic b = 42;
dynamic c = new { Name = "Test", Value = 100 };

// Operations resolved at runtime
dynamic result = a + " World";  // String concatenation
dynamic sum = b + 10;           // Integer addition

// Member access (no compile-time checking)
int length = a.Length;          // Works for string
// int invalid = b.Length;      // RuntimeBinderException at runtime

// Method calls
dynamic upper = a.ToUpper();

// Dynamic with anonymous types
dynamic anon = new { X = 1, Y = 2 };
int x = anon.X;
int y = anon.Y;

// ExpandoObject (truly dynamic object)
dynamic expando = new ExpandoObject();
expando.Name = "Test";
expando.Value = 42;
expando.Calculate = (Func<int, int>)(x => x * 2);
int calculated = expando.Calculate(5);  // 10

// Add/remove properties at runtime
var dict = (IDictionary<string, object>)expando;
dict["NewProperty"] = "Added at runtime";
dict.Remove("Value");

// DynamicObject (for custom dynamic behavior)
public class DynamicDictionary : DynamicObject
{
    private Dictionary<string, object> _data = new();

    public override bool TryGetMember(GetMemberBinder binder, out object result)
    {
        return _data.TryGetValue(binder.Name, out result);
    }

    public override bool TrySetMember(SetMemberBinder binder, object value)
    {
        _data[binder.Name] = value;
        return true;
    }
}

// Interop with COM objects
dynamic excel = Activator.CreateInstance(Type.GetTypeFromProgID("Excel.Application"));
excel.Visible = true;
excel.Workbooks.Add();

// JSON deserialization to dynamic
dynamic json = JsonSerializer.Deserialize<dynamic>(jsonString);

// Implicit conversion
dynamic d = 10;
int i = d;          // Implicit conversion at runtime
string s = d;       // RuntimeBinderException (can't convert int to string)

// var vs dynamic
var v = "Hello";    // Type is string (compile-time)
dynamic dyn = "Hello";  // Type is dynamic (runtime)
// v = 42;          // Compile error
dyn = 42;           // Works (runtime type changes)

// Performance consideration
// dynamic is slower due to runtime binding
// Use when interacting with dynamic languages, COM, or reflection-heavy code

// Checking actual runtime type
Type actualType = ((object)a).GetType();  // System.String
```

---

## Arrays and Collections

### Arrays

```csharp
// Single-dimensional arrays
int[] numbers = new int[5];              // All elements are 0
int[] initialized = { 1, 2, 3, 4, 5 };   // Collection initializer
int[] explicit = new int[] { 1, 2, 3 };  // Explicit type
int[] inferred = new[] { 1, 2, 3 };      // Type inferred

// Multi-dimensional arrays (rectangular)
int[,] matrix = new int[3, 4];           // 3 rows, 4 columns
int[,] init = { { 1, 2 }, { 3, 4 } };    // 2x2 matrix
int rows = matrix.GetLength(0);           // 3
int cols = matrix.GetLength(1);           // 4

// Jagged arrays (array of arrays)
int[][] jagged = new int[3][];
jagged[0] = new int[] { 1, 2, 3 };
jagged[1] = new int[] { 4, 5 };
jagged[2] = new int[] { 6 };

// Array properties and methods
int length = numbers.Length;              // Total elements
int rank = matrix.Rank;                   // Number of dimensions
bool isEmpty = numbers.Length == 0;

// Array access
int first = numbers[0];
int last = numbers[^1];                   // From end (C# 8+)
int[] slice = numbers[1..4];              // Range (C# 8+)

// Array methods
Array.Sort(numbers);
Array.Reverse(numbers);
int index = Array.IndexOf(numbers, 3);
int binaryIndex = Array.BinarySearch(numbers, 3);  // Must be sorted
Array.Clear(numbers, 0, numbers.Length);
Array.Copy(source, dest, length);
Array.Fill(numbers, 42);
bool exists = Array.Exists(numbers, x => x > 10);
int[] filtered = Array.FindAll(numbers, x => x > 5);
int found = Array.Find(numbers, x => x > 5);

// LINQ operations on arrays
var query = numbers.Where(x => x > 5).Select(x => x * 2);
int sum = numbers.Sum();
double average = numbers.Average();
int max = numbers.Max();
int min = numbers.Min();
bool any = numbers.Any(x => x > 10);
bool all = numbers.All(x => x > 0);

// Array conversion
List<int> list = numbers.ToList();
HashSet<int> set = numbers.ToHashSet();
int[] back = list.ToArray();

// Array covariance (reference types only)
object[] objects = new string[] { "a", "b" };  // Covariant
// objects[0] = 42;  // Compiles but throws ArrayTypeMismatchException

// ArraySegment (view into array)
ArraySegment<int> segment = new ArraySegment<int>(numbers, 1, 3);
foreach (int item in segment) { }
```

### Common Collection Types

```csharp
// List<T> - Dynamic array
List<int> list = new List<int> { 1, 2, 3 };
list.Add(4);
list.AddRange(new[] { 5, 6 });
list.Insert(0, 0);
list.Remove(3);
list.RemoveAt(0);
list.RemoveAll(x => x > 5);
bool contains = list.Contains(3);
int index = list.IndexOf(3);
list.Sort();
list.Reverse();
list.Clear();
int count = list.Count;
int capacity = list.Capacity;
list.TrimExcess();

// Dictionary<TKey, TValue> - Hash table
Dictionary<string, int> dict = new Dictionary<string, int>
{
    ["one"] = 1,
    ["two"] = 2
};
dict.Add("three", 3);
dict["four"] = 4;
bool hasKey = dict.ContainsKey("one");
bool hasValue = dict.ContainsValue(1);
bool got = dict.TryGetValue("one", out int value);
dict.Remove("one");
var keys = dict.Keys;
var values = dict.Values;

// HashSet<T> - Unique collection
HashSet<int> set = new HashSet<int> { 1, 2, 3 };
set.Add(4);
bool added = set.Add(1);  // false (already exists)
set.Remove(1);
bool has = set.Contains(2);
set.UnionWith(otherSet);
set.IntersectWith(otherSet);
set.ExceptWith(otherSet);
set.SymmetricExceptWith(otherSet);
bool isSubset = set.IsSubsetOf(otherSet);
bool isSuperset = set.IsSupersetOf(otherSet);
bool overlaps = set.Overlaps(otherSet);

// Queue<T> - FIFO
Queue<int> queue = new Queue<int>();
queue.Enqueue(1);
queue.Enqueue(2);
int first = queue.Peek();    // View without removing
int dequeued = queue.Dequeue();

// Stack<T> - LIFO
Stack<int> stack = new Stack<int>();
stack.Push(1);
stack.Push(2);
int top = stack.Peek();      // View without removing
int popped = stack.Pop();

// LinkedList<T> - Doubly-linked list
LinkedList<int> linked = new LinkedList<int>();
linked.AddFirst(1);
linked.AddLast(3);
LinkedListNode<int> node = linked.Find(1);
linked.AddAfter(node, 2);
linked.Remove(node);

// SortedSet<T> - Sorted unique collection (red-black tree)
SortedSet<int> sorted = new SortedSet<int> { 3, 1, 2 };
int min = sorted.Min;
int max = sorted.Max;
var range = sorted.GetViewBetween(1, 5);

// SortedDictionary<TKey, TValue> - Sorted by key
SortedDictionary<string, int> sortedDict = new SortedDictionary<string, int>();

// SortedList<TKey, TValue> - Array-based sorted collection
SortedList<string, int> sortedList = new SortedList<string, int>();

// PriorityQueue<TElement, TPriority> (.NET 6+)
PriorityQueue<string, int> pq = new PriorityQueue<string, int>();
pq.Enqueue("low", 10);
pq.Enqueue("high", 1);
string highest = pq.Dequeue();  // "high"

// Immutable collections (System.Collections.Immutable)
ImmutableList<int> immutableList = ImmutableList.Create(1, 2, 3);
ImmutableList<int> added = immutableList.Add(4);  // Returns new list
ImmutableDictionary<string, int> immutableDict = ImmutableDictionary<string, int>.Empty;
ImmutableHashSet<int> immutableSet = ImmutableHashSet.Create(1, 2, 3);
ImmutableArray<int> immutableArray = ImmutableArray.Create(1, 2, 3);

// Concurrent collections (System.Collections.Concurrent)
ConcurrentDictionary<string, int> concurrentDict = new ConcurrentDictionary<string, int>();
concurrentDict.TryAdd("key", 1);
concurrentDict.AddOrUpdate("key", 1, (k, v) => v + 1);
concurrentDict.GetOrAdd("key", 1);

ConcurrentQueue<int> concurrentQueue = new ConcurrentQueue<int>();
concurrentQueue.Enqueue(1);
concurrentQueue.TryDequeue(out int item);

ConcurrentBag<int> concurrentBag = new ConcurrentBag<int>();
ConcurrentStack<int> concurrentStack = new ConcurrentStack<int>();
BlockingCollection<int> blockingCollection = new BlockingCollection<int>();

// Channel<T> (.NET Core 3.0+) - For producer/consumer
Channel<int> channel = Channel.CreateUnbounded<int>();
await channel.Writer.WriteAsync(1);
int read = await channel.Reader.ReadAsync();
```

---

## Span and Memory Types

### `Span<T>` and `ReadOnlySpan<T>`

Stack-only types for efficient, safe access to contiguous memory regions.

| Property | Value |
|----------|-------|
| Size | 16 bytes (pointer + length) on 64-bit |
| Allocation | Stack only (ref struct) |
| Lifetime | Cannot outlive stack frame |

```csharp
// Creating Spans
int[] array = { 1, 2, 3, 4, 5 };
Span<int> span = array;                      // From array
Span<int> slice = array.AsSpan(1, 3);        // Slice: { 2, 3, 4 }
Span<int> rangeSlice = array.AsSpan()[1..4]; // Same slice

// Stack allocation with Span
Span<int> stackSpan = stackalloc int[10];    // On stack, very fast

// String as ReadOnlySpan<char>
string str = "Hello, World!";
ReadOnlySpan<char> charSpan = str.AsSpan();
ReadOnlySpan<char> hello = str.AsSpan(0, 5);  // "Hello"

// Span properties
int length = span.Length;
bool isEmpty = span.IsEmpty;
ref int first = ref span[0];              // Reference to element

// Slicing (creates view, no allocation)
Span<int> firstHalf = span[..2];          // { 1, 2 }
Span<int> secondHalf = span[2..];         // { 3, 4, 5 }
Span<int> middle = span[1..^1];           // { 2, 3, 4 }

// Modification
span[0] = 10;
span.Fill(42);                            // Fill all with 42
span.Clear();                             // Set all to default

// Copying
Span<int> dest = new int[5];
span.CopyTo(dest);
bool copied = span.TryCopyTo(dest);       // Returns false if too small

// Searching
int index = span.IndexOf(3);
int lastIndex = span.LastIndexOf(3);
bool contains = span.Contains(3);
bool startsWith = span.StartsWith(new[] { 1, 2 });
bool endsWith = span.EndsWith(new[] { 4, 5 });

// Comparison
bool equal = span.SequenceEqual(otherSpan);

// Binary search (must be sorted)
int binaryIndex = span.BinarySearch(3);

// Sorting
span.Sort();
span.Reverse();

// Conversion
int[] backToArray = span.ToArray();

// ReadOnlySpan (immutable view)
ReadOnlySpan<int> readOnly = array;
ReadOnlySpan<int> fromString = "Hello".AsSpan();
// readOnly[0] = 1;  // Compile error

// Span and stackalloc for performance
public static int Sum(ReadOnlySpan<int> values)
{
    int sum = 0;
    foreach (int value in values)
        sum += value;
    return sum;
}

// Zero-allocation parsing
ReadOnlySpan<char> input = "123,456,789".AsSpan();
int firstComma = input.IndexOf(',');
ReadOnlySpan<char> firstNumber = input[..firstComma];
int parsed = int.Parse(firstNumber);

// Span limitations (ref struct)
// Cannot be field in class/non-ref struct
// Cannot be boxed
// Cannot be captured in lambdas/async methods
// Cannot implement interfaces
```

### `Memory<T>` and `ReadOnlyMemory<T>`

Heap-storable wrapper around memory regions, for when Span's limitations are too restrictive.

| Property | Value |
|----------|-------|
| Size | 16 bytes |
| Allocation | Can be stored on heap |
| Lifetime | Can outlive stack frame |

```csharp
// Creating Memory
int[] array = { 1, 2, 3, 4, 5 };
Memory<int> memory = array;
Memory<int> slice = array.AsMemory(1, 3);

// Memory from string
ReadOnlyMemory<char> strMemory = "Hello".AsMemory();

// Getting Span from Memory
Span<int> span = memory.Span;
ReadOnlySpan<char> charSpan = strMemory.Span;

// Memory properties
int length = memory.Length;
bool isEmpty = memory.IsEmpty;

// Slicing
Memory<int> firstHalf = memory[..2];
Memory<int> secondHalf = memory[2..];

// Memory can be stored in classes
class DataHolder
{
    public Memory<byte> Data { get; set; }
}

// Memory can be used in async methods
async Task ProcessAsync(Memory<byte> data)
{
    // Can await with Memory (not with Span)
    await Task.Delay(100);

    // Get Span when needed
    Span<byte> span = data.Span;
    span[0] = 42;
}

// IMemoryOwner<T> for pooled memory
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
Memory<byte> pooledMemory = owner.Memory;

// MemoryMarshal for advanced scenarios
ReadOnlySpan<byte> bytes = MemoryMarshal.AsBytes(memory.Span);
Span<int> ints = MemoryMarshal.Cast<byte, int>(byteSpan);
ref int reference = ref MemoryMarshal.GetReference(span);

// ArrayPool for reusable arrays
byte[] rentedArray = ArrayPool<byte>.Shared.Rent(1024);
try
{
    // Use the array
    Memory<byte> rentedMemory = rentedArray.AsMemory(0, 1024);
}
finally
{
    ArrayPool<byte>.Shared.Return(rentedArray);
}

// Pipe for high-performance I/O
var pipe = new Pipe();
// Writer
Memory<byte> buffer = pipe.Writer.GetMemory(512);
// ... fill buffer ...
pipe.Writer.Advance(bytesWritten);
await pipe.Writer.FlushAsync();

// Reader
ReadResult result = await pipe.Reader.ReadAsync();
ReadOnlySequence<byte> sequence = result.Buffer;
```

---

## Boxing and Unboxing

Boxing is the process of converting a value type to a reference type (object or interface). Unboxing is the reverse.

```csharp
// Boxing - value type to object
int value = 42;
object boxed = value;  // Boxing occurs here

// What happens during boxing:
// 1. Memory allocated on heap for object
// 2. Value copied to heap memory
// 3. Reference returned

// Unboxing - object back to value type
int unboxed = (int)boxed;  // Unboxing occurs here

// What happens during unboxing:
// 1. Type check (must match exactly)
// 2. Value copied from heap to stack

// Invalid unboxing throws InvalidCastException
object boxedInt = 42;
// long invalid = (long)boxedInt;  // Throws! Must unbox to exact type first
long valid = (long)(int)boxedInt;  // Unbox to int, then convert to long

// Boxing with nullable
int? nullable = 42;
object boxedNullable = nullable;  // Boxes to int, not Nullable<int>
object boxedNull = (int?)null;    // null reference

int? unboxedNullable = (int?)boxedNullable;  // Can unbox to nullable

// Interface boxing
int number = 42;
IComparable comparable = number;  // Boxing occurs
IFormattable formattable = number;  // Boxing occurs

// Boxing in collections (before generics)
ArrayList oldList = new ArrayList();
oldList.Add(42);  // Boxing
int retrieved = (int)oldList[0];  // Unboxing

// No boxing with generic collections
List<int> newList = new List<int>();
newList.Add(42);  // No boxing
int retrieved2 = newList[0];  // No unboxing

// Boxing with string formatting
int val = 42;
string str = string.Format("{0}", val);  // Boxing occurs
string str2 = val.ToString();  // No boxing (virtual method on int)
string str3 = $"{val}";  // May be optimized to avoid boxing

// Boxing in equality comparisons
object box1 = 42;
object box2 = 42;
bool refEqual = box1 == box2;  // false (different references)
bool valueEqual = box1.Equals(box2);  // true (value comparison)

// Avoid boxing by using constraints
void Process<T>(T value) where T : struct, IComparable<T>
{
    // No boxing when calling CompareTo due to constraint
    int result = value.CompareTo(default);
}

// Boxing detection via IL analysis or performance counters
// Boxing creates GC pressure and should be minimized in hot paths

// Span<T> and boxing (Span cannot be boxed - it's a ref struct)
// Span<int> span = stackalloc int[10];
// object boxedSpan = span;  // Compile error - cannot box ref struct

// TypedReference for avoiding boxing in some scenarios (advanced)
int myInt = 42;
TypedReference tr = __makeref(myInt);
int back = __refvalue(tr, int);
```

### Performance Implications of Boxing

```csharp
// BAD: Boxing in loop
void BoxingInLoop(int[] values)
{
    foreach (int value in values)
    {
        object boxed = value;  // Allocates on heap each iteration
        ProcessObject(boxed);
    }
}

// GOOD: Use generics to avoid boxing
void GenericApproach<T>(T[] values) where T : struct
{
    foreach (T value in values)
    {
        Process(value);  // No boxing
    }
}

// BAD: Interface boxing
void InterfaceBoxing(int value)
{
    IComparable comp = value;  // Boxing
    comp.CompareTo(42);
}

// GOOD: Generic constraint
void GenericConstraint<T>(T value) where T : IComparable<T>
{
    value.CompareTo(default);  // No boxing with correct constraint
}
```

---

## Comparison with JavaScript

### Type System Differences

| Aspect | C# | JavaScript |
|--------|----|----|
| Type System | Static, strong | Dynamic, weak |
| Type Checking | Compile-time | Runtime |
| Primitive Types | Many (13+) | 7 (string, number, bigint, boolean, undefined, null, symbol) |
| Integer Types | 8 distinct types | Single number type (or BigInt) |
| Floating-Point | float, double, decimal | Only double (IEEE 754) |
| Null Handling | Nullable<T>, null references | null, undefined |
| Type Coercion | Explicit only | Implicit, complex rules |

### Number Handling

```csharp
// C#: Distinct integer and floating-point types
int intValue = 42;
long bigInt = 9007199254740993L;  // Exact (beyond JS safe integer)
double floatValue = 3.14;
decimal money = 19.99m;  // Exact decimal

// Overflow behavior (configurable)
checked { int overflow = int.MaxValue + 1; }  // Throws
unchecked { int wrap = int.MaxValue + 1; }    // Wraps to MinValue
```

```javascript
// JavaScript: Single number type
let intValue = 42;
let bigInt = 9007199254740993;  // LOSES PRECISION! (9007199254740992)
let bigIntSafe = 9007199254740993n;  // BigInt preserves
let floatValue = 3.14;
let money = 0.1 + 0.2;  // 0.30000000000000004 (not 0.3!)

// No overflow protection
let overflow = Number.MAX_SAFE_INTEGER + 1;  // Silent precision loss
```

### Boolean and Truthiness

```csharp
// C#: Strict boolean
bool flag = true;
if (flag) { }  // Only bool allowed

int number = 0;
// if (number) { }  // COMPILE ERROR

if (number != 0) { }  // Must be explicit
```

```javascript
// JavaScript: Truthy/Falsy coercion
let flag = true;
if (flag) { }

let number = 0;
if (number) { }  // Valid! 0 is falsy

// Falsy values: false, 0, "", null, undefined, NaN
// Everything else is truthy (including "0", [], {})
```

### Type Coercion

```csharp
// C#: Explicit conversions
string str = "42";
int num = int.Parse(str);  // Explicit parsing
// int fail = str;  // COMPILE ERROR

object obj = 42;
int unboxed = (int)obj;  // Explicit cast required
```

```javascript
// JavaScript: Implicit coercion
let str = "42";
let num = +str;  // 42 (unary plus coerces)
let weird = "42" - 0;  // 42
let weirder = "42" + 0;  // "420" (string concatenation!)

// Type coercion rules are complex
"5" - 3;    // 2
"5" + 3;    // "53"
true + 1;   // 2
[] + {};    // "[object Object]"
{} + [];    // 0 (in some contexts)
```

### Null and Undefined

```csharp
// C#: null for references, Nullable<T> for value types
string? nullableString = null;
int? nullableInt = null;

// Null-safety operators
string safe = nullableString ?? "default";
int len = nullableString?.Length ?? 0;
nullableString ??= "assigned if null";

// Null checks
if (nullableString is not null) { }
if (nullableInt.HasValue) { }
```

```javascript
// JavaScript: null AND undefined
let a = null;
let b = undefined;
let c;  // undefined

// Both are falsy
if (!a) { }  // true
if (!b) { }  // true

// Different equality behavior
null == undefined;   // true (loose)
null === undefined;  // false (strict)

// Nullish coalescing (ES2020)
let safe = nullableValue ?? "default";
let len = str?.length ?? 0;
nullableValue ??= "assigned if nullish";
```

### Implications for Semantic Primitives

Based on these comparisons, C# features that could enhance JavaScript semantic primitives:

1. **Strong Typing Benefits**
   ```csharp
   // C# enforces type safety
   public record UserId(Guid Value);
   public record Email(string Value);

   void ProcessUser(UserId id, Email email) { }

   // Can't accidentally swap parameters
   // ProcessUser(email, id);  // COMPILE ERROR
   ```

2. **Decimal for Financial Calculations**
   ```csharp
   // C# decimal eliminates floating-point errors
   decimal price = 19.99m;
   decimal tax = 0.0825m;
   decimal total = Math.Round(price * (1 + tax), 2);  // Exact: 21.64
   ```

3. **Value Types for Performance**
   ```csharp
   // C# structs avoid heap allocation
   public readonly struct Point(double X, double Y);

   // Stack allocated, no GC pressure
   Point[] points = new Point[1000000];
   ```

4. **Nullable Value Types**
   ```csharp
   // C# nullable int is clear and type-safe
   int? maybeNumber = GetNumber();
   int definiteNumber = maybeNumber ?? 0;
   ```

5. **Span for Memory Safety**
   ```csharp
   // C# Span provides safe views without copying
   void Process(ReadOnlySpan<char> data)
   {
       // Safe, efficient access to substring
   }
   ```

### Potential JavaScript/TypeScript Enhancements

Based on C# patterns, semantic primitives in JS/TS could benefit from:

1. **Nominal typing** (vs structural) for distinct semantic types
2. **Value semantics** for immutable primitives
3. **Decimal type** for financial calculations (TC39 proposal exists)
4. **Overflow checking** options for integer arithmetic
5. **Non-nullable by default** with explicit nullable syntax
6. **Branded types** pattern for type-safe IDs

```typescript
// TypeScript branded types (approximating C# distinct types)
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
    return id as UserId;
}

function processUser(id: UserId, email: Email) { }
// Type-safe at compile time
```

---

## Summary

C#'s type system provides:

- **Rich primitive types** with precise control over size and behavior
- **Strong typing** that catches errors at compile time
- **Value types** for performance-critical scenarios
- **Nullable types** for explicit optional values
- **Span/Memory** for safe, efficient memory access
- **Boxing/unboxing** transparency for understanding performance

These features make C# well-suited for systems where type safety and performance are critical, and many of these patterns can inform the design of semantic primitives in dynamically-typed languages like JavaScript.
