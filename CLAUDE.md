
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

---

## Semantic Primitives Library Structure

This is a TypeScript library providing LLM-enhanced primitive types with built-in semantic understanding, fuzzy matching, natural language parsing, and AI-powered operations.

### File Organization

```
src/
├── index.ts              # Main entry point, re-exports all semantic types
├── provider/             # LLM provider abstraction
│   ├── index.ts          # Provider exports
│   ├── base.ts           # Base provider interface
│   └── <provider>.ts     # Provider implementations (openai, anthropic, google, etc.)
├── primitives/           # Semantic primitive types
│   ├── index.ts          # Re-exports all primitives
│   ├── SemanticString.ts
│   ├── SemanticNumber.ts
│   ├── SemanticBoolean.ts
│   └── SemanticBigInt.ts
├── collections/          # Semantic collection types
│   ├── index.ts          # Re-exports all collections
│   ├── SemanticArray.ts
│   ├── SemanticMap.ts
│   └── SemanticSet.ts
├── objects/              # Semantic object types
│   ├── index.ts          # Re-exports all objects
│   ├── SemanticDate.ts
│   ├── SemanticRecord.ts
│   └── SemanticObject.ts
├── types/                # Shared TypeScript types and interfaces
│   └── index.ts
└── utils/                # Shared utilities
    └── index.ts
```

### Naming Conventions

- All semantic types MUST be prefixed with `Semantic` followed by the original type name
- Examples: `SemanticString`, `SemanticNumber`, `SemanticBoolean`, `SemanticArray<T>`, `SemanticMap<K, V>`
- Each semantic type should be a drop-in replacement for its native counterpart
- Semantic types should extend or wrap native types, not replace their core functionality

### Semantic Types to Implement

Based on `node-types.md`, the following semantic wrappers will be created:

**Primitives:**
- `SemanticString` - Fuzzy matching, semantic similarity, NL parsing
- `SemanticNumber` - Natural language number parsing, semantic comparisons
- `SemanticBoolean` - Fuzzy truth detection from text, confidence scoring
- `SemanticBigInt` - Same as SemanticNumber but for large integers

**Collections:**
- `SemanticArray<T>` - Semantic search, smart filtering, NL queries
- `SemanticMap<K, V>` - Fuzzy key lookup, semantic key matching
- `SemanticSet<T>` - Semantic membership testing, similarity-based operations

**Objects:**
- `SemanticDate` - Natural language date parsing, relative time understanding
- `SemanticRecord<K, V>` - Semantic property access, fuzzy field matching
- `SemanticObject` - Dynamic semantic property resolution

### Module Exports

The main `index.ts` should export:
1. All semantic types individually for tree-shaking
2. A namespace/object containing all types for convenience
3. Provider configuration utilities
4. Shared types and interfaces

```ts
// Individual exports (preferred for tree-shaking)
export { SemanticString } from './primitives/SemanticString';
export { SemanticArray } from './collections/SemanticArray';
// etc.

// Grouped exports
export * as primitives from './primitives';
export * as collections from './collections';
export * as objects from './objects';
```

### Implementation Guidelines

- Each semantic type file should be self-contained with its class and related types
- Use dependency injection for the LLM provider (passed via constructor or config)
- Implement both sync and async methods where appropriate (sync uses cached/heuristic, async uses LLM)
- Include comprehensive JSDoc comments for IDE support
- Each type should have a corresponding test file: `SemanticString.test.ts`
