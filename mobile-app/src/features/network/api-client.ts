import { createCorrelationId } from './correlation-id';
import { loadAccessToken, loadAuthSession, loadOrCreateDeviceId, markGuestMode } from '../auth/auth-session-store';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  correlationPrefix?: string;
};

function shouldDebugApi(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

function maskHeaders(headers: Record<string, string>): Record<string, string> {
  if (!headers.Authorization) {
    return headers;
  }

  return {
    ...headers,
    Authorization: 'Bearer ***',
  };
}

function debugApi(label: string, payload: unknown): void {
  if (!shouldDebugApi()) {
    return;
  }

  console.log(`[API] ${label}`, payload);
}

async function readResponsePayload(response: Response): Promise<{ text: string; parsed: unknown }> {
  if (typeof response.text === 'function') {
    const text = await response.text();
    if (!text) {
      return { text: '', parsed: null };
    }

    try {
      return {
        text,
        parsed: JSON.parse(text),
      };
    } catch {
      return {
        text,
        parsed: text,
      };
    }
  }

  if (typeof response.json === 'function') {
    const parsed = await response.json();
    return {
      text: JSON.stringify(parsed),
      parsed,
    };
  }

  return {
    text: '',
    parsed: null,
  };
}

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
    const correlationId = options.correlationPrefix ? createCorrelationId(options.correlationPrefix) : undefined;
    const method = options.method ?? 'GET';
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
      ...(correlationId ? { 'X-Correlation-ID': correlationId } : undefined),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
      ...options.headers,
    };
    const url = `${baseUrl}${path}`;

    debugApi(`REQUEST ${method} ${path}`, {
      url,
      correlationId: correlationId ?? null,
      headers: maskHeaders(headers),
      body: options.body ?? null,
    });

    return fetch(url, {
      method,
      headers,
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
    const { text, parsed } = await readResponsePayload(response);
    debugApi(`RESPONSE ${response.status} ${path}`, parsed);
    throw new ApiRequestError(response.status, text || 'Request failed.');
  }

  const { parsed } = await readResponsePayload(response);
  debugApi(`RESPONSE ${response.status} ${path}`, parsed);
  return parsed as TResponse;
}

export async function apiRequestVoid(path: string, options: ApiRequestOptions = {}): Promise<void> {
  const baseUrl = getApiBaseUrl();

  const execute = async (): Promise<Response> => {
    const accessToken = await loadAccessToken();
    const correlationId = options.correlationPrefix ? createCorrelationId(options.correlationPrefix) : undefined;
    const method = options.method ?? 'GET';
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
      ...(correlationId ? { 'X-Correlation-ID': correlationId } : undefined),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
      ...options.headers,
    };
    const url = `${baseUrl}${path}`;

    debugApi(`REQUEST ${method} ${path}`, {
      url,
      correlationId: correlationId ?? null,
      headers: maskHeaders(headers),
      body: options.body ?? null,
    });

    return fetch(url, {
      method,
      headers,
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
    const { text, parsed } = await readResponsePayload(response);
    debugApi(`RESPONSE ${response.status} ${path}`, parsed);
    debugApi(`RESPONSE ${response.status} ${path}`, text || null);
    throw new ApiRequestError(response.status, text || 'Request failed.');
  }

  const { parsed } = await readResponsePayload(response);
  debugApi(`RESPONSE ${response.status} ${path}`, parsed);
}
