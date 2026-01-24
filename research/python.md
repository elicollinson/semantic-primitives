# Python Primitive and Built-in Types

This document provides a comprehensive reference for Python's primitive and built-in types, with comparisons to JavaScript/TypeScript where relevant for implementing semantic equivalents.

## Table of Contents

1. [Overview](#overview)
2. [Numeric Types](#numeric-types)
   - [int](#int)
   - [float](#float)
   - [complex](#complex)
   - [bool](#bool)
3. [Sequence Types](#sequence-types)
   - [str](#str)
   - [bytes](#bytes)
   - [bytearray](#bytearray)
   - [list](#list)
   - [tuple](#tuple)
4. [Mapping Types](#mapping-types)
   - [dict](#dict)
5. [Set Types](#set-types)
   - [set](#set)
   - [frozenset](#frozenset)
6. [None Type](#none-type)
7. [Type System and Duck Typing](#type-system-and-duck-typing)
8. [Comparison with JavaScript](#comparison-with-javascript)

---

## Overview

Python's type system is **dynamic** and **strongly typed**:

- **Dynamic**: Variable types are determined at runtime, not compile time
- **Strongly typed**: Implicit type coercion is minimal; operations between incompatible types raise `TypeError`

All values in Python are objects, including primitives. Every object has:
- An **identity** (`id()` - memory address in CPython)
- A **type** (`type()`)
- A **value** (mutable or immutable)

```python
x = 42
print(id(x))      # 140234866583344 (memory address)
print(type(x))    # <class 'int'>
print(x)          # 42
```

### Mutability Classification

| Immutable | Mutable |
|-----------|---------|
| `int`, `float`, `complex`, `bool` | `list` |
| `str`, `bytes`, `tuple`, `frozenset` | `dict`, `set`, `bytearray` |
| `None` | |

---

## Numeric Types

### int

Python integers have **arbitrary precision** - they can grow to any size limited only by available memory.

#### Type Name and Syntax

```python
# Type
int

# Class hierarchy
int.__bases__  # (object,)
int.__mro__    # (int, object)
```

#### Memory Representation

CPython implementation details:

```python
import sys

# Small integers (-5 to 256) are interned/cached
a = 256
b = 256
print(a is b)  # True - same object

a = 257
b = 257
print(a is b)  # False - different objects (in most cases)

# Memory size grows with magnitude
sys.getsizeof(0)           # 24 bytes (base overhead)
sys.getsizeof(1)           # 28 bytes
sys.getsizeof(2**30)       # 32 bytes
sys.getsizeof(2**60)       # 36 bytes
sys.getsizeof(2**1000)     # 160 bytes
```

Internal structure (CPython `PyLongObject`):
- `ob_refcnt`: Reference count
- `ob_type`: Pointer to type object
- `ob_digit[]`: Array of 30-bit digits (variable length)

#### Literal Syntax and Construction

```python
# Decimal
x = 42
x = 1_000_000  # Underscores for readability (Python 3.6+)

# Binary
x = 0b101010   # 42
x = 0B101010   # Case insensitive prefix

# Octal
x = 0o52       # 42
x = 0O52

# Hexadecimal
x = 0x2A       # 42
x = 0X2a

# Constructor
int()          # 0
int(3.14)      # 3 (truncates toward zero)
int(-3.14)     # -3
int("42")      # 42
int("2A", 16)  # 42 (base conversion)
int("101010", 2)  # 42
int(True)      # 1
int(False)     # 0
```

#### Built-in Methods and Properties

```python
n = 42

# Bit manipulation
n.bit_length()        # 6 - minimum bits needed (excluding sign)
n.bit_count()         # 3 - number of 1s in binary (Python 3.10+)

# Byte conversion
n.to_bytes(2, 'big')           # b'\x00*'
n.to_bytes(2, 'little')        # b'*\x00'
n.to_bytes(2, 'big', signed=True)  # For negative numbers

int.from_bytes(b'\x00*', 'big')  # 42

# Numeric properties (via abstract base class)
n.numerator    # 42
n.denominator  # 1
n.real         # 42
n.imag         # 0

# Check methods
n.is_integer()  # True (always for int, exists for float compatibility)

# Conjugate (for complex number compatibility)
n.conjugate()   # 42

# As integer ratio (fraction)
n.as_integer_ratio()  # (42, 1)
```

#### Common Operations and Operators

```python
# Arithmetic
a + b     # Addition
a - b     # Subtraction
a * b     # Multiplication
a / b     # True division (returns float)
a // b    # Floor division (returns int)
a % b     # Modulo
a ** b    # Exponentiation
-a        # Negation
+a        # Unary plus
abs(a)    # Absolute value
divmod(a, b)  # (a // b, a % b)

# Comparison
a == b    # Equal
a != b    # Not equal
a < b     # Less than
a <= b    # Less than or equal
a > b     # Greater than
a >= b    # Greater than or equal

# Bitwise operations
a & b     # AND
a | b     # OR
a ^ b     # XOR
~a        # NOT (complement)
a << n    # Left shift
a >> n    # Right shift

# Built-in functions
pow(a, b)      # a ** b
pow(a, b, m)   # (a ** b) % m (more efficient)
round(a)       # Round to nearest integer
```

#### Type Conversion/Coercion Rules

```python
# Explicit conversions
float(42)      # 42.0
complex(42)    # (42+0j)
str(42)        # '42'
bool(42)       # True
bool(0)        # False

# Implicit promotion in mixed operations
42 + 3.14      # 45.14 (int -> float)
42 + (1+2j)    # (43+2j) (int -> complex)

# No implicit string conversion
42 + "3"       # TypeError
```

#### Magic Methods

```python
class int:
    # Representation
    def __repr__(self): ...     # repr(x) - "42"
    def __str__(self): ...      # str(x) - "42"
    def __format__(self, spec): ...  # format(x, 'd')

    # Comparison
    def __eq__(self, other): ...    # x == y
    def __ne__(self, other): ...    # x != y
    def __lt__(self, other): ...    # x < y
    def __le__(self, other): ...    # x <= y
    def __gt__(self, other): ...    # x > y
    def __ge__(self, other): ...    # x >= y
    def __hash__(self): ...         # hash(x)
    def __bool__(self): ...         # bool(x)

    # Arithmetic
    def __add__(self, other): ...   # x + y
    def __radd__(self, other): ...  # y + x (reflected)
    def __iadd__(self, other): ...  # x += y (in-place, returns new for immutable)
    def __sub__(self, other): ...
    def __rsub__(self, other): ...
    def __isub__(self, other): ...
    def __mul__(self, other): ...
    def __rmul__(self, other): ...
    def __imul__(self, other): ...
    def __truediv__(self, other): ...   # x / y
    def __rtruediv__(self, other): ...
    def __itruediv__(self, other): ...
    def __floordiv__(self, other): ...  # x // y
    def __rfloordiv__(self, other): ...
    def __ifloordiv__(self, other): ...
    def __mod__(self, other): ...       # x % y
    def __rmod__(self, other): ...
    def __imod__(self, other): ...
    def __pow__(self, other, mod=None): ...  # x ** y or pow(x, y, mod)
    def __rpow__(self, other): ...
    def __ipow__(self, other): ...
    def __divmod__(self, other): ...    # divmod(x, y)
    def __rdivmod__(self, other): ...

    # Unary
    def __neg__(self): ...      # -x
    def __pos__(self): ...      # +x
    def __abs__(self): ...      # abs(x)
    def __invert__(self): ...   # ~x

    # Bitwise
    def __and__(self, other): ...   # x & y
    def __rand__(self, other): ...
    def __iand__(self, other): ...
    def __or__(self, other): ...    # x | y
    def __ror__(self, other): ...
    def __ior__(self, other): ...
    def __xor__(self, other): ...   # x ^ y
    def __rxor__(self, other): ...
    def __ixor__(self, other): ...
    def __lshift__(self, other): ...  # x << y
    def __rlshift__(self, other): ...
    def __ilshift__(self, other): ...
    def __rshift__(self, other): ...  # x >> y
    def __rrshift__(self, other): ...
    def __irshift__(self, other): ...

    # Type conversion
    def __int__(self): ...      # int(x)
    def __float__(self): ...    # float(x)
    def __complex__(self): ...  # complex(x)
    def __index__(self): ...    # Used for slicing, bin(), hex(), oct()
    def __trunc__(self): ...    # math.trunc(x)
    def __floor__(self): ...    # math.floor(x)
    def __ceil__(self): ...     # math.ceil(x)
    def __round__(self, n=0): ...  # round(x, n)
```

#### Duck Typing Considerations

Python integers implement `numbers.Integral` ABC (Abstract Base Class):

```python
from numbers import Number, Complex, Real, Rational, Integral

isinstance(42, Integral)   # True
isinstance(42, Rational)   # True
isinstance(42, Real)       # True
isinstance(42, Complex)    # True
isinstance(42, Number)     # True

# Required methods for Integral:
# __int__, __index__, __pow__ with modulo, __lshift__, __rshift__,
# __and__, __or__, __xor__, __invert__
```

---

### float

IEEE 754 double-precision 64-bit floating point numbers.

#### Type Name and Syntax

```python
# Type
float

# Class hierarchy
float.__bases__  # (object,)
```

#### Memory Representation

```python
import sys
import struct

sys.getsizeof(1.0)  # 24 bytes (fixed size)

# IEEE 754 double-precision format:
# - 1 bit sign
# - 11 bits exponent
# - 52 bits mantissa (fraction)

# View binary representation
struct.pack('d', 3.14)  # b'\x1f\x85\xebQ\xb8\x1e\t@'

# Precision limits
import sys
sys.float_info.max         # 1.7976931348623157e+308
sys.float_info.min         # 2.2250738585072014e-308
sys.float_info.epsilon     # 2.220446049250313e-16
sys.float_info.dig         # 15 (decimal digits of precision)
sys.float_info.mant_dig    # 53 (bits in mantissa)
```

#### Literal Syntax and Construction

```python
# Decimal notation
x = 3.14
x = .5       # 0.5
x = 5.       # 5.0
x = 1_000.5  # Underscores allowed

# Scientific notation
x = 3.14e10   # 3.14 * 10^10
x = 3.14E10   # Case insensitive
x = 3.14e-10
x = 1e100     # No decimal point needed

# Special values
x = float('inf')    # Positive infinity
x = float('-inf')   # Negative infinity
x = float('nan')    # Not a Number

# Constructor
float()           # 0.0
float(42)         # 42.0
float("3.14")     # 3.14
float("inf")      # inf
float("-infinity")  # -inf (flexible parsing)
float(True)       # 1.0
float(False)      # 0.0
```

#### Built-in Methods and Properties

```python
f = 3.14

# Check special values
import math
math.isnan(f)       # False
math.isinf(f)       # False
math.isfinite(f)    # True

# Instance methods
f.is_integer()      # False (3.0.is_integer() -> True)
f.as_integer_ratio()  # (7070651414971679, 2251799813685248)
f.hex()             # '0x1.91eb851eb851fp+1' (exact representation)

float.fromhex('0x1.91eb851eb851fp+1')  # 3.14

# Numeric properties
f.real      # 3.14
f.imag      # 0.0
f.conjugate()  # 3.14
```

#### Common Operations and Operators

```python
# Same arithmetic operators as int
# Division always returns float
5 / 2       # 2.5
5 // 2      # 2 (floor division returns int if both operands are int)
5.0 // 2    # 2.0 (floor division returns float if any operand is float)

# Comparison with NaN
nan = float('nan')
nan == nan  # False (!)
nan != nan  # True (!)

# Use math.isnan() for NaN checks
import math
math.isnan(nan)  # True

# Rounding functions
round(3.5)      # 4 (banker's rounding in Python 3)
round(2.5)      # 2 (rounds to nearest even)
round(3.14159, 2)  # 3.14

import math
math.floor(3.7)   # 3
math.ceil(3.2)    # 4
math.trunc(3.7)   # 3
math.trunc(-3.7)  # -3
```

#### Type Conversion/Coercion Rules

```python
# Explicit
int(3.7)       # 3 (truncates toward zero)
int(-3.7)      # -3
str(3.14)      # '3.14'
bool(0.0)      # False
bool(0.1)      # True
bool(float('nan'))  # True (!)
complex(3.14)  # (3.14+0j)

# Implicit promotion
3.14 + 42      # 45.14 (int promoted to float)
3.14 + (1+2j)  # (4.140000000000001+2j) (float promoted to complex)
```

#### Magic Methods

Same as `int` except:
- No bitwise operations (`__and__`, `__or__`, `__xor__`, `__lshift__`, `__rshift__`, `__invert__`)
- No `__index__` method

Additional method:
```python
def __getformat__(typestr): ...  # Get float format info
def __set_format__(typestr, fmt): ...  # Set float format (deprecated)
```

#### Duck Typing Considerations

```python
from numbers import Real, Complex, Number

isinstance(3.14, Real)     # True
isinstance(3.14, Complex)  # True
isinstance(3.14, Number)   # True
```

---

### complex

Complex numbers with real and imaginary parts (both stored as `float`).

#### Type Name and Syntax

```python
# Type
complex

# Class hierarchy
complex.__bases__  # (object,)
```

#### Memory Representation

```python
import sys
sys.getsizeof(1+2j)  # 32 bytes (two 64-bit floats + overhead)
```

#### Literal Syntax and Construction

```python
# Literal syntax (j or J suffix for imaginary)
z = 3+4j
z = 3.14+2.71j
z = 1j          # Pure imaginary
z = 0j          # Zero
z = 3+4J        # Case insensitive

# Note: Must use j, not i
# Note: No space allowed: 3 + 4j is addition, not literal

# Constructor
complex()           # 0j
complex(3)          # (3+0j)
complex(3, 4)       # (3+4j)
complex(3.0, 4.0)   # (3+4j)
complex("3+4j")     # (3+4j) - no spaces in string!
complex("3")        # (3+0j)
complex(1+2j, 3+4j) # (-3+5j) - complex(a, b) = a + b*1j
```

#### Built-in Methods and Properties

```python
z = 3+4j

# Properties (read-only)
z.real        # 3.0
z.imag        # 4.0

# Methods
z.conjugate() # (3-4j)

# Common operations via cmath module
import cmath
abs(z)              # 5.0 (magnitude)
cmath.phase(z)      # 0.9272952180016122 (angle in radians)
cmath.polar(z)      # (5.0, 0.9272952180016122) (r, phi)
cmath.rect(5, 0.927)  # Reconstruct from polar

# Exponential and logarithms
cmath.exp(z)
cmath.log(z)
cmath.log10(z)

# Trigonometric
cmath.sin(z)
cmath.cos(z)
cmath.tan(z)

# Hyperbolic
cmath.sinh(z)
cmath.cosh(z)
cmath.tanh(z)

# Square root
cmath.sqrt(z)
cmath.sqrt(-1)      # 1j
```

#### Common Operations and Operators

```python
z1 = 3+4j
z2 = 1+2j

# Arithmetic
z1 + z2     # (4+6j)
z1 - z2     # (2+2j)
z1 * z2     # (-5+10j)
z1 / z2     # (2.2-0.4j)
z1 ** 2     # (-7+24j)
-z1         # (-3-4j)
+z1         # (3+4j)
abs(z1)     # 5.0

# Comparison (only equality)
z1 == z2    # False
z1 != z2    # True
# z1 < z2   # TypeError: not supported

# No floor division or modulo
# z1 // z2  # TypeError
# z1 % z2   # TypeError
```

#### Type Conversion/Coercion Rules

```python
# Cannot convert to int or float
int(3+4j)     # TypeError
float(3+4j)   # TypeError

# Can convert to bool and str
bool(0+0j)    # False
bool(1+0j)    # True
bool(0+1j)    # True
str(3+4j)     # '(3+4j)'

# Implicit promotion
3 + 4j        # int -> complex
3.14 + 4j     # float -> complex
```

#### Magic Methods

Complex supports:
- `__repr__`, `__str__`, `__format__`
- `__eq__`, `__ne__`, `__hash__`, `__bool__`
- `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__pow__` (and reflected versions)
- `__neg__`, `__pos__`, `__abs__`
- `__complex__`

Does NOT support:
- Comparison operators (`__lt__`, `__le__`, `__gt__`, `__ge__`)
- Floor division, modulo
- Bitwise operations
- `__int__`, `__float__`, `__index__`

---

### bool

Boolean type, subclass of `int`.

#### Type Name and Syntax

```python
# Type
bool

# Class hierarchy - bool is a subclass of int!
bool.__bases__  # (int,)
bool.__mro__    # (bool, int, object)

# Singleton instances
True
False
```

#### Memory Representation

```python
import sys
sys.getsizeof(True)   # 28 bytes
sys.getsizeof(False)  # 24 bytes

# True and False are singletons
a = True
b = bool(1)
a is b    # True (same object)

# Identity
id(True)   # Always same
id(False)  # Always same
```

#### Literal Syntax and Construction

```python
# Literals (case-sensitive)
True
False
# true, false, TRUE, FALSE are not valid

# Constructor
bool()           # False
bool(0)          # False
bool(1)          # True
bool(42)         # True
bool(-1)         # True
bool(0.0)        # False
bool(0.1)        # True
bool("")         # False
bool("False")    # True (non-empty string!)
bool([])         # False
bool([1,2,3])    # True
bool(None)       # False
```

#### Truthiness Rules

```python
# Falsy values (evaluate to False)
False
None
0               # Zero of any numeric type
0.0
0j
""              # Empty string
[]              # Empty list
()              # Empty tuple
{}              # Empty dict
set()           # Empty set
frozenset()     # Empty frozenset
range(0)        # Empty range

# Custom objects: __bool__ or __len__
class Falsy:
    def __bool__(self):
        return False

class Empty:
    def __len__(self):
        return 0

bool(Falsy())  # False
bool(Empty())  # False
```

#### Common Operations and Operators

```python
# Boolean operators (short-circuit)
True and False   # False
True or False    # True
not True         # False

# Note: and/or return the determining value, not necessarily bool
1 and 2          # 2
0 and 2          # 0
1 or 2           # 1
0 or 2           # 2

# Comparison operators return bool
3 < 5            # True
3 == 3           # True

# Since bool is subclass of int, arithmetic works
True + True      # 2
True * 10        # 10
False - True     # -1
sum([True, True, False, True])  # 3
```

#### Type Conversion/Coercion Rules

```python
# To int (inherited behavior)
int(True)    # 1
int(False)   # 0

# To float
float(True)  # 1.0
float(False) # 0.0

# To string
str(True)    # 'True'
str(False)   # 'False'

# Bool cannot be subclassed
# class MyBool(bool): pass  # TypeError
```

#### Magic Methods

Inherits all from `int`, overrides:
```python
def __repr__(self): ...  # 'True' or 'False'
def __str__(self): ...   # 'True' or 'False'
def __and__(self, other): ...  # Bitwise and (1 & 0 = 0)
def __or__(self, other): ...   # Bitwise or (1 | 0 = 1)
def __xor__(self, other): ...  # Bitwise xor (1 ^ 1 = 0)
```

---

## Sequence Types

### str

Immutable sequence of Unicode code points.

#### Type Name and Syntax

```python
# Type
str

# Class hierarchy
str.__bases__  # (object,)

# Implements Sequence ABC
from collections.abc import Sequence
isinstance("hello", Sequence)  # True
```

#### Memory Representation

```python
import sys

# CPython uses flexible string representation (PEP 393)
# ASCII strings use 1 byte per character
sys.getsizeof("")      # 49 bytes (base overhead)
sys.getsizeof("a")     # 50 bytes
sys.getsizeof("abc")   # 52 bytes

# Latin-1 (0-255) uses 1 byte per character
sys.getsizeof("\xff")  # 50 bytes

# BMP characters (U+0100 to U+FFFF) use 2 bytes per character
sys.getsizeof("\u0100")  # 76 bytes (different base + 2 bytes)

# Non-BMP characters (U+10000+) use 4 bytes per character
sys.getsizeof("\U0001F600")  # 80 bytes

# String interning (for identifiers and small strings)
a = "hello"
b = "hello"
a is b  # True (interned)

a = "hello world!"
b = "hello world!"
a is b  # May be False (not interned)

# Explicit interning
import sys
a = sys.intern("hello world!")
b = sys.intern("hello world!")
a is b  # True
```

#### Literal Syntax and Construction

```python
# Single quotes
'hello'
'it\'s'

# Double quotes
"hello"
"she said \"hi\""

# Triple quotes (multi-line)
'''multi
line'''

"""also
multi-line"""

# Raw strings (no escape processing)
r"C:\Users\name"
r'no\escape'

# Formatted strings (f-strings, Python 3.6+)
name = "world"
f"hello {name}"          # 'hello world'
f"{2 + 2}"               # '4'
f"{name!r}"              # "'world'" (repr)
f"{name!s}"              # 'world' (str)
f"{3.14159:.2f}"         # '3.14' (format spec)
f"{name:>10}"            # '     world' (padding)

# Byte strings (not str, but bytes)
b"hello"

# Unicode escapes
"\u0041"      # 'A'
"\U0001F600"  # emoji
"\N{SNOWMAN}" # named character
"\x41"        # hex escape

# Constructor
str()              # ''
str(42)            # '42'
str(3.14)          # '3.14'
str([1, 2, 3])     # '[1, 2, 3]'
str(b'hello', 'utf-8')           # 'hello' (decode bytes)
str(b'hello', 'utf-8', 'ignore') # With error handling
```

#### Built-in Methods and Properties

```python
s = "Hello, World!"

# Case methods
s.lower()          # 'hello, world!'
s.upper()          # 'HELLO, WORLD!'
s.capitalize()     # 'Hello, world!'
s.title()          # 'Hello, World!'
s.swapcase()       # 'hELLO, wORLD!'
s.casefold()       # 'hello, world!' (aggressive lowercase for caseless matching)

# Search methods
s.find('o')        # 4 (first occurrence, -1 if not found)
s.rfind('o')       # 8 (last occurrence)
s.index('o')       # 4 (like find, but raises ValueError)
s.rindex('o')      # 8
s.count('o')       # 2
s.startswith('Hello')  # True
s.endswith('!')        # True
'o' in s              # True

# Modification methods (return new string)
s.replace('World', 'Python')  # 'Hello, Python!'
s.strip()          # Remove whitespace from both ends
s.lstrip()         # Remove from left
s.rstrip()         # Remove from right
s.strip('!')       # Remove specific chars
"  hello  ".strip()  # 'hello'

# Split and join
s.split(',')       # ['Hello', ' World!']
s.split()          # ['Hello,', 'World!'] (whitespace)
s.rsplit(',', 1)   # ['Hello', ' World!'] (maxsplit)
s.splitlines()     # Split on line boundaries
','.join(['a', 'b', 'c'])  # 'a,b,c'
s.partition(',')   # ('Hello', ',', ' World!')
s.rpartition(',')  # ('Hello', ',', ' World!')

# Padding and alignment
'hello'.ljust(10)       # 'hello     '
'hello'.rjust(10)       # '     hello'
'hello'.center(10)      # '  hello   '
'hello'.zfill(10)       # '00000hello'
'42'.zfill(5)           # '00042'

# Testing methods
'hello'.isalpha()       # True
'hello123'.isalnum()    # True
'123'.isdigit()         # True
'123'.isnumeric()       # True (includes fractions, etc.)
'123'.isdecimal()       # True
'HELLO'.isupper()       # True
'hello'.islower()       # True
'Hello World'.istitle() # True
'   '.isspace()         # True
'hello'.isascii()       # True (Python 3.7+)
'hello'.isprintable()   # True
'_hello'.isidentifier() # True

# Encoding
'hello'.encode('utf-8')      # b'hello'
'hello'.encode('utf-16')     # b'\xff\xfeh\x00e\x00l\x00l\x00o\x00'

# Formatting
'{} {}'.format('hello', 'world')  # 'hello world'
'{0} {1}'.format('hello', 'world')
'{name}'.format(name='world')
'%s %d' % ('hello', 42)           # Old style

# Translation
table = str.maketrans('aeiou', '12345')
'hello'.translate(table)  # 'h2ll4'

# Remove prefix/suffix (Python 3.9+)
'HelloWorld'.removeprefix('Hello')  # 'World'
'HelloWorld'.removesuffix('World')  # 'Hello'
```

#### Common Operations and Operators

```python
# Concatenation
'hello' + ' ' + 'world'  # 'hello world'

# Repetition
'ab' * 3                 # 'ababab'

# Indexing (0-based)
s = 'hello'
s[0]     # 'h'
s[-1]    # 'o'
s[10]    # IndexError

# Slicing
s[1:4]   # 'ell'
s[::2]   # 'hlo' (every 2nd char)
s[::-1]  # 'olleh' (reverse)

# Length
len(s)   # 5

# Iteration
for char in s:
    print(char)

# Comparison (lexicographic, Unicode code points)
'abc' < 'abd'   # True
'abc' == 'ABC'  # False

# Membership
'ell' in 'hello'  # True
```

#### Type Conversion/Coercion Rules

```python
# To other types
int('42')          # 42
int('2A', 16)      # 42
float('3.14')      # 3.14
bool('')           # False
bool('anything')   # True
list('abc')        # ['a', 'b', 'c']
tuple('abc')       # ('a', 'b', 'c')

# From other types
str(42)            # '42'
str([1,2,3])       # '[1, 2, 3]'
repr([1,2,3])      # '[1, 2, 3]' (unambiguous)
ascii('caf\xe9')   # "'caf\\xe9'" (ASCII only)

# Format method
format(42, 'd')    # '42'
format(3.14, '.2f')  # '3.14'
```

#### Magic Methods

```python
class str:
    # Creation and representation
    def __new__(cls, *args, **kwargs): ...
    def __repr__(self): ...
    def __str__(self): ...
    def __format__(self, spec): ...

    # Comparison and hashing
    def __eq__(self, other): ...
    def __ne__(self, other): ...
    def __lt__(self, other): ...
    def __le__(self, other): ...
    def __gt__(self, other): ...
    def __ge__(self, other): ...
    def __hash__(self): ...
    def __bool__(self): ...  # True if non-empty

    # Container operations
    def __len__(self): ...
    def __getitem__(self, key): ...  # Indexing and slicing
    def __contains__(self, item): ...  # 'in' operator
    def __iter__(self): ...

    # String operations
    def __add__(self, other): ...  # Concatenation
    def __mul__(self, n): ...      # Repetition
    def __rmul__(self, n): ...
    def __mod__(self, args): ...   # % formatting

    # Encoding
    def __getnewargs__(self): ...  # For pickling
```

#### Duck Typing Considerations

```python
from collections.abc import Sequence, Iterable, Hashable

isinstance('hello', Sequence)  # True
isinstance('hello', Iterable)  # True
isinstance('hello', Hashable)  # True

# String-like objects should implement:
# __str__, __repr__, __len__, __getitem__, __iter__, __contains__
# __add__ (concatenation), __mul__ (repetition)
```

---

### bytes

Immutable sequence of bytes (integers 0-255).

#### Type Name and Syntax

```python
# Type
bytes

# Class hierarchy
bytes.__bases__  # (object,)
```

#### Memory Representation

```python
import sys
sys.getsizeof(b'')      # 33 bytes (base)
sys.getsizeof(b'hello') # 38 bytes (33 + 5)
# 1 byte per byte (no encoding overhead)
```

#### Literal Syntax and Construction

```python
# Byte literals (ASCII only in literal)
b'hello'
b"hello"
b'''multi
line'''

# Escape sequences
b'\x00'        # Null byte
b'\xff'        # 255
b'\n'          # Newline
b'\\'          # Backslash

# Raw bytes
rb'\n'         # Two bytes: backslash and n

# Constructor
bytes()                    # b''
bytes(5)                   # b'\x00\x00\x00\x00\x00' (5 zero bytes)
bytes([72, 101, 108, 108, 111])  # b'Hello'
bytes(range(256))          # All possible byte values
bytes('hello', 'utf-8')    # b'hello'
'hello'.encode('utf-8')    # b'hello' (preferred)

# From hex
bytes.fromhex('48656c6c6f')  # b'Hello'
bytes.fromhex('48 65 6c 6c 6f')  # Spaces ignored
```

#### Built-in Methods and Properties

```python
b = b'Hello, World!'

# Most str methods work on bytes
b.lower()        # b'hello, world!'
b.upper()        # b'HELLO, WORLD!'
b.find(b'o')     # 4
b.split(b',')    # [b'Hello', b' World!']
b','.join([b'a', b'b'])  # b'a,b'
b.replace(b'World', b'Python')  # b'Hello, Python!'
b.strip()        # Remove whitespace bytes
b.startswith(b'Hello')  # True

# Bytes-specific methods
b.hex()                  # '48656c6c6f2c20576f726c6421'
b.hex(' ')               # '48 65 6c 6c 6f...' (with separator)
b.decode('utf-8')        # 'Hello, World!'
b.decode('utf-8', 'ignore')   # Error handling
b.decode('utf-8', 'replace')  # Replace errors with ?

# Translation
table = bytes.maketrans(b'aeiou', b'12345')
b'hello'.translate(table)  # b'h2ll4'

# Remove prefix/suffix (Python 3.9+)
b'HelloWorld'.removeprefix(b'Hello')  # b'World'
```

#### Common Operations and Operators

```python
# Same as str
b'hello' + b' world'   # b'hello world'
b'ab' * 3              # b'ababab'
b'hello'[0]            # 104 (int, not bytes!)
b'hello'[1:4]          # b'ell' (slice returns bytes)
len(b'hello')          # 5
104 in b'hello'        # True (checks for int)
b'ell' in b'hello'     # True (checks for subsequence)
list(b'hello')         # [104, 101, 108, 108, 111]
```

#### Type Conversion/Coercion Rules

```python
# To string (decode)
b'hello'.decode('utf-8')      # 'hello'
str(b'hello', 'utf-8')        # 'hello'
str(b'hello')                 # "b'hello'" (repr, not decode!)

# To list
list(b'hello')  # [104, 101, 108, 108, 111]

# To bytearray
bytearray(b'hello')  # bytearray(b'hello')

# From string (encode)
'hello'.encode('utf-8')  # b'hello'
bytes('hello', 'utf-8')  # b'hello'
```

---

### bytearray

Mutable sequence of bytes (integers 0-255).

#### Type Name and Syntax

```python
# Type
bytearray

# Class hierarchy
bytearray.__bases__  # (object,)
```

#### Memory Representation

```python
import sys
sys.getsizeof(bytearray())        # 56 bytes (base, more than bytes)
sys.getsizeof(bytearray(b'hello'))  # 61 bytes
```

#### Literal Syntax and Construction

```python
# No literal syntax - must use constructor
bytearray()                      # bytearray(b'')
bytearray(5)                     # bytearray(b'\x00\x00\x00\x00\x00')
bytearray([72, 101, 108, 108, 111])  # bytearray(b'Hello')
bytearray(b'hello')              # bytearray(b'hello')
bytearray('hello', 'utf-8')      # bytearray(b'hello')
bytearray.fromhex('48656c6c6f')  # bytearray(b'Hello')
```

#### Built-in Methods and Properties

```python
ba = bytearray(b'Hello')

# Same methods as bytes, plus mutable methods:

# Assignment
ba[0] = 104           # bytearray(b'hello')
ba[1:3] = b'xx'       # bytearray(b'hxxlo')
ba[1:3] = b'ello'     # Can change size: bytearray(b'hellollo')

# List-like methods
ba.append(33)         # Append single byte
ba.extend(b'!!')      # Extend with bytes
ba.insert(0, 72)      # Insert at position
ba.pop()              # Remove and return last byte
ba.pop(0)             # Remove and return at position
ba.remove(101)        # Remove first occurrence of value
ba.clear()            # Remove all
ba.reverse()          # Reverse in place

# Copy
ba.copy()             # Shallow copy
```

#### Duck Typing Considerations

Both `bytes` and `bytearray` implement `collections.abc.ByteString`:

```python
from collections.abc import ByteString, MutableSequence

isinstance(b'hello', ByteString)           # True
isinstance(bytearray(b'hello'), ByteString)  # True
isinstance(bytearray(b'hello'), MutableSequence)  # True
isinstance(b'hello', MutableSequence)      # False
```

---

### list

Mutable sequence of arbitrary objects.

#### Type Name and Syntax

```python
# Type
list

# Class hierarchy
list.__bases__  # (object,)

# Implements MutableSequence ABC
from collections.abc import MutableSequence
isinstance([], MutableSequence)  # True
```

#### Memory Representation

```python
import sys

# Lists store references (pointers), not values
sys.getsizeof([])        # 56 bytes (base, empty list)
sys.getsizeof([1])       # 64 bytes
sys.getsizeof([1,2,3])   # 80 bytes

# Lists over-allocate for efficiency
# Actual memory = base + (pointer_size * allocated_slots)
# Pointer size: 8 bytes on 64-bit systems

# List resizing pattern (growth factor ~1.125)
lst = []
for i in range(20):
    print(f"{len(lst):2d}: {sys.getsizeof(lst):3d} bytes")
    lst.append(i)
# Shows jumps in allocation
```

#### Literal Syntax and Construction

```python
# Empty list
[]
list()

# With elements
[1, 2, 3]
[1, 'hello', 3.14, None]  # Mixed types
[[1, 2], [3, 4]]          # Nested

# List comprehension
[x**2 for x in range(5)]              # [0, 1, 4, 9, 16]
[x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]
[x*y for x in [1,2] for y in [3,4]]   # [3, 4, 6, 8]

# Constructor
list()                   # []
list('hello')            # ['h', 'e', 'l', 'l', 'o']
list((1, 2, 3))          # [1, 2, 3]
list(range(5))           # [0, 1, 2, 3, 4]
list({1, 2, 3})          # [1, 2, 3] (order may vary)
list({'a': 1, 'b': 2})   # ['a', 'b'] (keys)
```

#### Built-in Methods and Properties

```python
lst = [3, 1, 4, 1, 5, 9]

# Adding elements
lst.append(2)            # Add to end: [3, 1, 4, 1, 5, 9, 2]
lst.extend([6, 5])       # Add multiple: [..., 2, 6, 5]
lst.insert(0, 0)         # Insert at index: [0, 3, 1, ...]
lst += [3, 5]            # Same as extend

# Removing elements
lst.pop()                # Remove and return last
lst.pop(0)               # Remove and return at index
lst.remove(1)            # Remove first occurrence of value
lst.clear()              # Remove all

# Searching
lst = [3, 1, 4, 1, 5]
lst.index(1)             # 1 (first occurrence)
lst.index(1, 2)          # 3 (search from index 2)
lst.count(1)             # 2
1 in lst                 # True

# Ordering
lst.sort()               # Sort in place: [1, 1, 3, 4, 5]
lst.sort(reverse=True)   # Descending: [5, 4, 3, 1, 1]
lst.sort(key=abs)        # Custom key function
lst.reverse()            # Reverse in place

# Copying
lst.copy()               # Shallow copy
lst[:]                   # Shallow copy via slicing
import copy
copy.deepcopy(lst)       # Deep copy
```

#### Common Operations and Operators

```python
# Concatenation
[1, 2] + [3, 4]          # [1, 2, 3, 4]

# Repetition
[0] * 5                  # [0, 0, 0, 0, 0]
# Caution with mutable elements:
[[]] * 3                 # [[], [], []] - same object repeated!

# Indexing
lst = [0, 1, 2, 3, 4]
lst[0]                   # 0
lst[-1]                  # 4
lst[10]                  # IndexError

# Slicing
lst[1:4]                 # [1, 2, 3]
lst[::2]                 # [0, 2, 4]
lst[::-1]                # [4, 3, 2, 1, 0]
lst[1:4] = [10, 20]      # Replace slice: [0, 10, 20, 4]
del lst[1:3]             # Delete slice: [0, 4]

# Comparison (lexicographic)
[1, 2] < [1, 3]          # True
[1, 2] == [1, 2]         # True (element-wise)
[1, 2] is [1, 2]         # False (different objects)

# Unpacking
a, b, c = [1, 2, 3]
first, *rest = [1, 2, 3, 4]  # first=1, rest=[2,3,4]
*init, last = [1, 2, 3, 4]   # init=[1,2,3], last=4
```

#### Type Conversion/Coercion Rules

```python
# To other types
tuple([1, 2, 3])         # (1, 2, 3)
set([1, 2, 2, 3])        # {1, 2, 3}
str([1, 2, 3])           # '[1, 2, 3]'
bool([])                 # False
bool([1])                # True

# From other types
list('abc')              # ['a', 'b', 'c']
list((1, 2, 3))          # [1, 2, 3]
list({1, 2, 3})          # [1, 2, 3]
list({'a': 1})           # ['a']
list(range(5))           # [0, 1, 2, 3, 4]
```

#### Magic Methods

```python
class list:
    # Creation
    def __init__(self, iterable=()): ...

    # Representation
    def __repr__(self): ...

    # Comparison
    def __eq__(self, other): ...
    def __ne__(self, other): ...
    def __lt__(self, other): ...
    def __le__(self, other): ...
    def __gt__(self, other): ...
    def __ge__(self, other): ...
    def __hash__(self): ...  # None! Lists are not hashable
    def __bool__(self): ...

    # Container
    def __len__(self): ...
    def __getitem__(self, key): ...
    def __setitem__(self, key, value): ...
    def __delitem__(self, key): ...
    def __contains__(self, item): ...
    def __iter__(self): ...
    def __reversed__(self): ...

    # Operations
    def __add__(self, other): ...   # Concatenation
    def __radd__(self, other): ...
    def __iadd__(self, other): ...  # In-place (extend)
    def __mul__(self, n): ...       # Repetition
    def __rmul__(self, n): ...
    def __imul__(self, n): ...      # In-place repetition
```

---

### tuple

Immutable sequence of arbitrary objects.

#### Type Name and Syntax

```python
# Type
tuple

# Class hierarchy
tuple.__bases__  # (object,)

# Implements Sequence ABC
from collections.abc import Sequence, Hashable
isinstance((), Sequence)  # True
isinstance((), Hashable)  # True (if all elements hashable)
```

#### Memory Representation

```python
import sys

# Tuples are more memory-efficient than lists
sys.getsizeof(())        # 40 bytes (base)
sys.getsizeof((1,))      # 48 bytes
sys.getsizeof((1,2,3))   # 64 bytes

# Compare to list
sys.getsizeof([])        # 56 bytes
sys.getsizeof([1])       # 64 bytes
sys.getsizeof([1,2,3])   # 80 bytes

# Small tuples may be cached
a = (1, 2)
b = (1, 2)
a is b  # May be True (implementation dependent)

# Empty tuple is singleton
() is ()  # True
```

#### Literal Syntax and Construction

```python
# Empty tuple
()
tuple()

# Single element (comma required!)
(1,)                     # Tuple
(1)                      # Just integer 1!
1,                       # Also tuple

# Multiple elements
(1, 2, 3)
1, 2, 3                  # Parentheses optional

# Nested
((1, 2), (3, 4))

# Generator expression (not tuple!)
(x**2 for x in range(5))  # Generator, not tuple!

# Tuple from generator
tuple(x**2 for x in range(5))  # (0, 1, 4, 9, 16)

# Constructor
tuple()                  # ()
tuple('hello')           # ('h', 'e', 'l', 'l', 'o')
tuple([1, 2, 3])         # (1, 2, 3)
tuple(range(5))          # (0, 1, 2, 3, 4)
```

#### Built-in Methods and Properties

```python
t = (3, 1, 4, 1, 5, 9)

# Only two methods (immutable, so no modification methods)
t.count(1)               # 2
t.index(4)               # 2
t.index(1, 2)            # 3 (search from index 2)
```

#### Common Operations and Operators

```python
# Same as list (non-mutating operations)
(1, 2) + (3, 4)          # (1, 2, 3, 4)
(0,) * 5                 # (0, 0, 0, 0, 0)
t = (0, 1, 2, 3, 4)
t[0]                     # 0
t[-1]                    # 4
t[1:4]                   # (1, 2, 3)
len(t)                   # 5
3 in t                   # True

# Comparison
(1, 2) < (1, 3)          # True
(1, 2) == (1, 2)         # True

# Unpacking
a, b, c = (1, 2, 3)
first, *rest = (1, 2, 3, 4)

# Tuple as dict key (hashable)
d = {(1, 2): 'point'}

# Named tuples (enhanced tuples)
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
p.x, p.y                 # 3, 4
p[0], p[1]               # 3, 4

# Typing module NamedTuple (Python 3.6+)
from typing import NamedTuple
class Point(NamedTuple):
    x: float
    y: float
```

#### Type Conversion/Coercion Rules

```python
# To other types
list((1, 2, 3))          # [1, 2, 3]
set((1, 2, 2, 3))        # {1, 2, 3}
str((1, 2, 3))           # '(1, 2, 3)'
bool(())                 # False
bool((1,))               # True

# Hashability depends on contents
hash((1, 2, 3))          # Works
hash((1, [2], 3))        # TypeError: unhashable type: 'list'
```

#### Magic Methods

Same as list, but without mutation methods (`__setitem__`, `__delitem__`, `__iadd__`, `__imul__`).

Has `__hash__` (if all elements are hashable).

---

## Mapping Types

### dict

Mutable mapping of hashable keys to arbitrary values.

#### Type Name and Syntax

```python
# Type
dict

# Class hierarchy
dict.__bases__  # (object,)

# Implements MutableMapping ABC
from collections.abc import MutableMapping
isinstance({}, MutableMapping)  # True
```

#### Memory Representation

```python
import sys

# Dicts use hash tables with open addressing
sys.getsizeof({})                    # 64 bytes (empty)
sys.getsizeof({'a': 1})              # 184 bytes
sys.getsizeof({'a': 1, 'b': 2})      # 184 bytes (same bucket)

# Python 3.7+ guarantees insertion order
# Compact dict representation (PEP 412):
# - Separate arrays for keys and values
# - Sparse hash table indexes into dense arrays
# - More memory efficient than Python 2

# Key must be hashable
{[1,2]: 'value'}  # TypeError: unhashable type: 'list'
{(1,2): 'value'}  # OK

# Dict views share memory with dict
d = {'a': 1, 'b': 2}
keys = d.keys()     # View, not copy
d['c'] = 3
list(keys)          # ['a', 'b', 'c'] - reflects changes
```

#### Literal Syntax and Construction

```python
# Empty dict
{}
dict()

# Key-value pairs
{'a': 1, 'b': 2}
{1: 'one', 2: 'two'}
{(1,2): 'tuple key'}

# Dict comprehension
{x: x**2 for x in range(5)}  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
{k: v for k, v in [('a', 1), ('b', 2)]}

# Constructor
dict()                       # {}
dict(a=1, b=2)               # {'a': 1, 'b': 2}
dict([('a', 1), ('b', 2)])   # From pairs
dict({'a': 1}, b=2)          # Combine
dict.fromkeys(['a', 'b'], 0) # {'a': 0, 'b': 0}
dict.fromkeys('abc')         # {'a': None, 'b': None, 'c': None}
```

#### Built-in Methods and Properties

```python
d = {'a': 1, 'b': 2, 'c': 3}

# Access
d['a']                   # 1
d['x']                   # KeyError
d.get('a')               # 1
d.get('x')               # None
d.get('x', 'default')    # 'default'

# Views
d.keys()                 # dict_keys(['a', 'b', 'c'])
d.values()               # dict_values([1, 2, 3])
d.items()                # dict_items([('a', 1), ('b', 2), ('c', 3)])

# Modification
d['d'] = 4               # Add/update
d.update({'e': 5})       # Update from dict
d.update(f=6)            # Update from kwargs
d.update([('g', 7)])     # Update from pairs
d.setdefault('h', 8)     # Set if missing, return value
d.pop('a')               # Remove and return value
d.pop('x', 'default')    # With default
d.popitem()              # Remove and return last item (LIFO)
del d['b']               # Delete key
d.clear()                # Remove all

# Copying
d.copy()                 # Shallow copy

# Merging (Python 3.9+)
d1 = {'a': 1}
d2 = {'b': 2}
d1 | d2                  # {'a': 1, 'b': 2} (new dict)
d1 |= d2                 # Update d1 in place
```

#### Common Operations and Operators

```python
d = {'a': 1, 'b': 2}

# Membership (checks keys)
'a' in d                 # True
'x' in d                 # False
'x' not in d             # True

# Length
len(d)                   # 2

# Iteration (over keys by default)
for key in d:
    print(key)

for key, value in d.items():
    print(key, value)

# Comparison (Python 3)
{'a': 1} == {'a': 1}     # True (same content)
{'a': 1} == {'a': 1, 'b': 2}  # False

# No ordering comparison
# {'a': 1} < {'b': 2}    # TypeError

# Unpacking (Python 3.5+)
{**d, 'c': 3}            # {'a': 1, 'b': 2, 'c': 3}
def f(**kwargs): print(kwargs)
f(**d)                   # {'a': 1, 'b': 2}
```

#### Type Conversion/Coercion Rules

```python
# To other types
list({'a': 1, 'b': 2})   # ['a', 'b'] (keys)
tuple({'a': 1})          # ('a',) (keys)
set({'a': 1})            # {'a'} (keys)
str({'a': 1})            # "{'a': 1}"
bool({})                 # False
bool({'a': 1})           # True

# From other types
dict([('a', 1), ('b', 2)])  # From pairs
dict(zip(['a', 'b'], [1, 2]))  # From two iterables
```

#### Magic Methods

```python
class dict:
    # Representation
    def __repr__(self): ...

    # Comparison
    def __eq__(self, other): ...
    def __ne__(self, other): ...
    def __hash__(self): ...  # None! Dicts are not hashable
    def __bool__(self): ...

    # Container
    def __len__(self): ...
    def __getitem__(self, key): ...
    def __setitem__(self, key, value): ...
    def __delitem__(self, key): ...
    def __contains__(self, key): ...
    def __iter__(self): ...  # Iterates over keys
    def __reversed__(self): ...  # Python 3.8+

    # Merging (Python 3.9+)
    def __or__(self, other): ...   # d1 | d2
    def __ror__(self, other): ...
    def __ior__(self, other): ...  # d1 |= d2
```

---

## Set Types

### set

Mutable unordered collection of unique hashable objects.

#### Type Name and Syntax

```python
# Type
set

# Class hierarchy
set.__bases__  # (object,)

# Implements MutableSet ABC
from collections.abc import MutableSet
isinstance(set(), MutableSet)  # True
```

#### Memory Representation

```python
import sys

# Sets use hash tables
sys.getsizeof(set())           # 216 bytes (empty)
sys.getsizeof({1})             # 216 bytes
sys.getsizeof({1, 2, 3, 4, 5}) # 216 bytes (same bucket size)

# Elements must be hashable
{[1, 2]}  # TypeError: unhashable type: 'list'
{(1, 2)}  # OK
```

#### Literal Syntax and Construction

```python
# Non-empty set (braces)
{1, 2, 3}
{'a', 'b', 'c'}
{1, 'mixed', 3.14}

# Empty set (no literal!)
set()       # Correct
{}          # This is an empty DICT, not set!

# Set comprehension
{x**2 for x in range(5)}  # {0, 1, 4, 9, 16}

# Constructor
set()                    # set()
set([1, 2, 2, 3])        # {1, 2, 3}
set('hello')             # {'h', 'e', 'l', 'o'}
set((1, 2, 3))           # {1, 2, 3}
set(range(5))            # {0, 1, 2, 3, 4}
```

#### Built-in Methods and Properties

```python
s = {1, 2, 3, 4, 5}

# Modification
s.add(6)                 # Add element
s.update([7, 8])         # Add multiple elements
s.update({9}, [10])      # From multiple iterables
s.remove(1)              # Remove (raises KeyError if missing)
s.discard(1)             # Remove (no error if missing)
s.pop()                  # Remove and return arbitrary element
s.clear()                # Remove all

# Set operations (return new set)
a = {1, 2, 3}
b = {2, 3, 4}
a.union(b)               # {1, 2, 3, 4}
a.intersection(b)        # {2, 3}
a.difference(b)          # {1}
a.symmetric_difference(b) # {1, 4}

# Set operations (modify in place)
a.update(b)              # a |= b (union)
a.intersection_update(b) # a &= b (intersection)
a.difference_update(b)   # a -= b (difference)
a.symmetric_difference_update(b)  # a ^= b

# Comparison
a = {1, 2}
b = {1, 2, 3}
a.issubset(b)            # True
a.issuperset(b)          # False
a.isdisjoint({4, 5})     # True (no common elements)

# Copying
s.copy()                 # Shallow copy
```

#### Common Operations and Operators

```python
a = {1, 2, 3}
b = {2, 3, 4}

# Set operations (operators)
a | b        # Union: {1, 2, 3, 4}
a & b        # Intersection: {2, 3}
a - b        # Difference: {1}
a ^ b        # Symmetric difference: {1, 4}

# In-place operators
a |= b       # Union update
a &= b       # Intersection update
a -= b       # Difference update
a ^= b       # Symmetric difference update

# Comparison operators
{1, 2} <= {1, 2, 3}   # Subset: True
{1, 2} < {1, 2, 3}    # Proper subset: True
{1, 2, 3} >= {1, 2}   # Superset: True
{1, 2, 3} > {1, 2}    # Proper superset: True
{1, 2} == {2, 1}      # Equal (order doesn't matter): True

# Membership
1 in {1, 2, 3}        # True
5 in {1, 2, 3}        # False

# Length
len({1, 2, 3})        # 3

# Iteration (order not guaranteed before Python 3.7)
for item in {1, 2, 3}:
    print(item)
```

#### Type Conversion/Coercion Rules

```python
# To other types
list({1, 2, 3})          # [1, 2, 3] (order may vary)
tuple({1, 2, 3})         # (1, 2, 3)
frozenset({1, 2, 3})     # frozenset({1, 2, 3})
str({1, 2, 3})           # '{1, 2, 3}'
bool(set())              # False
bool({1})                # True
```

#### Magic Methods

```python
class set:
    # Representation
    def __repr__(self): ...

    # Comparison
    def __eq__(self, other): ...
    def __ne__(self, other): ...
    def __lt__(self, other): ...   # Proper subset
    def __le__(self, other): ...   # Subset
    def __gt__(self, other): ...   # Proper superset
    def __ge__(self, other): ...   # Superset
    def __hash__(self): ...        # None! Sets are not hashable
    def __bool__(self): ...

    # Container
    def __len__(self): ...
    def __contains__(self, item): ...
    def __iter__(self): ...

    # Set operations
    def __and__(self, other): ...   # Intersection
    def __rand__(self, other): ...
    def __iand__(self, other): ...
    def __or__(self, other): ...    # Union
    def __ror__(self, other): ...
    def __ior__(self, other): ...
    def __sub__(self, other): ...   # Difference
    def __rsub__(self, other): ...
    def __isub__(self, other): ...
    def __xor__(self, other): ...   # Symmetric difference
    def __rxor__(self, other): ...
    def __ixor__(self, other): ...
```

---

### frozenset

Immutable version of set.

#### Type Name and Syntax

```python
# Type
frozenset

# Class hierarchy
frozenset.__bases__  # (object,)

# Implements Set ABC (not MutableSet)
from collections.abc import Set, Hashable
isinstance(frozenset(), Set)       # True
isinstance(frozenset(), Hashable)  # True
```

#### Memory Representation

```python
import sys
sys.getsizeof(frozenset())         # 216 bytes (same as set)
sys.getsizeof(frozenset({1,2,3}))  # 216 bytes

# Empty frozenset is cached
frozenset() is frozenset()  # True
```

#### Literal Syntax and Construction

```python
# No literal syntax
frozenset()                  # frozenset()
frozenset([1, 2, 3])         # frozenset({1, 2, 3})
frozenset({1, 2, 3})         # frozenset({1, 2, 3})
frozenset('hello')           # frozenset({'h', 'e', 'l', 'o'})
```

#### Built-in Methods

Same as set, but without modification methods (`add`, `remove`, `discard`, `pop`, `clear`, `update`, etc.).

Supports all non-mutating set operations:
- `union`, `intersection`, `difference`, `symmetric_difference`
- `issubset`, `issuperset`, `isdisjoint`
- `copy`

#### Use Cases

```python
# As dict key (hashable)
d = {frozenset({1, 2}): 'value'}

# As set element
s = {frozenset({1, 2}), frozenset({3, 4})}

# Immutable set for constants
VALID_STATES = frozenset({'pending', 'active', 'completed'})
```

---

## None Type

### NoneType

The sole value `None` represents the absence of a value.

#### Type Name and Syntax

```python
# Type
type(None)        # <class 'NoneType'>
type(None).__name__  # 'NoneType'

# Cannot instantiate directly
# NoneType()      # NameError: name 'NoneType' is not defined

# Access via types module
from types import NoneType  # Python 3.10+
```

#### Memory Representation

```python
import sys
sys.getsizeof(None)  # 16 bytes

# None is a singleton
a = None
b = None
a is b  # True
id(None)  # Always same address
```

#### Literal Syntax

```python
# Only one way to write None
None

# Case-sensitive
none  # NameError
NONE  # NameError
null  # NameError (not JavaScript!)
```

#### Common Usage Patterns

```python
# Default parameter
def greet(name=None):
    if name is None:
        name = "World"
    print(f"Hello, {name}!")

# Optional return value
def find(lst, value):
    for i, item in enumerate(lst):
        if item == value:
            return i
    return None  # Explicit None return

# Implicit None return
def no_return():
    pass  # Returns None implicitly

result = no_return()
print(result)  # None

# None comparison
x = None
x is None      # True (preferred)
x == None      # True (works but not idiomatic)
x is not None  # True (preferred for not None)
```

#### Type Conversion

```python
bool(None)     # False
str(None)      # 'None'
repr(None)     # 'None'

# Cannot convert to numeric types
int(None)      # TypeError
float(None)    # TypeError
```

#### Magic Methods

```python
# None has minimal methods
dir(None)
# ['__bool__', '__class__', '__delattr__', '__doc__', '__eq__',
#  '__format__', '__ge__', '__getattribute__', '__gt__', '__hash__',
#  '__init__', '__init_subclass__', '__le__', '__lt__', '__ne__',
#  '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__',
#  '__sizeof__', '__str__', '__subclasshook__']

None.__bool__()  # False
None.__repr__()  # 'None'
hash(None)       # Some fixed integer (hashable)
```

---

## Type System and Duck Typing

### Duck Typing Philosophy

Python follows "duck typing": if it walks like a duck and quacks like a duck, it's a duck.

```python
# Don't check type, check behavior
def process(items):
    for item in items:  # Works with any iterable
        print(item)

# Works with list, tuple, set, string, generator, custom objects...
process([1, 2, 3])
process((1, 2, 3))
process({1, 2, 3})
process("abc")
process(x for x in range(3))
```

### Abstract Base Classes (ABCs)

Python provides ABCs to formalize duck typing:

```python
from collections.abc import (
    # Containers
    Container,      # __contains__
    Hashable,       # __hash__
    Iterable,       # __iter__
    Iterator,       # __iter__, __next__
    Reversible,     # __reversed__
    Generator,      # send, throw, close

    # Sized
    Sized,          # __len__

    # Callable
    Callable,       # __call__

    # Collections
    Collection,     # Sized + Iterable + Container

    # Sequences
    Sequence,       # Collection + __getitem__ + index + count
    MutableSequence,  # + __setitem__, __delitem__, insert, append, etc.

    # Mappings
    Mapping,        # Collection + __getitem__ + keys + items + values + get
    MutableMapping, # + __setitem__, __delitem__, pop, etc.

    # Sets
    Set,            # Collection + set operations
    MutableSet,     # + add, discard, etc.
)

# Type checking with ABCs
from collections.abc import Sequence
isinstance([1,2,3], Sequence)  # True
isinstance((1,2,3), Sequence)  # True
isinstance("abc", Sequence)    # True
isinstance({1,2,3}, Sequence)  # False (sets have no order)
```

### Protocol Classes (Python 3.8+)

Static duck typing with `typing.Protocol`:

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

def render(shape: Drawable) -> None:
    shape.draw()

# Circle is implicitly a Drawable (structural subtyping)
render(Circle())  # Works without explicit inheritance
```

### Type Checking Patterns

```python
# isinstance (check against class or ABC)
isinstance(x, int)
isinstance(x, (int, float))
isinstance(x, Sequence)

# type (exact type check, rarely needed)
type(x) is int
type(x) == int

# hasattr (check for attribute/method)
hasattr(x, '__iter__')
hasattr(x, 'read')

# try/except (EAFP - Easier to Ask Forgiveness than Permission)
try:
    iterator = iter(x)
except TypeError:
    print("Not iterable")

# callable
callable(x)  # Can x be called as a function?
```

---

## Comparison with JavaScript

### Overview Table

| Python | JavaScript | Notes |
|--------|------------|-------|
| `int` | `number`/`bigint` | Python int is arbitrary precision; JS number is 64-bit float |
| `float` | `number` | Both IEEE 754 double |
| `complex` | - | No native JS equivalent |
| `bool` | `boolean` | Similar, but Python `bool` is `int` subclass |
| `str` | `string` | Both Unicode; Python uses code points, JS uses UTF-16 |
| `bytes`/`bytearray` | `Uint8Array`/`ArrayBuffer` | Different APIs |
| `None` | `null`/`undefined` | Python has only `None` |
| `list` | `Array` | Similar functionality |
| `tuple` | - | JS arrays are mutable; use `Object.freeze` or libs |
| `dict` | `Object`/`Map` | `Map` is closer to dict |
| `set`/`frozenset` | `Set` | JS `Set` is mutable only |

### Detailed Comparisons

#### Numbers

```python
# Python
x = 10**100                    # Arbitrary precision
y = 3.14                       # 64-bit float
z = 1 + 2j                     # Native complex

# Division
10 / 3                         # 3.333... (true division)
10 // 3                        # 3 (floor division)
```

```javascript
// JavaScript
let x = 10n ** 100n;           // BigInt (separate type)
let y = 3.14;                  // 64-bit float
// No native complex

// Division
10 / 3                         // 3.333... (always float)
Math.floor(10 / 3)             // 3 (explicit floor)

// TypeScript consideration:
// number vs bigint are incompatible types
// Need explicit conversion: Number(bigint) or BigInt(number)
```

**TypeScript Library Implications:**
- Need separate types for arbitrary precision integers
- Consider using libraries like `bignumber.js` or `decimal.js`
- Complex numbers need custom implementation

#### Booleans

```python
# Python
True + True         # 2 (bool is int subclass)
bool([])            # False (truthiness based on __bool__ or __len__)
bool(0)             # False
bool("")            # False
```

```javascript
// JavaScript
true + true         // 2 (implicit conversion)
Boolean([])         // true (!) - only null/undefined/0/""/NaN/false are falsy
Boolean(0)          // false
Boolean("")         // false

// TypeScript:
// Strict boolean checks available with strictNullChecks
```

**TypeScript Library Implications:**
- Truthiness rules differ significantly
- Python's `bool([])` is `False`, JS's `Boolean([])` is `true`
- Need explicit truthiness helper matching Python semantics

#### Strings

```python
# Python
s = "hello"
s[0]                # 'h' (single char is still str)
len("🎉")           # 1 (counts code points)
"🎉".encode()       # b'\xf0\x9f\x8e\x89' (4 bytes)

# String methods
"hello".upper()
"  hello  ".strip()
"a,b,c".split(",")
",".join(["a", "b"])
```

```javascript
// JavaScript
let s = "hello";
s[0]                // 'h' (or s.charAt(0))
"🎉".length         // 2 (!) - counts UTF-16 code units
[..."🎉"].length    // 1 (spread uses iterator, gets code points)

// String methods (similar but different names/behavior)
"hello".toUpperCase()
"  hello  ".trim()
"a,b,c".split(",")
["a", "b"].join(",")
```

**TypeScript Library Implications:**
- String length semantics differ for non-BMP characters
- Need careful handling of Unicode in string operations
- Some method names differ (`.upper()` vs `.toUpperCase()`)

#### None vs null/undefined

```python
# Python - single "no value" concept
x = None
x is None           # Idiomatic check
```

```javascript
// JavaScript - two "no value" concepts
let x = null;       // Explicit absence
let y;              // undefined (implicit absence)
y === undefined     // true

// TypeScript:
// strictNullChecks distinguishes T, T | null, T | undefined, T | null | undefined
```

**TypeScript Library Implications:**
- Map Python's `None` to `null` (explicit absence)
- Handle `undefined` for missing properties/parameters
- Consider `Option<T>` or `Maybe<T>` monad pattern

#### Lists vs Arrays

```python
# Python
lst = [1, 2, 3]
lst.append(4)       # In-place
lst.extend([5, 6])  # In-place
lst + [7, 8]        # New list
lst * 2             # [1,2,3,4,5,6,1,2,3,4,5,6]
lst[1:3]            # Slice: [2, 3]
lst[-1]             # Last element: 6

# List comprehension
[x**2 for x in lst if x > 2]
```

```javascript
// JavaScript
let arr = [1, 2, 3];
arr.push(4);        // In-place, returns length
arr.push(5, 6);     // Multiple values
arr.concat([7, 8]); // New array
// No repeat operator
arr.slice(1, 3);    // Slice: [2, 3]
arr.at(-1);         // Last element (ES2022)
arr[arr.length - 1] // Last element (traditional)

// Array methods
arr.filter(x => x > 2).map(x => x**2)
```

**TypeScript Library Implications:**
- Method names differ (`.append()` vs `.push()`)
- Slicing syntax can't be replicated; need method
- Negative indexing needs helper or `.at()`
- List comprehensions map to `.filter().map()` chain

#### Dictionaries vs Objects/Maps

```python
# Python dict
d = {'a': 1, 'b': 2}
d['a']              # 1
d['c']              # KeyError
d.get('c')          # None
d.get('c', 0)       # 0
'a' in d            # True
d.keys()            # dict_keys(['a', 'b'])
d.values()          # dict_values([1, 2])
d.items()           # dict_items([('a', 1), ('b', 2)])

# Iteration
for key in d: ...
for key, value in d.items(): ...
```

```javascript
// JavaScript Object
let obj = {a: 1, b: 2};
obj.a               // 1
obj.c               // undefined (no error!)
obj.c ?? 0          // 0 (nullish coalescing)
'a' in obj          // true
Object.keys(obj)    // ['a', 'b']
Object.values(obj)  // [1, 2]
Object.entries(obj) // [['a', 1], ['b', 2]]

// JavaScript Map (closer to Python dict)
let map = new Map([['a', 1], ['b', 2]]);
map.get('a')        // 1
map.get('c')        // undefined
map.has('a')        // true
map.keys()          // MapIterator
map.values()        // MapIterator
map.entries()       // MapIterator

// Iteration
for (let [key, value] of map) { ... }
```

**TypeScript Library Implications:**
- Python dict's `KeyError` vs JS's silent `undefined`
- `Map` preserves insertion order and allows non-string keys
- Need to decide between Object and Map semantics
- Consider wrapper class with Python-like `.get()` behavior

#### Sets

```python
# Python
s = {1, 2, 3}
s.add(4)
s.remove(5)         # KeyError if missing
s.discard(5)        # No error
s | {4, 5}          # Union
s & {2, 3}          # Intersection
s - {1}             # Difference
```

```javascript
// JavaScript
let s = new Set([1, 2, 3]);
s.add(4);
s.delete(5);        // Returns boolean, no error
// No built-in set operations!
// Need helper functions or libraries
```

**TypeScript Library Implications:**
- JS Set lacks set algebra operations
- Need to implement `union`, `intersection`, `difference`, etc.
- `frozenset` needs immutable wrapper

#### Type Checking

```python
# Python
isinstance(x, int)
isinstance(x, (int, float))
type(x) is int
```

```javascript
// JavaScript
typeof x === 'number'
x instanceof Array
Array.isArray(x)            // Preferred for arrays
Object.prototype.toString.call(x) === '[object Array]'

// TypeScript
// Type guards
function isNumber(x: unknown): x is number {
    return typeof x === 'number';
}
```

**TypeScript Library Implications:**
- TypeScript's type system is compile-time only
- Runtime type checking needs explicit implementation
- Consider branded types for nominal typing

### Summary for TypeScript Implementation

When building a TypeScript library providing Python-like semantic primitives:

1. **Use wrapper classes** for Python-like behavior (e.g., `PyInt`, `PyList`, `PyDict`)
2. **Implement iterator protocol** for Python-style iteration
3. **Add Python method names** as aliases (`.append()`, `.extend()`, `.upper()`)
4. **Handle truthiness** according to Python rules
5. **Implement slicing** as method since operator overloading is limited
6. **Consider immutability** - use `readonly` arrays, `Object.freeze()`, or Immutable.js
7. **Provide rich comparison** via methods (Python's `__lt__`, etc.)
8. **Handle `None`** mapping to `null`, with explicit handling of `undefined`
9. **Implement set operations** missing from native JS Set
10. **Use BigInt** for arbitrary precision integers, with conversion helpers

Example wrapper approach:

```typescript
class PyList<T> extends Array<T> {
    // Python-style methods
    append(item: T): void { this.push(item); }
    extend(items: Iterable<T>): void { this.push(...items); }

    // Slicing
    slice(start?: number, stop?: number, step?: number): PyList<T> {
        // Implement Python slicing semantics
    }

    // Python truthiness
    __bool__(): boolean { return this.length > 0; }
}
```
