import { createCorrelationId } from './correlation-id';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  correlationPrefix?: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://suleymansanver-001-site1.stempurl.com/pillreminder';
  return raw.replace(/\/+$/, '');
}

export async function apiRequestJson<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
      ...(options.correlationPrefix ? { 'X-Correlation-ID': createCorrelationId(options.correlationPrefix) } : undefined),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiRequestError(response.status, text || 'Request failed.');
  }

  return (await response.json()) as TResponse;
}

export async function apiRequestVoid(path: string, options: ApiRequestOptions = {}): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
      ...(options.correlationPrefix ? { 'X-Correlation-ID': createCorrelationId(options.correlationPrefix) } : undefined),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiRequestError(response.status, text || 'Request failed.');
  }
}
