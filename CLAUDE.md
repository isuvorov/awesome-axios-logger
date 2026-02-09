# awesome-axios-logger

> **This file contains instructions for AI assistants (Claude).** For project documentation see [docs/guideline.md](docs/guideline.md).

Axios interceptors for automatic HTTP request/response/error logging to files.

**Important:**
- Update this file and docs/guideline.md after large project changes
- Run `bun run fix` if all ok run `bun run test` after each code change
- Before saying "done", always run full `bun run fix` and `bun run test` (partial runs are ok for debugging)
- Use context7

## Main Commands
```bash
bun run build       # Build the project (tsdown → lib/)
bun run test        # Run lint + types + unit tests + size-limit
bun run test:lint   # Run only lints (biome)
bun run test:types  # Check TypeScript types (tsc --noEmit)
bun run test:unit   # Run only unit tests
bun run test:size   # Check bundle size limits
bun run fix         # Fix lint errors
```

## Structure
```
src/
├── index.ts              # Re-exports everything
├── types.ts              # TypeScript types (LogKind, LogExt, FilenameParams, etc.)
├── utils.ts              # Pure utility functions (sanitize, detectExt, formatSize, etc.)
├── saveLog.ts            # File saving with auto-created directories
└── createAxiosLogger.ts  # Main logic: createLoggerInterceptors, attachLogger
```

## Key Architecture
- **createLoggerInterceptors(options)** — creates request/response/error interceptor functions
- **attachLogger(instance, options)** — attaches interceptors to an axios instance
- **saveLog(filepath, content)** — writes log files with recursive mkdir
- Utility functions in `utils.ts` are exported for testing and reuse

## Dependencies
- `axios` — peer dependency (^1.0.0)
- `@lsk4/log` — console logging (lazyLog)

## Testing
- Framework: `bun:test` (describe, test, expect)
- Run with: `bun run test:unit` → `bun test`
- Tests create temp dirs `.test-logs-*` (cleaned up in `afterAll()` hooks)

## More Info
Full guideline available at [docs/guideline.md](docs/guideline.md)
