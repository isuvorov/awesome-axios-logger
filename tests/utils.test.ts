import { describe, expect, test } from 'bun:test';

import {
  buildFilepath,
  defaultFilename,
  detectExt,
  formatSize,
  getDataSize,
  getHostname,
  getPathFromUrl,
  sanitize,
} from '../src/index.js';

describe('sanitize', () => {
  test('removes protocol prefix', () => {
    expect(sanitize('https://example.com')).toBe('example_com');
  });
  test('removes http prefix', () => {
    expect(sanitize('http://example.com')).toBe('example_com');
  });
  test('replaces non-alphanumeric characters with underscores', () => {
    expect(sanitize('/v1/get_player')).toBe('v1_get_player');
  });
  test('removes leading and trailing underscores', () => {
    expect(sanitize('__hello__')).toBe('hello');
  });
  test('collapses multiple underscores', () => {
    expect(sanitize('a///b///c')).toBe('a_b_c');
  });
  test('lowercases the result', () => {
    expect(sanitize('Hello-World')).toBe('hello_world');
  });
  test('handles empty string', () => {
    expect(sanitize('')).toBe('');
  });
  test('handles simple alphanumeric', () => {
    expect(sanitize('abc123')).toBe('abc123');
  });
});

describe('getPathFromUrl', () => {
  test('extracts path from absolute URL', () => {
    expect(getPathFromUrl('https://api.example.com/v1/player')).toBe('v1_player');
  });
  test('extracts path from URL with query params', () => {
    expect(getPathFromUrl('https://api.example.com/v1/player?id=1')).toBe('v1_player');
  });
  test('handles relative URL', () => {
    expect(getPathFromUrl('/v1/player')).toBe('v1_player');
  });
  test('handles relative URL with query', () => {
    expect(getPathFromUrl('/api/users?page=2')).toBe('api_users');
  });
  test('handles empty string', () => {
    expect(getPathFromUrl('')).toBe('');
  });
  test('handles root path', () => {
    expect(getPathFromUrl('https://example.com/')).toBe('');
  });
});

describe('getHostname', () => {
  test('returns a sanitized hostname string', () => {
    const result = getHostname();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^[a-z0-9_]*$/);
  });
});

describe('detectExt', () => {
  test('detects html from content-type header', () => {
    expect(detectExt('data', { 'content-type': 'text/html' })).toBe('html');
  });
  test('detects json from content-type header', () => {
    expect(detectExt('data', { 'content-type': 'application/json' })).toBe('json');
  });
  test('detects html from string content starting with <!', () => {
    expect(detectExt('<!DOCTYPE html><html></html>')).toBe('html');
  });
  test('detects html from string content starting with <html', () => {
    expect(detectExt('<html><body></body></html>')).toBe('html');
  });
  test('detects json from string content starting with {', () => {
    expect(detectExt('{"key": "value"}')).toBe('json');
  });
  test('detects json from string content starting with [', () => {
    expect(detectExt('[1, 2, 3]')).toBe('json');
  });
  test('detects json from object data', () => {
    expect(detectExt({ key: 'value' })).toBe('json');
  });
  test('detects json from array data', () => {
    expect(detectExt([1, 2, 3])).toBe('json');
  });
  test('returns txt for plain string', () => {
    expect(detectExt('hello world')).toBe('txt');
  });
  test('returns txt for null', () => {
    expect(detectExt(null)).toBe('txt');
  });
  test('returns txt for undefined', () => {
    expect(detectExt(undefined)).toBe('txt');
  });
  test('returns txt for number', () => {
    expect(detectExt(42)).toBe('txt');
  });
  test('header takes priority over content detection', () => {
    expect(detectExt('{"json": true}', { 'content-type': 'text/html' })).toBe('html');
  });
  test('handles whitespace before content', () => {
    expect(detectExt('  {"key": "value"}')).toBe('json');
  });
});

describe('formatSize', () => {
  test('formats bytes', () => {
    expect(formatSize(0)).toBe('0B');
    expect(formatSize(100)).toBe('100B');
    expect(formatSize(1023)).toBe('1023B');
  });
  test('formats kilobytes', () => {
    expect(formatSize(1024)).toBe('1.0KB');
    expect(formatSize(1536)).toBe('1.5KB');
    expect(formatSize(10240)).toBe('10.0KB');
  });
  test('formats megabytes', () => {
    expect(formatSize(1048576)).toBe('1.00MB');
    expect(formatSize(5242880)).toBe('5.00MB');
  });
});

describe('getDataSize', () => {
  test('returns 0 for null', () => {
    expect(getDataSize(null)).toBe(0);
  });
  test('returns 0 for undefined', () => {
    expect(getDataSize(undefined)).toBe(0);
  });
  test('returns 0 for empty string', () => {
    expect(getDataSize('')).toBe(0);
  });
  test('returns string length for strings', () => {
    expect(getDataSize('hello')).toBe(5);
  });
  test('returns JSON.stringify length for objects', () => {
    const data = { key: 'value' };
    expect(getDataSize(data)).toBe(JSON.stringify(data).length);
  });
  test('returns JSON.stringify length for arrays', () => {
    const data = [1, 2, 3];
    expect(getDataSize(data)).toBe(JSON.stringify(data).length);
  });
  test('returns 0 for circular references', () => {
    const obj: any = {};
    obj.self = obj;
    expect(getDataSize(obj)).toBe(0);
  });
});

describe('defaultFilename', () => {
  test('generates correct filename', () => {
    const result = defaultFilename({
      ts: 1738678234,
      hostname: 'macbook',
      url: 'https://api.example.com/v1/player',
      path: 'v1_player',
      kind: 'req',
      ext: 'json',
    });
    expect(result).toBe('1738678234_macbook_v1_player_req.json');
  });
  test('works with response kind', () => {
    const result = defaultFilename({
      ts: 1738678234,
      hostname: 'server',
      url: 'https://api.example.com/v1/player',
      path: 'v1_player',
      kind: 'res',
      ext: 'html',
    });
    expect(result).toBe('1738678234_server_v1_player_res.html');
  });
  test('works with error kind', () => {
    const result = defaultFilename({
      ts: 1738678234,
      hostname: 'server',
      url: 'https://api.example.com/submit',
      path: 'submit',
      kind: 'err',
      ext: 'json',
    });
    expect(result).toBe('1738678234_server_submit_err.json');
  });
});

describe('buildFilepath', () => {
  test('combines dir and filename', () => {
    const result = buildFilepath(
      './logs',
      defaultFilename,
      {
        ts: 1738678234,
        hostname: 'macbook',
        url: 'https://api.example.com/v1/player',
        path: 'v1_player',
        kind: 'req',
      },
      'json',
    );
    expect(result).toBe('./logs/1738678234_macbook_v1_player_req.json');
  });
  test('works with custom filename function', () => {
    const customFn = ({ path, kind, ext }: { path: string; kind: string; ext: string }) =>
      `${path}_${kind}.${ext}`;
    const result = buildFilepath(
      '/var/logs',
      customFn,
      {
        ts: 123,
        hostname: 'host',
        url: 'http://example.com/api',
        path: 'api',
        kind: 'res',
      },
      'json',
    );
    expect(result).toBe('/var/logs/api_res.json');
  });
});
