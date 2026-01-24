# Go Primitive Types - Comprehensive Reference

This document provides a thorough technical reference for Go's primitive types, composite types, and how they compare to JavaScript's type system.

## Table of Contents

1. [Numeric Types](#numeric-types)
   - [Signed Integers](#signed-integers)
   - [Unsigned Integers](#unsigned-integers)
   - [Floating-Point Numbers](#floating-point-numbers)
   - [Complex Numbers](#complex-numbers)
2. [Boolean Type](#boolean-type)
3. [String Type](#string-type)
4. [Type Aliases: byte and rune](#type-aliases-byte-and-rune)
5. [Composite Types](#composite-types)
   - [Arrays](#arrays)
   - [Slices](#slices)
   - [Maps](#maps)
6. [Pointers](#pointers)
7. [The interface{} / any Type](#the-interface--any-type)
8. [Type Conversion Rules](#type-conversion-rules)
9. [Comparison with JavaScript](#comparison-with-javascript)

---

## Numeric Types

Go provides a rich set of numeric types with explicit sizes, unlike JavaScript's single `number` type.

### Signed Integers

| Type    | Size (bits) | Size (bytes) | Range |
|---------|-------------|--------------|-------|
| `int8`  | 8           | 1            | -128 to 127 |
| `int16` | 16          | 2            | -32,768 to 32,767 |
| `int32` | 32          | 4            | -2,147,483,648 to 2,147,483,647 |
| `int64` | 64          | 8            | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| `int`   | Platform-dependent | 4 or 8 | Same as `int32` or `int64` |

**Zero Value:** `0`

```go
var a int8   // 0
var b int16  // 0
var c int32  // 0
var d int64  // 0
var e int    // 0 (platform-dependent size)
```

**Common Operations:**

```go
// Arithmetic
sum := 10 + 5      // 15
diff := 10 - 5     // 5
prod := 10 * 5     // 50
quot := 10 / 3     // 3 (integer division, truncates)
rem := 10 % 3      // 1 (modulo/remainder)

// Bitwise operations
and := 12 & 10     // 8  (1100 & 1010 = 1000)
or := 12 | 10      // 14 (1100 | 1010 = 1110)
xor := 12 ^ 10     // 6  (1100 ^ 1010 = 0110)
not := ^12         // -13 (bitwise complement)
lshift := 3 << 2   // 12 (left shift)
rshift := 12 >> 2  // 3  (right shift)

// Comparison
eq := 5 == 5       // true
neq := 5 != 3      // true
lt := 3 < 5        // true
gt := 5 > 3        // true
lte := 3 <= 3      // true
gte := 5 >= 5      // true

// Increment/Decrement (statements, not expressions)
i := 0
i++                // i = 1
i--                // i = 0
```

**Overflow Behavior:**

```go
var x int8 = 127
x++  // x = -128 (wraps around silently)

var y int8 = -128
y--  // y = 127 (wraps around silently)
```

### Unsigned Integers

| Type     | Size (bits) | Size (bytes) | Range |
|----------|-------------|--------------|-------|
| `uint8`  | 8           | 1            | 0 to 255 |
| `uint16` | 16          | 2            | 0 to 65,535 |
| `uint32` | 32          | 4            | 0 to 4,294,967,295 |
| `uint64` | 64          | 8            | 0 to 18,446,744,073,709,551,615 |
| `uint`   | Platform-dependent | 4 or 8 | Same as `uint32` or `uint64` |
| `uintptr`| Platform-dependent | 4 or 8 | Large enough to hold pointer bits |

**Zero Value:** `0`

```go
var a uint8   // 0
var b uint16  // 0
var c uint32  // 0
var d uint64  // 0
var e uint    // 0
var f uintptr // 0
```

**Common Operations:**

```go
// Same arithmetic and bitwise operations as signed integers
// But subtraction can cause underflow:
var x uint8 = 0
x--  // x = 255 (wraps around)

// Useful for bit manipulation, file sizes, array indices
var fileSize uint64 = 1024 * 1024 * 1024  // 1 GB
var index uint = 42
```

### Floating-Point Numbers

| Type      | Size (bits) | Precision | Range (approximate) |
|-----------|-------------|-----------|---------------------|
| `float32` | 32          | ~7 decimal digits | ±1.18e-38 to ±3.4e38 |
| `float64` | 64          | ~15 decimal digits | ±2.23e-308 to ±1.8e308 |

**Zero Value:** `0.0`

```go
var a float32  // 0
var b float64  // 0
```

**Special Values:**

```go
import "math"

posInf := math.Inf(1)   // +Inf
negInf := math.Inf(-1)  // -Inf
nan := math.NaN()       // NaN (Not a Number)

// Checking special values
math.IsInf(posInf, 1)   // true
math.IsInf(negInf, -1)  // true
math.IsNaN(nan)         // true

// NaN comparisons
nan == nan              // false (NaN is never equal to anything)
```

**Common Operations:**

```go
import "math"

// Arithmetic
sum := 3.14 + 2.71      // 5.85
diff := 3.14 - 2.71     // 0.43
prod := 3.14 * 2.0      // 6.28
quot := 10.0 / 3.0      // 3.3333... (true division)

// Math functions
sqrt := math.Sqrt(16.0)        // 4.0
pow := math.Pow(2.0, 10.0)     // 1024.0
sin := math.Sin(math.Pi / 2)   // 1.0
cos := math.Cos(0)             // 1.0
log := math.Log(math.E)        // 1.0
log10 := math.Log10(100.0)     // 2.0
abs := math.Abs(-5.5)          // 5.5
ceil := math.Ceil(3.2)         // 4.0
floor := math.Floor(3.8)       // 3.0
round := math.Round(3.5)       // 4.0
```

**Precision Considerations:**

```go
// Floating-point precision issues (same as JavaScript)
a := 0.1 + 0.2
fmt.Println(a == 0.3)          // false
fmt.Printf("%.17f\n", a)       // 0.30000000000000004

// Use tolerance for comparisons
const epsilon = 1e-9
func almostEqual(a, b float64) bool {
    return math.Abs(a-b) < epsilon
}
```

### Complex Numbers

| Type        | Size (bits) | Components |
|-------------|-------------|------------|
| `complex64` | 64          | Two `float32` values (real + imaginary) |
| `complex128`| 128         | Two `float64` values (real + imaginary) |

**Zero Value:** `(0+0i)`

```go
var a complex64   // (0+0i)
var b complex128  // (0+0i)
```

**Creation and Operations:**

```go
// Literal syntax
c1 := 3 + 4i              // complex128 by default
c2 := complex(3.0, 4.0)   // complex128
c3 := complex(float32(3), float32(4))  // complex64

// Extracting parts
r := real(c1)             // 3.0 (float64)
i := imag(c1)             // 4.0 (float64)

// Arithmetic
sum := (1 + 2i) + (3 + 4i)    // (4+6i)
diff := (3 + 4i) - (1 + 2i)   // (2+2i)
prod := (1 + 2i) * (3 + 4i)   // (-5+10i)
quot := (3 + 4i) / (1 + 2i)   // (2.2-0.4i)

// Math operations
import "math/cmplx"

abs := cmplx.Abs(3 + 4i)      // 5.0 (magnitude)
phase := cmplx.Phase(1 + 1i)  // 0.7853... (radians, pi/4)
conj := cmplx.Conj(3 + 4i)    // (3-4i) (conjugate)
sqrt := cmplx.Sqrt(-1 + 0i)   // (0+1i)
```

---

## Boolean Type

| Type   | Size (bits) | Values |
|--------|-------------|--------|
| `bool` | 8*          | `true`, `false` |

*Size is implementation-dependent but typically 1 byte for alignment.

**Zero Value:** `false`

```go
var b bool  // false
```

**Operations:**

```go
// Logical operators
and := true && false   // false
or := true || false    // true
not := !true           // false

// Short-circuit evaluation
func expensive() bool {
    fmt.Println("called")
    return true
}

false && expensive()   // "called" is NOT printed
true || expensive()    // "called" is NOT printed

// Comparison results are booleans
eq := 5 == 5           // true
lt := 3 < 5            // true
```

**No Truthy/Falsy Values:**

```go
// Go has NO implicit boolean conversion
// These are all compile errors:

if 1 { }               // Error: non-bool 1 used as if condition
if "hello" { }         // Error: non-bool "hello" used as if condition
if nil { }             // Error: non-bool nil used as if condition

// Must be explicit:
if x != 0 { }          // Correct
if s != "" { }         // Correct
if ptr != nil { }      // Correct
```

---

## String Type

Strings in Go are immutable sequences of bytes, typically (but not necessarily) representing UTF-8 encoded text.

| Type     | Zero Value | Immutable |
|----------|------------|-----------|
| `string` | `""`       | Yes       |

**Zero Value:** `""` (empty string)

```go
var s string  // ""
```

**String Literals:**

```go
// Interpreted string literals (escape sequences processed)
s1 := "Hello, World!\n"
s2 := "Tab:\tNewline:\n"
s3 := "Unicode: \u4e16\u754c"  // "Unicode: 世界"
s4 := "Backslash: \\"

// Raw string literals (no escape processing)
s5 := `Line 1
Line 2
Line 3`

s6 := `C:\Users\name\file.txt`  // No escaping needed
s7 := `"quoted" text`
```

**String Internals (UTF-8):**

```go
s := "Hello, 世界"

// Length in bytes (NOT characters)
len(s)                    // 13 (7 ASCII + 6 UTF-8 bytes for 2 Chinese chars)

// Length in runes (characters)
import "unicode/utf8"
utf8.RuneCountInString(s) // 9

// Indexing returns bytes
s[0]                      // 72 (byte value of 'H')
s[7]                      // 228 (first byte of '世', not the character)

// Iterating over runes (characters)
for i, r := range s {
    fmt.Printf("%d: %c (U+%04X)\n", i, r, r)
}
// Output:
// 0: H (U+0048)
// 1: e (U+0065)
// ...
// 7: 世 (U+4E16)
// 10: 界 (U+754C)
```

**Common Operations:**

```go
import (
    "strings"
    "strconv"
)

s := "Hello, World!"

// Concatenation
s1 := "Hello" + ", " + "World"   // "Hello, World"
s2 := strings.Join([]string{"a", "b", "c"}, "-")  // "a-b-c"

// Substrings (byte-based slicing)
sub := s[0:5]                    // "Hello"
sub2 := s[7:]                    // "World!"
sub3 := s[:5]                    // "Hello"

// Searching
idx := strings.Index(s, "World")        // 7
contains := strings.Contains(s, "World") // true
hasPrefix := strings.HasPrefix(s, "Hello") // true
hasSuffix := strings.HasSuffix(s, "!")  // true

// Case conversion
upper := strings.ToUpper(s)      // "HELLO, WORLD!"
lower := strings.ToLower(s)      // "hello, world!"
title := strings.Title(s)        // Deprecated; use cases.Title

// Trimming
trimmed := strings.TrimSpace("  hello  ")    // "hello"
trimLeft := strings.TrimLeft("!!!hello", "!") // "hello"
trimRight := strings.TrimRight("hello!!!", "!") // "hello"

// Splitting
parts := strings.Split("a,b,c", ",")  // []string{"a", "b", "c"}
fields := strings.Fields("a b  c")     // []string{"a", "b", "c"}

// Replacing
replaced := strings.Replace(s, "World", "Go", 1)  // "Hello, Go!"
replaceAll := strings.ReplaceAll(s, "l", "L")     // "HeLLo, WorLd!"

// String <-> Number conversions
intVal, err := strconv.Atoi("42")        // 42, nil
strVal := strconv.Itoa(42)               // "42"
floatVal, err := strconv.ParseFloat("3.14", 64)  // 3.14, nil
floatStr := strconv.FormatFloat(3.14, 'f', 2, 64) // "3.14"
boolVal, err := strconv.ParseBool("true")  // true, nil
```

**String Builder (Efficient Concatenation):**

```go
import "strings"

var builder strings.Builder
for i := 0; i < 1000; i++ {
    builder.WriteString("hello")
}
result := builder.String()
```

**Converting Between Strings and Byte Slices:**

```go
s := "hello"

// String to byte slice (copies data)
b := []byte(s)       // []byte{104, 101, 108, 108, 111}

// Byte slice to string (copies data)
s2 := string(b)      // "hello"

// String to rune slice
r := []rune("世界")   // []rune{19990, 30028}

// Rune slice to string
s3 := string(r)      // "世界"
```

---

## Type Aliases: byte and rune

### byte

`byte` is an alias for `uint8`. They are identical types.

```go
var b byte = 255    // Same as uint8
var u uint8 = 255   // Same as byte

// No conversion needed between byte and uint8
b = u               // OK
u = b               // OK

// Common use: raw binary data
data := []byte{0x48, 0x65, 0x6c, 0x6c, 0x6f}  // "Hello"
```

### rune

`rune` is an alias for `int32`. It represents a Unicode code point.

```go
var r rune = 'A'    // 65
var r2 rune = '世'  // 19990 (U+4E16)

// Character literals
r3 := 'a'           // rune (int32), value 97
r4 := '\n'          // rune, value 10
r5 := '\u4e16'      // rune, value 19990
r6 := '\U0001F600'  // rune, value 128512 (emoji)

// Rune operations
import "unicode"

unicode.IsLetter('a')    // true
unicode.IsDigit('5')     // true
unicode.IsSpace(' ')     // true
unicode.ToUpper('a')     // 'A'
unicode.ToLower('A')     // 'a'
```

---

## Composite Types

### Arrays

Arrays have a fixed size known at compile time. The size is part of the type.

```go
// Declaration and zero values
var arr1 [5]int                    // [0, 0, 0, 0, 0]
var arr2 [3]string                 // ["", "", ""]
var arr3 [2][3]int                 // [[0,0,0], [0,0,0]]

// Initialization
arr4 := [5]int{1, 2, 3, 4, 5}
arr5 := [...]int{1, 2, 3}          // Size inferred: [3]int
arr6 := [5]int{0: 1, 4: 5}         // Sparse: [1, 0, 0, 0, 5]

// Type identity - size is part of type
var a [3]int
var b [4]int
// a = b  // Compile error: cannot use [4]int as [3]int

// Operations
len(arr4)                          // 5 (compile-time constant)
arr4[0]                            // 1 (access by index)
arr4[0] = 10                       // Modify element

// Arrays are values (copied on assignment)
arr7 := [3]int{1, 2, 3}
arr8 := arr7                       // Full copy
arr8[0] = 100
fmt.Println(arr7[0])               // 1 (unchanged)

// Comparison (arrays of comparable types are comparable)
[3]int{1, 2, 3} == [3]int{1, 2, 3}  // true
[3]int{1, 2, 3} == [3]int{1, 2, 4}  // false

// Iteration
for i, v := range arr4 {
    fmt.Printf("Index %d: %d\n", i, v)
}
```

### Slices

Slices are dynamic, flexible views into arrays. They are the most commonly used sequence type.

```go
// Zero value
var s []int                        // nil slice, len=0, cap=0

// Creation
s1 := []int{1, 2, 3, 4, 5}        // Slice literal
s2 := make([]int, 5)               // len=5, cap=5, all zeros
s3 := make([]int, 3, 10)           // len=3, cap=10

// Length and capacity
len(s1)                            // 5 (number of elements)
cap(s1)                            // 5 (underlying array capacity)

// Slicing operations (creates view, not copy)
arr := [5]int{1, 2, 3, 4, 5}
slice := arr[1:4]                  // [2, 3, 4], len=3, cap=4
slice2 := arr[:3]                  // [1, 2, 3]
slice3 := arr[2:]                  // [3, 4, 5]
slice4 := arr[:]                   // [1, 2, 3, 4, 5]

// Full slice expression (controls capacity)
slice5 := arr[1:3:4]               // [2, 3], len=2, cap=3

// Modifying slice affects underlying array
slice[0] = 100
fmt.Println(arr[1])                // 100

// Appending
s4 := []int{1, 2, 3}
s4 = append(s4, 4)                 // [1, 2, 3, 4]
s4 = append(s4, 5, 6, 7)           // [1, 2, 3, 4, 5, 6, 7]
s5 := []int{8, 9}
s4 = append(s4, s5...)             // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Copying
src := []int{1, 2, 3}
dst := make([]int, len(src))
n := copy(dst, src)                // n=3, dst=[1, 2, 3]

// Nil vs empty slice
var nilSlice []int                 // nil
emptySlice := []int{}              // not nil, but len=0
emptySlice2 := make([]int, 0)      // not nil, but len=0

nilSlice == nil                    // true
emptySlice == nil                  // false
len(nilSlice)                      // 0 (safe to call)
len(emptySlice)                    // 0

// Slices are not comparable (except to nil)
// []int{1, 2} == []int{1, 2}      // Compile error

// Use slices.Equal from Go 1.21+
import "slices"
slices.Equal([]int{1, 2}, []int{1, 2})  // true

// Common patterns
// Delete element at index i
s := []int{1, 2, 3, 4, 5}
i := 2
s = append(s[:i], s[i+1:]...)      // [1, 2, 4, 5]

// Insert element at index i
s = []int{1, 2, 4, 5}
i = 2
s = append(s[:i], append([]int{3}, s[i:]...)...)  // [1, 2, 3, 4, 5]

// Alternatively (more efficient)
s = append(s[:i+1], s[i:]...)
s[i] = 3
```

**Slice Internals:**

```go
// A slice header contains:
// - Pointer to underlying array
// - Length (int)
// - Capacity (int)

// This is why slices are reference-like (but not references)
s1 := []int{1, 2, 3}
s2 := s1               // Copies header, shares underlying array
s2[0] = 100
fmt.Println(s1[0])     // 100

// But append may create new array
s1 = []int{1, 2, 3}
s2 = append(s1, 4)     // May or may not share array
```

### Maps

Maps are unordered key-value collections (hash tables).

```go
// Zero value
var m map[string]int               // nil map

// Creation
m1 := make(map[string]int)         // Empty map
m2 := map[string]int{              // Map literal
    "one":   1,
    "two":   2,
    "three": 3,
}

// Operations
m1["key"] = 42                     // Insert/update
value := m1["key"]                 // Access (returns zero value if missing)
delete(m1, "key")                  // Delete

// Check existence
value, exists := m2["one"]         // value=1, exists=true
value, exists = m2["four"]         // value=0, exists=false

// Length
len(m2)                            // 3

// Iteration (order is random)
for key, value := range m2 {
    fmt.Printf("%s: %d\n", key, value)
}

// Keys only
for key := range m2 {
    fmt.Println(key)
}

// Nil map behavior
var nilMap map[string]int
len(nilMap)                        // 0 (safe)
_ = nilMap["key"]                  // 0 (safe, returns zero value)
// nilMap["key"] = 1               // Panic! Cannot assign to nil map

// Maps are not comparable (except to nil)
// m1 == m2                        // Compile error

// Use maps.Equal from Go 1.21+
import "maps"
maps.Equal(map[string]int{"a": 1}, map[string]int{"a": 1})  // true

// Valid key types: any comparable type
// (booleans, numbers, strings, pointers, channels, arrays, structs with comparable fields)
// Invalid key types: slices, maps, functions

// Map of maps
nested := map[string]map[string]int{
    "outer": {
        "inner": 42,
    },
}

// Map with struct keys
type Point struct{ X, Y int }
pointMap := map[Point]string{
    {0, 0}: "origin",
    {1, 1}: "diagonal",
}
```

---

## Pointers

Pointers hold memory addresses of values.

```go
// Zero value
var p *int                         // nil

// Creating pointers
x := 42
p = &x                             // Address of x
fmt.Println(*p)                    // 42 (dereference)

*p = 100                           // Modify through pointer
fmt.Println(x)                     // 100

// new() allocates zeroed memory and returns pointer
p2 := new(int)                     // *int pointing to 0
*p2 = 42

// Pointer to struct
type Person struct {
    Name string
    Age  int
}

person := &Person{Name: "Alice", Age: 30}
// Automatic dereference for struct fields
person.Name = "Bob"                // Same as (*person).Name = "Bob"

// No pointer arithmetic in Go (unlike C)
// p++                             // Compile error

// Nil pointer dereference causes panic
var nilPtr *int
// *nilPtr = 42                    // Panic: runtime error

// Pointer comparison
p1 := new(int)
p2 := new(int)
p1 == p2                           // false (different addresses)
p1 == nil                          // false

// Pointers and functions
func double(x *int) {
    *x *= 2
}

value := 21
double(&value)
fmt.Println(value)                 // 42

// Common pattern: optional/nullable values
func find(items []string, target string) *string {
    for i := range items {
        if items[i] == target {
            return &items[i]
        }
    }
    return nil
}

result := find([]string{"a", "b", "c"}, "b")
if result != nil {
    fmt.Println(*result)           // "b"
}
```

---

## The interface{} / any Type

`interface{}` (empty interface) can hold values of any type. Go 1.18 introduced `any` as an alias.

```go
// any is an alias for interface{}
type any = interface{}

// Zero value
var a any                          // nil

// Can hold any value
a = 42
a = "hello"
a = []int{1, 2, 3}
a = struct{ X int }{X: 10}

// Type assertion
var i any = "hello"

s := i.(string)                    // "hello"
// n := i.(int)                    // Panic: interface conversion error

// Safe type assertion
s, ok := i.(string)                // s="hello", ok=true
n, ok := i.(int)                   // n=0, ok=false

// Type switch
func describe(i any) string {
    switch v := i.(type) {
    case nil:
        return "nil"
    case int:
        return fmt.Sprintf("int: %d", v)
    case string:
        return fmt.Sprintf("string: %q", v)
    case bool:
        return fmt.Sprintf("bool: %t", v)
    case []int:
        return fmt.Sprintf("[]int with %d elements", len(v))
    default:
        return fmt.Sprintf("unknown type: %T", v)
    }
}

describe(42)                       // "int: 42"
describe("hi")                     // "string: \"hi\""
describe([]int{1, 2})              // "[]int with 2 elements"

// Reflection for more complex inspection
import "reflect"

func typeInfo(i any) {
    t := reflect.TypeOf(i)
    v := reflect.ValueOf(i)
    fmt.Printf("Type: %v, Kind: %v, Value: %v\n", t, t.Kind(), v)
}

typeInfo(42)                       // Type: int, Kind: int, Value: 42
typeInfo([]int{1, 2})              // Type: []int, Kind: slice, Value: [1 2]

// Common uses of any
// 1. JSON unmarshaling
var data any
json.Unmarshal([]byte(`{"key": "value"}`), &data)

// 2. Generic containers (before Go 1.18 generics)
func PrintAll(items []any) {
    for _, item := range items {
        fmt.Println(item)
    }
}

// 3. Variadic functions
func Printf(format string, args ...any) {
    // ...
}
```

**interface{} vs Generics (Go 1.18+):**

```go
// Before generics: lose type safety
func SumOld(values []any) any {
    var sum float64
    for _, v := range values {
        switch n := v.(type) {
        case int:
            sum += float64(n)
        case float64:
            sum += n
        }
    }
    return sum
}

// With generics: type-safe
func Sum[T int | float64](values []T) T {
    var sum T
    for _, v := range values {
        sum += v
    }
    return sum
}

Sum([]int{1, 2, 3})           // 6 (int)
Sum([]float64{1.5, 2.5})      // 4.0 (float64)
```

---

## Type Conversion Rules

Go requires **explicit type conversions** between different types. There is no implicit type coercion.

### Syntax

```go
T(v)  // Convert value v to type T
```

### Numeric Conversions

```go
// Integer to integer
var i32 int32 = 100
var i64 int64 = int64(i32)     // Widening: safe
var i16 int16 = int16(i32)     // Narrowing: may truncate

// Integer overflow on conversion
var big int64 = 1000
var small int8 = int8(big)     // -24 (truncated, no error)

// Signed to unsigned (and vice versa)
var signed int32 = -1
var unsigned uint32 = uint32(signed)  // 4294967295

// Float to integer (truncates toward zero)
var f float64 = 3.9
var i int = int(f)             // 3 (not rounded)
f = -3.9
i = int(f)                     // -3

// Integer to float
i = 42
f = float64(i)                 // 42.0

// Float32 to float64
var f32 float32 = 3.14
var f64 float64 = float64(f32) // May have precision differences
```

### String Conversions

```go
// Integer to string (NOT the same as JavaScript)
i := 65
s := string(i)                 // "A" (Unicode code point, NOT "65")

// Use strconv for number-to-string
s = strconv.Itoa(65)           // "65"
s = fmt.Sprintf("%d", 65)      // "65"

// String to byte slice
s = "hello"
b := []byte(s)                 // []byte{104, 101, 108, 108, 111}

// Byte slice to string
s = string(b)                  // "hello"

// String to rune slice
s = "世界"
r := []rune(s)                 // []rune{19990, 30028}

// Rune slice to string
s = string(r)                  // "世界"

// Single rune/byte to string
char := 'A'
s = string(char)               // "A"

// Parsing strings to numbers
i, err := strconv.Atoi("42")            // 42
i64, err := strconv.ParseInt("42", 10, 64)  // 42
f, err := strconv.ParseFloat("3.14", 64)    // 3.14
b, err := strconv.ParseBool("true")         // true
```

### Pointer Conversions

```go
import "unsafe"

// Normally, pointers are not convertible
var ip *int
// var fp *float64 = ip          // Compile error

// Using unsafe (not recommended)
var x int = 42
ip = &x
up := unsafe.Pointer(ip)         // unsafe.Pointer
fp := (*float64)(up)             // Reinterpret bits

// uintptr conversions (for low-level operations)
addr := uintptr(up)              // Memory address as integer
```

### Interface Conversions

```go
// Implicit conversion to interface
var i any = 42                   // int -> any

// Type assertion (interface to concrete type)
n := i.(int)                     // Panics if wrong type
n, ok := i.(int)                 // Safe version

// Interface to interface
type Reader interface { Read([]byte) (int, error) }
type Writer interface { Write([]byte) (int, error) }
type ReadWriter interface { Reader; Writer }

var rw ReadWriter = os.Stdout
var r Reader = rw                // OK: ReadWriter implements Reader
// var rw2 ReadWriter = r        // Error: Reader might not implement Write
```

### Struct Conversions

```go
// Structs with identical underlying types can be converted
type Celsius float64
type Fahrenheit float64

c := Celsius(100)
f := Fahrenheit(c * 9/5 + 32)    // OK

// Named struct types
type Point1 struct{ X, Y int }
type Point2 struct{ X, Y int }

p1 := Point1{1, 2}
p2 := Point2(p1)                 // OK: identical underlying structure

// But not assignable without conversion
// p2 = p1                       // Compile error
```

---

## Comparison with JavaScript

### Type System Philosophy

| Aspect | Go | JavaScript |
|--------|----|-----------|
| Typing | Static, strong | Dynamic, weak |
| Type checking | Compile-time | Runtime |
| Type conversion | Explicit only | Implicit (coercion) |
| Type inference | Limited (`var x = 5`) | Full (`let x = 5`) |

### Numeric Types

```go
// Go: Multiple numeric types with explicit sizes
var i8 int8 = 127
var i64 int64 = 9223372036854775807
var f32 float32 = 3.14
var f64 float64 = 3.14159265358979
```

```javascript
// JavaScript: Single number type (64-bit float)
let num = 42;           // Number (float64)
let big = 9007199254740991;  // MAX_SAFE_INTEGER
let bigInt = 9007199254740993n;  // BigInt (arbitrary precision)
```

### Type Coercion vs Explicit Conversion

```javascript
// JavaScript: Implicit coercion
"5" + 3        // "53" (string concatenation)
"5" - 3        // 2 (numeric subtraction)
"5" * "2"      // 10 (numeric)
true + 1       // 2
[] + {}        // "[object Object]"
{} + []        // 0

// Loose equality
5 == "5"       // true
0 == false     // true
null == undefined  // true
```

```go
// Go: No implicit coercion - compile errors
// "5" + 3     // Error: mismatched types
// "5" - 3     // Error: invalid operation

// Must be explicit
strconv.Atoi("5") + 3  // First parse, then add: 8

// Only strict equality
5 == 5         // true
// 5 == "5"    // Compile error: mismatched types
```

### Truthy/Falsy Values

```javascript
// JavaScript: Many falsy values
if (0) { }           // false
if ("") { }          // false
if (null) { }        // false
if (undefined) { }   // false
if (NaN) { }         // false
if (false) { }       // false

// Everything else is truthy
if ("0") { }         // true
if ([]) { }          // true
if ({}) { }          // true
```

```go
// Go: Only bool values in conditions
if true { }          // OK
if false { }         // OK
// if 0 { }          // Compile error
// if "" { }         // Compile error
// if nil { }        // Compile error

// Must be explicit
if x != 0 { }
if s != "" { }
if ptr != nil { }
```

### Strings

```javascript
// JavaScript: UTF-16 internally
let s = "Hello, 世界";
s.length;            // 9 (UTF-16 code units, not bytes or characters)
s[7];                // "世" (returns string, not code unit)
s.charCodeAt(7);     // 19990 (UTF-16 code unit)
s.codePointAt(7);    // 19990 (full code point)

// Template literals
let name = "World";
let greeting = `Hello, ${name}!`;

// Strings are primitives but have methods
"hello".toUpperCase();  // "HELLO"
```

```go
// Go: UTF-8 internally
s := "Hello, 世界"
len(s)              // 13 (bytes, not characters)
s[7]                // 228 (byte, not character)

// No string interpolation, use fmt
name := "World"
greeting := fmt.Sprintf("Hello, %s!", name)

// Strings are values, methods via package
strings.ToUpper("hello")  // "HELLO"
```

### Null/Nil

```javascript
// JavaScript: null and undefined
let a;              // undefined
let b = null;       // null
let c = {};         // object
c.prop;             // undefined (missing property)

typeof null;        // "object" (famous bug)
typeof undefined;   // "undefined"
```

```go
// Go: Only nil, and only for certain types
var ptr *int        // nil
var slice []int     // nil
var m map[string]int // nil
var ch chan int     // nil
var fn func()       // nil
var iface any       // nil

var i int           // 0 (not nil)
var s string        // "" (not nil)
var b bool          // false (not nil)

// Type-specific nil
ptr == nil          // true
// i == nil         // Compile error: cannot compare int to nil
```

### Arrays/Slices vs Arrays

```javascript
// JavaScript: Dynamic arrays
let arr = [1, 2, 3];
arr.push(4);         // [1, 2, 3, 4]
arr.length;          // 4
arr.length = 2;      // [1, 2] (truncates!)

// Reference semantics
let arr2 = arr;
arr2[0] = 100;
arr[0];              // 100

// Many built-in methods
arr.map(x => x * 2);
arr.filter(x => x > 1);
arr.reduce((a, b) => a + b, 0);
```

```go
// Go: Fixed arrays vs dynamic slices
arr := [3]int{1, 2, 3}   // Fixed size, value semantics
slice := []int{1, 2, 3}  // Dynamic, reference-like

slice = append(slice, 4)  // [1, 2, 3, 4]
len(slice)                // 4

// Arrays: value semantics
arr2 := arr
arr2[0] = 100
arr[0]                    // 1 (unchanged)

// Slices: reference-like (but can diverge)
slice2 := slice
slice2[0] = 100
slice[0]                  // 100

// Functional operations require loops or packages
// Go 1.21+ has slices package
import "slices"
slices.Contains(slice, 2)
```

### Objects vs Structs/Maps

```javascript
// JavaScript: Dynamic objects
let obj = { name: "Alice", age: 30 };
obj.city = "NYC";        // Add property dynamically
delete obj.age;          // Remove property
obj["name"];             // Access via string key
"name" in obj;           // true

// Prototype chain
obj.toString();          // "[object Object]"
```

```go
// Go: Static structs, dynamic maps
type Person struct {
    Name string
    Age  int
}
p := Person{Name: "Alice", Age: 30}
// p.City = "NYC"        // Compile error: no City field

// Maps for dynamic keys
m := map[string]any{
    "name": "Alice",
    "age":  30,
}
m["city"] = "NYC"        // Add key dynamically
delete(m, "age")         // Remove key
_, exists := m["name"]   // Check existence
```

### Error Handling

```javascript
// JavaScript: Exceptions
try {
    throw new Error("something went wrong");
} catch (e) {
    console.error(e.message);
} finally {
    cleanup();
}

// Async errors
async function fetchData() {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.error(e);
    }
}
```

```go
// Go: Explicit error returns
func doSomething() error {
    return errors.New("something went wrong")
}

err := doSomething()
if err != nil {
    fmt.Println(err)
}

// Multiple return values
func fetchData() ([]byte, error) {
    // ...
    if err != nil {
        return nil, err
    }
    return data, nil
}

data, err := fetchData()
if err != nil {
    log.Fatal(err)
}

// Panic/recover for truly exceptional cases
func riskyOperation() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered:", r)
        }
    }()
    panic("catastrophic error")
}
```

### Summary Table

| Feature | Go | JavaScript |
|---------|----|-----------|
| Numeric types | int8-64, uint8-64, float32/64, complex | Number (float64), BigInt |
| Strings | UTF-8, immutable, []byte | UTF-16, immutable, String object |
| Arrays | Fixed size, value type | Dynamic, reference type |
| Dynamic arrays | Slices | Arrays |
| Key-value | Maps (typed) | Objects (dynamic) |
| Null value | nil (typed) | null, undefined |
| Type coercion | Never (explicit only) | Automatic |
| Boolean context | bool only | Truthy/falsy |
| Error handling | Return values | Exceptions |
| Generics | Yes (Go 1.18+) | N/A (dynamic) |
| Pointers | Yes | No (reference types) |
| Memory management | GC | GC |

---

## Quick Reference: Zero Values

| Type | Zero Value |
|------|------------|
| `bool` | `false` |
| `int`, `int8`, `int16`, `int32`, `int64` | `0` |
| `uint`, `uint8`, `uint16`, `uint32`, `uint64` | `0` |
| `float32`, `float64` | `0.0` |
| `complex64`, `complex128` | `(0+0i)` |
| `string` | `""` |
| `*T` (pointer) | `nil` |
| `[]T` (slice) | `nil` |
| `map[K]V` | `nil` |
| `chan T` | `nil` |
| `func` | `nil` |
| `interface{}` / `any` | `nil` |
| `[N]T` (array) | Array of zero values |
| `struct` | Struct with all fields zero |

---

## Quick Reference: Type Sizes

| Type | Size (bytes) | Notes |
|------|--------------|-------|
| `bool` | 1 | |
| `int8`, `uint8`, `byte` | 1 | |
| `int16`, `uint16` | 2 | |
| `int32`, `uint32`, `rune`, `float32` | 4 | |
| `int64`, `uint64`, `float64`, `complex64` | 8 | |
| `complex128` | 16 | |
| `int`, `uint`, `uintptr` | 4 or 8 | Platform-dependent |
| `string` | 16 | Header: pointer + length |
| `slice` | 24 | Header: pointer + length + capacity |
| `map` | 8 | Pointer to runtime map structure |
| `chan` | 8 | Pointer to runtime channel structure |
| `interface{}` | 16 | Type pointer + data pointer |
