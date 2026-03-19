import { createCorrelationId } from './correlation-id';
import { beginApiMutation, endApiMutation, reportApiError } from './api-request-state';
import { loadAccessToken, loadAuthSession, loadOrCreateDeviceId, markGuestMode } from '../auth/auth-session-store';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  correlationPrefix?: string;
};

type ApiErrorPayload = {
  message?: string;
  title?: string;
  detail?: string;
  error?: string;
  errors?: Record<string, string[]>;
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

function formatApiErrorMessage(status: number, parsed: unknown, fallbackText: string): string {
  if (parsed && typeof parsed === 'object') {
    const payload = parsed as ApiErrorPayload;
    const primaryMessage = payload.message || payload.title || payload.detail || payload.error;
    if (primaryMessage) {
      return `${primaryMessage}`.trim();
    }

    if (payload.errors && typeof payload.errors === 'object') {
      const firstError = Object.values(payload.errors).flat()[0];
      if (firstError) {
        return `${firstError}`.trim();
      }
    }
  }

  const normalizedText = fallbackText.trim();
  if (!normalizedText) {
    return `HTTP ${status} - Request failed.`;
  }

  if (normalizedText.startsWith('<')) {
    return `HTTP ${status} - Server error.`;
  }

  return normalizedText.length > 220 ? `${normalizedText.slice(0, 220)}...` : normalizedText;
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
  const method = options.method ?? 'GET';
  const mutationId = method === 'GET' ? null : beginApiMutation(method, path);

  const execute = async (): Promise<Response> => {
    const accessToken = await loadAccessToken();
    const correlationId = options.correlationPrefix ? createCorrelationId(options.correlationPrefix) : undefined;
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

  try {
    let response = await execute();
    if (response.status === 401) {
      const renewed = await renewGuestSessionIfNeeded(baseUrl);
      if (renewed) {
        response = await execute();
      }
    }

    if (!response.ok) {
      const { text, parsed } = await readResponsePayload(response);
      const message = formatApiErrorMessage(response.status, parsed, text || 'Request failed.');
      debugApi(`RESPONSE ${response.status} ${path}`, parsed);
      reportApiError({
        method,
        path,
        status: response.status,
        message,
      });
      throw new ApiRequestError(response.status, message);
    }

    const { parsed } = await readResponsePayload(response);
    debugApi(`RESPONSE ${response.status} ${path}`, parsed);
    return parsed as TResponse;
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      const message = error instanceof Error && error.message ? error.message : 'Unexpected network error.';
      reportApiError({
        method,
        path,
        status: 0,
        message,
      });
    }
    throw error;
  } finally {
    if (mutationId) {
      endApiMutation(mutationId);
    }
  }
}

export async function apiRequestVoid(path: string, options: ApiRequestOptions = {}): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const method = options.method ?? 'GET';
  const mutationId = method === 'GET' ? null : beginApiMutation(method, path);

  const execute = async (): Promise<Response> => {
    const accessToken = await loadAccessToken();
    const correlationId = options.correlationPrefix ? createCorrelationId(options.correlationPrefix) : undefined;
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

  try {
    let response = await execute();
    if (response.status === 401) {
      const renewed = await renewGuestSessionIfNeeded(baseUrl);
      if (renewed) {
        response = await execute();
      }
    }

    if (!response.ok) {
      const { text, parsed } = await readResponsePayload(response);
      const message = formatApiErrorMessage(response.status, parsed, text || 'Request failed.');
      debugApi(`RESPONSE ${response.status} ${path}`, parsed);
      debugApi(`RESPONSE ${response.status} ${path}`, text || null);
      reportApiError({
        method,
        path,
        status: response.status,
        message,
      });
      throw new ApiRequestError(response.status, message);
    }

    const { parsed } = await readResponsePayload(response);
    debugApi(`RESPONSE ${response.status} ${path}`, parsed);
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      const message = error instanceof Error && error.message ? error.message : 'Unexpected network error.';
      reportApiError({
        method,
        path,
        status: 0,
        message,
      });
    }
    throw error;
  } finally {
    if (mutationId) {
      endApiMutation(mutationId);
    }
  }
}
