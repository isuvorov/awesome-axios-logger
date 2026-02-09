# Project Guidelines

> **This file contains project documentation for developers.** For AI assistant instructions see [CLAUDE.md](../CLAUDE.md).

Guidelines for awesome-axios-logger — axios interceptors for automatic HTTP logging to files.

Using modern TypeScript tooling for 2026.

**Important:**
- Update this file after large project changes
- Run `bun run fix` and `bun run test` after each code change

## Stack

| Tool            | Choice                | Notes                          |
|-----------------|-----------------------|--------------------------------|
| Runtime         | Node.js 20+          | Tested on Node 20 and 22      |
| Package Manager | bun                  | `bun install`, `bun add`      |
| Language        | TypeScript 5.9+      | Strict mode                   |
| Module System   | ESM (nodenext)       | `"type": "module"` in package.json |
| Build           | tsdown               | Primary builder → `lib/`      |
| Build (alt)     | tsup, bunup, tsc     | Alternative builders           |
| Linting         | Biome                | Code quality and formatting   |
| Testing         | bun:test             | Built-in Bun test runner      |
| Bundle Check    | size-limit           | Bundle size constraints       |
| Release         | semantic-release     | Automated versioning and npm publish |
| CI/CD           | GitHub Actions       | Test on PR, release on push to main |

## Project Structure

### Filesystem

| Folder / File         | Purpose                                  |
|-----------------------|------------------------------------------|
| `src/`                | Library source code                      |
| `new-src/`            | Original source (before refactoring)     |
| `tests/`              | Unit and integration tests               |
| `docs/`               | Documentation and guidelines             |
| `.github/workflows/`  | CI/CD pipelines (test, release)          |
| `biome.json`          | Biome linter/formatter configuration     |
| `tsconfig.json`       | TypeScript config                        |
| `tsdown.config.ts`    | tsdown build config                      |
| `tsup.config.ts`      | tsup build config                        |
| `bunup.config.ts`     | bunup build config                       |
| `package.json`        | Scripts, dependencies, size-limit config |

```
project/
├── src/
│   ├── index.ts              # Re-exports all public API
│   ├── types.ts              # TypeScript type definitions
│   ├── utils.ts              # Pure utility functions
│   ├── saveLog.ts            # File saving utility
│   └── createAxiosLogger.ts  # Main interceptor logic
├── tests/
│   ├── utils.test.ts              # Tests for utility functions
│   ├── saveLog.test.ts            # Tests for file saving
│   └── createAxiosLogger.test.ts  # Tests for interceptors
├── docs/
│   ├── guideline.md          # Project guidelines (this file)
│   └── logo.png              # Project logo
├── .github/
│   └── workflows/
│       ├── test.yml          # PR testing (Node 20, 22)
│       └── release.yml       # Auto-release on push to main
├── biome.json
├── tsconfig.json
├── tsdown.config.ts
├── tsup.config.ts
├── bunup.config.ts
├── CLAUDE.md
└── package.json
```

### `src/` Structure

| File                    | Purpose                                                        |
|-------------------------|----------------------------------------------------------------|
| `index.ts`              | Public API — re-exports all functions and types                |
| `types.ts`              | Type definitions: LogKind, LogExt, FilenameParams, LoggerOptions, LoggerInterceptors |
| `utils.ts`              | Pure utility functions: sanitize, getPathFromUrl, getHostname, detectExt, formatSize, getDataSize, defaultFilename, buildFilepath |
| `saveLog.ts`            | Async file writer with recursive directory creation            |
| `createAxiosLogger.ts`  | Core logic: createLoggerInterceptors, attachLogger, axios module augmentation |

### Test Structure

| File                         | What it tests                                          |
|------------------------------|--------------------------------------------------------|
| `utils.test.ts`              | sanitize, getPathFromUrl, getHostname, detectExt, formatSize, getDataSize, defaultFilename, buildFilepath |
| `saveLog.test.ts`            | File creation, nested dirs, overwrite, empty content   |
| `createAxiosLogger.test.ts`  | Request/response/error interceptors, skipLog, logAs, custom filename, HTML/JSON body saving, attachLogger |

