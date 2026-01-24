# Rust Primitive Types: Comprehensive Reference

This document provides an exhaustive reference of Rust's primitive types, their characteristics, behaviors, and semantic meaning. Rust's type system is designed for safety and performance, providing compile-time guarantees that eliminate entire classes of bugs common in other systems programming languages.

---

## Table of Contents

1. [Scalar Types](#scalar-types)
   - [Integer Types](#integer-types)
   - [Floating-Point Types](#floating-point-types)
   - [Boolean Type](#boolean-type)
   - [Character Type](#character-type)
   - [Unit Type](#unit-type)
2. [Compound Types](#compound-types)
   - [Tuples](#tuples)
   - [Arrays](#arrays)
3. [Slices](#slices)
4. [String Types](#string-types)
5. [Collections](#collections)
6. [Semantic Wrapper Types](#semantic-wrapper-types)
7. [Comparison with JavaScript](#comparison-with-javascript)

---

## Scalar Types

Scalar types represent a single value. Rust has four primary scalar categories: integers, floating-point numbers, booleans, and characters.

### Integer Types

Rust provides signed and unsigned integers in various sizes:

| Type | Size | Minimum | Maximum |
|------|------|---------|---------|
| `i8` | 1 byte | -128 | 127 |
| `i16` | 2 bytes | -32,768 | 32,767 |
| `i32` | 4 bytes | -2,147,483,648 | 2,147,483,647 |
| `i64` | 8 bytes | -9,223,372,036,854,775,808 | 9,223,372,036,854,775,807 |
| `i128` | 16 bytes | -170,141,183,460,469,231,731,687,303,715,884,105,728 | 170,141,183,460,469,231,731,687,303,715,884,105,727 |
| `isize` | arch-dependent | arch-dependent | arch-dependent |
| `u8` | 1 byte | 0 | 255 |
| `u16` | 2 bytes | 0 | 65,535 |
| `u32` | 4 bytes | 0 | 4,294,967,295 |
| `u64` | 8 bytes | 0 | 18,446,744,073,709,551,615 |
| `u128` | 16 bytes | 0 | 340,282,366,920,938,463,463,374,607,431,768,211,455 |
| `usize` | arch-dependent | 0 | arch-dependent |

#### Platform-Dependent Types

`isize` and `usize` are pointer-sized integers:
- On 32-bit architectures: 4 bytes (same as `i32`/`u32`)
- On 64-bit architectures: 8 bytes (same as `i64`/`u64`)

These types are primarily used for indexing collections and memory-related operations.

```rust
// usize is the type for array indices
let arr = [1, 2, 3, 4, 5];
let index: usize = 2;
let value = arr[index]; // value = 3

// isize for pointer arithmetic (rare in safe Rust)
let ptr_diff: isize = -5;
```

#### Default Values

Integer types have no implicit default value in Rust. You must explicitly initialize them. However, the `Default` trait provides:

```rust
let x: i32 = Default::default(); // 0
let y: u64 = Default::default(); // 0
```

#### Traits Implemented

All integer types implement:

| Trait | Purpose |
|-------|---------|
| `Copy` | Implicit bitwise copy on assignment |
| `Clone` | Explicit duplication via `.clone()` |
| `Debug` | Debug formatting `{:?}` |
| `Display` | User-facing formatting `{}` |
| `Default` | Returns `0` |
| `PartialEq`, `Eq` | Equality comparison |
| `PartialOrd`, `Ord` | Ordering comparison |
| `Hash` | Hashing for use in `HashMap`/`HashSet` |
| `Add`, `Sub`, `Mul`, `Div`, `Rem` | Arithmetic operators |
| `BitAnd`, `BitOr`, `BitXor`, `Not` | Bitwise operators |
| `Shl`, `Shr` | Bit shifting |
| `FromStr` | Parsing from string |
| `From`/`Into` | Type conversions (where lossless) |

#### Common Methods

```rust
// Constants
let min = i32::MIN;           // -2147483648
let max = i32::MAX;           // 2147483647
let bits = i32::BITS;         // 32

// Checked arithmetic (returns Option<T>)
let a: i32 = 100;
let b = a.checked_add(50);    // Some(150)
let c = i32::MAX.checked_add(1); // None

// Saturating arithmetic (clamps at boundaries)
let d = i32::MAX.saturating_add(1); // 2147483647

// Wrapping arithmetic (wraps around)
let e = i32::MAX.wrapping_add(1); // -2147483648

// Overflowing arithmetic (returns tuple with overflow flag)
let (f, overflowed) = i32::MAX.overflowing_add(1); // (-2147483648, true)

// Bit manipulation
let g: u32 = 0b1010;
let leading = g.leading_zeros();   // 28
let trailing = g.trailing_zeros(); // 1
let ones = g.count_ones();         // 2
let zeros = g.count_zeros();       // 30

// Byte order
let h: u32 = 0x12345678;
let big = h.to_be();              // Big-endian
let little = h.to_le();           // Little-endian
let native = h.to_ne();           // Native endian

// Power and logarithms
let i: u32 = 2;
let pow = i.pow(10);              // 1024
let log = 1024u32.ilog2();        // 10
let log10 = 1000u32.ilog10();     // 3

// Absolute value (signed only)
let j: i32 = -42;
let abs = j.abs();                // 42
let abs_diff = 10i32.abs_diff(15); // 5u32

// Division and remainder
let div = 7i32.div_euclid(4);     // 1
let rem = 7i32.rem_euclid(4);     // 3
let divrem = 7i32.div_euclid(-4); // -1 (Euclidean division)
```

#### Overflow Behavior

Rust's overflow behavior depends on the build profile:

**Debug mode:** Integer overflow causes a **panic** at runtime.

```rust
// In debug mode, this panics!
let x: u8 = 255;
let y = x + 1; // panic: attempt to add with overflow
```

**Release mode:** Overflow performs **two's complement wrapping** by default.

```rust
// In release mode with default settings
let x: u8 = 255;
let y = x + 1; // y = 0 (wrapped)
```

**Explicit overflow control:**

```rust
// Checked: Returns None on overflow
255u8.checked_add(1)  // None

// Wrapping: Always wraps
255u8.wrapping_add(1) // 0

// Saturating: Clamps at boundary
255u8.saturating_add(1) // 255

// Overflowing: Returns value and overflow flag
255u8.overflowing_add(1) // (0, true)
```

#### Integer Literals

```rust
// Decimal
let decimal = 98_222;      // Underscores for readability

// Hexadecimal
let hex = 0xff;

// Octal
let octal = 0o77;

// Binary
let binary = 0b1111_0000;

// Byte (u8 only)
let byte = b'A';           // 65u8

// Type suffix
let typed = 42i64;
let typed2 = 42_u8;
```

---

### Floating-Point Types

Rust has two floating-point types following IEEE 754 standard:

| Type | Size | Precision | Range |
|------|------|-----------|-------|
| `f32` | 4 bytes | ~6-9 decimal digits | ~1.2e-38 to ~3.4e+38 |
| `f64` | 8 bytes | ~15-17 decimal digits | ~2.2e-308 to ~1.8e+308 |

The default type for floating-point literals is `f64`:

```rust
let x = 2.0;      // f64 (default)
let y: f32 = 3.0; // f32 (explicit annotation required)
```

#### Special Values

```rust
// Infinity
let pos_inf = f64::INFINITY;
let neg_inf = f64::NEG_INFINITY;

// NaN (Not a Number)
let nan = f64::NAN;

// Smallest/largest values
let min = f64::MIN;           // -1.7976931348623157e308
let max = f64::MAX;           // 1.7976931348623157e308
let min_positive = f64::MIN_POSITIVE; // 2.2250738585072014e-308

// Machine epsilon
let epsilon = f64::EPSILON;   // 2.220446049250313e-16

// Mathematical constants
let pi = std::f64::consts::PI;
let e = std::f64::consts::E;
let tau = std::f64::consts::TAU;
let sqrt2 = std::f64::consts::SQRT_2;
```

#### Traits Implemented

Floating-point types implement:

| Trait | Purpose |
|-------|---------|
| `Copy` | Implicit bitwise copy |
| `Clone` | Explicit duplication |
| `Debug` | Debug formatting |
| `Display` | User-facing formatting |
| `Default` | Returns `0.0` |
| `PartialEq` | Equality (but NOT `Eq` due to NaN) |
| `PartialOrd` | Ordering (but NOT `Ord` due to NaN) |
| `Add`, `Sub`, `Mul`, `Div`, `Rem`, `Neg` | Arithmetic operators |
| `From`/`Into` | Type conversions |

**Note:** `f32` and `f64` do NOT implement `Eq` or `Ord` because `NaN != NaN` and `NaN` has no ordering:

```rust
let nan = f64::NAN;
println!("{}", nan == nan); // false (IEEE 754 behavior)

// This won't compile:
// let floats: BTreeSet<f64> = BTreeSet::new(); // Error: Ord not implemented

// Use ordered-float crate for hashable/orderable floats
```

#### Common Methods

```rust
let x: f64 = -3.7;

// Rounding
let floor = x.floor();     // -4.0
let ceil = x.ceil();       // -3.0
let round = x.round();     // -4.0
let trunc = x.trunc();     // -3.0
let fract = x.fract();     // -0.7

// Absolute value and sign
let abs = x.abs();         // 3.7
let signum = x.signum();   // -1.0
let copysign = 1.0_f64.copysign(-0.0); // -1.0

// Powers and roots
let y: f64 = 2.0;
let pow = y.powf(10.0);    // 1024.0
let powi = y.powi(10);     // 1024.0 (integer exponent, faster)
let sqrt = y.sqrt();       // 1.4142135623730951
let cbrt = 8.0_f64.cbrt(); // 2.0
let hypot = 3.0_f64.hypot(4.0); // 5.0

// Exponentials and logarithms
let exp = 1.0_f64.exp();   // 2.718281828459045 (e^1)
let exp2 = 3.0_f64.exp2(); // 8.0 (2^3)
let ln = std::f64::consts::E.ln(); // 1.0
let log2 = 8.0_f64.log2(); // 3.0
let log10 = 100.0_f64.log10(); // 2.0
let log = 8.0_f64.log(2.0); // 3.0 (arbitrary base)

// Trigonometry
let angle: f64 = std::f64::consts::PI / 4.0;
let sin = angle.sin();
let cos = angle.cos();
let tan = angle.tan();
let (sin_val, cos_val) = angle.sin_cos(); // Both at once (faster)

// Inverse trigonometry
let asin = 0.5_f64.asin();
let acos = 0.5_f64.acos();
let atan = 1.0_f64.atan();
let atan2 = 1.0_f64.atan2(1.0); // atan2(y, x)

// Hyperbolic functions
let sinh = 1.0_f64.sinh();
let cosh = 1.0_f64.cosh();
let tanh = 1.0_f64.tanh();

// Classification
let is_nan = f64::NAN.is_nan();           // true
let is_inf = f64::INFINITY.is_infinite(); // true
let is_finite = 1.0_f64.is_finite();      // true
let is_normal = 1.0_f64.is_normal();      // true
let is_sign_pos = 1.0_f64.is_sign_positive(); // true
let is_sign_neg = (-1.0_f64).is_sign_negative(); // true

// Min/max (handles NaN correctly)
let min = 1.0_f64.min(2.0); // 1.0
let max = 1.0_f64.max(2.0); // 2.0

// Clamping
let clamped = 5.0_f64.clamp(0.0, 3.0); // 3.0

// Fused multiply-add (more precise, often faster)
let fma = 2.0_f64.mul_add(3.0, 4.0); // 2*3 + 4 = 10
```

#### Floating-Point Precision Issues

```rust
// Classic floating-point precision issue
let result = 0.1 + 0.2;
println!("{}", result);           // 0.30000000000000004
println!("{}", result == 0.3);    // false

// Use approximate comparison
fn approx_eq(a: f64, b: f64, epsilon: f64) -> bool {
    (a - b).abs() < epsilon
}

println!("{}", approx_eq(0.1 + 0.2, 0.3, 1e-10)); // true
```

---

### Boolean Type

The `bool` type represents logical true/false values.

| Property | Value |
|----------|-------|
| Size | 1 byte |
| Values | `true`, `false` |
| Default | `false` |

```rust
let t: bool = true;
let f: bool = false;
let default: bool = Default::default(); // false
```

#### Traits Implemented

| Trait | Purpose |
|-------|---------|
| `Copy` | Implicit bitwise copy |
| `Clone` | Explicit duplication |
| `Debug` | Debug formatting |
| `Display` | User-facing formatting |
| `Default` | Returns `false` |
| `PartialEq`, `Eq` | Equality comparison |
| `PartialOrd`, `Ord` | Ordering (`false < true`) |
| `Hash` | Hashing |
| `Not` | Logical NOT (`!`) |
| `BitAnd`, `BitOr`, `BitXor` | Bitwise/logical operations |
| `FromStr` | Parsing `"true"` or `"false"` |

#### Common Methods

```rust
let b = true;

// Convert to integer
let as_int = b as i32;        // 1 (true = 1, false = 0)

// then_some: Returns Option based on bool
let opt = b.then_some(42);    // Some(42)
let opt2 = false.then_some(42); // None

// then: Lazy evaluation version
let opt3 = b.then(|| expensive_computation()); // Some(result) only if true
```

---

### Character Type

The `char` type represents a single Unicode scalar value.

| Property | Value |
|----------|-------|
| Size | 4 bytes (always) |
| Range | U+0000 to U+D7FF and U+E000 to U+10FFFF |
| Default | `'\0'` (null character) |

**Important:** A `char` is NOT the same as a byte. It always represents a valid Unicode scalar value and occupies 4 bytes regardless of the actual character.

```rust
let c = 'z';
let heart = '❤';
let emoji = '😀';
let chinese = '中';

// All are 4 bytes in size
assert_eq!(std::mem::size_of::<char>(), 4);

// But UTF-8 encoding varies
assert_eq!('a'.len_utf8(), 1);
assert_eq!('中'.len_utf8(), 3);
assert_eq!('😀'.len_utf8(), 4);
```

#### Character Literals

```rust
// Regular characters
let a = 'a';

// Escape sequences
let newline = '\n';
let tab = '\t';
let backslash = '\\';
let quote = '\'';
let null = '\0';

// Unicode escapes
let unicode = '\u{1F600}';    // 😀
let unicode2 = '\u{4E2D}';    // 中
```

#### Traits Implemented

| Trait | Purpose |
|-------|---------|
| `Copy` | Implicit bitwise copy |
| `Clone` | Explicit duplication |
| `Debug` | Debug formatting |
| `Display` | User-facing formatting |
| `Default` | Returns `'\0'` |
| `PartialEq`, `Eq` | Equality comparison |
| `PartialOrd`, `Ord` | Unicode code point ordering |
| `Hash` | Hashing |
| `FromStr` | Parsing single character |

#### Common Methods

```rust
let c = 'A';

// Classification
c.is_alphabetic();       // true
c.is_alphanumeric();     // true
c.is_ascii();            // true
c.is_ascii_alphabetic(); // true
c.is_ascii_digit();      // false
c.is_digit(10);          // false (not a digit in base 10)
c.is_digit(16);          // true (A is valid in hex)
c.is_lowercase();        // false
c.is_uppercase();        // true
c.is_whitespace();       // false
c.is_control();          // false
c.is_numeric();          // false

// Case conversion
let lower = c.to_lowercase(); // Returns iterator (some chars expand)
let upper = c.to_uppercase(); // Returns iterator
let lower_ascii = c.to_ascii_lowercase(); // 'a'
let upper_ascii = 'a'.to_ascii_uppercase(); // 'A'

// Converting lowercase iterator to string
let s: String = 'İ'.to_lowercase().collect(); // "i̇" (2 characters!)

// Unicode info
let code_point = c as u32;   // 65
let from_code = char::from_u32(65); // Some('A')
let from_digit = char::from_digit(10, 16); // Some('a')

// UTF encoding
let mut buf = [0u8; 4];
let encoded = c.encode_utf8(&mut buf); // "A"
c.len_utf8();  // 1 (bytes needed for UTF-8)
c.len_utf16(); // 1 (u16 units needed for UTF-16)
```

---

### Unit Type

The unit type `()` represents the absence of a meaningful value.

| Property | Value |
|----------|-------|
| Size | 0 bytes (zero-sized type) |
| Values | `()` (only one value) |
| Default | `()` |

```rust
// Functions that don't return a value implicitly return ()
fn print_hello() {
    println!("Hello");
} // Returns ()

// Explicit return type
fn explicit() -> () {
    ()
}

// The return value
let unit: () = ();
let result: () = print_hello();
```

#### Traits Implemented

| Trait | Purpose |
|-------|---------|
| `Copy` | Implicit copy |
| `Clone` | Explicit duplication |
| `Debug` | Debug formatting (`()`) |
| `Default` | Returns `()` |
| `PartialEq`, `Eq` | Always equal to itself |
| `PartialOrd`, `Ord` | Always `Equal` |
| `Hash` | Hashing |

#### Use Cases

```rust
// 1. Functions with side effects only
fn log_message(msg: &str) -> () {
    println!("{}", msg);
}

// 2. As a placeholder in generic types
use std::collections::HashSet;
// HashSet<T> is implemented as HashMap<T, ()>

// 3. In Result when only error matters
fn validate(x: i32) -> Result<(), String> {
    if x > 0 {
        Ok(())
    } else {
        Err("Value must be positive".to_string())
    }
}

// 4. The "never" pattern with !
// fn diverges() -> ! {
//     panic!("This function never returns");
// }
```

---

## Compound Types

Compound types group multiple values into one type.

### Tuples

Tuples are fixed-length, heterogeneous collections.

```rust
// Creating tuples
let tuple: (i32, f64, bool) = (500, 6.4, true);

// Accessing elements (0-indexed)
let first = tuple.0;   // 500
let second = tuple.1;  // 6.4
let third = tuple.2;   // true

// Destructuring
let (x, y, z) = tuple;

// Nested tuples
let nested = ((1, 2), (3, 4));
let inner = nested.0.1; // 2

// Unit tuple
let unit: () = ();
```

#### Tuple Properties

| Property | Description |
|----------|-------------|
| Max size | 12 elements (for trait implementations) |
| Size | Sum of element sizes + padding |
| Traits | Implemented up to 12 elements |

```rust
// Tuples up to 12 elements implement common traits
let small: (i32, i32) = (1, 2);
let cloned = small.clone();
println!("{:?}", small); // (1, 2)

// Comparison (lexicographic)
assert!((1, 2) < (1, 3));
assert!((1, 2) < (2, 0));
```

#### Tuple Structs

```rust
// Named tuple types
struct Point(i32, i32);
struct Color(u8, u8, u8);

let origin = Point(0, 0);
let red = Color(255, 0, 0);

// Newtype pattern (single-element tuple struct)
struct Meters(f64);
struct Feet(f64);

// Type safety: can't accidentally mix units
fn calculate_area(width: Meters, height: Meters) -> f64 {
    width.0 * height.0
}
```

---

### Arrays

Arrays are fixed-length, homogeneous collections stored on the stack.

```rust
// Creating arrays
let arr: [i32; 5] = [1, 2, 3, 4, 5];

// Repeat syntax
let zeros: [i32; 100] = [0; 100];  // 100 zeros
let ones: [bool; 5] = [true; 5];   // 5 trues

// Type inference
let inferred = [1, 2, 3]; // [i32; 3]
```

#### Array Properties

| Property | Description |
|----------|-------------|
| Size | Fixed at compile time |
| Storage | Stack-allocated |
| Length | Part of the type (`[T; N]`) |
| Bounds checking | Runtime panic on out-of-bounds |

```rust
// Accessing elements
let arr = [1, 2, 3, 4, 5];
let first = arr[0];        // 1
let last = arr[arr.len() - 1]; // 5

// Bounds checking (panics if out of bounds)
// let invalid = arr[10]; // panic: index out of bounds

// Safe access with get()
let maybe = arr.get(10);   // None
let some = arr.get(2);     // Some(&3)

// Length
let len = arr.len();       // 5
let is_empty = arr.is_empty(); // false
```

#### Array Methods

```rust
let mut arr = [3, 1, 4, 1, 5, 9, 2, 6];

// Iteration
for elem in &arr {
    println!("{}", elem);
}

// Mutable iteration
for elem in &mut arr {
    *elem *= 2;
}

// Sorting
arr.sort();                // [1, 1, 2, 3, 4, 5, 6, 9]
arr.sort_by(|a, b| b.cmp(a)); // Reverse sort

// Searching
let found = arr.binary_search(&4); // Ok(index) or Err(insert_point)
let contains = arr.contains(&5);   // true

// Slicing
let slice = &arr[1..4];    // &[i32] slice

// Splitting
let (left, right) = arr.split_at(3);

// Chunking
for chunk in arr.chunks(3) {
    println!("{:?}", chunk);
}

// Windows (overlapping)
for window in arr.windows(3) {
    println!("{:?}", window);
}
```

#### Multi-dimensional Arrays

```rust
// 2D array (array of arrays)
let matrix: [[i32; 3]; 2] = [
    [1, 2, 3],
    [4, 5, 6],
];

let elem = matrix[1][2]; // 6

// Flattening
let flat: Vec<i32> = matrix.iter().flatten().copied().collect();
```

---

## Slices

Slices are dynamically-sized views into contiguous sequences.

```rust
// Slices are always references
let arr = [1, 2, 3, 4, 5];
let slice: &[i32] = &arr[1..4];  // [2, 3, 4]

// Mutable slices
let mut arr = [1, 2, 3, 4, 5];
let slice: &mut [i32] = &mut arr[1..4];
slice[0] = 20; // arr is now [1, 20, 3, 4, 5]
```

#### Slice Properties

| Property | Description |
|----------|-------------|
| Size | Fat pointer: 2 words (ptr + len) |
| Notation | `&[T]` or `&mut [T]` |
| Storage | References existing data |
| Bounds | Runtime checked |

#### Slice Ranges

```rust
let arr = [0, 1, 2, 3, 4, 5];

let full = &arr[..];       // [0, 1, 2, 3, 4, 5]
let from_start = &arr[..3]; // [0, 1, 2]
let to_end = &arr[3..];    // [3, 4, 5]
let middle = &arr[2..4];   // [2, 3]
let inclusive = &arr[2..=4]; // [2, 3, 4]
```

#### Slice Methods

```rust
let slice = &[1, 2, 3, 4, 5];

// Length and emptiness
slice.len();           // 5
slice.is_empty();      // false

// First and last
slice.first();         // Some(&1)
slice.last();          // Some(&5)

// Getting elements
slice.get(2);          // Some(&3)
slice.get(10);         // None

// Iteration
slice.iter();          // Iterator<Item = &T>
slice.iter().enumerate(); // Iterator<Item = (usize, &T)>

// Searching
slice.contains(&3);    // true
slice.starts_with(&[1, 2]); // true
slice.ends_with(&[4, 5]);   // true

// Binary search (must be sorted)
let sorted = &[1, 2, 3, 4, 5];
sorted.binary_search(&3); // Ok(2)

// Splitting
let (left, right) = slice.split_at(2);
slice.split(|x| *x == 3); // Iterator over [1,2] and [4,5]

// Copying between slices
let src = [1, 2, 3];
let mut dst = [0; 3];
dst.copy_from_slice(&src);

// Cloning (for non-Copy types)
let strings: &[String] = &["a".to_string(), "b".to_string()];
let mut cloned = vec![String::new(); 2];
cloned.clone_from_slice(strings);
```

---

## String Types

Rust has two primary string types: `String` (owned) and `&str` (borrowed slice).

### String vs &str

| Aspect | `String` | `&str` |
|--------|----------|--------|
| Ownership | Owned, heap-allocated | Borrowed reference |
| Mutability | Can be mutated | Immutable view |
| Size | 3 words (ptr, len, capacity) | 2 words (ptr, len) |
| Storage | Heap | Can point to heap, stack, or static |
| Growth | Can grow/shrink | Fixed size |

```rust
// String literals are &'static str
let static_str: &'static str = "Hello, world!";

// Creating String
let mut s = String::new();
let s = String::from("Hello");
let s = "Hello".to_string();
let s = "Hello".to_owned();

// Converting between types
let string: String = String::from("Hello");
let str_slice: &str = &string;       // Deref coercion
let str_slice: &str = string.as_str(); // Explicit
let string: String = str_slice.to_string(); // Back to String
```

### String Operations

```rust
let mut s = String::from("Hello");

// Appending
s.push(' ');              // Push single char
s.push_str("world!");     // Push string slice

// Concatenation
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;        // s1 is moved, s2 is borrowed

// Format macro (doesn't take ownership)
let s = format!("{} {}", "Hello", "world!");

// Length (in bytes, not characters!)
let len = "Hello".len();        // 5
let len = "Здравствуй".len();   // 20 (not 10!)

// Character count
let chars = "Здравствуй".chars().count(); // 10

// Indexing (not allowed directly due to UTF-8)
// let c = s[0]; // Error!
let c = s.chars().nth(0); // Some('H')

// Slicing (must be on char boundaries)
let hello = &"Hello, world!"[0..5]; // "Hello"
// let invalid = &"Здравствуй"[0..1]; // panic! (not char boundary)

// Iteration
for c in "Hello".chars() {
    println!("{}", c);
}

for b in "Hello".bytes() {
    println!("{}", b);
}
```

### String Methods

```rust
let s = String::from("  Hello, World!  ");

// Trimming
s.trim();                // "Hello, World!"
s.trim_start();          // "Hello, World!  "
s.trim_end();            // "  Hello, World!"

// Case conversion
"hello".to_uppercase();  // "HELLO"
"HELLO".to_lowercase();  // "hello"

// Searching
s.contains("World");     // true
s.starts_with("  Hello"); // true
s.ends_with("!  ");      // true
s.find("World");         // Some(9)
s.rfind("o");            // Some(10)

// Replacing
"hello".replace("l", "L"); // "heLLo"
"aaa".replacen("a", "b", 2); // "bba"

// Splitting
"a,b,c".split(',');      // Iterator: "a", "b", "c"
"a  b  c".split_whitespace(); // Iterator: "a", "b", "c"
"hello\nworld".lines();  // Iterator: "hello", "world"

// Parsing
let num: i32 = "42".parse().unwrap(); // 42
let num: f64 = "3.14".parse().unwrap(); // 3.14

// Checking
"hello".is_empty();      // false
"  ".is_ascii();         // true
"123".chars().all(|c| c.is_numeric()); // true
```

### String Capacity and Memory

```rust
let mut s = String::with_capacity(100);

s.capacity();            // 100
s.len();                 // 0

s.push_str("Hello");
s.len();                 // 5
s.capacity();            // 100 (unchanged)

s.shrink_to_fit();       // Reduce capacity to len
s.reserve(50);           // Ensure at least 50 more bytes
s.reserve_exact(50);     // Reserve exactly 50 more bytes

// Clear vs truncate
s.truncate(3);           // Keep first 3 bytes: "Hel"
s.clear();               // Remove all content (capacity unchanged)
```

---

## Collections

### Vec<T>

A growable, heap-allocated array.

```rust
// Creating vectors
let v: Vec<i32> = Vec::new();
let v = vec![1, 2, 3];
let v = vec![0; 5];      // [0, 0, 0, 0, 0]
let v: Vec<i32> = (0..5).collect();

// With capacity
let v: Vec<i32> = Vec::with_capacity(100);
```

#### Vec Operations

```rust
let mut v = vec![1, 2, 3];

// Adding elements
v.push(4);               // [1, 2, 3, 4]
v.insert(1, 10);         // [1, 10, 2, 3, 4]
v.extend([5, 6, 7]);     // [1, 10, 2, 3, 4, 5, 6, 7]

// Removing elements
v.pop();                 // Some(7), v = [1, 10, 2, 3, 4, 5, 6]
v.remove(1);             // 10, v = [1, 2, 3, 4, 5, 6]
v.swap_remove(0);        // 1, v = [6, 2, 3, 4, 5] (fast, changes order)
v.retain(|x| x % 2 == 0); // [6, 2, 4]
v.clear();               // []

// Accessing
let v = vec![1, 2, 3, 4, 5];
v[0];                    // 1 (panics if out of bounds)
v.get(0);                // Some(&1)
v.get(10);               // None
v.first();               // Some(&1)
v.last();                // Some(&5)

// Slicing
let slice: &[i32] = &v[1..3];

// Iteration
for elem in &v { }       // Immutable borrow
for elem in &mut v { }   // Mutable borrow
for elem in v { }        // Takes ownership

// Sorting
let mut v = vec![3, 1, 4, 1, 5];
v.sort();                // [1, 1, 3, 4, 5]
v.sort_by(|a, b| b.cmp(a)); // [5, 4, 3, 1, 1]
v.sort_by_key(|x| -x);   // Sort by key function

// Deduplication (must be sorted first)
v.sort();
v.dedup();               // Remove consecutive duplicates

// Searching
v.contains(&3);          // true
v.binary_search(&3);     // Ok(index) or Err(insert_point)

// Transformation
let squared: Vec<i32> = v.iter().map(|x| x * x).collect();
let filtered: Vec<i32> = v.into_iter().filter(|x| *x > 2).collect();
```

### HashMap<K, V>

A hash table for key-value pairs.

```rust
use std::collections::HashMap;

// Creating
let mut map: HashMap<String, i32> = HashMap::new();
let map: HashMap<_, _> = vec![("a", 1), ("b", 2)].into_iter().collect();

// Inserting
map.insert("key".to_string(), 42);

// Entry API (efficient insert-or-update)
map.entry("key".to_string()).or_insert(0);
map.entry("new".to_string()).or_insert_with(|| expensive_default());
*map.entry("key".to_string()).or_insert(0) += 1; // Increment

// Accessing
map.get("key");          // Option<&V>
map.get_mut("key");      // Option<&mut V>
map["key"];              // Panics if missing

// Removing
map.remove("key");       // Option<V>

// Checking
map.contains_key("key"); // bool
map.is_empty();          // bool
map.len();               // usize

// Iteration
for (key, value) in &map { }
for key in map.keys() { }
for value in map.values() { }
```

### HashSet<T>

A set of unique values.

```rust
use std::collections::HashSet;

let mut set: HashSet<i32> = HashSet::new();
let set: HashSet<_> = vec![1, 2, 3, 2, 1].into_iter().collect(); // {1, 2, 3}

// Operations
set.insert(4);
set.remove(&4);
set.contains(&1);

// Set operations
let a: HashSet<_> = [1, 2, 3].into();
let b: HashSet<_> = [2, 3, 4].into();

let union: HashSet<_> = a.union(&b).copied().collect();      // {1, 2, 3, 4}
let intersection: HashSet<_> = a.intersection(&b).copied().collect(); // {2, 3}
let difference: HashSet<_> = a.difference(&b).copied().collect();     // {1}
let symmetric: HashSet<_> = a.symmetric_difference(&b).copied().collect(); // {1, 4}

a.is_subset(&b);         // false
a.is_superset(&b);       // false
a.is_disjoint(&b);       // false
```

### Other Collections

```rust
use std::collections::{VecDeque, LinkedList, BTreeMap, BTreeSet, BinaryHeap};

// VecDeque: Double-ended queue
let mut deque: VecDeque<i32> = VecDeque::new();
deque.push_front(1);
deque.push_back(2);
deque.pop_front();       // Some(1)
deque.pop_back();        // Some(2)

// BTreeMap: Sorted map (balanced tree)
let mut btree: BTreeMap<i32, &str> = BTreeMap::new();
btree.insert(3, "three");
btree.insert(1, "one");
// Iteration is in sorted order by key

// BTreeSet: Sorted set
let bset: BTreeSet<i32> = [3, 1, 2].into();
// Iteration: 1, 2, 3

// BinaryHeap: Max-heap priority queue
let mut heap = BinaryHeap::from(vec![1, 5, 2]);
heap.push(3);
heap.pop();              // Some(5) (largest)
heap.peek();             // Some(&3)
```

---

## Semantic Wrapper Types

Rust uses wrapper types to encode additional meaning into the type system, making invalid states unrepresentable.

### Option<T>

Represents an optional value: either `Some(T)` or `None`.

```rust
enum Option<T> {
    Some(T),
    None,
}
```

#### Use Cases

```rust
// 1. Nullable values without null
fn find_user(id: u64) -> Option<User> {
    // Return Some(user) if found, None otherwise
}

// 2. Optional function parameters
fn greet(name: Option<&str>) {
    match name {
        Some(n) => println!("Hello, {}!", n),
        None => println!("Hello, stranger!"),
    }
}

// 3. Partial functions
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

// 4. First/last element of collections
let v = vec![1, 2, 3];
let first: Option<&i32> = v.first(); // Some(&1)
let empty: Vec<i32> = vec![];
let first: Option<&i32> = empty.first(); // None
```

#### Option Methods

```rust
let some: Option<i32> = Some(42);
let none: Option<i32> = None;

// Checking
some.is_some();          // true
some.is_none();          // false

// Unwrapping (careful: panics on None!)
some.unwrap();           // 42
none.unwrap_or(0);       // 0
none.unwrap_or_else(|| compute_default()); // Lazy default
none.unwrap_or_default(); // Uses T::default()

// Safe unwrapping
some.expect("Value should exist"); // 42 or panic with message

// Transforming
some.map(|x| x * 2);     // Some(84)
none.map(|x| x * 2);     // None

some.and_then(|x| if x > 0 { Some(x) } else { None }); // Some(42)
some.filter(|x| *x > 50); // None

// Combining
some.or(Some(0));        // Some(42)
none.or(Some(0));        // Some(0)
some.and(Some("yes"));   // Some("yes")
none.and(Some("yes"));   // None

some.xor(None);          // Some(42)
some.xor(Some(0));       // None

// Converting to Result
some.ok_or("error");     // Ok(42)
none.ok_or("error");     // Err("error")

// Taking ownership
let mut opt = Some(42);
let taken = opt.take();  // opt is now None, taken is Some(42)

// Replacing
let mut opt = Some(1);
let old = opt.replace(2); // opt is Some(2), old is Some(1)

// Iteration (0 or 1 elements)
for x in some.iter() {
    println!("{}", x);
}

// Flattening
let nested: Option<Option<i32>> = Some(Some(42));
nested.flatten();        // Some(42)

// Zipping
let a = Some(1);
let b = Some("hi");
a.zip(b);                // Some((1, "hi"))
```

### Result<T, E>

Represents either success (`Ok(T)`) or failure (`Err(E)`).

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

#### Use Cases

```rust
use std::fs::File;
use std::io::{self, Read};

// 1. File operations
fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// 2. Parsing
fn parse_int(s: &str) -> Result<i32, std::num::ParseIntError> {
    s.parse()
}

// 3. Custom errors
#[derive(Debug)]
enum MyError {
    NotFound,
    InvalidInput(String),
    IoError(io::Error),
}

fn complex_operation() -> Result<(), MyError> {
    // ...
    Ok(())
}

// 4. The ? operator (early return on Err)
fn process() -> Result<i32, MyError> {
    let data = fetch_data()?;    // Returns Err early if failed
    let parsed = parse(data)?;   // Same here
    Ok(parsed * 2)
}
```

#### Result Methods

```rust
let ok: Result<i32, &str> = Ok(42);
let err: Result<i32, &str> = Err("error");

// Checking
ok.is_ok();              // true
ok.is_err();             // false

// Unwrapping
ok.unwrap();             // 42
err.unwrap_or(0);        // 0
err.unwrap_or_else(|e| {
    eprintln!("Error: {}", e);
    0
});
ok.expect("Should work"); // 42 or panic with message
err.unwrap_err();        // "error"

// Transforming
ok.map(|x| x * 2);       // Ok(84)
err.map(|x| x * 2);      // Err("error")
err.map_err(|e| format!("Failed: {}", e)); // Err("Failed: error")

ok.and_then(|x| if x > 0 { Ok(x) } else { Err("negative") }); // Ok(42)

// Combining
ok.or(Ok(0));            // Ok(42)
err.or(Ok(0));           // Ok(0)
ok.and(Ok("yes"));       // Ok("yes")
err.and(Ok("yes"));      // Err("error")

// Converting to Option
ok.ok();                 // Some(42)
err.ok();                // None
ok.err();                // None
err.err();               // Some("error")

// Transposing with Option
let x: Result<Option<i32>, &str> = Ok(Some(42));
let y: Option<Result<i32, &str>> = x.transpose(); // Some(Ok(42))

// Iteration
for x in ok.iter() {
    println!("{}", x);
}
```

### The ? Operator

The `?` operator provides ergonomic error propagation:

```rust
// Without ?
fn read_username() -> Result<String, io::Error> {
    let file = match File::open("username.txt") {
        Ok(f) => f,
        Err(e) => return Err(e),
    };
    // ... more matching ...
}

// With ?
fn read_username() -> Result<String, io::Error> {
    let mut file = File::open("username.txt")?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username)
}

// Works with Option too (in functions returning Option)
fn first_even(nums: &[i32]) -> Option<i32> {
    let first = nums.first()?;  // Returns None if empty
    if first % 2 == 0 {
        Some(*first)
    } else {
        None
    }
}
```

### Combining Option and Result

```rust
// Option to Result
let opt: Option<i32> = Some(42);
let res: Result<i32, &str> = opt.ok_or("missing value");

// Result to Option
let res: Result<i32, &str> = Ok(42);
let opt: Option<i32> = res.ok();

// Transpose: Option<Result<T, E>> <-> Result<Option<T>, E>
let opt_res: Option<Result<i32, &str>> = Some(Ok(42));
let res_opt: Result<Option<i32>, &str> = opt_res.transpose(); // Ok(Some(42))

// Flattening nested Results
let nested: Result<Result<i32, &str>, &str> = Ok(Ok(42));
let flat: Result<i32, &str> = nested.and_then(|x| x); // Ok(42)

// Collecting Results
let results: Vec<Result<i32, &str>> = vec![Ok(1), Ok(2), Ok(3)];
let collected: Result<Vec<i32>, &str> = results.into_iter().collect(); // Ok([1, 2, 3])

let results: Vec<Result<i32, &str>> = vec![Ok(1), Err("oops"), Ok(3)];
let collected: Result<Vec<i32>, &str> = results.into_iter().collect(); // Err("oops")
```

---

## Comparison with JavaScript

### Type System Philosophy

| Aspect | Rust | JavaScript |
|--------|------|------------|
| Typing | Static, strong | Dynamic, weak |
| Null handling | `Option<T>` | `null`, `undefined` |
| Error handling | `Result<T, E>` | Exceptions, callbacks |
| Type inference | Local, bidirectional | None (or TypeScript) |
| Generics | Monomorphized | N/A (duck typing) |

### Numbers

```javascript
// JavaScript: Single number type
const num = 42;           // number (64-bit float)
const big = 9007199254740993; // Precision lost!
const bigint = 9007199254740993n; // BigInt for large integers

// Rust: Explicit numeric types
let num: i32 = 42;        // 32-bit signed integer
let big: i128 = 9007199254740993; // No precision loss
let float: f64 = 3.14;    // 64-bit float
```

**JavaScript's Number Limitations:**

```javascript
// JavaScript
console.log(0.1 + 0.2 === 0.3); // false
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(9007199254740992 === 9007199254740993); // true (!)
```

```rust
// Rust: Same floating-point issues
assert!(0.1 + 0.2 != 0.3);

// But integers are precise
assert!(9007199254740992_i64 != 9007199254740993_i64);

// And overflow is caught in debug mode
let x: u8 = 255;
// let y = x + 1; // Panics in debug!
```

### Null and Undefined

```javascript
// JavaScript: Multiple "nothing" values
let a = null;
let b = undefined;
let c;                    // undefined

// Truthy/falsy confusion
if (0) { }                // false
if ("") { }               // false
if (null) { }             // false
if ([]) { }               // true (!)
if ({}) { }               // true (!)
```

```rust
// Rust: Explicit Option<T>
let a: Option<i32> = None;
let b: Option<i32> = Some(42);

// Must handle None explicitly
match a {
    Some(value) => println!("Got: {}", value),
    None => println!("Nothing"),
}

// No implicit conversions
// if a { }  // Error: expected bool, found Option<i32>
if a.is_some() { }        // Explicit check required
```

### Error Handling

```javascript
// JavaScript: Exceptions
function divide(a, b) {
    if (b === 0) {
        throw new Error("Division by zero");
    }
    return a / b;
}

try {
    const result = divide(10, 0);
} catch (e) {
    console.error(e.message);
}

// Or callbacks (Node.js style)
fs.readFile('file.txt', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(data);
});

// Or Promises
fetch('url')
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

```rust
// Rust: Result<T, E>
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// Must handle Result explicitly
match divide(10.0, 0.0) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => eprintln!("Error: {}", e),
}

// Or use ? for propagation
fn calculate() -> Result<f64, String> {
    let x = divide(10.0, 2.0)?;  // Returns Err early if failed
    let y = divide(x, 5.0)?;
    Ok(y)
}

// File reading with Result
use std::fs;
fn read_config() -> Result<String, std::io::Error> {
    fs::read_to_string("config.txt")
}
```

### Ownership vs. Garbage Collection

```javascript
// JavaScript: Garbage collected
function createData() {
    const data = new Array(1000000).fill(0);
    return data;  // Reference passed, GC manages memory
}

let data = createData();
let data2 = data;  // Both reference same array
data = null;       // Array still exists (data2 holds reference)
data2 = null;      // Array now eligible for GC (eventually freed)
```

```rust
// Rust: Ownership system
fn create_data() -> Vec<i32> {
    let data = vec![0; 1000000];
    data  // Ownership transferred to caller
}

let data = create_data();
let data2 = data;  // Ownership MOVED to data2
// println!("{:?}", data);  // Error: data no longer valid!

// data2 dropped here, memory freed immediately (deterministic)
```

### Borrowing vs. References

```javascript
// JavaScript: No borrowing concept
function modifyArray(arr) {
    arr.push(4);  // Modifies original
}

const original = [1, 2, 3];
modifyArray(original);
console.log(original);  // [1, 2, 3, 4]

// No way to prevent modification (except deep clone)
```

```rust
// Rust: Explicit borrowing
fn read_vec(v: &Vec<i32>) {
    println!("{:?}", v);  // Can read
    // v.push(4);  // Error: cannot mutate through shared reference
}

fn modify_vec(v: &mut Vec<i32>) {
    v.push(4);  // Can mutate
}

let mut original = vec![1, 2, 3];

read_vec(&original);      // Immutable borrow
modify_vec(&mut original); // Mutable borrow

// Cannot have mutable and immutable borrows simultaneously
// let r1 = &original;
// let r2 = &mut original;  // Error!
```

### Semantic Type Safety

```javascript
// JavaScript: No compile-time type safety
function processUser(userId) {
    // Is userId a number? string? object?
    // Could be null or undefined?
}

// Common bug: wrong type passed
processUser("123");  // String instead of number
processUser(null);   // Null
processUser();       // Undefined
```

```rust
// Rust: Types encode meaning
struct UserId(u64);
struct PostId(u64);

fn process_user(user_id: UserId) {
    // Guaranteed to be a valid UserId
}

fn process_post(post_id: PostId) {
    // Guaranteed to be a valid PostId
}

let user = UserId(123);
let post = PostId(456);

process_user(user);
// process_user(post);  // Error: expected UserId, found PostId
// process_user(123);   // Error: expected UserId, found integer

// With Option for nullable
fn find_user(id: UserId) -> Option<User> {
    // Returns None if not found, Some(user) otherwise
}
```

### Collection Types

```javascript
// JavaScript: Dynamic arrays
const arr = [1, "two", { three: 3 }];  // Mixed types
arr.push(null);  // Anything goes
arr.length = 0;  // Empties array

// JavaScript: Objects as maps
const map = {};
map["key"] = "value";
map[123] = "number key";  // Coerced to string "123"
```

```rust
// Rust: Typed collections
let arr: Vec<i32> = vec![1, 2, 3];  // Only i32
// arr.push("string");  // Error: expected i32

// HashMap with explicit types
use std::collections::HashMap;
let mut map: HashMap<String, i32> = HashMap::new();
map.insert("key".to_string(), 42);
// map.insert(123, 42);  // Error: expected String

// Arrays are fixed-size
let fixed: [i32; 3] = [1, 2, 3];
// fixed.push(4);  // Error: arrays don't have push
```

### Type Coercion

```javascript
// JavaScript: Implicit coercion
console.log("5" + 3);     // "53" (string)
console.log("5" - 3);     // 2 (number)
console.log([] + []);     // "" (string)
console.log([] + {});     // "[object Object]"
console.log({} + []);     // 0 (in some contexts)

// Equality confusion
console.log(0 == "");     // true
console.log(0 == "0");    // true
console.log("" == "0");   // false
console.log(null == undefined); // true
```

```rust
// Rust: No implicit coercion
let a: i32 = 5;
let b: f64 = 3.0;
// let c = a + b;  // Error: cannot add i32 and f64

// Explicit conversion required
let c = f64::from(a) + b;  // 8.0
let d = a + b as i32;      // 8

// No type coercion in comparisons
// "5" == 5  // Error: can't compare &str and i32
```

### Summary: Rust's Semantic Advantages

1. **Null Safety**: `Option<T>` forces explicit handling of absent values
2. **Error Handling**: `Result<T, E>` makes errors part of the type signature
3. **Memory Safety**: Ownership prevents use-after-free, double-free, data races
4. **Type Safety**: Strong typing catches bugs at compile time
5. **No Undefined Behavior**: Safe Rust guarantees memory safety
6. **Deterministic Cleanup**: RAII ensures resources are freed predictably
7. **Zero-Cost Abstractions**: High-level features compile to efficient code

```rust
// Rust's philosophy: Make invalid states unrepresentable

// Instead of nullable pointers
struct User {
    name: String,                    // Required
    email: Option<String>,           // Optional
}

// Instead of error codes
fn parse_config(path: &str) -> Result<Config, ConfigError> {
    let content = std::fs::read_to_string(path)?;
    let config: Config = toml::from_str(&content)?;
    Ok(config)
}

// Instead of raw pointers
fn process_items(items: &[Item]) {  // Guaranteed valid slice
    for item in items {
        // Safe iteration
    }
}
```

---

## Quick Reference Tables

### Primitive Types at a Glance

| Type | Size | Default | Copy | Eq | Ord | Hash |
|------|------|---------|------|-----|-----|------|
| `i8`-`i128` | 1-16 bytes | 0 | Yes | Yes | Yes | Yes |
| `u8`-`u128` | 1-16 bytes | 0 | Yes | Yes | Yes | Yes |
| `isize`/`usize` | ptr size | 0 | Yes | Yes | Yes | Yes |
| `f32`/`f64` | 4/8 bytes | 0.0 | Yes | Partial | Partial | No |
| `bool` | 1 byte | false | Yes | Yes | Yes | Yes |
| `char` | 4 bytes | '\0' | Yes | Yes | Yes | Yes |
| `()` | 0 bytes | () | Yes | Yes | Yes | Yes |

### Common Conversions

```rust
// Integer <-> Integer
let a: i32 = 42;
let b: i64 = i64::from(a);     // Lossless (always succeeds)
let c: i16 = a as i16;         // May truncate

// Integer <-> Float
let d: f64 = f64::from(a);     // Lossless for i32 -> f64
let e: i32 = d as i32;         // Truncates decimal

// String <-> Number
let s = 42.to_string();        // "42"
let n: i32 = "42".parse().unwrap(); // 42

// Char <-> Number
let ch = 'A';
let code = ch as u32;          // 65
let ch2 = char::from_u32(65).unwrap(); // 'A'
```

### Overflow Behavior Summary

| Method | On Overflow | Return Type |
|--------|-------------|-------------|
| `+`, `-`, `*`, `/` | Panic (debug) / Wrap (release) | `T` |
| `checked_*` | Return `None` | `Option<T>` |
| `wrapping_*` | Wrap around | `T` |
| `saturating_*` | Clamp at boundary | `T` |
| `overflowing_*` | Wrap + flag | `(T, bool)` |

---

*This document covers Rust's primitive types and core concepts. For the complete standard library documentation, see [doc.rust-lang.org](https://doc.rust-lang.org/std/).*
