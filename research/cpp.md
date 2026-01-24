# C and C++ Primitive Types: A Comprehensive Reference

This document provides an exhaustive examination of primitive and fundamental types in C and C++, covering their sizes, ranges, behaviors, and the low-level semantics that distinguish them from higher-level languages like JavaScript.

---

## Table of Contents

1. [Overview: What Makes C/C++ Types "Primitive"](#overview-what-makes-cc-types-primitive)
2. [Integer Types](#integer-types)
3. [Floating-Point Types](#floating-point-types)
4. [Boolean Type](#boolean-type)
5. [Void Type](#void-type)
6. [Fixed-Width Integer Types](#fixed-width-integer-types)
7. [Size and Pointer-Related Types](#size-and-pointer-related-types)
8. [Character Types](#character-types)
9. [Type Promotion and Conversion Rules](#type-promotion-and-conversion-rules)
10. [Literals and Suffixes](#literals-and-suffixes)
11. [C++ String Types](#c-string-types)
12. [Arrays](#arrays)
13. [Standard Library Containers](#standard-library-containers)
14. [nullptr vs NULL](#nullptr-vs-null)
15. [Auto Type Deduction](#auto-type-deduction)
16. [Comparison with JavaScript](#comparison-with-javascript)

---

## Overview: What Makes C/C++ Types "Primitive"

In C and C++, "primitive" or "fundamental" types are the building blocks provided directly by the language, mapped closely to hardware capabilities. Unlike JavaScript's abstract primitives:

- **Memory layout is explicit**: Each type has a defined size (in bytes) and memory representation
- **No automatic boxing/unboxing**: Primitives are never implicitly wrapped in objects
- **Platform-dependent sizes**: The same type may have different sizes on different architectures
- **Direct hardware correspondence**: Types map to CPU registers and memory operations
- **No garbage collection**: Memory management is manual or scope-based (RAII)

### The C++ Type Categories (C++11 and later)

```
Fundamental Types
├── void
├── std::nullptr_t (C++11)
├── Arithmetic Types
│   ├── Integral Types
│   │   ├── bool
│   │   ├── Character Types (char, wchar_t, char8_t, char16_t, char32_t)
│   │   └── Integer Types (signed/unsigned: short, int, long, long long)
│   └── Floating-Point Types (float, double, long double)
```

---

## Integer Types

### Signed Integer Types

The C/C++ standard defines **minimum** sizes, not exact sizes. Implementations may provide larger types.

| Type | Minimum Size | Typical Size (64-bit) | Minimum Range |
|------|--------------|----------------------|---------------|
| `signed char` | 8 bits | 8 bits | -127 to 127 |
| `short` / `short int` | 16 bits | 16 bits | -32,767 to 32,767 |
| `int` | 16 bits | 32 bits | -32,767 to 32,767 |
| `long` / `long int` | 32 bits | 64 bits (Unix) / 32 bits (Windows) | -2,147,483,647 to 2,147,483,647 |
| `long long` / `long long int` (C99/C++11) | 64 bits | 64 bits | -9,223,372,036,854,775,807 to 9,223,372,036,854,775,807 |

**Important**: The standard guarantees:
```
sizeof(char) <= sizeof(short) <= sizeof(int) <= sizeof(long) <= sizeof(long long)
```

### Unsigned Integer Types

| Type | Minimum Size | Minimum Range |
|------|--------------|---------------|
| `unsigned char` | 8 bits | 0 to 255 |
| `unsigned short` | 16 bits | 0 to 65,535 |
| `unsigned int` | 16 bits | 0 to 65,535 |
| `unsigned long` | 32 bits | 0 to 4,294,967,295 |
| `unsigned long long` | 64 bits | 0 to 18,446,744,073,709,551,615 |

### Two's Complement Representation (C++20)

Prior to C++20, signed integer representation was implementation-defined (two's complement, ones' complement, or sign-magnitude). **C++20 mandates two's complement** for signed integers, which affects:

- The minimum value of signed types (now exactly -2^(n-1) instead of -(2^(n-1) - 1))
- Behavior of bitwise operations on signed integers

```cpp
// C++20 guarantees:
// int8_t range: -128 to 127 (not -127 to 127)
static_assert(std::numeric_limits<int8_t>::min() == -128);
```

### Code Example: Discovering Type Sizes

```cpp
#include <iostream>
#include <limits>
#include <cstdint>

int main() {
    std::cout << "Type sizes on this platform:\n";
    std::cout << "char:        " << sizeof(char) << " byte(s)\n";
    std::cout << "short:       " << sizeof(short) << " byte(s)\n";
    std::cout << "int:         " << sizeof(int) << " byte(s)\n";
    std::cout << "long:        " << sizeof(long) << " byte(s)\n";
    std::cout << "long long:   " << sizeof(long long) << " byte(s)\n";

    std::cout << "\nint range: "
              << std::numeric_limits<int>::min() << " to "
              << std::numeric_limits<int>::max() << "\n";

    return 0;
}
```

**Typical output on 64-bit Linux:**
```
Type sizes on this platform:
char:        1 byte(s)
short:       2 byte(s)
int:         4 byte(s)
long:        8 byte(s)
long long:   8 byte(s)

int range: -2147483648 to 2147483647
```

### Integer Overflow Behavior

**Signed overflow**: Undefined behavior (UB) in C/C++. The compiler may assume it never happens.

```cpp
int x = INT_MAX;
x = x + 1;  // UNDEFINED BEHAVIOR - compiler may optimize unexpectedly

// This loop may become infinite due to UB optimization:
for (int i = 0; i >= 0; i++) {
    // Compiler may assume i never overflows, removing the condition
}
```

**Unsigned overflow**: Well-defined, wraps around (modulo 2^n).

```cpp
unsigned int x = UINT_MAX;  // 4294967295 on 32-bit
x = x + 1;                   // Well-defined: x becomes 0
```

---

## Floating-Point Types

C/C++ floating-point types follow IEEE 754 on most platforms (though not mandated by the standard).

| Type | Typical Size | Precision | Approximate Range |
|------|--------------|-----------|-------------------|
| `float` | 4 bytes (32 bits) | ~7 decimal digits | ±3.4 × 10^38 |
| `double` | 8 bytes (64 bits) | ~15-16 decimal digits | ±1.8 × 10^308 |
| `long double` | 8-16 bytes | ~18-34 decimal digits | Platform-dependent |

### Long Double Variations

`long double` is notoriously platform-dependent:

| Platform | Size | Format |
|----------|------|--------|
| x86 Linux/macOS | 12-16 bytes | 80-bit extended precision (padded) |
| x86 Windows (MSVC) | 8 bytes | Same as double |
| ARM64 | 16 bytes | IEEE 754 quadruple precision |
| PowerPC | 16 bytes | Double-double (two doubles) |

### Special Floating-Point Values

```cpp
#include <cmath>
#include <limits>

double inf = std::numeric_limits<double>::infinity();
double neg_inf = -std::numeric_limits<double>::infinity();
double nan = std::numeric_limits<double>::quiet_NaN();
double snan = std::numeric_limits<double>::signaling_NaN();

// Checking for special values
std::isnan(nan);       // true
std::isinf(inf);       // true
std::isfinite(1.0);    // true

// NaN comparisons
nan == nan;            // false (!)
nan != nan;            // true (!)
```

### Floating-Point Precision Issues

```cpp
#include <iomanip>
#include <iostream>

int main() {
    float f = 0.1f;
    double d = 0.1;

    // Neither can represent 0.1 exactly
    std::cout << std::setprecision(20);
    std::cout << "float 0.1:  " << f << "\n";  // 0.10000000149011611938
    std::cout << "double 0.1: " << d << "\n";  // 0.10000000000000000555

    // Classic precision problem
    double sum = 0.0;
    for (int i = 0; i < 10; i++) {
        sum += 0.1;
    }
    std::cout << "Sum of 10 × 0.1: " << sum << "\n";  // 0.99999999999999988898
    std::cout << "sum == 1.0: " << (sum == 1.0) << "\n";  // 0 (false)

    return 0;
}
```

---

## Boolean Type

### C++ `bool`

Native type since C++98:

```cpp
bool flag = true;
bool other = false;

// Size is implementation-defined but at least 1 byte
sizeof(bool);  // Typically 1

// Implicit conversions
bool b1 = 42;      // true (any non-zero becomes true)
bool b2 = 0;       // false
bool b3 = 0.0;     // false
bool b4 = nullptr; // false (C++11)
bool b5 = "";      // true (pointer is non-null!)

int i = true;      // 1
int j = false;     // 0
```

### C `_Bool` and `<stdbool.h>`

C99 introduced `_Bool` as a keyword and `<stdbool.h>` for convenience:

```c
#include <stdbool.h>

// stdbool.h defines:
// #define bool _Bool
// #define true 1
// #define false 0

bool flag = true;
_Bool raw_bool = 1;

// _Bool stores only 0 or 1
_Bool b = 42;  // Stored as 1, not 42
```

### Boolean Gotchas

```cpp
// Dangerous: bool can be implicitly converted to int
void func(int x) { /* ... */ }
void func(bool b) { /* ... */ }

func(true);   // Calls func(bool)
func(1);      // Calls func(int)
func(1 == 1); // Calls func(bool) - comparison yields bool

// Vector<bool> specialization trap
std::vector<bool> vb = {true, false, true};
auto val = vb[0];  // NOT a bool& - it's a proxy object!
// val is std::vector<bool>::reference, not bool
```

---

## Void Type

`void` is an incomplete type representing the absence of a value.

### Uses of void

```cpp
// 1. Function returning nothing
void doSomething() {
    // no return value
}

// 2. Function taking no parameters (C-style, optional in C++)
int getValue(void);  // C: explicitly no parameters
int getValue();      // C: unspecified parameters (!), C++: no parameters

// 3. Generic pointer
void* ptr = malloc(100);  // Points to untyped memory
int* ip = static_cast<int*>(ptr);

// 4. Discarding expression value
(void)printf("ignored return value\n");  // Silences "unused result" warnings

// 5. In templates and type traits
template<typename T> struct is_void : std::false_type {};
template<> struct is_void<void> : std::true_type {};
```

### Void Pointer Rules

```cpp
void* vp;
int* ip;
char* cp;

// C: implicit conversions allowed both ways
vp = ip;  // OK in C
ip = vp;  // OK in C, ERROR in C++ (requires cast)

// C++: only to void* is implicit
vp = ip;  // OK
ip = static_cast<int*>(vp);  // Explicit cast required

// Cannot dereference void*
*vp;          // ERROR
sizeof(*vp);  // ERROR (void is incomplete)

// Cannot do pointer arithmetic on void* (standard)
vp + 1;       // ERROR in standard C/C++
              // GCC extension: treats as char* arithmetic
```

---

## Fixed-Width Integer Types

Defined in `<cstdint>` (C++) or `<stdint.h>` (C), these provide **exact-width** integers.

### Exact-Width Types

| Type | Width | Signed Range | Unsigned Range |
|------|-------|--------------|----------------|
| `int8_t` / `uint8_t` | 8 bits | -128 to 127 | 0 to 255 |
| `int16_t` / `uint16_t` | 16 bits | -32,768 to 32,767 | 0 to 65,535 |
| `int32_t` / `uint32_t` | 32 bits | -2^31 to 2^31-1 | 0 to 2^32-1 |
| `int64_t` / `uint64_t` | 64 bits | -2^63 to 2^63-1 | 0 to 2^64-1 |

**Note**: These are **optional** - they only exist if the platform supports exact-width types with no padding bits.

### Minimum-Width Types (Always Available)

```cpp
int_least8_t   // At least 8 bits
int_least16_t  // At least 16 bits
int_least32_t  // At least 32 bits
int_least64_t  // At least 64 bits
// And unsigned variants: uint_least8_t, etc.
```

### Fastest Minimum-Width Types

```cpp
int_fast8_t    // Fastest with at least 8 bits
int_fast16_t   // Fastest with at least 16 bits
int_fast32_t   // Fastest with at least 32 bits
int_fast64_t   // Fastest with at least 64 bits
// And unsigned variants: uint_fast8_t, etc.
```

### Maximum-Width Types

```cpp
intmax_t   // Maximum-width signed integer
uintmax_t  // Maximum-width unsigned integer
// Guaranteed to be at least 64 bits
```

### Code Example: Portable Binary Protocol

```cpp
#include <cstdint>
#include <cstring>

struct NetworkPacket {
    uint32_t header;      // Exactly 4 bytes
    uint16_t length;      // Exactly 2 bytes
    uint8_t  flags;       // Exactly 1 byte
    uint8_t  reserved;    // Exactly 1 byte
    int64_t  timestamp;   // Exactly 8 bytes
};
// Total: 16 bytes (with standard packing)

// Endianness-aware serialization
void serialize_uint32_be(uint8_t* buffer, uint32_t value) {
    buffer[0] = (value >> 24) & 0xFF;
    buffer[1] = (value >> 16) & 0xFF;
    buffer[2] = (value >> 8) & 0xFF;
    buffer[3] = value & 0xFF;
}
```

---

## Size and Pointer-Related Types

### `size_t`

Unsigned type for object sizes and array indexing:

```cpp
#include <cstddef>

size_t len = sizeof(int);        // Result type of sizeof
size_t idx = strlen("hello");    // String length
size_t count = vec.size();       // Container size

// Platform-dependent size:
// - 32-bit: typically 4 bytes (uint32_t)
// - 64-bit: typically 8 bytes (uint64_t)

// Maximum value
SIZE_MAX  // Maximum value of size_t
```

### `ptrdiff_t`

Signed type for pointer differences:

```cpp
#include <cstddef>

int arr[100];
int* p1 = &arr[10];
int* p2 = &arr[50];

ptrdiff_t diff = p2 - p1;  // 40 (not bytes, but elements!)

// Can be negative
ptrdiff_t neg_diff = p1 - p2;  // -40
```

### `ssize_t` (POSIX, not standard C/C++)

Signed counterpart to `size_t`, used for functions that return -1 on error:

```cpp
#include <unistd.h>  // POSIX

ssize_t bytes_read = read(fd, buffer, count);
if (bytes_read < 0) {
    // Error handling
}
```

### `intptr_t` and `uintptr_t`

Integer types guaranteed to hold a pointer:

```cpp
#include <cstdint>

void* ptr = &some_object;
intptr_t as_int = reinterpret_cast<intptr_t>(ptr);
void* back = reinterpret_cast<void*>(as_int);

// Useful for:
// - Storing pointers in integer contexts
// - Pointer tagging (using low bits for metadata)
// - Interfacing with APIs that use integer handles
```

---

## Character Types

### Basic Character Types

| Type | Size | Purpose |
|------|------|---------|
| `char` | 1 byte | Basic character, signedness is implementation-defined |
| `signed char` | 1 byte | Explicitly signed small integer |
| `unsigned char` | 1 byte | Raw bytes, explicitly unsigned |
| `wchar_t` | Platform-dependent | Wide character (2 bytes Windows, 4 bytes Unix) |

### C++11 Unicode Character Types

| Type | Size | Encoding |
|------|------|----------|
| `char8_t` (C++20) | 1 byte | UTF-8 code unit |
| `char16_t` (C++11) | 2 bytes | UTF-16 code unit |
| `char32_t` (C++11) | 4 bytes | UTF-32 code unit (single code point) |

### Character Type Nuances

```cpp
// char signedness is implementation-defined!
char c = 200;
if (c < 0) {
    // True on platforms where char is signed
    // (200 interpreted as -56 in two's complement)
}

// Three distinct types (despite same size)
char a;
signed char b;
unsigned char c;
// These are three different types for overloading

// Character literals
char c1 = 'A';           // char
wchar_t c2 = L'A';       // wchar_t
char16_t c3 = u'A';      // char16_t (C++11)
char32_t c4 = U'A';      // char32_t (C++11)
char8_t c5 = u8'A';      // char8_t (C++20)
```

### String Literals and Character Encodings

```cpp
// Different string literal types
const char* s1 = "hello";           // Narrow string (char[])
const wchar_t* s2 = L"hello";       // Wide string (wchar_t[])
const char16_t* s3 = u"hello";      // UTF-16 string (char16_t[])
const char32_t* s4 = U"hello";      // UTF-32 string (char32_t[])
const char8_t* s5 = u8"hello";      // UTF-8 string (char8_t[], C++20)

// Raw string literals (C++11)
const char* raw = R"(Line 1
Line 2
Contains "quotes" and \backslashes\)";

// Custom delimiter for nested parentheses
const char* custom = R"delim(Contains )( without ending)delim";
```

---

## Type Promotion and Conversion Rules

### Integer Promotion

Small integer types are promoted to `int` (or `unsigned int`) before operations:

```cpp
char a = 10;
char b = 20;
auto result = a + b;  // result is int, not char!

// Promotion rules:
// 1. Types smaller than int (char, short, bool) -> int
// 2. If int can't represent all values -> unsigned int

unsigned short us = 65535;
auto promoted = +us;  // Unary + forces promotion to int
```

### Usual Arithmetic Conversions

When operands have different types, they're converted to a common type:

```cpp
// Simplified rules (in order of precedence):
// 1. long double > double > float
// 2. If both integral after float promotion:
//    - If same signedness: use larger type
//    - If unsigned rank >= signed rank: use unsigned
//    - If signed can represent all unsigned values: use signed
//    - Otherwise: use unsigned version of signed type

int i = -1;
unsigned int u = 1;
auto result = i + u;  // Both converted to unsigned int!
                       // Result is UINT_MAX (not 0!)

long l = -1;
unsigned int u2 = 1;
auto result2 = l + u2;  // Both converted to long (on 64-bit Linux)
                         // Because long can represent all unsigned int values
```

### Implicit Conversions (Dangerous!)

```cpp
// Narrowing conversions (may lose data)
int large = 1000000;
short small = large;     // Implementation-defined if value doesn't fit
char tiny = large;       // Likely truncation

double pi = 3.14159;
int truncated = pi;      // 3 (fractional part lost)

// Sign conversion
int negative = -1;
unsigned int u = negative;  // UINT_MAX (wraps around)

// C++11 brace initialization prevents narrowing
int x{3.14};              // ERROR: narrowing conversion
char c{1000};             // ERROR: narrowing conversion (if char is 8 bits)
```

### Explicit Conversions (Casts)

```cpp
// C-style cast (avoid in C++)
int i = (int)3.14;
void* vp = (void*)0x1234;

// C++ named casts
double d = 3.14;
int i1 = static_cast<int>(d);           // Numeric conversion
int* ip = reinterpret_cast<int*>(vp);   // Bit reinterpretation
const int ci = 10;
int* mip = const_cast<int*>(&ci);       // Remove const (dangerous!)

class Base { virtual ~Base() {} };
class Derived : public Base {};
Base* bp = new Derived();
Derived* dp = dynamic_cast<Derived*>(bp);  // Runtime-checked downcast
```

---

## Literals and Suffixes

### Integer Literal Suffixes

```cpp
auto a = 42;       // int
auto b = 42U;      // unsigned int
auto c = 42L;      // long
auto d = 42UL;     // unsigned long
auto e = 42LL;     // long long
auto f = 42ULL;    // unsigned long long

// C++23 size_t literal suffix
auto g = 42Z;      // signed version of size_t (C++23)
auto h = 42UZ;     // size_t (C++23)

// Case doesn't matter
auto same = 42ul;  // Same as 42UL
```

### Integer Literal Bases

```cpp
auto decimal = 42;       // Base 10
auto octal = 052;        // Base 8 (leading zero!)
auto hex = 0x2A;         // Base 16
auto binary = 0b101010;  // Base 2 (C++14)

// Digit separators (C++14)
auto big = 1'000'000'000;       // One billion
auto bytes = 0xFF'FF'FF'FF;     // Easier to read hex
auto bits = 0b1111'0000'1010;   // Binary groups
```

### Floating-Point Literal Suffixes

```cpp
auto a = 3.14;     // double (default)
auto b = 3.14F;    // float
auto c = 3.14L;    // long double

// Scientific notation
auto sci = 6.022e23;   // double
auto sci_f = 6.022e23F; // float

// Hexadecimal floating-point (C++17)
auto hex_float = 0x1.Fp+10;  // 1.9375 * 2^10 = 1984.0
```

### Character and String Literal Prefixes

```cpp
// Character literals
auto c1 = 'A';      // char
auto c2 = L'A';     // wchar_t
auto c3 = u'A';     // char16_t
auto c4 = U'A';     // char32_t
auto c5 = u8'A';    // char8_t (C++20)

// String literals
auto s1 = "hello";      // const char[6]
auto s2 = L"hello";     // const wchar_t[6]
auto s3 = u"hello";     // const char16_t[6]
auto s4 = U"hello";     // const char32_t[6]
auto s5 = u8"hello";    // const char8_t[6] (C++20)
auto s6 = R"(raw)";     // Raw string literal

// C++14 string literal suffix
using namespace std::string_literals;
auto str = "hello"s;    // std::string (not const char*)
```

### User-Defined Literals (C++11)

```cpp
// Standard library examples
using namespace std::chrono_literals;
auto duration = 500ms;   // std::chrono::milliseconds
auto hours = 2h;         // std::chrono::hours

using namespace std::complex_literals;
auto c = 3.0 + 4.0i;     // std::complex<double>

// Custom user-defined literal
constexpr long double operator""_deg(long double deg) {
    return deg * 3.14159265358979323846L / 180.0L;
}

auto angle = 90.0_deg;   // Converts degrees to radians
```

---

## C++ String Types

### `std::string`

Dynamic, mutable string class (a `typedef` for `std::basic_string<char>`):

```cpp
#include <string>

std::string s1;                      // Empty string
std::string s2 = "hello";            // From C-string
std::string s3("hello", 3);          // "hel" (first 3 chars)
std::string s4(5, 'x');              // "xxxxx" (5 copies of 'x')
std::string s5 = s2 + " world";      // Concatenation
std::string s6 = s2.substr(1, 3);    // "ell" (pos 1, length 3)

// Access
char c = s2[0];          // 'h' (no bounds checking)
char c2 = s2.at(0);      // 'h' (throws if out of bounds)
const char* cstr = s2.c_str();  // Null-terminated C-string

// Modification
s2 += " world";          // Append
s2.append("!");          // Append
s2.insert(5, ",");       // Insert at position
s2.erase(5, 1);          // Erase 1 char at position 5
s2.replace(0, 5, "hi");  // Replace substring

// Properties
s2.size();      // Length (same as length())
s2.empty();     // Is empty?
s2.capacity();  // Current allocated capacity
s2.reserve(100); // Reserve capacity (may avoid reallocations)

// Small String Optimization (SSO)
// Short strings (typically < 16-24 chars) stored inline, no heap allocation
```

### `std::string_view` (C++17)

Non-owning view into a string (no allocation, cheap to copy):

```cpp
#include <string_view>

void process(std::string_view sv) {
    // sv does NOT own the data - just a pointer + length
    std::cout << sv << '\n';
    std::cout << sv.size() << '\n';
    std::cout << sv.substr(0, 5) << '\n';  // Returns another string_view
}

std::string owned = "hello world";
const char* cstr = "hello world";

process(owned);       // No copy, views into string
process(cstr);        // No copy, views into C-string
process("literal");   // Views into string literal
process(owned.substr(0, 5));  // Views into temporary - DANGEROUS after call!

// Danger: lifetime issues
std::string_view dangerous() {
    std::string local = "hello";
    return local;  // DANGLING REFERENCE - local destroyed!
}

// Safe usage patterns
std::string_view safe_substr(std::string_view sv) {
    return sv.substr(0, 5);  // OK if caller's data outlives return value
}
```

### Other String Types

```cpp
// Wide string
std::wstring ws = L"wide string";

// Unicode strings (C++11)
std::u16string u16 = u"UTF-16 string";
std::u32string u32 = U"UTF-32 string";

// UTF-8 string (C++20)
std::u8string u8s = u8"UTF-8 string";

// Corresponding string_view types (C++17/C++20)
std::wstring_view wsv;
std::u16string_view u16sv;
std::u32string_view u32sv;
std::u8string_view u8sv;  // C++20
```

---

## Arrays

### C-Style Arrays

```cpp
// Stack-allocated, fixed size known at compile time
int arr[5];                    // Uninitialized (garbage values)
int arr2[5] = {1, 2, 3, 4, 5}; // Fully initialized
int arr3[5] = {1, 2};          // Partial: {1, 2, 0, 0, 0}
int arr4[5] = {};              // Zero-initialized: {0, 0, 0, 0, 0}
int arr5[] = {1, 2, 3};        // Size deduced: arr5[3]

// Multi-dimensional
int matrix[3][4];              // 3 rows, 4 columns
int matrix2[2][3] = {
    {1, 2, 3},
    {4, 5, 6}
};

// Array decay to pointer
void func(int* p, size_t len);  // Array becomes pointer
func(arr, 5);                    // arr decays to &arr[0]

// Size information lost after decay!
sizeof(arr);      // 20 (5 * sizeof(int))
sizeof(arr + 0);  // 8 (size of pointer on 64-bit)

// Prevent decay with reference
template<size_t N>
void func_ref(int (&arr)[N]) {
    // N is deduced, size preserved
}

// Variable-length arrays (C99, optional in C11, not in standard C++)
void c99_vla(int n) {
    int vla[n];  // OK in C99, not standard C++
}
```

### `std::array` (C++11)

Fixed-size array with value semantics:

```cpp
#include <array>

std::array<int, 5> arr = {1, 2, 3, 4, 5};

// Access
arr[0];           // No bounds checking
arr.at(0);        // Throws std::out_of_range if invalid
arr.front();      // First element
arr.back();       // Last element
arr.data();       // Pointer to underlying array

// Properties
arr.size();       // 5 (constexpr)
arr.empty();      // false
arr.max_size();   // 5 (same as size for array)

// Iteration
for (int x : arr) { /* ... */ }
for (auto it = arr.begin(); it != arr.end(); ++it) { /* ... */ }

// Comparison (element-wise)
std::array<int, 3> a1 = {1, 2, 3};
std::array<int, 3> a2 = {1, 2, 3};
a1 == a2;  // true

// Can be passed by value (copies entire array)
void func(std::array<int, 5> arr);  // Passed by value

// Advantages over C-arrays:
// - Doesn't decay to pointer
// - Knows its own size
// - Can be returned from functions
// - Can be assigned (copies elements)
// - Works with standard algorithms
```

---

## Standard Library Containers

### `std::vector`

Dynamic array with automatic memory management:

```cpp
#include <vector>

std::vector<int> v1;                    // Empty
std::vector<int> v2(5);                 // 5 elements, value-initialized (0)
std::vector<int> v3(5, 42);             // 5 elements, all 42
std::vector<int> v4 = {1, 2, 3, 4, 5};  // Initializer list
std::vector<int> v5(v4);                // Copy
std::vector<int> v6(v4.begin(), v4.end());  // From iterators

// Access
v4[0];              // No bounds check
v4.at(0);           // Throws if out of bounds
v4.front();         // First element
v4.back();          // Last element
v4.data();          // Pointer to contiguous data

// Modification
v1.push_back(1);    // Add to end
v1.emplace_back(2); // Construct in place (more efficient)
v1.pop_back();      // Remove last
v1.insert(v1.begin(), 0);  // Insert at position
v1.erase(v1.begin());      // Erase at position
v1.clear();         // Remove all elements

// Capacity
v4.size();          // Number of elements
v4.capacity();      // Allocated capacity
v4.reserve(100);    // Reserve capacity (avoids reallocations)
v4.shrink_to_fit(); // Release excess capacity
v4.resize(10);      // Change size (adds/removes elements)

// Iterator invalidation: be careful!
for (auto it = v4.begin(); it != v4.end(); ) {
    if (*it == 3) {
        it = v4.erase(it);  // erase returns next valid iterator
    } else {
        ++it;
    }
}
```

### `std::map` and `std::unordered_map`

Associative containers for key-value pairs:

```cpp
#include <map>
#include <unordered_map>

// std::map - ordered by key (red-black tree)
std::map<std::string, int> ages;
ages["Alice"] = 30;
ages["Bob"] = 25;
ages.insert({"Charlie", 35});
ages.emplace("David", 40);

// Access
ages["Alice"];           // 30 (creates entry if not found!)
ages.at("Alice");        // 30 (throws if not found)
ages.find("Alice");      // Iterator to element (or end() if not found)
ages.count("Alice");     // 1 or 0
ages.contains("Alice");  // true (C++20)

// Iteration (ordered by key)
for (const auto& [name, age] : ages) {
    std::cout << name << ": " << age << '\n';
}

// std::unordered_map - hash table (faster average case)
std::unordered_map<std::string, int> fast_ages;
// Same interface, unordered iteration

// Complexity:
// map:           O(log n) for most operations
// unordered_map: O(1) average, O(n) worst case
```

### `std::set` and `std::unordered_set`

Unique element collections:

```cpp
#include <set>
#include <unordered_set>

std::set<int> s = {3, 1, 4, 1, 5, 9};  // {1, 3, 4, 5, 9} - duplicates removed, sorted

s.insert(2);       // Add element
s.erase(4);        // Remove element
s.find(3);         // Iterator to element
s.count(3);        // 1 or 0
s.contains(3);     // true (C++20)

// std::unordered_set - hash-based, faster but unordered
std::unordered_set<int> us = {3, 1, 4, 1, 5, 9};
```

### Other Containers

```cpp
// std::list - doubly-linked list
std::list<int> lst = {1, 2, 3};
lst.push_front(0);   // O(1)
lst.push_back(4);    // O(1)

// std::deque - double-ended queue
std::deque<int> dq = {1, 2, 3};
dq.push_front(0);    // O(1)
dq.push_back(4);     // O(1)
dq[2];               // O(1) random access

// std::stack, std::queue, std::priority_queue - container adapters
std::stack<int> stk;
stk.push(1);
stk.top();   // Peek
stk.pop();   // Remove

std::queue<int> q;
q.push(1);
q.front();   // Peek front
q.back();    // Peek back
q.pop();     // Remove front

std::priority_queue<int> pq;  // Max-heap by default
pq.push(3);
pq.push(1);
pq.push(4);
pq.top();    // 4 (maximum)
pq.pop();    // Remove 4
```

---

## nullptr vs NULL

### The Problem with NULL

```cpp
// NULL is typically defined as:
#define NULL 0      // or
#define NULL ((void*)0)  // C only

void func(int x);
void func(int* p);

func(NULL);  // Ambiguous! Calls func(int) with 0, not func(int*)
func(0);     // Same problem

// In templates:
template<typename T>
void forward(T arg) {
    other_func(arg);  // NULL becomes int 0, loses pointer semantics
}
```

### nullptr (C++11)

```cpp
// nullptr has type std::nullptr_t
// - Implicitly converts to any pointer type
// - Does NOT convert to integral types

void func(int x);
void func(int* p);

func(nullptr);  // Unambiguous: calls func(int*)

// Type-safe
int i = nullptr;     // ERROR: cannot convert to int
int* p = nullptr;    // OK
bool b = nullptr;    // OK: false (special case for conditionals)

// Works correctly in templates
template<typename T>
void forward(T arg) {
    // nullptr keeps its type: std::nullptr_t
}

// Comparisons
int* p = nullptr;
if (p == nullptr) { }  // OK
if (p == NULL) { }     // OK but deprecated style
if (!p) { }            // OK, idiomatic
if (p == 0) { }        // OK but deprecated style
```

### Best Practices

```cpp
// Always use nullptr in C++11 and later
int* p = nullptr;           // Good
int* q = NULL;              // Avoid
int* r = 0;                 // Avoid

// For C code, NULL is still appropriate
int* p = NULL;  // C style

// Checking for null
if (p != nullptr) { }  // Explicit
if (p) { }             // Idiomatic, preferred by many
```

---

## Auto Type Deduction

### Basic `auto` (C++11)

```cpp
auto x = 42;              // int
auto y = 42.0;            // double
auto z = "hello";         // const char*
auto w = std::string("hello");  // std::string

// With initializer list (special rules)
auto a = {1, 2, 3};       // std::initializer_list<int>
auto b{1};                // int in C++17 (was initializer_list in C++11/14)
auto c = {1};             // std::initializer_list<int>

// Deduction drops references and top-level const
const int& ref = x;
auto copy = ref;          // int (not const int&)
auto& keep_ref = ref;     // const int& (reference preserved)
const auto& explicit_ref = x;  // const int&

// Deduction keeps pointers and pointed-to const
const int* ptr = &x;
auto ptr_copy = ptr;      // const int* (low-level const preserved)
```

### `decltype` (C++11)

```cpp
int x = 42;
decltype(x) y = x;        // int (same type as x)

const int& ref = x;
decltype(ref) z = x;      // const int& (preserves reference and const!)

// decltype with expressions
decltype(x + 1.0) d;      // double (type of expression result)
decltype((x)) r = x;      // int& (parenthesized variable = lvalue reference)

// Common use: return type deduction
template<typename T, typename U>
auto add(T t, U u) -> decltype(t + u) {
    return t + u;
}
```

### `auto` Return Type (C++14)

```cpp
// C++14: auto return type deduction
auto multiply(int a, int b) {
    return a * b;  // Return type deduced from return statement
}

// Multiple return statements must deduce to same type
auto func(bool flag) {
    if (flag) return 1;    // int
    else return 2;         // int - OK, same type
    // return 3.0;         // ERROR if uncommented: inconsistent types
}

// decltype(auto) preserves references and cv-qualifiers
decltype(auto) get_ref() {
    static int x = 42;
    return (x);  // Returns int& (parenthesized = lvalue)
}

auto get_copy() {
    static int x = 42;
    return (x);  // Returns int (auto drops reference)
}
```

### Structured Bindings (C++17)

```cpp
// Decompose aggregate types
std::pair<int, std::string> get_pair() {
    return {42, "hello"};
}

auto [num, str] = get_pair();  // num = 42, str = "hello"

// With arrays
int arr[3] = {1, 2, 3};
auto [a, b, c] = arr;  // a=1, b=2, c=3

// With structs
struct Point { int x, y; };
Point p{10, 20};
auto [x, y] = p;  // x=10, y=20

// With maps
std::map<std::string, int> ages = {{"Alice", 30}, {"Bob", 25}};
for (const auto& [name, age] : ages) {
    std::cout << name << ": " << age << '\n';
}

// References and const
auto& [rx, ry] = p;  // rx and ry are references
const auto& [cx, cy] = p;  // const references
```

### Concepts and `auto` (C++20)

```cpp
#include <concepts>

// Constrained auto
std::integral auto x = 42;         // OK: int is integral
// std::integral auto y = 3.14;    // ERROR: double is not integral

// In function parameters (abbreviated template)
void print(const std::ranges::range auto& r) {
    for (const auto& elem : r) {
        std::cout << elem << ' ';
    }
}

// Equivalent to:
template<std::ranges::range R>
void print(const R& r) { /* ... */ }
```

---

## Comparison with JavaScript

### Type Philosophy

| Aspect | C/C++ | JavaScript |
|--------|-------|------------|
| **Type System** | Static, compile-time | Dynamic, runtime |
| **Memory Model** | Explicit sizes, manual or RAII management | Abstract, garbage collected |
| **Type Safety** | Strong (mostly), undefined behavior possible | Weak, coercions everywhere |
| **Number Types** | Multiple integer and float types | Single `Number` (IEEE 754 double) + BigInt |
| **String Type** | Multiple (`char*`, `std::string`, etc.) | Single `String` (UTF-16) |

### Numeric Types

```javascript
// JavaScript: One number type (double-precision float)
let x = 42;        // Number (actually 42.0)
let y = 42.5;      // Number
let big = 2**53;   // Number (loses precision beyond this)
let bigint = 42n;  // BigInt (arbitrary precision integer)

// No integer overflow - becomes Infinity
let huge = Number.MAX_VALUE * 2;  // Infinity

// Bitwise ops convert to 32-bit signed int
let bits = 0xFFFFFFFF | 0;  // -1 (not 4294967295)
```

```cpp
// C++: Many numeric types with explicit sizes
int32_t x = 42;           // Exactly 32-bit signed integer
double y = 42.5;          // 64-bit float
int64_t big = 9223372036854775807LL;  // 64-bit signed integer
uint64_t huge = 18446744073709551615ULL;  // 64-bit unsigned

// Overflow is well-defined (unsigned) or UB (signed)
uint32_t overflow = UINT32_MAX + 1;  // 0 (wraps)
```

### String Handling

```javascript
// JavaScript: Immutable, UTF-16 strings
let s = "hello";
s[0] = "H";  // Silent failure, strings are immutable
let s2 = s.toUpperCase();  // New string

// Concatenation is easy but potentially expensive
let result = "";
for (let i = 0; i < 1000; i++) {
    result += "x";  // May create many intermediate strings
}
```

```cpp
// C++: Multiple string types, mutable
std::string s = "hello";
s[0] = 'H';  // Direct mutation, s is now "Hello"

// Efficient concatenation with reserve
std::string result;
result.reserve(1000);
for (int i = 0; i < 1000; i++) {
    result += 'x';  // Single allocation
}

// C-style strings: error-prone manual management
char* cstr = new char[6];
strcpy(cstr, "hello");
// Must remember to delete[] cstr;
```

### Type Coercion vs. Explicit Conversion

```javascript
// JavaScript: Implicit coercion everywhere
"5" + 3;      // "53" (string concatenation)
"5" - 3;      // 2 (numeric subtraction)
"5" * "3";    // 15 (both coerced to numbers)
[] + {};      // "[object Object]"
{} + [];      // 0 (parsed as block + array)

// Loose equality enables coercion
"5" == 5;     // true
0 == "";      // true
null == undefined;  // true
```

```cpp
// C++: Mostly explicit, with some implicit conversions
std::string s = "5";
// s + 3;     // ERROR: no matching operator
s + std::to_string(3);  // "53"
std::stoi(s) + 3;       // 8

// Implicit conversions exist but are more predictable
int i = 3.14;     // 3 (truncation, may warn)
double d = 5;     // 5.0 (safe widening)
bool b = 42;      // true (non-zero)

// Brace initialization prevents narrowing
int x{3.14};      // ERROR: narrowing conversion
```

### Truthiness

```javascript
// JavaScript: Complex truthiness rules
if (0) { }          // false
if ("") { }         // false
if (null) { }       // false
if (undefined) { }  // false
if (NaN) { }        // false
if ([]) { }         // TRUE (empty array is truthy!)
if ({}) { }         // TRUE (empty object is truthy!)
if ("0") { }        // TRUE (non-empty string)
```

```cpp
// C++: Simpler rules
if (0) { }          // false
if (0.0) { }        // false
if (nullptr) { }    // false
if ("") { }         // TRUE (pointer to empty string is non-null!)

// Containers don't implicitly convert to bool
std::vector<int> v;
// if (v) { }       // ERROR: no conversion to bool
if (!v.empty()) { } // Explicit check
```

### Memory and Ownership

```javascript
// JavaScript: No memory management
let obj = {x: 1, y: 2};
let ref = obj;  // Both point to same object
obj = null;     // ref still works, GC handles cleanup
// No control over when memory is freed
```

```cpp
// C++: Explicit ownership and lifetime
// Raw ownership (dangerous)
int* raw = new int(42);
delete raw;  // Must manually free

// Smart pointers (modern C++)
auto unique = std::make_unique<int>(42);  // Unique ownership
// unique automatically deleted when out of scope

auto shared = std::make_shared<int>(42);  // Reference counted
auto copy = shared;  // Both own the object
// Deleted when last shared_ptr destroyed

// Stack allocation (preferred when possible)
int stack_var = 42;  // Automatically cleaned up at scope exit
```

### Arrays and Collections

```javascript
// JavaScript: Dynamic, heterogeneous arrays
let arr = [1, "two", {three: 3}, [4]];  // Mixed types
arr.push(5);      // Dynamic growth
arr.length = 2;   // Truncate
arr[100] = "x";   // Sparse array, length becomes 101
```

```cpp
// C++: Homogeneous, type-safe containers
std::vector<int> vec = {1, 2, 3};  // Only ints
vec.push_back(4);                   // Dynamic growth
// vec.push_back("five");           // ERROR: type mismatch

// For heterogeneous data, must use variant or any
std::vector<std::variant<int, std::string>> mixed;
mixed.push_back(1);
mixed.push_back("two");

// No sparse arrays - vectors are contiguous
// vec[100] = 5;  // UNDEFINED BEHAVIOR if size < 101
```

### What "Primitive" Means

**JavaScript primitives** (string, number, boolean, null, undefined, symbol, bigint):
- Immutable values
- Passed by value (not reference)
- Have wrapper objects for methods (autoboxing)
- Abstract representation (no defined memory layout)

**C/C++ fundamental types**:
- Defined memory size and layout
- Direct hardware correspondence
- No autoboxing (primitives are not objects)
- Can observe exact bit representation
- Programmer controls memory placement and lifetime

```cpp
// C++: Can inspect exact memory representation
int32_t x = 0x12345678;
uint8_t* bytes = reinterpret_cast<uint8_t*>(&x);
// bytes[0..3] contain the actual bytes (order depends on endianness)

// Can control memory layout
struct __attribute__((packed)) Packet {
    uint8_t type;
    uint32_t data;  // No padding before this
};

// Can place objects at specific addresses
void* memory = malloc(sizeof(int));
int* p = new (memory) int(42);  // Placement new
```

This low-level control is what makes C/C++ suitable for systems programming, embedded development, and performance-critical applications - contexts where JavaScript's abstractions would be too costly.

---

## Summary

C and C++ provide a rich set of primitive and fundamental types that offer:

1. **Explicit control** over memory size and layout
2. **Platform-appropriate** sizing with portable alternatives (`<cstdint>`)
3. **Predictable behavior** (with care around undefined behavior)
4. **Direct hardware mapping** for performance-critical code
5. **Building blocks** for higher-level abstractions (containers, smart pointers)

Understanding these low-level primitives is essential for:
- Writing efficient, portable code
- Interfacing with hardware and operating systems
- Understanding how higher-level languages implement their abstractions
- Debugging memory and performance issues

The contrast with JavaScript highlights how languages at different abstraction levels make different trade-offs between programmer convenience and low-level control.
