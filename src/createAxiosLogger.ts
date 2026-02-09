import { createLogger } from '@lsk4/log';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { saveLog } from './saveLog.js';
import type { LoggerInterceptors, LoggerOptions } from './types.js';
import {
  buildFilepath,
  defaultFilename,
  detectExt,
  formatSize,
  getDataSize,
  getHostname,
  getPathFromUrl,
} from './utils.js';

const log = createLogger('axios', { level: 'fatal' });

// Extend axios config to store our metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    logAs?: string;
    skipLog?: boolean;
  }
  interface InternalAxiosRequestConfig {
    logAs?: string;
    skipLog?: boolean;
    _logPath?: string;
    _logStartTime?: number;
  }
}

/**
 * Creates logger interceptors for axios instance
 */
export function createLoggerInterceptors(options: LoggerOptions): LoggerInterceptors {
  const { dir } = options;
  const filenameFn = options.filename ?? defaultFilename;
  const host = getHostname();

  // Request interceptor
  const request = async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    if (config.skipLog) {
      return config;
    }

    const path = config.logAs || config._logPath || getPathFromUrl(config.url || '');
    config._logPath = path;
    config._logStartTime = Date.now();

    const ts = Math.floor(Date.now() / 1000);
    const params = {
      ts,
      hostname: host,
      url: config.url || '',
      path,
      kind: 'req' as const,
    };

    const reqData = {
      url: config.url,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
    };

    const filepath = buildFilepath(dir, filenameFn, params, 'json');
    const reqSize = getDataSize(config.data);

    log.trace(
      `[->] [${config.method?.toUpperCase()}] ${path} (${formatSize(reqSize)}) -> ${filepath}`,
    );

    await saveLog(filepath, JSON.stringify(reqData, null, 2));

    return config;
  };

  // Response success interceptor
  const response = async (res: AxiosResponse): Promise<AxiosResponse> => {
    if (res.config.skipLog) {
      return res;
    }

    const path = res.config._logPath || 'response';
    const duration = res.config._logStartTime ? Date.now() - res.config._logStartTime : undefined;

    const ts = Math.floor(Date.now() / 1000);
    const params = {
      ts,
      hostname: host,
      url: res.config.url || '',
      path,
      kind: 'res' as const,
    };

    // Save metadata
    const resMeta = {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      duration,
    };
    const metaFilepath = buildFilepath(dir, filenameFn, params, 'json');

    // Save body with detected extension
    const bodyExt = detectExt(res.data, res.headers as Record<string, unknown>);
    const bodyFilepath = buildFilepath(dir, filenameFn, { ...params, kind: 'res' }, bodyExt);

    const resSize = getDataSize(res.data);
    log.info(`[<-] ${path} ${res.status} ${bodyExt} (${formatSize(resSize)}) ${duration}ms`);

    await saveLog(metaFilepath, JSON.stringify(resMeta, null, 2));

    // Save body if different extension or if it's the content
    if (bodyExt !== 'json') {
      const bodyContent =
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      await saveLog(bodyFilepath, bodyContent);
    } else if (res.data) {
      // For JSON, save body as separate _data file
      const dataFilepath = metaFilepath.replace('_res.json', '_res_data.json');
      await saveLog(dataFilepath, JSON.stringify(res.data, null, 2));
    }

    return res;
  };

  // Response error interceptor
  const error = async (err: AxiosError): Promise<never> => {
    if (err.config?.skipLog) {
      return Promise.reject(err);
    }

    const path = err.config?._logPath || 'error';
    const duration = err.config?._logStartTime ? Date.now() - err.config._logStartTime : undefined;

    const ts = Math.floor(Date.now() / 1000);
    const params = {
      ts,
      hostname: host,
      url: err.config?.url || '',
      path,
      kind: 'err' as const,
    };

    const errData = {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      headers: err.response?.headers,
      duration,
      data: err.response?.data,
    };

    const filepath = buildFilepath(dir, filenameFn, params, 'json');
    const resSize = getDataSize(err.response?.data);

    log.error(
      `<- ${path} ${err.response?.status || 'ERR'} (${formatSize(resSize)}) ${duration}ms -> ${filepath}`,
    );

    await saveLog(filepath, JSON.stringify(errData, null, 2));

    return Promise.reject(err);
  };

  return {
    request,
    response,
    error,
    logDir: dir,
  };
}

/**
 * Attaches logger interceptors to an axios instance
 */
export function attachLogger(instance: AxiosInstance, options: LoggerOptions): LoggerInterceptors {
  const interceptors = createLoggerInterceptors(options);

  // all ok just test it
  instance.interceptors.request.use(interceptors.request);
  instance.interceptors.response.use(interceptors.response, interceptors.error);

  return interceptors;
}
