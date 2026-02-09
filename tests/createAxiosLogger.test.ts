import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import type { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { attachLogger, createLoggerInterceptors } from '../src/index.js';

const testDir = join(import.meta.dirname, '../.test-logs-axios');

function makeRequestConfig(
  overrides: Partial<InternalAxiosRequestConfig> = {},
): InternalAxiosRequestConfig {
  return {
    url: 'https://api.example.com/v1/player',
    method: 'get',
    headers: { 'Content-Type': 'application/json' } as unknown as AxiosHeaders,
    ...overrides,
  } as InternalAxiosRequestConfig;
}

function makeResponse(
  config: InternalAxiosRequestConfig,
  overrides: Partial<AxiosResponse> = {},
): AxiosResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    data: { result: 'ok' },
    config,
    ...overrides,
  } as AxiosResponse;
}

function makeAxiosError(
  config: InternalAxiosRequestConfig,
  overrides: Partial<AxiosError> = {},
): AxiosError {
  const error = new Error('Request failed') as AxiosError;
  error.config = config;
  error.code = 'ERR_BAD_RESPONSE';
  error.isAxiosError = true;
  error.toJSON = () => ({});
  error.response = {
    status: 500,
    statusText: 'Internal Server Error',
    headers: { 'content-type': 'application/json' },
    data: { error: 'Something went wrong' },
    config,
  } as AxiosResponse;
  Object.assign(error, overrides);
  return error;
}

