# SemanticError Evaluation Datasets

LLM-as-judge evaluation test cases for the `SemanticError` class. These datasets are discovered automatically by the evaluation runner via the glob pattern `src/types/**/evals/index.ts`.

## Running

```bash
# All SemanticError evals
bun run evaluation/runner.ts --type SemanticError

# Single method
bun run evaluation/runner.ts --type SemanticError --method classify

# Raw results without LLM judge (no API key needed for review)
bun run evaluation/runner.ts --type SemanticError --no-judge --json

# Filter by difficulty or tags
bun run evaluation/runner.ts --type SemanticError --difficulty hard
bun run evaluation/runner.ts --type SemanticError --tags network,timeout
```

## Datasets

| File | Method | Cases | Description |
|------|--------|-------|-------------|
| `classify.evals.ts` | `classify()` | 17 | Categorize errors by type, severity, and retryability |
| `semanticallyEquals.evals.ts` | `semanticallyEquals()` | 13 | Compare two errors for semantic equivalence |
| `matches.evals.ts` | `matches()` | 14 | Check if an error matches a named pattern |
| `getSeverity.evals.ts` | `getSeverity()` | 12 | Assess severity level (critical/error/warning/info) |
| `recoveryStrategy.evals.ts` | `recoveryStrategy()` | 13 | Recommend recovery action (retry/fallback/abort/ignore) |
| `inferRootCause.evals.ts` | `inferRootCause()` | 10 | Infer the underlying root cause from the error message |

**Total: 79 cases across 6 methods.**

## Difficulty Distribution

Each dataset targets roughly 40% easy / 40% medium / 20% hard:

| Dataset | Easy | Medium | Hard | Total |
|---------|------|--------|------|-------|
| classify | 5 | 8 | 4 | 17 |
| semanticallyEquals | 5 | 5 | 3 | 13 |
| matches | 6 | 4 | 4 | 14 |
| getSeverity | 4 | 5 | 3 | 12 |
| recoveryStrategy | 3 | 7 | 3 | 13 |
| inferRootCause | 3 | 4 | 3 | 10 |
| **Totals** | **26 (33%)** | **33 (42%)** | **20 (25%)** | **79** |

## What Each Difficulty Tests

### Easy — Clear, unambiguous errors
- Standard error codes with well-known meanings (ECONNREFUSED, ENOTFOUND, OOM)
- Errors where the category, severity, or pattern is self-evident from the message
- Direct matches and obvious non-matches
- Examples: timeout → retryable, OOM → critical, auth failure ≠ timeout

### Medium — Nuance within a category
- Errors that require interpreting context or implication (JWT expired → auth, not retryable without refresh)
- Subcategory distinctions (unique constraint vs. foreign key violation)
- Verbose vs. terse versions of the same error (ECONNRESET vs. full description)
- Recovery strategies that depend on error semantics (abort for invalid credentials, fallback for cache unavailable)

### Hard — Ambiguous, cross-cutting, or context-dependent
- Errors that span categories (SSL handshake → network or configuration?)
- Cascade failures where the root cause is upstream, not in the immediate message
- Subtle distinctions (read timeout vs. connection timeout — same family, different phase)
- Cross-platform equivalence (Java SQL exception ↔ PostgreSQL error for the same missing table)
- Gradual failures that imply a leak rather than a single event

## Error Domains Covered

The test cases use realistic error messages from common production systems:

- **Network**: ECONNREFUSED, ENOTFOUND, ECONNRESET, timeouts, DNS failures, socket hang-ups
- **Database**: PostgreSQL constraint violations, connection pool exhaustion, deadlocks, schema mismatches
- **Authentication**: JWT expiry, invalid credentials, permission denied, HTTP 403
- **Validation**: Email format, type mismatches, invalid arguments
- **Resource**: OOM (heap), disk full (ENOSPC), rate limiting (429)
- **Runtime**: Null references, stack overflow, type errors
- **Infrastructure**: Circuit breakers, service unavailability, cascade failures, data corruption
- **Operational**: Deprecation warnings, cache misses, retry-in-progress, log rotation

## Assumptions and Design Decisions

### Factory is synchronous
`SemanticError.from()` returns a `SemanticError` directly (not a Promise), so all datasets set `factoryAsync: false`. This differs from `SemanticString.from()` and `SemanticBoolean.from()` which are async.

### Structural match limitations
Two methods return primitives rather than objects:
- `matches()` returns `boolean`
- `getSeverity()` returns `string` (an `ErrorSeverityLevel`)

The runner's `checkStructuralMatch()` requires an object, so structural match will always be `false` for these two methods. This is expected — the LLM judge evaluates correctness via the criteria and expected values regardless of structural match. The other four methods return objects and support structural matching normally.

### Error objects in args
`semanticallyEquals()` requires an `Error` object as its argument. The eval cases pass `new Error("...")` in the `args` array. This works because eval files are TypeScript modules imported at runtime — the args are live JavaScript values, not serialized JSON.

### Expected values are intentionally partial
Most cases only assert on the fields that matter for that test. For example, a `classify` case might only check `{ category: 'network', retryable: true }` without constraining `subcategory` or `confidence`. This avoids over-fitting to specific LLM output formatting while still validating semantic correctness.

### No context parameter in factory
The runner passes only `input.value` to `SemanticError.from()`. The optional `context` parameter of `from(error, context?)` is not populated by the runner's factory call. Cases that would benefit from context (e.g., distinguishing severity based on business domain) rely solely on the error message content.

### Tag taxonomy
Tags are used for filtering (`--tags network,timeout`) and follow these conventions:
- **Error domain**: `network`, `database`, `authentication`, `validation`, `resource`, `runtime`
- **Specific pattern**: `timeout`, `connection`, `constraint`, `memory`, `ssl`, `jwt`
- **Test type**: `basic`, `negative`, `nuance`, `subtle`, `ambiguous`, `indirect`
- **Severity**: `critical`
- **Complexity**: `cascade`, `cross-platform`, `context`