## Commands

```bash
# Build
bun run build              # Build for production (tsdown → lib/)
bun run build:tsdown       # Build with tsdown (→ lib-tsdown/)
bun run build:tsup         # Build with tsup (→ lib-tsup/)
bun run build:bunup        # Build with bunup (→ lib-bunup/)
bun run build:tsc          # Build with tsc (→ lib-tsc/)
bun run build:all          # Build with all builders
bun run dev                # Watch mode (tsdown)

# Testing
bun run test               # Full: lint + types + unit tests + size-limit
bun run test:unit          # Run only unit tests
bun run test:unit:watch    # Run unit tests in watch mode
bun run test:types         # TypeScript type check (tsc --noEmit)
bun run test:lint          # Run biome lint
bun run test:size          # Check bundle size limits
bun run test:watch         # Alias for test:unit:watch

# Fixing
bun run fix                # Auto fix lint & formatting (biome)
bun run fix:lint           # Same as fix

# Release
bun run release            # Build + test + semantic-release + npm publish
bun run version:patch      # Manual patch version bump
```

## TypeScript

Using TypeScript 5.9+ with strict mode enabled.

**tsconfig.json:**
- `target: ES2023`
- `module: nodenext`
- `moduleResolution: nodenext`
- `strict: true`
- `skipLibCheck: true`
- `rootDir: src/`
- `declaration: true` (generates `.d.ts`)
- `sourceMap: true`

## Lint

Using Biome as the sole linter and formatter.

```bash
bun run test:lint          # Run Biome lint
bun run fix                # Auto fix
```

**Biome configuration (biome.json):**
- Recommended rules enabled
- `noExplicitAny: off` — allows `any` type
- `useImportExtensions: error` — enforces `.js` extensions in imports
- 2-space indentation, 100-char line width
- Single quotes, always semicolons
- Applies to `src/**/*.ts` and `tests/**/*.ts`

## CI/CD

GitHub Actions runs two workflows:

### Test (on PR to main)
1. Checkout code
2. Setup Node.js (matrix: 20, 22)
3. Setup Bun, install deps
4. Build (`bun run build`)
5. Test (`bun run test`)

### Release (on push to main)
1. Checkout code (full history)
2. Setup Node.js (LTS)
3. Setup Bun, install deps
4. Build and test
5. Run semantic-release (publish to npm, create GitHub release)

## Dependencies

### Runtime
- `@lsk4/log` — JSON-compatible logger (pino-style), used for console output

### Peer
- `axios` (^1.0.0) — HTTP client, must be installed by consumer

### Dev
- `@biomejs/biome` — Linting and formatting
- `tsdown` — Primary TypeScript builder
- `typescript` — TypeScript compiler
- `size-limit` — Bundle size checking
- `semantic-release` — Automated releases

## Size Limits

Bundle size is checked via size-limit:

| Entry          | Limit | Note                                    |
|----------------|-------|-----------------------------------------|
| `lib/index.js` | 5 KB  | Full library (with external deps ignored) |
| `lib/saveLog.js` | 1 KB | File saving utility                    |
| `lib/utils.js` | 1 KB  | Pure utility functions                  |

Node built-in modules (`node:os`, `node:fs/promises`, `node:path`) and external deps (`axios`, `@lsk4/log`) are excluded from size calculation.

## Package Exports

The package supports both main entry and individual module imports:

```typescript
// Main entry
import { attachLogger, createLoggerInterceptors, saveLog } from 'awesome-axios-logger';

// Individual modules
import { attachLogger } from 'awesome-axios-logger/createAxiosLogger';
import { saveLog } from 'awesome-axios-logger/saveLog';
import { sanitize, detectExt } from 'awesome-axios-logger/utils';
```
