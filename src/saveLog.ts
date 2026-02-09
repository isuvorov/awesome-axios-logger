import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Save log file with auto-created directories
 */
export async function saveLog(filepath: string, content: string): Promise<void> {
  const dir = dirname(filepath);
  await mkdir(dir, { recursive: true }).catch(() => {});
  await writeFile(filepath, content).catch(() => {});
}
