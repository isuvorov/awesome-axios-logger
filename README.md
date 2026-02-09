# 📡 awesome-axios-logger

[![LSK.js](https://github.com/lskjs/presets/raw/main/docs/badge.svg)](https://github.com/lskjs)
[![NPM version](https://badgen.net/npm/v/awesome-axios-logger)](https://www.npmjs.com/package/awesome-axios-logger)
[![Tests](https://github.com/isuvorov/awesome-axios-logger/actions/workflows/release.yml/badge.svg)](https://github.com/isuvorov/awesome-axios-logger/actions/workflows/release.yml)
[![TypeScript + ESM](https://img.shields.io/badge/TypeScript-Ready-brightgreen.svg)](https://www.typescriptlang.org/)
[![Install size](https://packagephobia.now.sh/badge?p=awesome-axios-logger)](https://packagephobia.now.sh/result?p=awesome-axios-logger)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/awesome-axios-logger.svg)](https://bundlephobia.com/result?p=awesome-axios-logger)
[![License](https://badgen.net//github/license/isuvorov/awesome-axios-logger)](https://github.com/isuvorov/awesome-axios-logger/blob/master/LICENSE)
[![Ask me in Telegram](https://img.shields.io/badge/Ask%20me%20in-Telegram-brightblue.svg)](https://t.me/isuvorov)


<div align="center">
  <p><strong>Axios interceptors for automatic HTTP request/response/error logging to files</strong></p>
</div>

<img src="./docs/logo.png" align="right" width="200" height="200" />


**🚀 Modern**: Built with ESM6 modules and TypeScript <br/>
**🪶 Lightweight**: Tree-shakable, minimal bundle size  <br/>
**💪 Type-safe**: Full TypeScript support with comprehensive type definitions <br/>
**⚡ Fast**: Non-blocking async file logging <br/>
**🎯 Focused**: Request, response, and error logging without bloat <br/>
**📦 Zero Dependencies**: No extra runtime dependencies — works out of the box with just `axios` and this package. <br/>

```ts
import axios from 'axios';
import { attachLogger } from 'awesome-axios-logger';

const client = axios.create({ baseURL: 'https://api.example.com' });
attachLogger(client, { dir: './logs' });

await client.get('/v1/player');
```


## Features

- Automatic file logging of HTTP requests, responses, and errors
- Smart content detection (JSON, HTML, plain text)
- Customizable filename patterns
- Per-request logging control (`skipLog`, `logAs`)
- Console output via `@lsk4/log` (pino-style)
- Zero config — just specify a directory

## Installation

```bash
npm install axios awesome-axios-logger 
```

### Import

```typescript
import { attachLogger, createLoggerInterceptors } from 'awesome-axios-logger';
```

## Quick Start

```typescript
import axios from 'axios';
import { attachLogger } from 'awesome-axios-logger';

const client = axios.create({
  baseURL: 'https://api.example.com',
});

// Attach logger — all requests will be logged to ./logs
attachLogger(client, {
  dir: './logs',
});

// Make requests as usual
await client.get('/v1/player');
await client.post('/v1/submit', { data: 'hello' });

// Skip logging for specific requests
await client.get('/health', { skipLog: true });

// Custom name in logs
await client.get('/v1/get_user_info', { logAs: 'user' });
```

## Console output

Uses `@lsk4/log` — a JSON-compatible logger (pino-style).

Enable logs via environment variable:
```bash
DEBUG=axios node app.js
```

Example output:
```
[axios] -> GET v1_player (124B)
[axios] <- v1_player 200 json (45.2KB) 234ms
```

On error:
```
[axios] -> POST submit (1.2KB)
[axios] <- submit 500 json (156B) 89ms
```

## Log file structure

```
logs/
├── 1738678234_macbook_v1_player_req.json       # request metadata
├── 1738678234_macbook_v1_player_res.json       # response metadata
├── 1738678234_macbook_v1_player_res_data.json  # JSON body
├── 1738678234_macbook_v1_player_res.html       # HTML body (if HTML response)
└── 1738678234_macbook_v1_player_err.json       # error metadata
```

### Request log (`*_req.json`)

```json
{
  "url": "https://api.example.com/v1/player",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "data": {
    "videoId": "dQw4w9WgXcQ"
  }
}
```

### Response log (`*_res.json`)

```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "content-length": "46280"
  },
  "duration": 234
}
```

### Error log (`*_err.json`)

```json
{
  "message": "Request failed with status code 500",
  "code": "ERR_BAD_RESPONSE",
  "status": 500,
  "statusText": "Internal Server Error",
  "duration": 89,
  "data": {
    "error": "Something went wrong"
  }
}
```

## API Reference

### `attachLogger(instance, options)` → `LoggerInterceptors`

Attaches logging interceptors to an axios instance.

```typescript
import axios from 'axios';
import { attachLogger } from 'awesome-axios-logger';

const client = axios.create({ baseURL: 'https://api.example.com' });

const logger = attachLogger(client, {
  dir: './logs',
  filename: ({ ts, path, kind, ext }) => `${ts}_${path}_${kind}.${ext}`,
});

console.log(logger.logDir); // './logs'
```

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `dir` | `string` | Yes | Directory for log files |
| `filename` | `FilenameFunction` | No | Custom filename generator |

### `createLoggerInterceptors(options)` → `LoggerInterceptors`

Creates interceptors without auto-attaching. Use this for manual interceptor setup.

```typescript
import { createLoggerInterceptors } from 'awesome-axios-logger';

const logger = createLoggerInterceptors({ dir: './logs' });

client.interceptors.request.use(logger.request);
client.interceptors.response.use(logger.response, logger.error);
```

### `saveLog(filepath, content)`

Low-level utility to save a log file with auto-created directories.

```typescript
import { saveLog } from 'awesome-axios-logger';

await saveLog('./logs/custom.json', JSON.stringify({ hello: 'world' }, null, 2));
```

### Per-request options

Control logging on a per-request basis:

| Option | Type | Description |
|--------|------|-------------|
| `logAs` | `string` | Override `path` for this request |
| `skipLog` | `boolean` | Skip logging entirely |

```typescript
// Skip logging
await client.get('/health', { skipLog: true });

// Custom name in logs
await client.get('/v1/get_user_info', { logAs: 'user' });
// → 1738678234_macbook_user_req.json (instead of v1_get_user_info)
```

### Custom filename

The `filename` function receives parameters about the request and returns the filename:

```typescript
interface FilenameParams {
  ts: number;        // Unix timestamp (seconds)
  hostname: string;  // Machine hostname (sanitized)
  url: string;       // Full request URL
  path: string;      // Path from URL (sanitized: /v1/get_player → v1_player)
  kind: 'req' | 'res' | 'err';
  ext: 'json' | 'html' | 'txt';
}
```

**Examples:**

```typescript
// Group by date
attachLogger(client, {
  dir: './logs',
  filename: ({ ts, path, kind, ext }) => {
    const date = new Date(ts * 1000).toISOString().split('T')[0];
    return `${date}/${ts}_${path}_${kind}.${ext}`;
  },
});
// → ./logs/2026-02-04/1738678234_v1_player_req.json

// Group by videoId
const videoId = 'abc123';
attachLogger(client, {
  dir: './logs',
  filename: ({ ts, path, kind, ext }) => `${videoId}/${ts}_${path}_${kind}.${ext}`,
});
// → ./logs/abc123/1738678234_v1_player_req.json

// Minimal format (without hostname)
attachLogger(client, {
  dir: './logs',
  filename: ({ ts, path, kind, ext }) => `${ts}_${path}_${kind}.${ext}`,
});
// → ./logs/1738678234_v1_player_req.json
```

## Type Definitions

awesome-axios-logger includes comprehensive TypeScript definitions:

```typescript
import type {
  LoggerOptions,
  LoggerInterceptors,
  FilenameParams,
  FilenameFunction,
  LogKind,   // 'req' | 'res' | 'err'
  LogExt,    // 'json' | 'html' | 'txt'
} from 'awesome-axios-logger';
```

## Utility Functions

The library exports utility functions used internally:

```typescript
import {
  sanitize,       // Sanitize string for filenames
  getPathFromUrl, // Extract and sanitize path from URL
  getHostname,    // Get sanitized system hostname
  detectExt,      // Detect file extension from content
  formatSize,     // Format bytes to human readable (B, KB, MB)
  getDataSize,    // Get data size in bytes
  defaultFilename,// Default filename function
  buildFilepath,  // Build full filepath from components
} from 'awesome-axios-logger';
```

## Inspired by

- [axios-logger](https://github.com/hg-pyun/axios-logger) — request/response logging
- [axios-debug-log](https://github.com/Gerhut/axios-debug-log) — debug-style logging
- [axios-vcr](https://github.com/aaazi/axios-vcr) — record/replay requests
- [axios-adapter-logger](https://github.com/wizbii/axios-adapter-logger) — adapter-based logging
- [@new10com/axios-logger](https://github.com/new10com/axios-logger) — structured logging

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Resources

- [GitHub Repository](https://github.com/isuvorov/awesome-axios-logger)
- [NPM Package](https://www.npmjs.com/package/awesome-axios-logger)
- [Issues & Bug Reports](https://github.com/isuvorov/awesome-axios-logger/issues)

## License

MIT © [Igor Suvorov](https://github.com/isuvorov)

---

**awesome-axios-logger** — _Log every HTTP call_ 📡

---