describe('createLoggerInterceptors', () => {
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('returns interceptors object with all required fields', () => {
    const interceptors = createLoggerInterceptors({ dir: testDir });
    expect(typeof interceptors.request).toBe('function');
    expect(typeof interceptors.response).toBe('function');
    expect(typeof interceptors.error).toBe('function');
    expect(interceptors.logDir).toBe(testDir);
  });

  test('request interceptor saves request log file', async () => {
    const dir = join(testDir, 'req-test');
    const interceptors = createLoggerInterceptors({ dir });
    const config = makeRequestConfig();

    const result = await interceptors.request(config);

    expect(result.url).toBe('https://api.example.com/v1/player');
    expect(result.method).toBe('get');
    expect(result._logPath).toBeTruthy();
    expect(result._logStartTime).toBeTruthy();

    const files = readdirSync(dir);
    expect(files.length).toBeGreaterThan(0);
    const reqFile = files.find((f) => f.includes('_req.json'));
    expect(reqFile).toBeTruthy();

    const content = JSON.parse(readFileSync(join(dir, reqFile as string), 'utf-8'));
    expect(content.url).toBe('https://api.example.com/v1/player');
    expect(content.method).toBe('GET');
  });

  test('request interceptor skips when skipLog is true', async () => {
    const dir = join(testDir, 'skip-test');
    const interceptors = createLoggerInterceptors({ dir });
    const config = makeRequestConfig({ skipLog: true });

    const result = await interceptors.request(config);

    expect(result.skipLog).toBe(true);
    expect(result._logPath).toBeUndefined();
    expect(existsSync(dir)).toBe(false);
  });

  test('request interceptor uses logAs for path', async () => {
    const dir = join(testDir, 'logas-test');
    const interceptors = createLoggerInterceptors({ dir });
    const config = makeRequestConfig({ logAs: 'custom_name' });

    const result = await interceptors.request(config);

    expect(result._logPath).toBe('custom_name');
    const files = readdirSync(dir);
    const reqFile = files.find((f) => f.includes('custom_name'));
    expect(reqFile).toBeTruthy();
  });

  test('response interceptor saves response metadata', async () => {
    const dir = join(testDir, 'res-test');
    const interceptors = createLoggerInterceptors({ dir });

    const config = makeRequestConfig();
    config._logPath = 'v1_player';
    config._logStartTime = Date.now() - 100;

    const res = makeResponse(config);
    const result = await interceptors.response(res);

    expect(result.status).toBe(200);

    const files = readdirSync(dir);
    expect(files.length).toBeGreaterThan(0);
    const resFile = files.find((f) => f.includes('_res.json'));
    expect(resFile).toBeTruthy();

    const meta = JSON.parse(readFileSync(join(dir, resFile as string), 'utf-8'));
    expect(meta.status).toBe(200);
    expect(meta.statusText).toBe('OK');
    expect(meta.duration).toBeGreaterThanOrEqual(0);
  });

  test('response interceptor saves JSON body as separate file', async () => {
    const dir = join(testDir, 'res-json-test');
    const interceptors = createLoggerInterceptors({ dir });

    const config = makeRequestConfig();
    config._logPath = 'v1_data';
    config._logStartTime = Date.now();

    const res = makeResponse(config, {
      data: { items: [1, 2, 3] },
    });
    await interceptors.response(res);

    const files = readdirSync(dir);
    const dataFile = files.find((f) => f.includes('_res_data.json'));
    expect(dataFile).toBeTruthy();

    const data = JSON.parse(readFileSync(join(dir, dataFile as string), 'utf-8'));
    expect(data).toEqual({ items: [1, 2, 3] });
  });

  test('response interceptor saves HTML body with .html extension', async () => {
    const dir = join(testDir, 'res-html-test');
    const interceptors = createLoggerInterceptors({ dir });

    const config = makeRequestConfig();
    config._logPath = 'page';
    config._logStartTime = Date.now();

    const res = makeResponse(config, {
      data: '<!DOCTYPE html><html><body>Hello</body></html>',
      headers: { 'content-type': 'text/html' } as unknown as AxiosHeaders,
    });
    await interceptors.response(res);

    const files = readdirSync(dir);
    const htmlFile = files.find((f) => f.endsWith('.html'));
    expect(htmlFile).toBeTruthy();

    const html = readFileSync(join(dir, htmlFile as string), 'utf-8');
    expect(html).toContain('<body>Hello</body>');
  });

  test('response interceptor skips when skipLog is true', async () => {
    const dir = join(testDir, 'res-skip-test');
    const interceptors = createLoggerInterceptors({ dir });

    const config = makeRequestConfig({ skipLog: true });
    const res = makeResponse(config);
    const result = await interceptors.response(res);

    expect(result.status).toBe(200);
    expect(existsSync(dir)).toBe(false);
  });

  test('error interceptor saves error log and rejects', async () => {
    const dir = join(testDir, 'err-test');
    const interceptors = createLoggerInterceptors({ dir });

    const config = makeRequestConfig();
    config._logPath = 'submit';
    config._logStartTime = Date.now() - 50;

    const err = makeAxiosError(config);

    await expect(interceptors.error(err)).rejects.toThrow('Request failed');

    const files = readdirSync(dir);
    const errFile = files.find((f) => f.includes('_err.json'));
    expect(errFile).toBeTruthy();

    const errData = JSON.parse(readFileSync(join(dir, errFile as string), 'utf-8'));
    expect(errData.message).toBe('Request failed');
    expect(errData.code).toBe('ERR_BAD_RESPONSE');
    expect(errData.status).toBe(500);
    expect(errData.duration).toBeGreaterThanOrEqual(0);
  });

  test('error interceptor skips when skipLog is true', async () => {
    const dir = join(testDir, 'err-skip-test');
    const interceptors = createLoggerInterceptors({ dir });

    const config = makeRequestConfig({ skipLog: true });
    const err = makeAxiosError(config);

    await expect(interceptors.error(err)).rejects.toThrow();
    expect(existsSync(dir)).toBe(false);
  });

  test('custom filename function is used', async () => {
    const dir = join(testDir, 'custom-fn-test');
    const interceptors = createLoggerInterceptors({
      dir,
      filename: ({ path, kind, ext }) => `custom_${path}_${kind}.${ext}`,
    });

    const config = makeRequestConfig();
    await interceptors.request(config);

    const files = readdirSync(dir);
    const customFile = files.find((f) => f.startsWith('custom_'));
    expect(customFile).toBeTruthy();
  });
});

describe('attachLogger', () => {
  test('attaches interceptors to axios instance', () => {
    const requestHandlers: Array<(...args: any[]) => any> = [];
    const responseHandlers: Array<{
      fulfilled: (...args: any[]) => any;
      rejected: (...args: any[]) => any;
    }> = [];

    const mockInstance = {
      interceptors: {
        request: {
          use: (fn: (...args: any[]) => any) => requestHandlers.push(fn),
        },
        response: {
          use: (fulfilled: (...args: any[]) => any, rejected: (...args: any[]) => any) =>
            responseHandlers.push({ fulfilled, rejected }),
        },
      },
    };

    const result = attachLogger(mockInstance as any, {
      dir: join(testDir, 'attach-test'),
    });

    expect(requestHandlers).toHaveLength(1);
    expect(responseHandlers).toHaveLength(1);
    expect(typeof result.request).toBe('function');
    expect(typeof result.response).toBe('function');
    expect(typeof result.error).toBe('function');
    expect(result.logDir).toContain('attach-test');
  });
});
