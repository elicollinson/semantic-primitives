# Primitives:

- string
- number
- bigint
- boolean
- symbol
- undefined
- null

# Special types:

- void
- never
- unknown
- any

# Base reference types:

- object - any non-primitive
- Object - Object constructor interface
- Array<T> / T[]
- Function
- Map<K, V>
- Set<T>
- WeakMap<K, V>
- WeakSet<T>
- Date
- RegExp
- Promise<T>
- Error (and subclasses: TypeError, RangeError, etc.)
- ArrayBuffer
- SharedArrayBuffer
- DataView
- TypedArrays - Uint8Array, Int32Array, Float64Array, etc.
- Buffer (Node/Bun specific)
- URL
- URLSearchParams

# Structural types:

- Object literals: `{ key: Type }`
- Tuples: `[string, number]`
- Records: `Record<K, V>`
- Callable: `(...args: A) => R`
- Constructable: `new (...args: A) => T`

# Node/Bun specific globals:

- ReadableStream / WritableStream
- Request / Response / Headers
- Blob / File
- FormData
- TextEncoder / TextDecoder
- EventEmitter (Node)
- Bun namespace types (Bun)