## Library Structure

This is a TypeScript library for semantic primitives with AI intelligence.

### Directory Organization

```
src/
├── index.ts              # Main entry point, re-exports all public APIs
├── primitives/           # Semantic wrappers for TypeScript primitives
│   ├── index.ts          # Re-exports all primitives
│   └── <type>.ts         # One file per primitive (e.g., string.ts, number.ts)
├── types/                # Semantic wrappers for reference/structural types
│   ├── index.ts          # Re-exports all types
│   └── <type>.ts         # One file per type (e.g., array.ts, map.ts)
├── llm/                  # LLM client and provider abstractions
├── shared/               # Shared utilities, base classes, and interfaces
└── __tests__/            # Test files mirror src structure
```

### Naming Conventions

- All semantic wrappers use the `Semantic` prefix: `SemanticString`, `SemanticNumber`, `SemanticArray`, etc.
- One class/type per file, filename matches the base type in lowercase (e.g., `string.ts` for `SemanticString`)
- Each directory has an `index.ts` that re-exports its public APIs
- Test files use `.test.ts` suffix and live in `__tests__/` directories

### Export Guidelines

- The main `src/index.ts` should export everything users need
- Support subpath exports in `package.json` for tree-shaking (e.g., `semantic-primitives/primitives`)
- Keep internal utilities unexported or in a separate internal path

### Code Style

- Prefer classes for semantic wrappers to enable method chaining and inheritance
- Use TypeScript generics where the underlying type is generic (e.g., `SemanticArray<T>`)
- Each semantic wrapper should extend or wrap its base type, not replace it

---

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
