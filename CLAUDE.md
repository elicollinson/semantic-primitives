## Library Structure

This is a TypeScript library for semantic primitives with AI intelligence.

### Directory Organization

```
src/
├── index.ts              # Main entry point, re-exports all public APIs
├── primitives/           # Semantic wrappers for TypeScript primitives
│   ├── index.ts          # Re-exports all primitives
│   └── <type>/           # One folder per primitive
│       ├── index.ts      # Re-exports public API
│       ├── <type>.ts     # Main class implementation
│       ├── prompts.ts    # LLM prompt templates
│       └── __tests__/    # Tests and mocks
├── types/                # Semantic wrappers for reference/structural types
│   ├── index.ts          # Re-exports all types
│   └── <type>/           # One folder per type (same structure as primitives)
├── llm/                  # LLM client and provider abstractions
└── shared/               # Shared utilities, base classes, and interfaces
    ├── index.ts          # Re-exports shared APIs
    └── types.ts          # Shared type definitions
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

### Shared Types

- When multiple modules use the same type structure, define it once in `src/shared/types.ts`
- Import shared types from `../../shared/types.ts` and re-export from the module's index
- Examples of shared types: `SemanticEqualsResult`, common result interfaces
- This ensures type compatibility across modules and reduces duplication

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

---

## LLM-as-Judge Evaluation System

The evaluation system tests and optimizes prompts across all semantic primitives using an LLM-as-judge approach.

### Evaluation Directory Structure

```
evaluation/
├── SPEC.md                    # Complete specification
├── runner.ts                  # CLI evaluation runner
├── judge.ts                   # LLM judge implementation
├── types.ts                   # TypeScript type definitions
├── reporter.ts                # Results reporting
├── config.ts                  # Configuration and class registry
├── index.ts                   # Public API exports
├── results/                   # Stored results (gitignored)
└── __tests__/                 # Unit tests

src/primitives/<type>/evals/   # Evaluation data per type
├── index.ts                   # Re-exports all datasets
└── <method>.evals.ts          # Dataset for each method
```

### Running Evaluations

```bash
# Run all evaluations (default: 1 run per case)
bun run evaluation/runner.ts

# Multiple runs for statistical significance
bun run evaluation/runner.ts --runs 5

# Filter by type or method
bun run evaluation/runner.ts --type SemanticString
bun run evaluation/runner.ts --type SemanticString --method semanticallyEquals

# Filter by tags or difficulty
bun run evaluation/runner.ts --tags synonyms,basic
bun run evaluation/runner.ts --difficulty easy,medium

# Output formats
bun run evaluation/runner.ts --verbose
bun run evaluation/runner.ts --json
bun run evaluation/runner.ts --save --output results/run.json

# No-judge mode (raw results for external review)
bun run evaluation/runner.ts --no-judge
bun run evaluation/runner.ts --no-judge --save --output results/raw-results.json
bun run evaluation/runner.ts --no-judge --json
```

### No-Judge Mode

The `--no-judge` flag runs evaluations without the LLM judge, producing raw input/output pairs for external review (e.g., by a code agent or human reviewer).

**Output format:**
```typescript
interface RawEvalOutput {
  timestamp: string;
  config: { runs: number; type?: string; method?: string };
  totalCases: number;
  results: RawEvalResult[];
}

