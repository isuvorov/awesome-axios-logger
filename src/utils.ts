import { hostname as osHostname } from 'node:os';

import type { FilenameFunction, FilenameParams, LogExt } from './types.js';

/** Sanitize string for use in filename */
export function sanitize(str: string): string {
  return str
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/** Extract and sanitize path from URL */
export function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return sanitize(urlObj.pathname);
  } catch {
    // Relative URL
    const path = url.split('?')[0];
    return sanitize(path);
  }
}

/** Get current hostname (sanitized) */
export function getHostname(): string {
  try {
    return sanitize(osHostname());
  } catch {
    return 'unknown';
  }
}

/** Detect extension from content */
export function detectExt(data: unknown, headers?: Record<string, unknown>): LogExt {
  const contentType = headers?.['content-type'] as string | undefined;
  if (contentType?.includes('html')) return 'html';
  if (contentType?.includes('json')) return 'json';

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) return 'html';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  }
  if (typeof data === 'object' && data !== null) return 'json';
  return 'txt';
}

/** Format bytes to human readable */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/** Get data size in bytes */
export function getDataSize(data: unknown): number {
  if (!data) return 0;
  if (typeof data === 'string') return data.length;
  try {
    return JSON.stringify(data).length;
  } catch {
    return 0;
  }
}

/** Default filename function */
export const defaultFilename: FilenameFunction = ({ ts, hostname, path, kind, ext }) => {
  return `${ts}_${hostname}_${path}_${kind}.${ext}`;
};

/** Build full filepath */
export function buildFilepath(
  dir: string,
  filenameFn: FilenameFunction,
  params: Omit<FilenameParams, 'ext'>,
  ext: LogExt,
): string {
  const filename = filenameFn({ ...params, ext });
  return `${dir}/${filename}`;
}
