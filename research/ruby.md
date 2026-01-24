# Ruby Primitive and Basic Types

## Overview

Ruby is a **pure object-oriented language** where everything is an object, including primitive values that would be "primitives" in other languages. There are no true primitives in Ruby - even integers and `nil` are full-fledged objects with methods. This document provides a comprehensive examination of Ruby's basic types, their behaviors, and how they compare to JavaScript's type system.

---

## Table of Contents

1. [Foundational Concepts](#foundational-concepts)
2. [Numeric Types](#numeric-types)
3. [String](#string)
4. [Symbol](#symbol)
5. [Boolean Types](#boolean-types)
6. [NilClass](#nilclass)
7. [Array](#array)
8. [Hash](#hash)
9. [Range](#range)
10. [Symbols vs Strings](#symbols-vs-strings)
11. [Blocks, Procs, and Lambdas](#blocks-procs-and-lambdas)
12. [Method Objects](#method-objects)
13. [Comparison with JavaScript](#comparison-with-javascript)

---

## Foundational Concepts

### Everything Is an Object

In Ruby, every value is an object - an instance of a class. This includes what other languages call "primitives":

```ruby
42.class          # => Integer
3.14.class        # => Float
"hello".class     # => String
true.class        # => TrueClass
nil.class         # => NilClass

# Even classes are objects
Integer.class     # => Class
Class.class       # => Class
```

### Object Identity and Equality

Every object has a unique `object_id`:

```ruby
a = "hello"
b = "hello"
a.object_id == b.object_id  # => false (different objects)

# But some objects are singletons
true.object_id == true.object_id   # => true
nil.object_id == nil.object_id     # => true
42.object_id == 42.object_id       # => true (small integers are cached)
```

### Truthiness and Falsiness

Ruby has a simple truthiness model:

- **Falsy values**: `false` and `nil` ONLY
- **Truthy values**: Everything else, including `0`, `""`, `[]`, `{}`

```ruby
# These are ALL truthy in Ruby
if 0 then "truthy" end        # => "truthy"
if "" then "truthy" end       # => "truthy"
if [] then "truthy" end       # => "truthy"
if 0.0 then "truthy" end      # => "truthy"

# Only these are falsy
if false then "yes" else "no" end  # => "no"
if nil then "yes" else "no" end    # => "no"
```

### Duck Typing

Ruby embraces duck typing: "If it walks like a duck and quacks like a duck, it's a duck." The language cares about what methods an object responds to, not its class:

```ruby
def process(item)
  item.each { |x| puts x }
end

# Works with Array
process([1, 2, 3])

# Works with any object that implements #each
class MyCollection
  def each
    yield 1
    yield 2
  end
end
process(MyCollection.new)
```

---

## Numeric Types

### Class Hierarchy

```
BasicObject
  └── Object
        └── Numeric
              ├── Integer
              ├── Float
              ├── Rational
              └── Complex
```

### Integer

Since Ruby 2.4, `Fixnum` and `Bignum` were unified into a single `Integer` class. Ruby automatically handles arbitrary precision integers.

#### Object Nature

```ruby
42.class              # => Integer
42.is_a?(Numeric)     # => true
42.is_a?(Object)      # => true

# Integers are immutable value objects
a = 42
a.frozen?             # => true (effectively immutable)

# Small integers are cached (immediate values)
a = 42
b = 42
a.object_id == b.object_id  # => true
```

#### Common Methods

```ruby
# Arithmetic
5 + 3       # => 8
5 - 3       # => 2
5 * 3       # => 15
5 / 3       # => 1 (integer division)
5 % 3       # => 2 (modulo)
5 ** 3      # => 125 (exponentiation)

# Comparison
5 <=> 3     # => 1 (spaceship operator)
5.between?(1, 10)  # => true

# Conversion
42.to_s     # => "42"
42.to_f     # => 42.0
42.to_r     # => (42/1) - Rational
42.chr      # => "*" (ASCII character)

# Iteration
5.times { |i| puts i }      # 0, 1, 2, 3, 4
1.upto(5) { |i| puts i }    # 1, 2, 3, 4, 5
5.downto(1) { |i| puts i }  # 5, 4, 3, 2, 1

# Predicates
42.even?    # => true
42.odd?     # => false
42.zero?    # => false
42.positive? # => true
42.negative? # => false

# Bit operations
5 & 3       # => 1
5 | 3       # => 7
5 ^ 3       # => 6
5 << 2      # => 20
5 >> 1      # => 2
~5          # => -6

# Arbitrary precision
(2 ** 100).class  # => Integer
```

#### Mutability

Integers are **immutable**. Operations return new Integer objects:

```ruby
a = 5
b = a + 3   # b is a new object; a is unchanged
a           # => 5
```

### Float

IEEE 754 double-precision floating-point numbers.

#### Object Nature

```ruby
3.14.class              # => Float
3.14.is_a?(Numeric)     # => true

# Floats are also immutable
3.14.frozen?            # => true
```

#### Common Methods

```ruby
# Arithmetic (same operators as Integer)
5.0 / 3.0   # => 1.6666666666666667

# Rounding
3.7.round   # => 4
3.7.floor   # => 3
3.7.ceil    # => 4
3.7.truncate # => 3

# Predicates
3.14.finite?   # => true
(1.0/0).infinite?  # => 1 (positive infinity)
(0.0/0).nan?   # => true

# Special values
Float::INFINITY   # Positive infinity
-Float::INFINITY  # Negative infinity
Float::NAN        # Not a Number

# Conversion
3.14.to_i   # => 3
3.14.to_r   # => (7070651414971679/2251799813685248)
3.14.to_s   # => "3.14"

# Precision issues (IEEE 754)
0.1 + 0.2 == 0.3  # => false
0.1 + 0.2         # => 0.30000000000000004
```

### Rational

Exact representation of rational numbers (fractions).

#### Object Nature

```ruby
r = Rational(1, 3)
r.class             # => Rational
r.is_a?(Numeric)    # => true

# Also immutable
r.frozen?           # => true
```

#### Common Methods

```ruby
# Creation
Rational(1, 3)      # => (1/3)
Rational(0.5)       # => (1/2)
1/3r                # => (1/3) - literal syntax
0.5.to_r            # => (1/2)

# Components
r = Rational(3, 4)
r.numerator         # => 3
r.denominator       # => 4

# Arithmetic with exact precision
Rational(1, 3) + Rational(1, 3) + Rational(1, 3)  # => (1/1)

# Conversion
Rational(1, 3).to_f  # => 0.3333333333333333
```

### Complex

Complex numbers with real and imaginary parts.

#### Object Nature

```ruby
c = Complex(3, 4)
c.class             # => Complex
c.is_a?(Numeric)    # => true
```

#### Common Methods

```ruby
# Creation
Complex(3, 4)       # => (3+4i)
3 + 4i              # => (3+4i) - literal syntax (when 'i' suffix is used)
Complex.polar(5, Math::PI/4)  # => from polar coordinates

# Components
c = Complex(3, 4)
c.real              # => 3
c.imaginary         # => 4
c.abs               # => 5.0 (magnitude)
c.arg               # => 0.9272952180016122 (angle in radians)

# Arithmetic
Complex(1, 2) + Complex(3, 4)  # => (4+6i)
Complex(1, 2) * Complex(3, 4)  # => (-5+10i)
Complex(3, 4).conjugate        # => (3-4i)

# Conversion
Complex(3, 4).to_a  # => [3, 4]
Complex(3, 0).to_i  # => 3 (only if imaginary part is 0)
```

### Duck Typing for Numerics

Ruby's `Numeric` class defines a protocol that all numeric types follow:

```ruby
def double(n)
  n * 2  # Works for Integer, Float, Rational, Complex
end

double(5)           # => 10
double(2.5)         # => 5.0
double(Rational(1,3))  # => (2/3)
double(Complex(1,2))   # => (2+4i)

# Coercion protocol
1 + 2.0             # Integer coerced to Float => 3.0
1 + Rational(1,2)   # Integer coerced to Rational => (3/2)
```

---

## String

### Class Hierarchy

```
BasicObject
  └── Object
        └── String
```

### Object Nature

```ruby
"hello".class       # => String
"hello".is_a?(Object)  # => true

# Each string literal creates a new object (by default)
a = "hello"
b = "hello"
a.object_id == b.object_id  # => false

# Frozen string literals (Ruby 2.3+)
# With magic comment: # frozen_string_literal: true
# Or explicitly:
a = "hello".freeze
a.frozen?           # => true
```

### Common Methods

```ruby
# Creation
"hello"                     # Double quotes - supports interpolation
'hello'                     # Single quotes - literal
%q(hello)                   # Alternative literal (single-quote-like)
%Q(hello #{1+1})            # Alternative literal (double-quote-like)
String.new("hello")         # Constructor
<<~HEREDOC                  # Here document
  Multi-line
  string
HEREDOC

# Length and access
s = "hello"
s.length            # => 5
s.size              # => 5 (alias)
s.bytesize          # => 5 (bytes, may differ for UTF-8)
s[0]                # => "h"
s[-1]               # => "o"
s[1, 3]             # => "ell" (start, length)
s[1..3]             # => "ell" (range)

# Case conversion
"hello".upcase      # => "HELLO"
"HELLO".downcase    # => "hello"
"hello".capitalize  # => "Hello"
"hElLo".swapcase    # => "HeLlO"

# Searching
"hello".include?("ell")  # => true
"hello".index("l")       # => 2
"hello".rindex("l")      # => 3
"hello".start_with?("he") # => true
"hello".end_with?("lo")   # => true
"hello" =~ /l+/          # => 2 (regex match position)
"hello".match(/l+/)      # => #<MatchData "ll">

# Modification (returns new string)
"hello".reverse     # => "olleh"
"hello".gsub("l", "L")  # => "heLLo"
"hello".sub("l", "L")   # => "heLlo"
"  hello  ".strip   # => "hello"
"hello".tr("aeiou", "*")  # => "h*ll*"

# Splitting and joining
"a,b,c".split(",")  # => ["a", "b", "c"]
["a", "b", "c"].join(",")  # => "a,b,c"
"hello".chars       # => ["h", "e", "l", "l", "o"]
"hello".bytes       # => [104, 101, 108, 108, 111]

# Interpolation
name = "Ruby"
"Hello, #{name}!"   # => "Hello, Ruby!"

# Formatting
"Hello, %s!" % "Ruby"     # => "Hello, Ruby!"
"%05d" % 42               # => "00042"
sprintf("%0.2f", 3.14159) # => "3.14"

# Conversion
"42".to_i           # => 42
"3.14".to_f         # => 3.14
"hello".to_sym      # => :hello
"hello".intern      # => :hello (alias)
"hello".encode("UTF-16")  # encoding conversion
```

### Mutability

Strings are **mutable** by default (unless frozen):

```ruby
s = "hello"
s.upcase!           # Modifies s in place
s                   # => "HELLO"

s << " world"       # Append in place
s                   # => "HELLO world"

s[0] = "J"          # Modify character
s                   # => "JELLO world"

# Bang methods modify in place
s = "hello"
s.reverse!          # => "olleh", s is now "olleh"

# Non-bang methods return new string
s = "hello"
t = s.reverse       # => "olleh", s is still "hello"
```

### Frozen String Literals

```ruby
# File-level pragma
# frozen_string_literal: true

s = "hello"         # This string is frozen
s << " world"       # FrozenError!

# Or explicit freezing
s = "hello".freeze
s << " world"       # FrozenError!

# Duplicate to unfreeze
t = s.dup
t << " world"       # Works, t is not frozen
```

### Encoding

```ruby
s = "hello"
s.encoding          # => #<Encoding:UTF-8>

# Ruby strings are encoding-aware
s = "caf\u00e9"     # => "cafe" with accented e
s.length            # => 4 (characters)
s.bytesize          # => 5 (bytes in UTF-8)

# Force encoding
s.force_encoding("ASCII-8BIT")
s.encode("UTF-16")
```

---

## Symbol

### Class Hierarchy

```
BasicObject
  └── Object
        └── Symbol
```

### Object Nature

Symbols are **immutable**, **interned** identifiers. They are guaranteed to be unique - the same symbol literal always refers to the same object.

```ruby
:hello.class        # => Symbol

# Symbol identity
a = :hello
b = :hello
a.object_id == b.object_id  # => true (same object!)

# Symbols are always frozen
:hello.frozen?      # => true

# Symbol table (all symbols are stored in a global table)
Symbol.all_symbols  # => array of all symbols in the runtime
```

### Common Methods

```ruby
# Creation
:hello              # Literal
:"hello world"      # With spaces
:"hello-#{1+1}"     # Interpolation (creates dynamic symbol)
"hello".to_sym      # From string
"hello".intern      # From string (alias)

# Inspection
:hello.to_s         # => "hello"
:hello.id2name      # => "hello" (alias)
:hello.length       # => 5
:hello.size         # => 5

# Comparison
:a <=> :b           # => -1 (based on string comparison)
:hello == :hello    # => true
:hello == "hello"   # => false (different types)

# Predicates
:hello.empty?       # => false (Ruby 2.7+)

# Pattern matching / case
case :status
when :active then "Active"
when :inactive then "Inactive"
end

# Method names are symbols
"hello".methods.first  # => :unicode_normalized? (or similar)
"hello".respond_to?(:upcase)  # => true
"hello".send(:upcase)  # => "HELLO"
```

### Use Cases

```ruby
# Hash keys (more efficient than strings)
user = { name: "Alice", age: 30 }  # Symbols as keys
user[:name]  # => "Alice"

# Method arguments (options)
def configure(options)
  options[:timeout] || 30
end
configure(timeout: 60)

# Metaprogramming
class Foo
  attr_accessor :bar  # :bar is a symbol
  define_method(:greet) { "Hello" }
end

# Enumerations
STATES = [:pending, :active, :completed]
```

---

## Boolean Types

Ruby has no single `Boolean` class. Instead, it has two singleton classes:

### Class Hierarchy

```
BasicObject
  └── Object
        ├── TrueClass   (true is the only instance)
        └── FalseClass  (false is the only instance)
```

### Object Nature

```ruby
true.class          # => TrueClass
false.class         # => FalseClass

true.is_a?(Object)  # => true
false.is_a?(Object) # => true

# There is no Boolean class by default
defined?(Boolean)   # => nil

# Singletons
true.object_id      # Always the same
false.object_id     # Always the same

# Frozen
true.frozen?        # => true
false.frozen?       # => true
```

### Common Methods

```ruby
# Logical operations
true & false        # => false (AND)
true | false        # => true (OR)
true ^ false        # => true (XOR)
!true               # => false (NOT)

# Short-circuit operators (not methods)
true && false       # => false
true || false       # => true

# Conversion
true.to_s           # => "true"
false.to_s          # => "false"

# Truthiness is checked via double negation
!!nil               # => false
!!false             # => false
!!0                 # => true
!!""                # => true
```

### Duck Typing Consideration

Since there's no `Boolean` class, checking for boolean values requires:

```ruby
def validate_flag(value)
  # Can't do: value.is_a?(Boolean)

  # Option 1: Check both classes
  value.is_a?(TrueClass) || value.is_a?(FalseClass)

  # Option 2: Use case equality
  [true, false].include?(value)

  # Option 3: Double negation comparison
  !!value == value
end

# For truthiness, just use the value directly
if some_value
  # truthy path
end
```

---

## NilClass

### Class Hierarchy

```
BasicObject
  └── Object
        └── NilClass  (nil is the only instance)
```

### Object Nature

```ruby
nil.class           # => NilClass
nil.is_a?(Object)   # => true

# Singleton
nil.object_id       # => 8 (fixed value)

# Frozen
nil.frozen?         # => true
```

### Common Methods

```ruby
# Predicates
nil.nil?            # => true
nil.to_a            # => []
nil.to_h            # => {}
nil.to_s            # => ""
nil.to_i            # => 0
nil.to_f            # => 0.0
nil.inspect         # => "nil"

# Rationalize
nil.rationalize     # => (0/1)

# Safe navigation (Ruby 2.3+)
nil&.foo            # => nil (no method error)
```

### Nil-Safe Patterns

```ruby
# Safe navigation operator
user&.address&.city   # Returns nil if any is nil

# Or with default
name = nil
name || "Anonymous"   # => "Anonymous"

# Nil guard
def process(data)
  return if data.nil?
  # ... process data
end

# Array compact
[1, nil, 2, nil, 3].compact  # => [1, 2, 3]

# Hash with default
h = Hash.new(0)
h[:missing]         # => 0 (not nil)
```

---

## Array

### Class Hierarchy

```
BasicObject
  └── Object
        └── Array
```

### Object Nature

```ruby
[1, 2, 3].class     # => Array
[1, 2, 3].is_a?(Enumerable)  # => true

# Arrays can contain any type
mixed = [1, "two", :three, [4, 5], { six: 6 }]

# Each array is a distinct object
a = [1, 2, 3]
b = [1, 2, 3]
a.object_id == b.object_id  # => false
a == b                      # => true (content equality)
```

### Common Methods

```ruby
# Creation
[1, 2, 3]                   # Literal
Array.new(3)                # => [nil, nil, nil]
Array.new(3, 0)             # => [0, 0, 0]
Array.new(3) { |i| i * 2 }  # => [0, 2, 4]
%w[a b c]                   # => ["a", "b", "c"]
%i[a b c]                   # => [:a, :b, :c]
(1..5).to_a                 # => [1, 2, 3, 4, 5]

# Access
a = [10, 20, 30, 40, 50]
a[0]                # => 10
a[-1]               # => 50
a[1, 3]             # => [20, 30, 40] (start, length)
a[1..3]             # => [20, 30, 40] (range)
a.first             # => 10
a.last              # => 50
a.first(2)          # => [10, 20]
a.sample            # Random element
a.sample(2)         # => 2 random elements

# Length
a.length            # => 5
a.size              # => 5
a.count             # => 5
a.empty?            # => false

# Modification (mutating)
a = [1, 2, 3]
a << 4              # => [1, 2, 3, 4]
a.push(5)           # => [1, 2, 3, 4, 5]
a.pop               # => 5, a is now [1, 2, 3, 4]
a.shift             # => 1, a is now [2, 3, 4]
a.unshift(0)        # => [0, 2, 3, 4]
a.insert(2, 1.5)    # => [0, 2, 1.5, 3, 4]
a.delete(1.5)       # => 1.5, removed from array
a.delete_at(0)      # => 0, removed element at index

# Iteration (Enumerable)
[1, 2, 3].each { |x| puts x }
[1, 2, 3].map { |x| x * 2 }       # => [2, 4, 6]
[1, 2, 3].select { |x| x.odd? }   # => [1, 3]
[1, 2, 3].reject { |x| x.odd? }   # => [2]
[1, 2, 3].reduce(0) { |sum, x| sum + x }  # => 6
[1, 2, 3].find { |x| x > 1 }      # => 2

# Transformation
[1, 2, 3].reverse               # => [3, 2, 1]
[3, 1, 2].sort                  # => [1, 2, 3]
[[1, 2], [3, 4]].flatten        # => [1, 2, 3, 4]
[1, 1, 2, 2, 3].uniq            # => [1, 2, 3]
[1, 2, 3].zip([4, 5, 6])        # => [[1, 4], [2, 5], [3, 6]]

# Set operations
[1, 2, 3] & [2, 3, 4]           # => [2, 3] (intersection)
[1, 2, 3] | [2, 3, 4]           # => [1, 2, 3, 4] (union)
[1, 2, 3] - [2]                 # => [1, 3] (difference)

# Comparison
[1, 2, 3] == [1, 2, 3]          # => true
[1, 2, 3] <=> [1, 2, 4]         # => -1
```

### Mutability

Arrays are **mutable**:

```ruby
a = [1, 2, 3]
a[0] = 99           # => [99, 2, 3]
a << 4              # => [99, 2, 3, 4]

# Freeze to prevent modification
a.freeze
a << 5              # FrozenError!

# Deep freeze (recursive)
def deep_freeze(obj)
  obj.freeze
  obj.each { |e| deep_freeze(e) } if obj.respond_to?(:each)
  obj
end
```

---

## Hash

### Class Hierarchy

```
BasicObject
  └── Object
        └── Hash
```

### Object Nature

```ruby
{ a: 1 }.class      # => Hash
{ a: 1 }.is_a?(Enumerable)  # => true

# Hashes maintain insertion order (Ruby 1.9+)
h = { c: 3, a: 1, b: 2 }
h.keys              # => [:c, :a, :b] (insertion order preserved)
```

### Common Methods

```ruby
# Creation
{ a: 1, b: 2 }                  # Symbol keys (shorthand)
{ :a => 1, :b => 2 }            # Hash rocket syntax
{ "a" => 1, "b" => 2 }          # String keys
Hash.new                        # Empty hash
Hash.new(0)                     # Default value 0
Hash.new { |h, k| h[k] = [] }   # Default block

# Access
h = { a: 1, b: 2, c: 3 }
h[:a]               # => 1
h[:missing]         # => nil
h.fetch(:a)         # => 1
h.fetch(:missing)   # KeyError!
h.fetch(:missing, 0) # => 0 (default)
h.dig(:nested, :key) # Safe nested access

# Keys and values
h.keys              # => [:a, :b, :c]
h.values            # => [1, 2, 3]
h.key?(:a)          # => true (also: has_key?, include?, member?)
h.value?(1)         # => true (also: has_value?)

# Modification
h = { a: 1 }
h[:b] = 2           # Add/update
h.merge(c: 3)       # => { a: 1, b: 2, c: 3 } (new hash)
h.merge!(c: 3)      # Mutates h
h.delete(:a)        # => 1, removes key
h.delete_if { |k, v| v > 1 }  # Conditional delete
h.transform_values { |v| v * 2 }  # => { b: 4, c: 6 }
h.transform_keys { |k| k.to_s }   # => { "b" => 2, "c" => 3 }

# Iteration
h.each { |k, v| puts "#{k}: #{v}" }
h.each_key { |k| puts k }
h.each_value { |v| puts v }
h.map { |k, v| [k, v * 2] }.to_h  # Transform to new hash
h.select { |k, v| v > 1 }         # Filter

# Conversion
h.to_a              # => [[:a, 1], [:b, 2]]
[[:a, 1], [:b, 2]].to_h  # => { a: 1, b: 2 }

# Comparison
{ a: 1, b: 2 } == { b: 2, a: 1 }  # => true (order doesn't matter)
```

### Default Values

```ruby
# Static default
h = Hash.new(0)
h[:missing]         # => 0
h[:count] += 1      # Works! h[:count] is now 1

# Block default (for mutable defaults)
h = Hash.new { |hash, key| hash[key] = [] }
h[:items] << "item1"
h[:items]           # => ["item1"]

# Default proc
h.default_proc      # Returns the block
```

### Mutability

Hashes are **mutable**:

```ruby
h = { a: 1 }
h[:b] = 2           # Mutates h

h.freeze
h[:c] = 3           # FrozenError!
```

---

## Range

### Class Hierarchy

```
BasicObject
  └── Object
        └── Range
```

### Object Nature

```ruby
(1..5).class        # => Range
(1..5).is_a?(Enumerable)  # => true

# Inclusive vs exclusive
(1..5).to_a         # => [1, 2, 3, 4, 5] (includes 5)
(1...5).to_a        # => [1, 2, 3, 4] (excludes 5)
```

### Common Methods

```ruby
# Creation
1..5                # Inclusive
1...5               # Exclusive
Range.new(1, 5)     # Same as 1..5
Range.new(1, 5, true)  # Same as 1...5
('a'..'z')          # Character range
(Time.now..(Time.now + 86400))  # Time range

# Properties
r = (1..10)
r.begin             # => 1 (also: first, min)
r.end               # => 10 (also: last, max)
r.exclude_end?      # => false
r.size              # => 10
r.count             # => 10

# Membership
(1..10).include?(5)   # => true
(1..10).cover?(5)     # => true
(1..10) === 5         # => true (used in case statements)

# Iteration
(1..5).each { |i| puts i }
(1..5).map { |i| i * 2 }   # => [2, 4, 6, 8, 10]
(1..5).to_a               # => [1, 2, 3, 4, 5]
(1..5).step(2).to_a       # => [1, 3, 5]

# Endless and beginless ranges (Ruby 2.6+/2.7+)
(1..)                # Endless range
(..5)                # Beginless range
(1..).take(5)        # => [1, 2, 3, 4, 5]
```

### Use Cases

```ruby
# Case statements
case age
when 0..12 then "child"
when 13..19 then "teen"
when 20..64 then "adult"
else "senior"
end

# Array slicing
arr = [0, 1, 2, 3, 4, 5]
arr[1..3]           # => [1, 2, 3]
arr[2..]            # => [2, 3, 4, 5]

# String slicing
"hello"[1..3]       # => "ell"

# Iteration
(1..100).select(&:even?)  # Even numbers 1-100
```

### Mutability

Ranges are **immutable**:

```ruby
r = (1..5)
r.frozen?           # => true (always frozen)
```

---

## Symbols vs Strings

### Key Differences

| Aspect | Symbol | String |
|--------|--------|--------|
| Mutability | Immutable | Mutable (by default) |
| Identity | Interned (same symbol = same object) | New object each time |
| Memory | One copy ever | Many copies possible |
| Use case | Identifiers, keys | Text data |
| GC | Never garbage collected* | Garbage collected |

*Dynamic symbols (created at runtime) can be garbage collected in Ruby 2.2+

### Performance Comparison

```ruby
require 'benchmark'

n = 1_000_000

Benchmark.bm do |x|
  x.report("symbol:") { n.times { :hello == :hello } }
  x.report("string:") { n.times { "hello" == "hello" } }
end

# Symbols are faster for comparison (pointer comparison vs character-by-character)
```

### When to Use Which

```ruby
# Use Symbols for:
# - Hash keys
user = { name: "Alice", age: 30 }

# - Method names
obj.send(:method_name)
obj.respond_to?(:method_name)

# - Constants/enumerations
STATUS = [:pending, :active, :completed]

# - Options/flags
def configure(options)
  options[:timeout]
end

# Use Strings for:
# - User input
gets.chomp

# - File content
File.read("file.txt")

# - Dynamic text
"Hello, #{name}!"

# - Data that needs manipulation
text.upcase.gsub(/\s+/, "_")
```

### Interconversion

```ruby
# String to Symbol
"hello".to_sym      # => :hello
"hello".intern      # => :hello

# Symbol to String
:hello.to_s         # => "hello"
:hello.id2name      # => "hello"

# Be careful with dynamic symbols
user_input = gets.chomp
user_input.to_sym   # Could exhaust memory if input is untrusted (pre-Ruby 2.2)
```

---

## Blocks, Procs, and Lambdas

### Blocks

Blocks are not objects - they are syntactic constructs that can be passed to methods:

```ruby
# Block with do...end
[1, 2, 3].each do |x|
  puts x
end

# Block with braces
[1, 2, 3].each { |x| puts x }

# Receiving a block in a method
def with_timing
  start = Time.now
  result = yield  # Execute the block
  puts "Took #{Time.now - start} seconds"
  result
end

with_timing { sleep(1); "done" }

# Block given?
def maybe_yield
  if block_given?
    yield
  else
    "no block"
  end
end

# Converting block to Proc
def capture_block(&block)
  block  # This is now a Proc object
end

my_proc = capture_block { puts "hello" }
my_proc.class  # => Proc
my_proc.call   # prints "hello"
```

### Procs

Procs are objects that encapsulate blocks:

```ruby
# Creation
p1 = Proc.new { |x| x * 2 }
p2 = proc { |x| x * 2 }     # Kernel#proc

p1.class            # => Proc
p1.call(5)          # => 10
p1.(5)              # => 10 (shorthand)
p1[5]               # => 10 (shorthand)

# Procs are lenient with arguments
p = Proc.new { |a, b| [a, b] }
p.call(1)           # => [1, nil] (missing args are nil)
p.call(1, 2, 3)     # => [1, 2] (extra args ignored)

# Return in Proc returns from enclosing method
def test_proc
  p = Proc.new { return "from proc" }
  p.call
  "after proc"  # Never reached
end
test_proc           # => "from proc"

# Arity
p = Proc.new { |a, b, c| }
p.arity             # => 3
```

### Lambdas

Lambdas are a stricter form of Proc:

```ruby
# Creation
l1 = lambda { |x| x * 2 }
l2 = ->(x) { x * 2 }        # Stabby lambda syntax
l3 = ->(x, y=10) { x + y }  # With default argument

l1.class            # => Proc
l1.lambda?          # => true

# Lambdas are strict with arguments
l = ->(a, b) { [a, b] }
l.call(1)           # ArgumentError: wrong number of arguments
l.call(1, 2, 3)     # ArgumentError: wrong number of arguments

# Return in lambda returns from lambda only
def test_lambda
  l = -> { return "from lambda" }
  l.call
  "after lambda"  # This IS reached
end
test_lambda         # => "after lambda"
```

### Comparison Table

| Feature | Block | Proc | Lambda |
|---------|-------|------|--------|
| Object? | No | Yes | Yes |
| Argument checking | N/A | Lenient | Strict |
| Return behavior | N/A | Returns from method | Returns from lambda |
| Created with | `{}` or `do...end` | `Proc.new`, `proc` | `lambda`, `->` |

### Symbol#to_proc

A powerful Ruby idiom for converting symbols to procs:

```ruby
# These are equivalent:
[1, 2, 3].map { |x| x.to_s }
[1, 2, 3].map(&:to_s)

# How it works:
# 1. &:to_s calls :to_s.to_proc
# 2. Symbol#to_proc returns: ->(obj) { obj.to_s }
# 3. The proc is passed as a block

# With arguments (Ruby 2.7+):
["hello", "world"].map(&:upcase)  # => ["HELLO", "WORLD"]
```

---

## Method Objects

Methods can be captured as objects:

### Method Class

```ruby
class Calculator
  def add(a, b)
    a + b
  end
end

calc = Calculator.new
m = calc.method(:add)

m.class             # => Method
m.call(2, 3)        # => 5
m.(2, 3)            # => 5
m[2, 3]             # => 5

# Method properties
m.name              # => :add
m.owner             # => Calculator
m.receiver          # => calc instance
m.arity             # => 2
m.parameters        # => [[:req, :a], [:req, :b]]
m.source_location   # => ["file.rb", 3]

# Convert to Proc
p = m.to_proc
p.call(2, 3)        # => 5
[1, 2, 3].map(&m)   # Can use with &
```

### UnboundMethod Class

```ruby
class Greeter
  def greet
    "Hello!"
  end
end

# Get unbound method from class
um = Greeter.instance_method(:greet)
um.class            # => UnboundMethod

# Can't call directly
um.call             # NoMethodError

# Must bind to an instance first
g = Greeter.new
m = um.bind(g)
m.call              # => "Hello!"
```

### Use Cases

```ruby
# Method reference instead of block
def double(x)
  x * 2
end
[1, 2, 3].map(&method(:double))  # => [2, 4, 6]

# Callbacks
button.on_click(method(:handle_click))

# Functional composition (Ruby 2.6+)
double = ->(x) { x * 2 }
increment = ->(x) { x + 1 }
double_then_increment = double >> increment
double_then_increment.call(5)  # => 11

increment_then_double = double << increment
increment_then_double.call(5)  # => 12
```

---

## Comparison with JavaScript

### Pure Object-Oriented Nature

| Aspect | Ruby | JavaScript |
|--------|------|------------|
| Primitives | None (everything is an object) | Yes (`number`, `string`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) |
| Autoboxing | Not needed | Automatic (`"str".length` boxes to String) |
| Methods on literals | Always work (`42.to_s`) | Works via autoboxing (`(42).toString()`) |
| null/nil | `nil` is an object (NilClass) | `null` is a primitive |

### Type Comparison

```ruby
# Ruby                          # JavaScript
42.class           # Integer    typeof 42           // "number"
42.0.class         # Float      typeof 42.0         // "number"
"str".class        # String     typeof "str"        // "string"
true.class         # TrueClass  typeof true         // "boolean"
nil.class          # NilClass   typeof null         // "object" (bug!)
:sym.class         # Symbol     typeof Symbol("s")  // "symbol"
[].class           # Array      typeof []           // "object"
{}.class           # Hash       typeof {}           // "object"
```

### Truthiness Comparison

```ruby
# Ruby: Only false and nil are falsy
if 0 then "truthy" end      # => "truthy"
if "" then "truthy" end     # => "truthy"
if [] then "truthy" end     # => "truthy"

# JavaScript: More values are falsy
# 0, "", null, undefined, NaN, false are all falsy
if (0) { "truthy" }         // Not executed
if ("") { "truthy" }        // Not executed
```

### Symbols

```ruby
# Ruby: Built-in Symbol type
:hello.object_id == :hello.object_id  # => true

# JavaScript: Symbol primitive (ES6+)
Symbol("hello") === Symbol("hello")  // false (unique each time)
Symbol.for("hello") === Symbol.for("hello")  // true (registered)
```

### Equality

```ruby
# Ruby
42 == 42.0          # => true (value equality)
42.eql?(42.0)       # => false (type and value)
42.equal?(42)       # => true (identity)

# JavaScript
42 == 42.0          // true
42 === 42.0         // true (no type difference)
42 == "42"          // true (type coercion)
42 === "42"         // false (strict equality)
```

### Nil/Null Handling

```ruby
# Ruby: Safe navigation operator
user&.address&.city

# JavaScript: Optional chaining (ES2020)
user?.address?.city

# Ruby: Nil coalescing
value || default

# JavaScript: Nullish coalescing (ES2020)
value ?? default
```

### Functions/Methods

```ruby
# Ruby: Methods belong to objects
def greet(name)
  "Hello, #{name}!"
end
method(:greet).class  # => Method

# Ruby: Blocks, Procs, Lambdas
square = ->(x) { x * x }
[1, 2, 3].map(&square)

# JavaScript: Functions are objects
function greet(name) {
  return `Hello, ${name}!`;
}
typeof greet  // "function"

// JavaScript: Arrow functions
const square = x => x * x;
[1, 2, 3].map(square)
```

### Key Takeaways

1. **Consistency**: Ruby's "everything is an object" is more consistent than JavaScript's primitive/object duality.

2. **Method Calls**: In Ruby, even operators are method calls (`5 + 3` is `5.+(3)`), making the language more uniform.

3. **Type System**: Ruby uses classes while JavaScript uses prototypes (though ES6 classes are syntactic sugar).

4. **Truthiness**: Ruby's simple rule (only `false` and `nil` are falsy) avoids JavaScript's confusing falsy values.

5. **Symbols**: Ruby symbols are interned by default; JavaScript symbols are unique unless registered.

6. **Callables**: Ruby distinguishes between blocks, procs, and lambdas; JavaScript has functions and arrow functions.

---

## Summary

Ruby's type system is built on a consistent object-oriented foundation where:

- **Everything is an object**, including integers, booleans, and nil
- **Classes define behavior**, with a clear hierarchy from `BasicObject` down
- **Duck typing** focuses on capability rather than type
- **Mutability varies** by type (Strings/Arrays/Hashes are mutable; Integers/Symbols/Ranges are immutable)
- **Truthiness is simple**: only `false` and `nil` are falsy
- **Callables** have three forms: blocks (syntax), procs (objects), and lambdas (strict procs)
- **Symbols** provide efficient, immutable identifiers distinct from strings

This uniformity makes Ruby code more predictable and expressive compared to languages with primitive/object distinctions.