interface RawEvalResult {
  caseId: string;
  description: string;
  targetClass: string;
  targetMethod: string;
  input: { value: unknown; args?: unknown[]; options?: Record<string, unknown> };
  expected: Record<string, unknown>;
  actual: unknown;           // The actual output from the semantic operation
  criteria: string[];        // Criteria for manual/external evaluation
  structuralMatch: boolean;  // Whether actual matches expected structure
  latencyMs: number;
  error?: string;
  tags?: string[];
  difficulty?: string;
}
```

**Use cases:**
- Review results with a code agent or external LLM
- Human review of prompt outputs
- Debugging specific test cases
- Cost reduction when LLM judge is not needed

### Evaluation Data File Constraints

Each `.evals.ts` file must export an `EvalDataset` with the following structure:

```typescript
// src/primitives/<type>/evals/<method>.evals.ts

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  // REQUIRED: Dataset metadata
  name: string,              // Format: "ClassName.methodName"
  description: string,       // Human-readable description
  version: string,           // Semver format: "1.0.0"
  targetClass: string,       // Class name: "SemanticString"
  targetMethod: string,      // Method name: "semanticallyEquals"

  // OPTIONAL: Method configuration
  isStaticMethod?: boolean,  // true if testing a static method
  factoryMethod?: string,    // Factory to create instance (default: "from")
  factoryAsync?: boolean,    // true if factory returns Promise

  // REQUIRED: Test cases array
  cases: EvalCase[],
};
```

### EvalCase Structure Constraints

Each test case must follow this structure:

```typescript
interface EvalCase {
  // REQUIRED fields
  id: string;              // Unique identifier (kebab-case recommended)
  description: string;     // What this case tests
  input: {
    value: unknown;        // Primary value for class instantiation
    args?: unknown[];      // Method arguments
    options?: Record<string, unknown>;  // Options/context
  };
  expected: Record<string, ExpectedValue>;  // Expected output
  criteria: string[];      // Evaluation criteria (min 1)

  // OPTIONAL fields
  tags?: string[];         // For filtering (lowercase, hyphenated)
  difficulty?: 'easy' | 'medium' | 'hard';  // Default: 'medium'
  skip?: boolean;          // Skip this case
  skipReason?: string;     // Why it's skipped
}
```

### Expected Value Types

Expected values support exact matching and ranges:

```typescript
// Exact values
expected: {
  equivalent: true,           // Exact boolean
  category: "positive",       // Exact string
  count: 5,                   // Exact number
}

// Numeric ranges
expected: {
  confidence: { min: 0.7 },              // At least 0.7
  confidence: { max: 0.9 },              // At most 0.9
  confidence: { min: 0.7, max: 0.9 },    // Between 0.7 and 0.9
  confidence: { exact: 0.85 },           // Exactly 0.85 (±0.0001)
}

// Nested structures
expected: {
  result: {
    valid: true,
    score: { min: 0.8, max: 1.0 },
  },
}
```

### Writing Good Evaluation Criteria

Criteria are natural language statements the LLM judge evaluates:

```typescript
criteria: [
  // Be specific and measurable
  "Returns boolean value true",
  "Confidence score is above 0.8",
  "Correctly identifies semantic equivalence",

  // Reference the expected behavior
  "Recognizes synonyms correctly",
  "Uses context hint for disambiguation",

  // Describe edge case handling
  "Handles empty input gracefully",
  "Does not conflate similar but different meanings",
]
```

### Coverage Guidelines

Each method should have test cases covering:

- **Easy (40%)**: Basic happy path, clear inputs
- **Medium (40%)**: Edge cases, variations, error conditions
- **Hard (20%)**: Adversarial, context-dependent, ambiguous

### Adding Evaluations to a New Type

1. Create `evals/` directory in the type folder:
   ```bash
   mkdir -p src/primitives/<type>/evals
   ```

2. Create dataset file `<method>.evals.ts`:
   ```typescript
   import type { EvalDataset } from '../../../shared/eval-types.ts';

   export const dataset: EvalDataset = {
     name: 'Semantic<Type>.<method>',
     // ... rest of dataset
   };
   ```

3. Create `index.ts` to export datasets:
   ```typescript
   export { dataset as methodName } from './methodName.evals.ts';
   ```

4. Run evaluations:
   ```bash
   bun run evaluation/runner.ts --type Semantic<Type>
   ```

### Configuration

Default configuration in `evaluation/config.ts`:

| Option | Default | Description |
|--------|---------|-------------|
| `runs` | 1 | Runs per test case |
| `passThreshold` | 0.7 | Minimum score to pass |
| `concurrency` | 5 | Parallel case execution |
| `timeoutMs` | 30000 | Timeout per case |
| `judgeProvider` | anthropic | LLM for judging |
| `--no-judge` | false | Skip LLM judge, output raw results |

### CI/CD Integration

```yaml
# .github/workflows/eval.yml
- name: Run Evaluations
  run: bun run evaluation/runner.ts --runs 3 --json > results.json
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Check Pass Rate
  run: |
    PASS_RATE=$(jq '.summary.passRate' results.json)
    if (( $(echo "$PASS_RATE < 0.8" | bc -l) )); then
      exit 1
    fi
```
