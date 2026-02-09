import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { saveLog } from '../src/index.js';

const testDir = join(import.meta.dirname, '../.test-logs-saveLog');

describe('saveLog', () => {
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('creates file with content', async () => {
    const filepath = join(testDir, 'test1.json');
    await saveLog(filepath, '{"hello":"world"}');
    expect(existsSync(filepath)).toBe(true);
    expect(readFileSync(filepath, 'utf-8')).toBe('{"hello":"world"}');
  });

  test('creates nested directories', async () => {
    const filepath = join(testDir, 'nested', 'deep', 'test2.json');
    await saveLog(filepath, 'nested content');
    expect(existsSync(filepath)).toBe(true);
    expect(readFileSync(filepath, 'utf-8')).toBe('nested content');
  });

  test('overwrites existing file', async () => {
    const filepath = join(testDir, 'overwrite.json');
    await saveLog(filepath, 'first');
    await saveLog(filepath, 'second');
    expect(readFileSync(filepath, 'utf-8')).toBe('second');
  });

  test('handles empty content', async () => {
    const filepath = join(testDir, 'empty.json');
    await saveLog(filepath, '');
    expect(existsSync(filepath)).toBe(true);
    expect(readFileSync(filepath, 'utf-8')).toBe('');
  });
});
