import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export type LogKind = 'req' | 'res' | 'err';
export type LogExt = 'json' | 'html' | 'txt';

export interface FilenameParams {
  /** Unix timestamp (seconds) */
  ts: number;
  /** Hostname (sanitized) */
  hostname: string;
  /** Full request URL */
  url: string;
  /** Path from URL (sanitized) */
  path: string;
  /** Log type */
  kind: LogKind;
  /** File extension */
  ext: LogExt;
}

export type FilenameFunction = (params: FilenameParams) => string;

export interface LoggerOptions {
  /** Directory for logs (required) */
  dir: string;
  /** Custom filename function (optional) */
  filename?: FilenameFunction;
}

export interface LoggerInterceptors {
  /** Request interceptor function */
  request: (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>;
  /** Response success interceptor function */
  response: (response: AxiosResponse) => Promise<AxiosResponse>;
  /** Response error interceptor function */
  error: (error: AxiosError) => Promise<never>;
  /** Path to log directory */
  logDir: string;
}
