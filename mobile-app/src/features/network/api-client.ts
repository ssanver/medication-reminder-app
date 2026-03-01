import { createCorrelationId } from './correlation-id';
import { loadAccessToken, loadAuthSession, loadOrCreateDeviceId, markGuestMode } from '../auth/auth-session-store';

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

async function renewGuestSessionIfNeeded(baseUrl: string): Promise<boolean> {
  const session = await loadAuthSession();
  if (!session.isGuestMode) {
    return false;
  }

  try {
    const deviceId = await loadOrCreateDeviceId();
    const response = await fetch(`${baseUrl}/api/auth/guest/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': createCorrelationId('guest-session-refresh'),
      },
      body: JSON.stringify({ deviceId }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      accessToken?: string;
      refreshToken?: string;
      email?: string;
    };

    await markGuestMode({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      email: payload.email,
    });
    return true;
  } catch {
    return false;
  }
}

export async function apiRequestJson<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();

  const execute = async (): Promise<Response> => {
    const accessToken = await loadAccessToken();
    return fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
        ...(options.correlationPrefix ? { 'X-Correlation-ID': createCorrelationId(options.correlationPrefix) } : undefined),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await execute();
  if (response.status === 401) {
    const renewed = await renewGuestSessionIfNeeded(baseUrl);
    if (renewed) {
      response = await execute();
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiRequestError(response.status, text || 'Request failed.');
  }

  return (await response.json()) as TResponse;
}

export async function apiRequestVoid(path: string, options: ApiRequestOptions = {}): Promise<void> {
  const baseUrl = getApiBaseUrl();

  const execute = async (): Promise<Response> => {
    const accessToken = await loadAccessToken();
    return fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
        ...(options.correlationPrefix ? { 'X-Correlation-ID': createCorrelationId(options.correlationPrefix) } : undefined),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await execute();
  if (response.status === 401) {
    const renewed = await renewGuestSessionIfNeeded(baseUrl);
    if (renewed) {
      response = await execute();
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiRequestError(response.status, text || 'Request failed.');
  }
}
